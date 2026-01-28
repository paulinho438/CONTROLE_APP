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

const saidas = ref([]);
const grupos = ref([]);
const materiais = ref([]);
const patios = ref([]);
const unidades = ref([]);
const colaboradores = ref([]);

const tiposMovimentacao = [
    { label: 'Saída', value: 'Saída' },
    { label: 'Transferência', value: 'Transferência' }
];

const form = ref({
    id: null,
    grupo_id: null,
    material_id: null,
    patio_id: null,
    destino_patio_id: null,
    tipo_movimentacao: 'Saída',
    nota_fiscal: '',
    valor: null,
    data_saida: null,
    quantidade: 1,
    unidade_medida_id: null,
    numero_romaneio: '',
    responsavel_colaborador_id: null,
    destino: '',
    observacao: ''
});

const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const saidaAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < saidas.value.length) {
        return saidas.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${saidas.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < saidas.value.length - 1);

const mostrarDestinoPatio = computed(() => form.value.tipo_movimentacao === 'Transferência');

watch(() => form.value.grupo_id, (novoGrupoId) => {
    if (!novoGrupoId) return;
    const materialDoGrupo = materiais.value.find(m => m.id === form.value.material_id);
    if (!materialDoGrupo || Number(materialDoGrupo.grupo_id) !== Number(novoGrupoId)) {
        form.value.material_id = null;
    }
});

watch(() => form.value.tipo_movimentacao, (novo) => {
    if (novo !== 'Transferência') {
        form.value.destino_patio_id = null;
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
        
        saidas.value = garantirArray(saidasResp.data);
        grupos.value = garantirArray(gruposResp.data);
        
        // Para materiais, usar o mesmo padrão da tela de Materiais que está funcionando
        materiais.value = materiaisResp.data?.data || materiaisResp.data || [];
        if (!Array.isArray(materiais.value)) {
            materiais.value = [];
        }
        
        patios.value = garantirArray(patiosResp.data);
        unidades.value = garantirArray(unidadesResp.data);
        colaboradores.value = garantirArray(colaboradoresResp.data);
        
        console.log('Materiais carregados (Saídas):', materiais.value.length, materiais.value);
        console.log('Materiais resposta completa:', materiaisResp.data);
        
        if (saidas.value.length > 0 && indiceAtual.value < 0) {
            indiceAtual.value = 0;
            carregarRegistroAtual();
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar dados', life: 3000 });
    }
    loading.value = false;
};

const carregarRegistroAtual = () => {
    if (!saidaAtual.value) return;
    const s = saidaAtual.value;
    form.value = {
        id: s.id ?? null,
        grupo_id: s.grupo_id != null ? Number(s.grupo_id) : null,
        material_id: s.material_id != null ? Number(s.material_id) : null,
        patio_id: s.patio_id != null ? Number(s.patio_id) : null,
        destino_patio_id: s.destino_patio_id != null ? Number(s.destino_patio_id) : null,
        tipo_movimentacao: s.tipo_movimentacao || 'Saída',
        nota_fiscal: s.nota_fiscal ?? '',
        valor: s.valor != null ? Number(s.valor) : null,
        data_saida: s.data_saida ? new Date(s.data_saida) : null,
        quantidade: s.quantidade != null ? Number(s.quantidade) : 1,
        unidade_medida_id: s.unidade_medida_id != null ? Number(s.unidade_medida_id) : null,
        numero_romaneio: s.numero_romaneio ?? '',
        responsavel_colaborador_id: s.responsavel_colaborador_id != null ? Number(s.responsavel_colaborador_id) : null,
        destino: s.destino ?? '',
        observacao: s.observacao ?? ''
    };
};

const novo = () => {
    form.value = {
        id: null,
        grupo_id: null,
        material_id: null,
        patio_id: null,
        destino_patio_id: null,
        tipo_movimentacao: 'Saída',
        nota_fiscal: '',
        valor: null,
        data_saida: null,
        quantidade: 1,
        unidade_medida_id: null,
        numero_romaneio: '',
        responsavel_colaborador_id: null,
        destino: '',
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
    if (!form.value.grupo_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Grupo é obrigatório', life: 3000 });
        return;
    }
    if (!form.value.material_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Material é obrigatório', life: 3000 });
        return;
    }
    if (!form.value.patio_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Pátio é obrigatório', life: 3000 });
        return;
    }
    if (!form.value.quantidade || form.value.quantidade <= 0) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Quantidade deve ser maior que zero', life: 3000 });
        return;
    }
    if (form.value.tipo_movimentacao === 'Transferência' && !form.value.destino_patio_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Pátio de destino é obrigatório para transferências', life: 3000 });
        return;
    }

    try {
        const payload = {
            ...form.value,
            data_saida: formatDate(form.value.data_saida)
        };
        await service.save(payload);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Saída salva com sucesso', life: 3000 });
        await carregar();
        if (form.value.id) {
            const index = saidas.value.findIndex(s => s.id === form.value.id);
            if (index >= 0) indiceAtual.value = index;
        } else {
            indiceAtual.value = saidas.value.length - 1;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar saída', life: 3000 });
    }
};

const editar = (item) => {
    const index = saidas.value.findIndex(s => s.id === item.id);
    if (index >= 0) {
        indiceAtual.value = index;
        carregarRegistroAtual();
        mostrarHistorico.value = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const remover = async (item) => {
    if (!confirm(`Deseja realmente excluir esta saída?`)) return;

    try {
        await service.delete(item.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Saída excluída com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= saidas.value.length) {
            indiceAtual.value = saidas.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir saída', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    const dados = saidas.value.map(s => ({
        material: s.material?.nome || '',
        patio: s.patio?.nome || '',
        tipo: s.tipo_movimentacao || '',
        quantidade: s.quantidade || 0,
        unidade: s.unidade_medida?.unidade || '',
        data_saida: s.data_saida ? new Date(s.data_saida).toLocaleDateString('pt-BR') : '',
        destino: s.destino || s.destino_patio?.nome || ''
    }));

    gerarPDF(
        'RELATÓRIO DE SAÍDAS DE MATERIAL',
        dados,
        [
            { field: 'material', header: 'Material' },
            { field: 'patio', header: 'Pátio' },
            { field: 'tipo', header: 'Tipo' },
            { field: 'quantidade', header: 'Quantidade' },
            { field: 'unidade', header: 'Unidade' },
            { field: 'data_saida', header: 'Data Saída' },
            { field: 'destino', header: 'Destino' }
        ],
        'relatorio_saidas.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarExcelSaidas = () => {
    try {
        const dados = saidas.value.map(s => ({
            'Material': s.material?.nome || '',
            'Pátio': s.patio?.nome || '',
            'Tipo': s.tipo_movimentacao || '',
            'Quantidade': s.quantidade || 0,
            'Unidade': s.unidade_medida?.unidade || '',
            'Data Saída': s.data_saida ? new Date(s.data_saida).toLocaleDateString('pt-BR') : '',
            'Destino': s.destino || s.destino_patio?.nome || ''
        }));

        exportarExcel(dados, 'relatorio_saidas.xlsx', 'Saídas');
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
            <h2>SAÍDA DE MATERIAL</h2>
            <div class="flex gap-2">
                <Button v-if="hasPermission('saidas.view')" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirRelatorio" />
                <Button v-if="hasPermission('saidas.view')" label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcelSaidas" />
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
                <label class="block mb-2">Pátio</label>
                <Dropdown v-model="form.patio_id" :options="patios" optionLabel="nome" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Tipo de movimentação</label>
                <Dropdown v-model="form.tipo_movimentacao" :options="tiposMovimentacao" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            <div v-if="mostrarDestinoPatio" class="col-12 md:col-4">
                <label class="block mb-2">Destino (pátio)</label>
                <Dropdown v-model="form.destino_patio_id" :options="patios" optionLabel="nome" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Nota fiscal</label>
                <InputText v-model="form.nota_fiscal" class="w-full" />
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
                <label class="block mb-2">Data saída</label>
                <Calendar v-model="form.data_saida" dateFormat="dd/mm/yy" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Valor (R$)</label>
                <InputNumber v-model="form.valor" class="w-full" mode="currency" currency="BRL" locale="pt-BR" :min="0" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Número do romaneio</label>
                <InputText v-model="form.numero_romaneio" class="w-full" />
            </div>
            <div class="col-12 md:col-6">
                <label class="block mb-2">Responsável</label>
                <Dropdown v-model="form.responsavel_colaborador_id" :options="colaboradores" optionLabel="nome_completo" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-6">
                <label class="block mb-2">Destino (texto)</label>
                <InputText v-model="form.destino" class="w-full" />
            </div>
            <div class="col-12">
                <label class="block mb-2">Observação</label>
                <Textarea v-model="form.observacao" rows="2" class="w-full" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button v-if="hasPermission('saidas.create')" label="Novo" icon="pi pi-plus" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('saidas.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('saidas.create') || hasPermission('saidas.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="saidas" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column field="material" header="Material" />
            <Column field="patio" header="Pátio" />
            <Column field="tipo_movimentacao" header="Tipo" />
            <Column field="quantidade" header="Quantidade" />
            <Column field="unidade_medida" header="Unidade" />
            <Column field="data_saida" header="Data Saída">
                <template #body="{ data }">
                    {{ data.data_saida ? new Date(data.data_saida).toLocaleDateString('pt-BR') : '' }}
                </template>
            </Column>
            <Column header="Ações">
                <template #body="{ data }">
                    <Button v-if="hasPermission('saidas.edit')" icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button v-if="hasPermission('saidas.delete')" icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
