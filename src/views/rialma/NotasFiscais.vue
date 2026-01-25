<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import NotaFiscalService from '@/service/NotaFiscalService';
import FornecedorService from '@/service/FornecedorService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const { hasPermission } = usePermissions();
const service = new NotaFiscalService();
const fornecedorService = new FornecedorService();
const notas = ref([]);
const fornecedores = ref([]);

const form = ref({
    id: null,
    fornecedor_id: null,
    razao_social: '',
    cnpj_cpf: '',
    numero_nota: '',
    data_emissao: null,
    data_recebimento: null,
    peso_nota: null,
    valor: null
});

const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const notaAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < notas.value.length) {
        return notas.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${notas.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < notas.value.length - 1);

watch(() => form.value.fornecedor_id, (novoFornecedorId) => {
    if (novoFornecedorId) {
        const fornecedor = fornecedores.value.find(f => f.id === novoFornecedorId);
        if (fornecedor) {
            form.value.razao_social = fornecedor.razao_social || '';
            form.value.cnpj_cpf = fornecedor.cnpj_cpf || '';
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

const validarCNPJCPF = (valor) => {
    if (!valor) return true;
    const limpo = valor.replace(/\D/g, '');
    return limpo.length === 11 || limpo.length === 14;
};

const carregar = async () => {
    loading.value = true;
    try {
        const [notasResp, fornecedoresResp] = await Promise.all([service.getAll(), fornecedorService.getAll()]);
        notas.value = notasResp.data.data || [];
        fornecedores.value = fornecedoresResp.data.data || [];
        
        if (notas.value.length > 0 && indiceAtual.value < 0) {
            indiceAtual.value = 0;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar dados', life: 3000 });
    }
    loading.value = false;
};

const carregarRegistroAtual = () => {
    if (notaAtual.value) {
        form.value = {
            ...notaAtual.value,
            data_emissao: notaAtual.value.data_emissao ? new Date(notaAtual.value.data_emissao) : null,
            data_recebimento: notaAtual.value.data_recebimento ? new Date(notaAtual.value.data_recebimento) : null
        };
    }
};

const novo = () => {
    form.value = {
        id: null,
        fornecedor_id: null,
        razao_social: '',
        cnpj_cpf: '',
        numero_nota: '',
        data_emissao: null,
        data_recebimento: null,
        peso_nota: null,
        valor: null
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
    if (!form.value.fornecedor_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Fornecedor é obrigatório', life: 3000 });
        return;
    }
    if (!form.value.numero_nota || form.value.numero_nota.trim() === '') {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Número da nota é obrigatório', life: 3000 });
        return;
    }
    if (form.value.cnpj_cpf && !validarCNPJCPF(form.value.cnpj_cpf)) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'CNPJ/CPF inválido', life: 3000 });
        return;
    }
    if (form.value.valor && form.value.valor < 0) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Valor não pode ser negativo', life: 3000 });
        return;
    }

    try {
        const payload = {
            ...form.value,
            data_emissao: formatDate(form.value.data_emissao),
            data_recebimento: formatDate(form.value.data_recebimento)
        };
        await service.save(payload);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Nota fiscal salva com sucesso', life: 3000 });
        await carregar();
        if (form.value.id) {
            const index = notas.value.findIndex(n => n.id === form.value.id);
            if (index >= 0) indiceAtual.value = index;
        } else {
            indiceAtual.value = notas.value.length - 1;
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar nota fiscal', life: 3000 });
    }
};

const editar = (item) => {
    const index = notas.value.findIndex(n => n.id === item.id);
    if (index >= 0) {
        indiceAtual.value = index;
        carregarRegistroAtual();
    }
};

const remover = async (item) => {
    if (!confirm(`Deseja realmente excluir a nota fiscal "${item.numero_nota}"?`)) return;

    try {
        await service.delete(item.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Nota fiscal excluída com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= notas.value.length) {
            indiceAtual.value = notas.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir nota fiscal', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    const dados = notas.value.map(n => ({
        fornecedor: n.fornecedor?.razao_social || n.razao_social || '',
        numero_nota: n.numero_nota || '',
        cnpj_cpf: n.cnpj_cpf || '',
        data_emissao: n.data_emissao ? new Date(n.data_emissao).toLocaleDateString('pt-BR') : '',
        data_recebimento: n.data_recebimento ? new Date(n.data_recebimento).toLocaleDateString('pt-BR') : '',
        peso: n.peso_nota || 0,
        valor: n.valor ? `R$ ${parseFloat(n.valor).toFixed(2)}` : 'R$ 0,00'
    }));

    gerarPDF(
        'RELATÓRIO DE NOTAS FISCAIS',
        dados,
        [
            { field: 'fornecedor', header: 'Fornecedor' },
            { field: 'numero_nota', header: 'Número' },
            { field: 'cnpj_cpf', header: 'CNPJ/CPF' },
            { field: 'data_emissao', header: 'Emissão' },
            { field: 'data_recebimento', header: 'Recebimento' },
            { field: 'peso', header: 'Peso' },
            { field: 'valor', header: 'Valor' }
        ],
        'relatorio_notas_fiscais.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
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
            <h2>NOTA FISCAL</h2>
            <Button v-if="hasPermission('notas-fiscais.view')" label="Imprimir relatório" icon="pi pi-print" @click="imprimirRelatorio" />
        </div>

        <div class="grid align-items-end mb-4">
            <div class="col-12 md:col-6">
                <label class="block mb-2">Fornecedor</label>
                <Dropdown v-model="form.fornecedor_id" :options="fornecedores" optionLabel="razao_social" optionValue="id" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Razão social</label>
                <InputText v-model="form.razao_social" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">CNPJ/CPF</label>
                <InputText v-model="form.cnpj_cpf" class="w-full" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Número da nota</label>
                <InputText v-model="form.numero_nota" class="w-full" />
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
                <label class="block mb-2">Peso da nota</label>
                <InputNumber v-model="form.peso_nota" class="w-full" :min="0" />
            </div>
            <div class="col-12 md:col-3">
                <label class="block mb-2">Valor (R$)</label>
                <InputNumber v-model="form.valor" class="w-full" mode="currency" currency="BRL" locale="pt-BR" :min="0" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button v-if="hasPermission('notas-fiscais.create')" label="Novo" icon="pi pi-plus" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('notas-fiscais.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('notas-fiscais.create') || hasPermission('notas-fiscais.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="notas" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column field="fornecedor" header="Fornecedor" />
            <Column field="numero_nota" header="Número" />
            <Column field="data_emissao" header="Emissão">
                <template #body="{ data }">
                    {{ data.data_emissao ? new Date(data.data_emissao).toLocaleDateString('pt-BR') : '' }}
                </template>
            </Column>
            <Column field="valor" header="Valor">
                <template #body="{ data }">
                    {{ data.valor ? `R$ ${parseFloat(data.valor).toFixed(2)}` : 'R$ 0,00' }}
                </template>
            </Column>
            <Column header="Ações">
                <template #body="{ data }">
                    <Button v-if="hasPermission('notas-fiscais.edit')" icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button v-if="hasPermission('notas-fiscais.delete')" icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
