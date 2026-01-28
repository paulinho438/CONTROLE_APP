<script setup>
import { onMounted, ref, computed } from 'vue';
import NotaFiscalService from '@/service/NotaFiscalService';
import FornecedorService from '@/service/FornecedorService';
import { useToast } from 'primevue/usetoast';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';

const toast = useToast();
const service = new NotaFiscalService();
const fornecedorService = new FornecedorService();

const notas = ref([]);
const fornecedores = ref([]);
const filtroFornecedor = ref(null);
const filtroNumero = ref('');
const filtroDataInicio = ref(null);
const filtroDataFim = ref(null);
const loading = ref(false);

const notasFiltradas = computed(() => {
    let resultado = notas.value;

    if (filtroFornecedor.value) {
        resultado = resultado.filter(n => n.fornecedor_id === filtroFornecedor.value);
    }

    if (filtroNumero.value) {
        const busca = String(filtroNumero.value).toLowerCase().trim();
        resultado = resultado.filter(n =>
            String(n.numero_nota ?? '').toLowerCase().includes(busca)
        );
    }

    if (filtroDataInicio.value) {
        const inicio = new Date(filtroDataInicio.value);
        inicio.setHours(0, 0, 0, 0);
        resultado = resultado.filter(n => {
            if (!n.data_emissao) return false;
            const data = new Date(n.data_emissao);
            return data >= inicio;
        });
    }

    if (filtroDataFim.value) {
        const fim = new Date(filtroDataFim.value);
        fim.setHours(23, 59, 59, 999);
        resultado = resultado.filter(n => {
            if (!n.data_emissao) return false;
            const data = new Date(n.data_emissao);
            return data <= fim;
        });
    }

    return resultado;
});

const carregar = async () => {
    loading.value = true;
    try {
        const params = filtroNumero.value?.trim() ? { numero_nota: filtroNumero.value.trim() } : {};
        const [notasResp, fornecedoresResp] = await Promise.all([
            service.getAll(params),
            fornecedorService.getAll()
        ]);
        notas.value = notasResp.data.data || [];
        fornecedores.value = fornecedoresResp.data.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar histórico', life: 3000 });
    }
    loading.value = false;
};

const imprimirRelatorio = () => {
    const dados = notasFiltradas.value.map(n => ({
        fornecedor: n.fornecedor?.razao_social || n.razao_social || '',
        numero_nota: n.numero_nota || '',
        cnpj_cpf: n.cnpj_cpf || '',
        data_emissao: n.data_emissao ? new Date(n.data_emissao).toLocaleDateString('pt-BR') : '',
        data_recebimento: n.data_recebimento ? new Date(n.data_recebimento).toLocaleDateString('pt-BR') : '',
        peso: n.peso_nota || 0,
        valor: n.valor ? `R$ ${parseFloat(n.valor).toFixed(2)}` : 'R$ 0,00'
    }));

    gerarPDF(
        'HISTÓRICO DE NOTAS FISCAIS',
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
        'historico_notas_fiscais.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarPlanilha = () => {
    const dados = notasFiltradas.value.map(n => ({
        'Fornecedor': n.fornecedor?.razao_social || n.razao_social || '',
        'Número': n.numero_nota || '',
        'CNPJ/CPF': n.cnpj_cpf || '',
        'Data Emissão': n.data_emissao ? new Date(n.data_emissao).toLocaleDateString('pt-BR') : '',
        'Data Recebimento': n.data_recebimento ? new Date(n.data_recebimento).toLocaleDateString('pt-BR') : '',
        'Peso': n.peso_nota || 0,
        'Valor': n.valor ? parseFloat(n.valor).toFixed(2) : '0.00'
    }));

    exportarExcel(dados, 'historico_notas_fiscais.xlsx', 'Histórico');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha exportada com sucesso', life: 3000 });
};

onMounted(carregar);
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>HISTÓRICO DE NOTAS FISCAIS</h2>
            <div class="flex gap-2">
                <Button label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirRelatorio" />
                <Button label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarPlanilha" />
            </div>
        </div>

        <div class="grid mb-4">
            <div class="col-12 md:col-4">
                <label class="block mb-2">Pesquisar nota fiscal</label>
                <div class="flex gap-2">
                    <InputText v-model="filtroNumero" placeholder="Número da nota" class="flex-1" @keyup.enter="carregar" />
                    <Button label="Buscar" icon="pi pi-search" @click="carregar" />
                </div>
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Fornecedor</label>
                <Dropdown v-model="filtroFornecedor" :options="fornecedores" optionLabel="razao_social" optionValue="id" class="w-full" placeholder="Todos" />
            </div>
            <div class="col-12 md:col-2">
                <label class="block mb-2">Data Início</label>
                <Calendar v-model="filtroDataInicio" dateFormat="dd/mm/yy" class="w-full" placeholder="Início" />
            </div>
            <div class="col-12 md:col-2">
                <label class="block mb-2">Data Fim</label>
                <Calendar v-model="filtroDataFim" dateFormat="dd/mm/yy" class="w-full" placeholder="Fim" />
            </div>
        </div>

        <DataTable :value="notasFiltradas" :loading="loading" dataKey="id" :paginator="true" :rows="20">
            <Column field="fornecedor" header="Fornecedor" />
            <Column field="numero_nota" header="Número" />
            <Column field="cnpj_cpf" header="CNPJ/CPF" />
            <Column field="data_emissao" header="Data Emissão">
                <template #body="{ data }">
                    {{ data.data_emissao ? new Date(data.data_emissao).toLocaleDateString('pt-BR') : '' }}
                </template>
            </Column>
            <Column field="data_recebimento" header="Data Recebimento">
                <template #body="{ data }">
                    {{ data.data_recebimento ? new Date(data.data_recebimento).toLocaleDateString('pt-BR') : '' }}
                </template>
            </Column>
            <Column field="peso_nota" header="Peso" />
            <Column field="valor" header="Valor">
                <template #body="{ data }">
                    {{ data.valor ? `R$ ${parseFloat(data.valor).toFixed(2)}` : 'R$ 0,00' }}
                </template>
            </Column>
        </DataTable>
    </div>
</template>

