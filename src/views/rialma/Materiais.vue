<script setup>
import { onMounted, ref, computed } from 'vue';
import MaterialService from '@/service/MaterialService';
import GrupoService from '@/service/GrupoService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const service = new MaterialService();
const grupoService = new GrupoService();
const { hasPermission } = usePermissions();
const materiais = ref([]);
const grupos = ref([]);
const form = ref({
    id: null,
    grupo_id: null,
    nome: '',
    aplicacao: '',
    cor_predominante: '',
    comprimento_m: null,
    largura_m: null,
    altura_m: null,
    massa_kg: null,
    densidade_kmm: null,
    estoque_previsto: 0
});
const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const materialAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < materiais.value.length) {
        return materiais.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${materiais.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < materiais.value.length - 1);

const carregar = async () => {
    loading.value = true;
    try {
        const [materiaisResp, gruposResp] = await Promise.all([service.getAll(), grupoService.getAll()]);
        materiais.value = materiaisResp.data.data || [];
        grupos.value = gruposResp.data.data || [];
        if (materiais.value.length > 0 && indiceAtual.value < 0) {
            indiceAtual.value = 0;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar materiais', life: 3000 });
    }
    loading.value = false;
};

const carregarRegistroAtual = () => {
    if (materialAtual.value) {
        form.value = { ...materialAtual.value };
    }
};

const novo = () => {
    form.value = {
        id: null,
        grupo_id: null,
        nome: '',
        aplicacao: '',
        cor_predominante: '',
        comprimento_m: null,
        largura_m: null,
        altura_m: null,
        massa_kg: null,
        densidade_kmm: null,
        estoque_previsto: 0
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
    if (!form.value.nome || form.value.nome.trim() === '') {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Nome do material é obrigatório', life: 3000 });
        return;
    }
    if (!form.value.grupo_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Grupo é obrigatório', life: 3000 });
        return;
    }

    try {
        await service.save(form.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Material salvo com sucesso', life: 3000 });
        await carregar();
        if (form.value.id) {
            const index = materiais.value.findIndex(m => m.id === form.value.id);
            if (index >= 0) indiceAtual.value = index;
        } else {
            indiceAtual.value = materiais.value.length - 1;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar material', life: 3000 });
    }
};

const editar = (item) => {
    const index = materiais.value.findIndex(m => m.id === item.id);
    if (index >= 0) {
        indiceAtual.value = index;
        carregarRegistroAtual();
    }
};

const remover = async (item) => {
    if (!confirm(`Deseja realmente excluir o material "${item.nome}"?`)) return;

    try {
        await service.delete(item.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Material excluído com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= materiais.value.length) {
            indiceAtual.value = materiais.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir material', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    const dados = materiais.value.map(m => ({
        grupo: m.grupo?.nome || '',
        material: m.nome || '',
        aplicacao: m.aplicacao || '',
        estoque_previsto: m.estoque_previsto || 0
    }));

    gerarPDF(
        'RELATÓRIO DE MATERIAIS',
        dados,
        [
            { field: 'grupo', header: 'Grupo' },
            { field: 'material', header: 'Material' },
            { field: 'aplicacao', header: 'Aplicação' },
            { field: 'estoque_previsto', header: 'Previsto' }
        ],
        'relatorio_materiais.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarPlanilha = () => {
    const dados = materiais.value.map(m => ({
        'Grupo': m.grupo?.nome || '',
        'Material': m.nome || '',
        'Aplicação': m.aplicacao || '',
        'Cor Predominante': m.cor_predominante || '',
        'Comprimento (m)': m.comprimento_m || '',
        'Largura (m)': m.largura_m || '',
        'Altura (m)': m.altura_m || '',
        'Massa (kg)': m.massa_kg || '',
        'Densidade (kmm)': m.densidade_kmm || '',
        'Estoque Previsto': m.estoque_previsto || 0
    }));

    exportarExcel(dados, 'relatorio_materiais.xlsx', 'Materiais');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha exportada com sucesso', life: 3000 });
};

onMounted(carregar);
</script>

<template>
    <div class="card" style="position: relative;">
        <div v-if="loading" class="flex align-items-center justify-content-center" style="min-height: 400px;">
            <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="3" />
        </div>
        <div v-else>
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>MATERIAL</h2>
            <div class="flex gap-2">
                <Button v-if="hasPermission('materiais.view')" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirRelatorio" />
                <Button v-if="hasPermission('materiais.view')" label="Exportar planilha" icon="pi pi-file-excel" severity="success" @click="exportarPlanilha" />
            </div>
        </div>

        <div class="grid align-items-end mb-4">
            <div class="col-12 md:col-6">
                <label class="block mb-2">Grupo</label>
                <Dropdown v-model="form.grupo_id" :options="grupos" optionLabel="nome" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-6">
                <label class="block mb-2">Material</label>
                <InputText v-model="form.nome" class="w-full" />
            </div>
            <div class="col-12 md:col-6">
                <label class="block mb-2">Aplicação</label>
                <InputText v-model="form.aplicacao" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Cor predominante</label>
                <InputText v-model="form.cor_predominante" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Estoque previsto</label>
                <InputNumber v-model="form.estoque_previsto" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Comprimento (m)</label>
                <InputNumber v-model="form.comprimento_m" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Largura (m)</label>
                <InputNumber v-model="form.largura_m" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Altura (m)</label>
                <InputNumber v-model="form.altura_m" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Massa (kg)</label>
                <InputNumber v-model="form.massa_kg" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Densidade (kmm)</label>
                <InputNumber v-model="form.densidade_kmm" class="w-full" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button v-if="hasPermission('materiais.create')" label="Novo" icon="pi pi-plus" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('materiais.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('materiais.create') || hasPermission('materiais.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="materiais" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column field="grupo" header="Grupo" />
            <Column field="nome" header="Material" />
            <Column field="aplicacao" header="Aplicação" />
            <Column field="estoque_previsto" header="Previsto" />
            <Column header="Ações">
                <template #body="{ data }">
                    <Button v-if="hasPermission('materiais.edit')" icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button v-if="hasPermission('materiais.delete')" icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
