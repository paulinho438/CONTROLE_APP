<script setup>
import { onMounted, ref, computed } from 'vue';
import ColaboradorService from '@/service/ColaboradorService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const service = new ColaboradorService();
const { hasPermission } = usePermissions();
const colaboradores = ref([]);
const form = ref({
    id: null,
    nome_completo: '',
    funcao: '',
    departamento: '',
    telefone: ''
});
const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const colaboradorAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < colaboradores.value.length) {
        return colaboradores.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${colaboradores.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < colaboradores.value.length - 1);

const carregar = async () => {
    loading.value = true;
    try {
        const response = await service.getAll();
        colaboradores.value = response.data.data || [];
        if (colaboradores.value.length > 0 && indiceAtual.value < 0) {
            indiceAtual.value = 0;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar colaboradores', life: 3000 });
    }
    loading.value = false;
};

const carregarRegistroAtual = () => {
    if (colaboradorAtual.value) {
        form.value = { ...colaboradorAtual.value };
    }
};

const novo = () => {
    form.value = {
        id: null,
        nome_completo: '',
        funcao: '',
        departamento: '',
        telefone: ''
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
    if (!form.value.nome_completo || form.value.nome_completo.trim() === '') {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Nome completo é obrigatório', life: 3000 });
        return;
    }

    try {
        await service.save(form.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Colaborador salvo com sucesso', life: 3000 });
        await carregar();
        if (form.value.id) {
            const index = colaboradores.value.findIndex(c => c.id === form.value.id);
            if (index >= 0) indiceAtual.value = index;
        } else {
            indiceAtual.value = colaboradores.value.length - 1;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar colaborador', life: 3000 });
    }
};

const editar = (item) => {
    const index = colaboradores.value.findIndex(c => c.id === item.id);
    if (index >= 0) {
        indiceAtual.value = index;
        carregarRegistroAtual();
    }
};

const remover = async (item) => {
    if (!confirm(`Deseja realmente excluir o colaborador "${item.nome_completo}"?`)) return;

    try {
        await service.delete(item.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Colaborador excluído com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= colaboradores.value.length) {
            indiceAtual.value = colaboradores.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir colaborador', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    try {
        const dados = colaboradores.value.map(c => ({
            nome: c.nome_completo || '',
            funcao: c.funcao || '',
            departamento: c.departamento || '',
            telefone: c.telefone || ''
        }));

        gerarPDF(
            'RELATÓRIO DE COLABORADORES',
            dados,
            [
                { field: 'nome', header: 'Nome' },
                { field: 'funcao', header: 'Função' },
                { field: 'departamento', header: 'Departamento' },
                { field: 'telefone', header: 'Telefone' }
            ],
            'relatorio_colaboradores.pdf'
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

const exportarExcelColaboradores = () => {
    try {
        const dados = colaboradores.value.map(c => ({
            'Nome': c.nome_completo || '',
            'Função': c.funcao || '',
            'Departamento': c.departamento || '',
            'Telefone': c.telefone || ''
        }));

        exportarExcel(dados, 'relatorio_colaboradores.xlsx', 'Colaboradores');
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
            <h2>COLABORADOR</h2>
            <div class="flex gap-2">
                <Button v-if="hasPermission('colaboradores.view')" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirRelatorio" />
                <Button v-if="hasPermission('colaboradores.view')" label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcelColaboradores" />
            </div>
        </div>

        <div class="grid align-items-end mb-4">
            <div class="col-12 md:col-6">
                <label class="block mb-2">Nome completo</label>
                <InputText v-model="form.nome_completo" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Função</label>
                <InputText v-model="form.funcao" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Departamento</label>
                <InputText v-model="form.departamento" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Telefone</label>
                <InputText v-model="form.telefone" class="w-full" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button v-if="hasPermission('colaboradores.create')" label="Novo" icon="pi pi-plus" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('colaboradores.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('colaboradores.create') || hasPermission('colaboradores.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="colaboradores" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column field="nome_completo" header="Nome" />
            <Column field="funcao" header="Função" />
            <Column field="departamento" header="Departamento" />
            <Column field="telefone" header="Telefone" />
            <Column header="Ações">
                <template #body="{ data }">
                    <Button v-if="hasPermission('colaboradores.edit')" icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button v-if="hasPermission('colaboradores.delete')" icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
