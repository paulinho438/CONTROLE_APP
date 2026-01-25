<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import PrevisaoService from '@/service/PrevisaoService';
import GrupoService from '@/service/GrupoService';
import MaterialService from '@/service/MaterialService';
import PatioService from '@/service/PatioService';
import UnidadeMedidaService from '@/service/UnidadeMedidaService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const { hasPermission } = usePermissions();
const service = new PrevisaoService();
const grupoService = new GrupoService();
const materialService = new MaterialService();
const patioService = new PatioService();
const unidadeService = new UnidadeMedidaService();

const previsoes = ref([]);
const grupos = ref([]);
const materiais = ref([]);
const patios = ref([]);
const unidades = ref([]);

const form = ref({
    id: null,
    grupo_id: null,
    material_id: null,
    patio_id: null,
    quantidade_prevista: 0,
    unidade_medida_id: null
});

const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const previsaoAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < previsoes.value.length) {
        return previsoes.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${previsoes.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < previsoes.value.length - 1);

const garantirArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (typeof data === 'object' && data.id) return [data]; // Se for um objeto único com ID, converte para array
    return [];
};

watch(() => form.value.grupo_id, (novoGrupoId) => {
    if (novoGrupoId) {
        form.value.material_id = null;
    }
});

const carregar = async () => {
    loading.value = true;
    try {
        const [prevResp, gruposResp, materiaisResp, patiosResp, unidadesResp] = await Promise.all([
            service.getAll(),
            grupoService.getAll(),
            materialService.getAll(),
            patioService.getAll(),
            unidadeService.getAll()
        ]);
        
        previsoes.value = garantirArray(prevResp.data);
        grupos.value = garantirArray(gruposResp.data);
        
        // Para materiais, usar o mesmo padrão da tela de Materiais que está funcionando
        materiais.value = materiaisResp.data?.data || materiaisResp.data || [];
        if (!Array.isArray(materiais.value)) {
            materiais.value = [];
        }
        
        patios.value = garantirArray(patiosResp.data);
        unidades.value = garantirArray(unidadesResp.data);
        
        console.log('Materiais carregados (Previsões):', materiais.value.length, materiais.value);
        console.log('Materiais resposta completa:', materiaisResp.data);
        
        if (previsoes.value.length > 0 && indiceAtual.value < 0) {
            indiceAtual.value = 0;
            carregarRegistroAtual();
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar previsões', life: 3000 });
    }
    loading.value = false;
};

const carregarRegistroAtual = () => {
    if (previsaoAtual.value) {
        form.value = { ...previsaoAtual.value };
    }
};

const novo = () => {
    form.value = {
        id: null,
        grupo_id: null,
        material_id: null,
        patio_id: null,
        quantidade_prevista: 0,
        unidade_medida_id: null
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
    if (!form.value.quantidade_prevista || form.value.quantidade_prevista <= 0) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Quantidade prevista deve ser maior que zero', life: 3000 });
        return;
    }

    try {
        await service.save(form.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Previsão salva com sucesso', life: 3000 });
        await carregar();
        if (form.value.id) {
            const index = previsoes.value.findIndex(p => p.id === form.value.id);
            if (index >= 0) indiceAtual.value = index;
        } else {
            indiceAtual.value = previsoes.value.length - 1;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar previsão', life: 3000 });
    }
};

const editar = (item) => {
    const index = previsoes.value.findIndex(p => p.id === item.id);
    if (index >= 0) {
        indiceAtual.value = index;
        carregarRegistroAtual();
    }
};

const remover = async (item) => {
    if (!confirm(`Deseja realmente excluir esta previsão?`)) return;

    try {
        await service.delete(item.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Previsão excluída com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= previsoes.value.length) {
            indiceAtual.value = previsoes.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir previsão', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    const dados = previsoes.value.map(p => ({
        grupo: p.grupo?.nome || '',
        material: p.material?.nome || '',
        patio: p.patio?.nome || '',
        quantidade_prevista: p.quantidade_prevista || 0,
        unidade: p.unidade_medida?.unidade || ''
    }));

    gerarPDF(
        'RELATÓRIO DE PLANEJAMENTO DE RECEBIMENTO',
        dados,
        [
            { field: 'grupo', header: 'Grupo' },
            { field: 'material', header: 'Material' },
            { field: 'patio', header: 'Pátio' },
            { field: 'quantidade_prevista', header: 'Quantidade Prevista' },
            { field: 'unidade', header: 'Unidade' }
        ],
        'relatorio_previsoes.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
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
            <h2>PLANEJAMENTO DE RECEBIMENTO</h2>
            <Button v-if="hasPermission('previsoes.view')" label="Imprimir relatório" icon="pi pi-print" @click="imprimirRelatorio" />
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
            <div class="col-12 md:col-3">
                <label class="block mb-2">Quantidade prevista</label>
                <InputNumber v-model="form.quantidade_prevista" class="w-full" :min="0.01" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Unidade</label>
                <Dropdown v-model="form.unidade_medida_id" :options="unidades" optionLabel="unidade" optionValue="id" class="w-full" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button v-if="hasPermission('previsoes.create')" label="Novo" icon="pi pi-plus" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('previsoes.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('previsoes.create') || hasPermission('previsoes.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="previsoes" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column field="grupo" header="Grupo" />
            <Column field="material" header="Material" />
            <Column field="patio" header="Pátio" />
            <Column field="quantidade_prevista" header="Previsto" />
            <Column field="unidade_medida" header="Unidade" />
            <Column header="Ações">
                <template #body="{ data }">
                    <Button v-if="hasPermission('previsoes.edit')" icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button v-if="hasPermission('previsoes.delete')" icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
