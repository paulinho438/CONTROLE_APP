<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import EntradaService from '@/service/EntradaService';
import GrupoService from '@/service/GrupoService';
import MaterialService from '@/service/MaterialService';
import PatioService from '@/service/PatioService';
import FornecedorService from '@/service/FornecedorService';
import NotaFiscalService from '@/service/NotaFiscalService';
import UnidadeMedidaService from '@/service/UnidadeMedidaService';
import ColaboradorService from '@/service/ColaboradorService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const { hasPermission } = usePermissions();
const service = new EntradaService();
const grupoService = new GrupoService();
const materialService = new MaterialService();
const patioService = new PatioService();
const fornecedorService = new FornecedorService();
const notaFiscalService = new NotaFiscalService();
const unidadeService = new UnidadeMedidaService();
const colaboradorService = new ColaboradorService();

const entradas = ref([]);
const grupos = ref([]);
const materiais = ref([]);
const patios = ref([]);
const fornecedores = ref([]);
const notas = ref([]);
const unidades = ref([]);
const colaboradores = ref([]);

const form = ref({
    id: null,
    grupo_id: null,
    material_id: null,
    patio_id: null,
    fornecedor_id: null,
    nota_fiscal_id: null,
    valor: null,
    data_emissao: null,
    quantidade: 1,
    unidade_medida_id: null,
    data_recebimento: null,
    numero_romaneio: '',
    peso_nota: null,
    responsavel_colaborador_id: null
});

const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const entradaAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < entradas.value.length) {
        return entradas.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${entradas.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < entradas.value.length - 1);

const valorTotal = computed(() => {
    if (form.value.quantidade && form.value.valor) {
        return form.value.quantidade * form.value.valor;
    }
    return 0;
});

watch(() => form.value.grupo_id, (novoGrupoId) => {
    if (novoGrupoId) {
        const grupo = grupos.value.find(g => g.id === novoGrupoId);
        if (grupo) {
            form.value.material_id = null;
        }
    }
});

const formatDate = (date) => {
    if (!date) return null;
    if (date instanceof Date) {
        return date.toISOString().slice(0, 10);
    }
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
};

const garantirArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (typeof data === 'object' && data.id) return [data]; // Se for um objeto único com ID, converte para array
    return [];
};

const carregar = async () => {
    loading.value = true;
    try {
        const [entradasResp, gruposResp, materiaisResp, patiosResp, fornecedoresResp, notasResp, unidadesResp, colaboradoresResp] =
            await Promise.all([
                service.getAll(),
                grupoService.getAll(),
                materialService.getAll(),
                patioService.getAll(),
                fornecedorService.getAll(),
                notaFiscalService.getAll(),
                unidadeService.getAll(),
                colaboradorService.getAll()
            ]);
        
        entradas.value = garantirArray(entradasResp.data);
        grupos.value = garantirArray(gruposResp.data);
        
        // Para materiais, usar o mesmo padrão da tela de Materiais que está funcionando
        materiais.value = materiaisResp.data?.data || materiaisResp.data || [];
        if (!Array.isArray(materiais.value)) {
            materiais.value = [];
        }
        
        patios.value = garantirArray(patiosResp.data);
        fornecedores.value = garantirArray(fornecedoresResp.data);
        notas.value = garantirArray(notasResp.data);
        unidades.value = garantirArray(unidadesResp.data);
        colaboradores.value = garantirArray(colaboradoresResp.data);
        
        console.log('Materiais carregados:', materiais.value.length, materiais.value);
        console.log('Materiais resposta completa:', materiaisResp.data);
        
        if (entradas.value.length > 0 && indiceAtual.value < 0) {
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
    if (entradaAtual.value) {
        const entrada = entradaAtual.value;
        
        // Função auxiliar para converter data
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            try {
                // Se já é um objeto Date, retornar
                if (dateStr instanceof Date) return dateStr;
                // Se é string no formato YYYY-MM-DD
                if (typeof dateStr === 'string') {
                    const parts = dateStr.split('T')[0].split('-');
                    if (parts.length === 3) {
                        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    }
                    return new Date(dateStr);
                }
                return null;
            } catch (e) {
                console.error('Erro ao parsear data:', dateStr, e);
                return null;
            }
        };
        
        // Limpar o formulário primeiro para garantir que não há dados antigos
        form.value = {
            id: entrada.id || null,
            grupo_id: entrada.grupo_id || null,
            material_id: entrada.material_id || null,
            patio_id: entrada.patio_id || null,
            fornecedor_id: entrada.fornecedor_id || null,
            nota_fiscal_id: entrada.nota_fiscal_id || null,
            valor: entrada.valor ? parseFloat(entrada.valor) : null,
            data_emissao: parseDate(entrada.data_emissao),
            quantidade: entrada.quantidade || 1,
            unidade_medida_id: entrada.unidade_medida_id || null,
            data_recebimento: parseDate(entrada.data_recebimento),
            numero_romaneio: entrada.numero_romaneio || '',
            peso_nota: entrada.peso_nota ? parseFloat(entrada.peso_nota) : null,
            responsavel_colaborador_id: entrada.responsavel_colaborador_id || null
        };
        console.log('Registro carregado no formulário:', form.value);
        console.log('Entrada atual:', entrada);
    } else {
        console.warn('entradaAtual.value é null ou undefined');
    }
};

const novo = () => {
    form.value = {
        id: null,
        grupo_id: null,
        material_id: null,
        patio_id: null,
        fornecedor_id: null,
        nota_fiscal_id: null,
        valor: null,
        data_emissao: null,
        quantidade: 1,
        unidade_medida_id: null,
        data_recebimento: null,
        numero_romaneio: '',
        peso_nota: null,
        responsavel_colaborador_id: null
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

    try {
        const payload = {
            ...form.value,
            data_emissao: formatDate(form.value.data_emissao),
            data_recebimento: formatDate(form.value.data_recebimento)
        };
        await service.save(payload);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Entrada salva com sucesso', life: 3000 });
        await carregar();
        if (form.value.id) {
            const index = entradas.value.findIndex(e => e.id === form.value.id);
            if (index >= 0) indiceAtual.value = index;
        } else {
            indiceAtual.value = entradas.value.length - 1;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar entrada', life: 3000 });
    }
};

const editar = (item) => {
    console.log('=== FUNÇÃO EDITAR CHAMADA ===');
    console.log('Item recebido:', item);
    console.log('Item ID:', item?.id);
    console.log('Total de entradas:', entradas.value.length);
    
    if (!item || !item.id) {
        console.error('Item inválido:', item);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Item inválido para edição', life: 3000 });
        return;
    }
    
    const index = entradas.value.findIndex(e => e.id === item.id);
    console.log('Índice encontrado:', index);
    console.log('Entrada encontrada:', entradas.value[index]);
    
    if (index >= 0) {
        indiceAtual.value = index;
        mostrarHistorico.value = false; // Ocultar histórico ao editar
        
        // Forçar atualização do formulário
        setTimeout(() => {
            console.log('Carregando registro atual, indiceAtual:', indiceAtual.value);
            console.log('entradaAtual.value:', entradaAtual.value);
            carregarRegistroAtual();
            console.log('Formulário após carregar:', form.value);
            toast.add({ severity: 'info', summary: 'Editando', detail: `Editando registro ${index + 1} de ${entradas.value.length}`, life: 2000 });
        }, 50);
    } else {
        console.error('Índice não encontrado para item:', item);
        console.error('IDs disponíveis:', entradas.value.map(e => e.id));
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Registro não encontrado na lista', life: 3000 });
    }
};

const remover = async (item) => {
    if (!confirm(`Deseja realmente excluir esta entrada?`)) return;

    try {
        await service.delete(item.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Entrada excluída com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= entradas.value.length) {
            indiceAtual.value = entradas.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir entrada', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    try {
        const dados = entradas.value.map(e => ({
            material: e.material?.nome || '',
            patio: e.patio?.nome || '',
            quantidade: e.quantidade || 0,
            unidade: e.unidade_medida?.unidade || '',
            fornecedor: e.fornecedor?.razao_social || '',
            data_recebimento: e.data_recebimento ? new Date(e.data_recebimento).toLocaleDateString('pt-BR') : '',
            valor: e.valor ? `R$ ${parseFloat(e.valor).toFixed(2)}` : 'R$ 0,00'
        }));

        gerarPDF(
            'RELATÓRIO DE ENTRADAS DE MATERIAL',
            dados,
            [
                { field: 'material', header: 'Material' },
                { field: 'patio', header: 'Pátio' },
                { field: 'quantidade', header: 'Quantidade' },
                { field: 'unidade', header: 'Unidade' },
                { field: 'fornecedor', header: 'Fornecedor' },
                { field: 'data_recebimento', header: 'Data Recebimento' },
                { field: 'valor', header: 'Valor' }
            ],
            'relatorio_entradas.pdf'
        );
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
    } catch (error) {
        toast.add({ 
            severity: 'error', 
            summary: 'Erro', 
            detail: error.message || 'Erro ao gerar relatório PDF', 
            life: 3000 
        });
    }
};

const exportarExcelEntradas = () => {
    try {
        const dados = entradas.value.map(e => ({
            'Material': e.material?.nome || '',
            'Pátio': e.patio?.nome || '',
            'Quantidade': e.quantidade || 0,
            'Unidade': e.unidade_medida?.unidade || '',
            'Fornecedor': e.fornecedor?.razao_social || '',
            'Data Recebimento': e.data_recebimento ? new Date(e.data_recebimento).toLocaleDateString('pt-BR') : '',
            'Valor': e.valor ? parseFloat(e.valor).toFixed(2) : '0.00'
        }));

        exportarExcel(dados, 'relatorio_entradas.xlsx', 'Entradas');
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
            <h2>ENTRADA DE MATERIAL</h2>
            <div class="flex gap-2">
                <Button v-if="hasPermission('entradas.view')" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirRelatorio" />
                <Button v-if="hasPermission('entradas.view')" label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcelEntradas" />
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
                <label class="block mb-2">Fornecedor</label>
                <Dropdown v-model="form.fornecedor_id" :options="fornecedores" optionLabel="razao_social" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Nota fiscal</label>
                <Dropdown v-model="form.nota_fiscal_id" :options="notas" optionLabel="numero_nota" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Unidade</label>
                <Dropdown v-model="form.unidade_medida_id" :options="unidades" optionLabel="unidade" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Quantidade</label>
                <InputNumber v-model="form.quantidade" class="w-full" :min="0.01" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Valor (R$)</label>
                <InputNumber v-model="form.valor" class="w-full" mode="currency" currency="BRL" locale="pt-BR" :min="0" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Valor Total</label>
                <InputText :value="`R$ ${valorTotal.toFixed(2)}`" class="w-full" readonly />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Data emissão</label>
                <Calendar v-model="form.data_emissao" dateFormat="dd/mm/yy" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Data recebimento</label>
                <Calendar v-model="form.data_recebimento" dateFormat="dd/mm/yy" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Número do romaneio</label>
                <InputText v-model="form.numero_romaneio" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Peso da nota</label>
                <InputNumber v-model="form.peso_nota" class="w-full" :min="0" />
            </div>
            <div class="col-12 md:col-6">
                <label class="block mb-2">Responsável</label>
                <Dropdown v-model="form.responsavel_colaborador_id" :options="colaboradores" optionLabel="nome_completo" optionValue="id" class="w-full" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button v-if="hasPermission('entradas.create')" label="Novo" icon="pi pi-plus" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('entradas.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('entradas.create') || hasPermission('entradas.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="entradas" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column header="Material">
                <template #body="{ data }">
                    {{ data.material || '-' }}
                </template>
            </Column>
            <Column header="Pátio">
                <template #body="{ data }">
                    {{ data.patio || '-' }}
                </template>
            </Column>
            <Column field="quantidade" header="Quantidade" />
            <Column header="Unidade">
                <template #body="{ data }">
                    {{ data.unidade_medida || '-' }}
                </template>
            </Column>
            <Column header="Recebimento">
                <template #body="{ data }">
                    {{ data.data_recebimento ? new Date(data.data_recebimento).toLocaleDateString('pt-BR') : '-' }}
                </template>
            </Column>
            <Column header="Ações">
                <template #body="{ data }">
                    <Button 
                        v-if="hasPermission('entradas.edit')" 
                        icon="pi pi-pencil" 
                        class="p-button-text" 
                        @click="editar(data)"
                        title="Editar entrada"
                    />
                    <Button 
                        v-if="hasPermission('entradas.delete')" 
                        icon="pi pi-trash" 
                        class="p-button-text p-button-danger" 
                        @click="remover(data)"
                        title="Excluir entrada"
                    />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
