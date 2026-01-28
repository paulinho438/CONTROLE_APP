<script setup>
import { onMounted, ref, computed } from 'vue';
import FornecedorService from '@/service/FornecedorService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const service = new FornecedorService();
const { hasPermission } = usePermissions();
const fornecedores = ref([]);
const form = ref({
    id: null,
    razao_social: '',
    cnpj_cpf: '',
    endereco: '',
    numero: '',
    cidade: '',
    estado: '',
    pais: '',
    telefone: '',
    email: ''
});
const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const fornecedorAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < fornecedores.value.length) {
        return fornecedores.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${fornecedores.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < fornecedores.value.length - 1);

const validarCNPJCPF = (valor) => {
    if (!valor) return true;
    const limpo = valor.replace(/\D/g, '');
    return limpo.length === 11 || limpo.length === 14;
};

const validarEmail = (email) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const carregar = async () => {
    loading.value = true;
    try {
        const response = await service.getAll();
        fornecedores.value = response.data.data || [];
        if (fornecedores.value.length > 0 && indiceAtual.value < 0) {
            indiceAtual.value = 0;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar fornecedores', life: 3000 });
    }
    loading.value = false;
};

const carregarRegistroAtual = () => {
    if (fornecedorAtual.value) {
        form.value = { ...fornecedorAtual.value };
    }
};

const novo = () => {
    form.value = {
        id: null,
        razao_social: '',
        cnpj_cpf: '',
        endereco: '',
        numero: '',
        cidade: '',
        estado: '',
        pais: '',
        telefone: '',
        email: ''
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
    if (!form.value.razao_social || form.value.razao_social.trim() === '') {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Razão social é obrigatória', life: 3000 });
        return;
    }
    if (form.value.cnpj_cpf && !validarCNPJCPF(form.value.cnpj_cpf)) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'CNPJ/CPF inválido', life: 3000 });
        return;
    }
    if (form.value.email && !validarEmail(form.value.email)) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Email inválido', life: 3000 });
        return;
    }

    try {
        await service.save(form.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Fornecedor salvo com sucesso', life: 3000 });
        await carregar();
        if (form.value.id) {
            const index = fornecedores.value.findIndex(f => f.id === form.value.id);
            if (index >= 0) indiceAtual.value = index;
        } else {
            indiceAtual.value = fornecedores.value.length - 1;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar fornecedor', life: 3000 });
    }
};

const editar = (item) => {
    const index = fornecedores.value.findIndex(f => f.id === item.id);
    if (index >= 0) {
        indiceAtual.value = index;
        carregarRegistroAtual();
    }
};

const remover = async (item) => {
    if (!confirm(`Deseja realmente excluir o fornecedor "${item.razao_social}"?`)) return;

    try {
        await service.delete(item.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Fornecedor excluído com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= fornecedores.value.length) {
            indiceAtual.value = fornecedores.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir fornecedor', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    const dados = fornecedores.value.map(f => ({
        razao_social: f.razao_social || '',
        cnpj_cpf: f.cnpj_cpf || '',
        cidade: f.cidade || '',
        telefone: f.telefone || ''
    }));

    gerarPDF(
        'RELATÓRIO DE FORNECEDORES',
        dados,
        [
            { field: 'razao_social', header: 'Razão Social' },
            { field: 'cnpj_cpf', header: 'CNPJ/CPF' },
            { field: 'cidade', header: 'Cidade' },
            { field: 'telefone', header: 'Telefone' }
        ],
        'relatorio_fornecedores.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarExcelFornecedores = () => {
    try {
        const dados = fornecedores.value.map(f => ({
            'Razão Social': f.razao_social || '',
            'CNPJ/CPF': f.cnpj_cpf || '',
            'Cidade': f.cidade || '',
            'Telefone': f.telefone || ''
        }));

        exportarExcel(dados, 'relatorio_fornecedores.xlsx', 'Fornecedores');
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
            <h2>FORNECEDOR</h2>
            <div class="flex gap-2">
                <Button v-if="hasPermission('fornecedores.view')" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirRelatorio" />
                <Button v-if="hasPermission('fornecedores.view')" label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcelFornecedores" />
            </div>
        </div>

        <div class="grid align-items-end mb-4">
            <div class="col-12 md:col-6">
                <label class="block mb-2">Razão social</label>
                <InputText v-model="form.razao_social" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">CNPJ/CPF</label>
                <InputText v-model="form.cnpj_cpf" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Telefone</label>
                <InputText v-model="form.telefone" class="w-full" />
            </div>
            <div class="col-12 md:col-6">
                <label class="block mb-2">Endereço</label>
                <InputText v-model="form.endereco" class="w-full" />
            </div>
            <div class="col-12 md:col-2">
                <label class="block mb-2">Número</label>
                <InputText v-model="form.numero" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Cidade</label>
                <InputText v-model="form.cidade" class="w-full" />
            </div>
            <div class="col-12 md:col-2">
                <label class="block mb-2">Estado</label>
                <InputText v-model="form.estado" class="w-full" />
            </div>
            <div class="col-12 md:col-2">
                <label class="block mb-2">País</label>
                <InputText v-model="form.pais" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Email</label>
                <InputText v-model="form.email" class="w-full" type="email" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button v-if="hasPermission('fornecedores.create')" label="Novo" icon="pi pi-plus" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('fornecedores.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('fornecedores.create') || hasPermission('fornecedores.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="fornecedores" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column field="razao_social" header="Razão social" />
            <Column field="cnpj_cpf" header="CNPJ/CPF" />
            <Column field="cidade" header="Cidade" />
            <Column field="telefone" header="Telefone" />
            <Column header="Ações">
                <template #body="{ data }">
                    <Button v-if="hasPermission('fornecedores.edit')" icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button v-if="hasPermission('fornecedores.delete')" icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
