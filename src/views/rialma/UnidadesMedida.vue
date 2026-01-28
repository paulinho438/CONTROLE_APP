<script setup>
import { onMounted, ref, computed } from 'vue';
import UnidadeMedidaService from '@/service/UnidadeMedidaService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import { gerarPDF } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const service = new UnidadeMedidaService();
const { hasPermission } = usePermissions();
const unidades = ref([]);
const form = ref({ id: null, unidade: '' });
const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const unidadeAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < unidades.value.length) {
        return unidades.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${unidades.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < unidades.value.length - 1);

const carregar = async () => {
    loading.value = true;
    try {
        const response = await service.getAll();
        unidades.value = response.data.data || [];
        if (unidades.value.length > 0 && indiceAtual.value < 0) {
            indiceAtual.value = 0;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar unidades', life: 3000 });
    }
    loading.value = false;
};

const carregarRegistroAtual = () => {
    if (unidadeAtual.value) {
        form.value = { ...unidadeAtual.value };
    }
};

const novo = () => {
    form.value = { id: null, unidade: '' };
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
    if (!form.value.unidade || form.value.unidade.trim() === '') {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Unidade é obrigatória', life: 3000 });
        return;
    }

    try {
        await service.save(form.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Unidade salva com sucesso', life: 3000 });
        await carregar();
        if (form.value.id) {
            const index = unidades.value.findIndex(u => u.id === form.value.id);
            if (index >= 0) indiceAtual.value = index;
        } else {
            indiceAtual.value = unidades.value.length - 1;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar unidade', life: 3000 });
    }
};

const editar = (item) => {
    const index = unidades.value.findIndex(u => u.id === item.id);
    if (index >= 0) {
        indiceAtual.value = index;
        carregarRegistroAtual();
    }
};

const remover = async (item) => {
    if (!confirm(`Deseja realmente excluir a unidade "${item.unidade}"?`)) return;

    try {
        await service.delete(item.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Unidade excluída com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= unidades.value.length) {
            indiceAtual.value = unidades.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir unidade', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    const dados = unidades.value.map(u => ({
        unidade: u.unidade || ''
    }));

    gerarPDF(
        'RELATÓRIO DE UNIDADES DE MEDIDA',
        dados,
        [{ field: 'unidade', header: 'Unidade' }],
        'relatorio_unidades_medida.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarExcelUnidadesMedida = () => {
    try {
        const dados = unidades.value.map(u => ({
            'Unidade': u.unidade || ''
        }));

        exportarExcel(dados, 'relatorio_unidades_medida.xlsx', 'Unidades de Medida');
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

onMounted(carregar);
</script>

<template>
    <div class="card" style="position: relative;">
        <div v-if="loading" class="flex align-items-center justify-content-center" style="min-height: 400px;">
            <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="3" />
        </div>
        <div v-else>
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>UNIDADE DE MEDIDA</h2>
            <div class="flex gap-2">
                <Button v-if="hasPermission('unidades-medida.view')" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirRelatorio" />
                <Button v-if="hasPermission('unidades-medida.view')" label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcelUnidadesMedida" />
            </div>
        </div>

        <div class="grid align-items-end mb-4">
            <div class="col-12 md:col-8">
                <label class="block mb-2">Unidade</label>
                <InputText v-model="form.unidade" class="w-full" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button v-if="hasPermission('unidades-medida.create')" label="Novo" icon="pi pi-plus" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('unidades-medida.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('unidades-medida.create') || hasPermission('unidades-medida.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="unidades" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column field="unidade" header="Unidade" />
            <Column header="Ações">
                <template #body="{ data }">
                    <Button v-if="hasPermission('unidades-medida.edit')" icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button v-if="hasPermission('unidades-medida.delete')" icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
