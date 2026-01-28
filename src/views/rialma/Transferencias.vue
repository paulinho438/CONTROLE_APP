<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import SaidaService from '@/service/SaidaService';
import GrupoService from '@/service/GrupoService';
import MaterialService from '@/service/MaterialService';
import PatioService from '@/service/PatioService';
import UnidadeMedidaService from '@/service/UnidadeMedidaService';
import ColaboradorService from '@/service/ColaboradorService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const { hasPermission } = usePermissions();
const service = new SaidaService();
const grupoService = new GrupoService();
const materialService = new MaterialService();
const patioService = new PatioService();
const unidadeService = new UnidadeMedidaService();
const colaboradorService = new ColaboradorService();

const transferencias = ref([]);
const grupos = ref([]);
const materiais = ref([]);
const patios = ref([]);
const unidades = ref([]);
const colaboradores = ref([]);

const form = ref({
    id: null,
    grupo_id: null,
    material_id: null,
    patio_id: null,
    destino_patio_id: null,
    tipo_movimentacao: 'Transferência',
    data_saida: null,
    quantidade: 1,
    unidade_medida_id: null,
    numero_romaneio: '',
    responsavel_colaborador_id: null,
    observacao: ''
});

const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const transferenciaAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < transferencias.value.length) {
        return transferencias.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${transferencias.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < transferencias.value.length - 1);

watch(() => form.value.grupo_id, (novoGrupoId) => {
    if (novoGrupoId) {
        form.value.material_id = null;
    }
});

const garantirArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (typeof data === 'object' && data.id) return [data]; // Se for um objeto único com ID, converte para array
    return [];
};

const formatDate = (date) => {
    if (!date) return null;
    if (date instanceof Date) {
        return date.toISOString().slice(0, 10);
    }
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
};

const carregar = async () => {
    loading.value = true;
    try {
        const [saidasResp, gruposResp, materiaisResp, patiosResp, unidadesResp, colaboradoresResp] = await Promise.all([
            service.getAll(),
            grupoService.getAll(),
            materialService.getAll(),
            patioService.getAll(),
            unidadeService.getAll(),
            colaboradorService.getAll()
        ]);
        
        const todasSaidas = garantirArray(saidasResp.data);
        transferencias.value = todasSaidas.filter((item) => item.tipo_movimentacao === 'Transferência');
        
        grupos.value = garantirArray(gruposResp.data);
        
        // Para materiais, usar o mesmo padrão da tela de Materiais que está funcionando
        materiais.value = materiaisResp.data?.data || materiaisResp.data || [];
        if (!Array.isArray(materiais.value)) {
            materiais.value = [];
        }
        
        patios.value = garantirArray(patiosResp.data);
        unidades.value = garantirArray(unidadesResp.data);
        colaboradores.value = garantirArray(colaboradoresResp.data);
        
        console.log('Materiais carregados (Transferências):', materiais.value.length, materiais.value);
        console.log('Materiais resposta completa:', materiaisResp.data);
        
        if (transferencias.value.length > 0 && indiceAtual.value < 0) {
            indiceAtual.value = 0;
            carregarRegistroAtual();
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar transferências', life: 3000 });
    }
    loading.value = false;
};

const carregarRegistroAtual = () => {
    if (transferenciaAtual.value) {
        form.value = {
            ...transferenciaAtual.value,
            data_saida: transferenciaAtual.value.data_saida ? new Date(transferenciaAtual.value.data_saida) : null
        };
    }
};

const novo = () => {
    form.value = {
        id: null,
        grupo_id: null,
        material_id: null,
        patio_id: null,
        destino_patio_id: null,
        tipo_movimentacao: 'Transferência',
        data_saida: null,
        quantidade: 1,
        unidade_medida_id: null,
        numero_romaneio: '',
        responsavel_colaborador_id: null,
        observacao: ''
    };
    indiceAtual.value = -1;
};

const voltar = () => {
    if (podeVoltar.value) {
        indiceAtual.value--;
        carregarRegistroAtual();
    }
};

const avancar = () => {
    if (podeAvançar.value) {
        indiceAtual.value++;
        carregarRegistroAtual();
    }
};

const salvar = async () => {
    console.log('Salvar chamado, form:', form.value);
    
    if (!form.value.grupo_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Grupo é obrigatório', life: 3000 });
        return;
    }
    if (!form.value.material_id) {
        console.warn('Validação falhou: Material é obrigatório');
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Material é obrigatório', life: 3000 });
        return;
    }
    if (!form.value.patio_id) {
        console.warn('Validação falhou: Pátio de origem é obrigatório');
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Pátio de origem é obrigatório', life: 3000 });
        return;
    }
    if (!form.value.destino_patio_id) {
        console.warn('Validação falhou: Pátio de destino é obrigatório');
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Pátio de destino é obrigatório', life: 3000 });
        return;
    }
    if (form.value.patio_id === form.value.destino_patio_id) {
        console.warn('Validação: Pátio de origem e destino são iguais:', form.value.patio_id, '===', form.value.destino_patio_id);
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Pátio de origem e destino devem ser diferentes!', life: 5000 });
        return;
    }
    if (!form.value.quantidade || form.value.quantidade <= 0) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Quantidade deve ser maior que zero', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        const payload = {
            ...form.value,
            tipo_movimentacao: 'Transferência',
            data_saida: formatDate(form.value.data_saida)
        };
        console.log('Payload a ser enviado:', payload);
        
        const response = await service.save(payload);
        console.log('Resposta do servidor:', response);
        
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Transferência salva com sucesso', life: 3000 });
        
        await carregar();
        
        if (form.value.id) {
            const index = transferencias.value.findIndex(t => t.id === form.value.id);
            if (index >= 0) {
                indiceAtual.value = index;
                carregarRegistroAtual();
            }
        } else {
            // Se foi um novo registro, posiciona no último
            if (transferencias.value.length > 0) {
                indiceAtual.value = transferencias.value.length - 1;
                carregarRegistroAtual();
            }
        }
    } catch (error) {
        console.error('Erro ao salvar transferência:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Erro ao salvar transferência';
        toast.add({ severity: 'error', summary: 'Erro', detail: errorMessage, life: 5000 });
    } finally {
        loading.value = false;
    }
};

const editar = (item) => {
    const index = transferencias.value.findIndex(t => t.id === item.id);
    if (index >= 0) {
        indiceAtual.value = index;
        carregarRegistroAtual();
    }
};

const remover = async (item) => {
    if (!confirm(`Deseja realmente excluir esta transferência?`)) return;

    try {
        await service.delete(item.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Transferência excluída com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= transferencias.value.length) {
            indiceAtual.value = transferencias.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir transferência', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    const dados = transferencias.value.map(t => ({
        material: t.material?.nome || '',
        patio_origem: t.patio?.nome || '',
        patio_destino: t.destino_patio?.nome || '',
        quantidade: t.quantidade || 0,
        unidade: t.unidade_medida?.unidade || '',
        data_transferencia: t.data_saida ? new Date(t.data_saida).toLocaleDateString('pt-BR') : '',
        romaneio: t.numero_romaneio || ''
    }));

    gerarPDF(
        'RELATÓRIO DE TRANSFERÊNCIAS',
        dados,
        [
            { field: 'material', header: 'Material' },
            { field: 'patio_origem', header: 'Pátio Origem' },
            { field: 'patio_destino', header: 'Pátio Destino' },
            { field: 'quantidade', header: 'Quantidade' },
            { field: 'unidade', header: 'Unidade' },
            { field: 'data_transferencia', header: 'Data' },
            { field: 'romaneio', header: 'Romaneio' }
        ],
        'relatorio_transferencias.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarExcelTransferencias = () => {
    try {
        const dados = transferencias.value.map(t => ({
            'Material': t.material?.nome || '',
            'Pátio Origem': t.patio_origem?.nome || '',
            'Pátio Destino': t.patio_destino?.nome || '',
            'Quantidade': t.quantidade || 0,
            'Unidade': t.unidade_medida?.unidade || '',
            'Data Transferência': t.data_transferencia ? new Date(t.data_transferencia).toLocaleDateString('pt-BR') : '',
            'Observação': t.observacao || ''
        }));

        exportarExcel(dados, 'relatorio_transferencias.xlsx', 'Transferências');
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha exportada com sucesso', life: 3000 });
    } catch (error) {
        toast.add({ 
            severity: 'error', 
            summary: 'Erro', 
            detail: error.message || 'Erro ao exportar planilha', 
            life: 3000 
        });
    }
};

const materiaisFiltrados = computed(() => {
    if (!form.value.grupo_id) {
        console.log('Sem grupo selecionado, retornando todos os materiais:', materiais.value.length);
        return materiais.value;
    }
    const filtrados = materiais.value.filter(m => m.grupo_id == form.value.grupo_id);
    console.log('Materiais filtrados por grupo', form.value.grupo_id, ':', filtrados.length);
    return filtrados;
});

onMounted(carregar);
</script>

<template>
    <div class="card" style="position: relative;">
        <div v-if="loading" class="flex align-items-center justify-content-center" style="min-height: 400px;">
            <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="3" />
        </div>
        <div v-else>
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>TRANSFERÊNCIA DE MATERIAL</h2>
            <div class="flex gap-2">
                <Button v-if="hasPermission('transferencias.view')" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirRelatorio" />
                <Button v-if="hasPermission('transferencias.view')" label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcelTransferencias" />
            </div>
        </div>

        <div class="grid align-items-end mb-4">
            <div class="col-12 md:col-4">
                <label class="block mb-2">Grupo</label>
                <Dropdown v-model="form.grupo_id" :options="grupos" optionLabel="nome" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Material</label>
                <Dropdown v-model="form.material_id" :options="materiaisFiltrados" optionLabel="nome" optionValue="id" class="w-full" placeholder="Selecione um material" :showClear="true" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Pátio origem</label>
                <Dropdown v-model="form.patio_id" :options="patios" optionLabel="nome" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Pátio destino</label>
                <Dropdown v-model="form.destino_patio_id" :options="patios" optionLabel="nome" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Quantidade</label>
                <InputNumber v-model="form.quantidade" class="w-full" :min="0.01" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Unidade</label>
                <Dropdown v-model="form.unidade_medida_id" :options="unidades" optionLabel="unidade" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Data transferência</label>
                <Calendar v-model="form.data_saida" dateFormat="dd/mm/yy" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Romaneio</label>
                <InputText v-model="form.numero_romaneio" class="w-full" />
            </div>
            <div class="col-12 md:col-6">
                <label class="block mb-2">Responsável</label>
                <Dropdown v-model="form.responsavel_colaborador_id" :options="colaboradores" optionLabel="nome_completo" optionValue="id" class="w-full" />
            </div>
            <div class="col-12">
                <label class="block mb-2">Observação</label>
                <Textarea v-model="form.observacao" rows="2" class="w-full" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button v-if="hasPermission('transferencias.create')" label="Novo" icon="pi pi-plus" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('transferencias.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('transferencias.create') || hasPermission('transferencias.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="transferencias" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column field="material" header="Material" />
            <Column field="patio" header="Origem" />
            <Column field="destino_patio" header="Destino" />
            <Column field="quantidade" header="Quantidade" />
            <Column field="data_saida" header="Data">
                <template #body="{ data }">
                    {{ data.data_saida ? new Date(data.data_saida).toLocaleDateString('pt-BR') : '' }}
                </template>
            </Column>
            <Column header="Ações">
                <template #body="{ data }">
                    <Button v-if="hasPermission('transferencias.edit')" icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button v-if="hasPermission('transferencias.delete')" icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
