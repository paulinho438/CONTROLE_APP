<script setup>
import { onMounted, ref, computed } from 'vue';
import PatioService from '@/service/PatioService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const service = new PatioService();
const { hasPermission } = usePermissions();
const patios = ref([]);
const form = ref({ id: null, nome: '' });
const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const patioAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < patios.value.length) {
        return patios.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${patios.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < patios.value.length - 1);

const carregar = async () => {
    loading.value = true;
    try {
        const response = await service.getAll();
        patios.value = response.data.data || [];
        if (patios.value.length > 0 && indiceAtual.value < 0) {
            indiceAtual.value = 0;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar pátios', life: 3000 });
    }
    loading.value = false;
};

const carregarRegistroAtual = () => {
    if (patioAtual.value) {
        form.value = { ...patioAtual.value };
    }
};

const novo = () => {
    form.value = { id: null, nome: '' };
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
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Nome do pátio é obrigatório', life: 3000 });
        return;
    }

    try {
        await service.save(form.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Pátio salvo com sucesso', life: 3000 });
        await carregar();
        if (form.value.id) {
            const index = patios.value.findIndex(p => p.id === form.value.id);
            if (index >= 0) indiceAtual.value = index;
        } else {
            indiceAtual.value = patios.value.length - 1;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar pátio', life: 3000 });
    }
};

const editar = (patio) => {
    const index = patios.value.findIndex(p => p.id === patio.id);
    if (index >= 0) {
        indiceAtual.value = index;
        carregarRegistroAtual();
    }
};

const remover = async (patio) => {
    if (!confirm(`Deseja realmente excluir o pátio "${patio.nome}"?`)) return;

    try {
        await service.delete(patio.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Pátio excluído com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= patios.value.length) {
            indiceAtual.value = patios.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir pátio', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    const dados = patios.value.map(p => ({
        patio: p.nome || ''
    }));

    gerarPDF(
        'RELATÓRIO DE PÁTIOS',
        dados,
        [{ field: 'patio', header: 'Pátio' }],
        'relatorio_patios.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarExcelPatios = () => {
    try {
        const dados = patios.value.map(p => ({
            'Pátio': p.nome || ''
        }));

        exportarExcel(dados, 'relatorio_patios.xlsx', 'Pátios');
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
            <h2>PÁTIO</h2>
            <div class="flex gap-2">
                <Button v-if="hasPermission('patios.view')" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirRelatorio" />
                <Button v-if="hasPermission('patios.view')" label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcelPatios" />
            </div>
        </div>

        <div class="grid align-items-end mb-4">
            <div class="col-12 md:col-8">
                <label class="block mb-2">Pátio</label>
                <InputText v-model="form.nome" class="w-full" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button v-if="hasPermission('patios.create')" label="Novo" icon="pi pi-plus" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('patios.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('patios.create') || hasPermission('patios.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="patios" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column field="nome" header="Pátio" />
            <Column header="Ações">
                <template #body="{ data }">
                    <Button v-if="hasPermission('patios.edit')" icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button v-if="hasPermission('patios.delete')" icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
