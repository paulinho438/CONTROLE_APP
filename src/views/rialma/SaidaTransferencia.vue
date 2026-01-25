<script setup>
import { onMounted, ref, computed } from 'vue';
import SaidaService from '@/service/SaidaService';
import PatioService from '@/service/PatioService';
import { useToast } from 'primevue/usetoast';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';

const toast = useToast();
const service = new SaidaService();
const patioService = new PatioService();

const saidas = ref([]);
const patios = ref([]);
const filtroRomaneio = ref('');
const filtroPatio = ref(null);
const loading = ref(false);

const saidasFiltradas = computed(() => {
    let resultado = saidas.value;

    if (filtroRomaneio.value) {
        resultado = resultado.filter(s => 
            s.numero_romaneio?.toLowerCase().includes(filtroRomaneio.value.toLowerCase())
        );
    }

    if (filtroPatio.value) {
        resultado = resultado.filter(s => s.patio_id === filtroPatio.value);
    }

    return resultado;
});

const carregar = async () => {
    loading.value = true;
    try {
        const [saidasResp, patiosResp] = await Promise.all([
            service.getAll(),
            patioService.getAll()
        ]);
        saidas.value = saidasResp.data.data || [];
        patios.value = patiosResp.data.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar dados', life: 3000 });
    }
    loading.value = false;
};

const imprimirRelatorio = () => {
    const dados = saidasFiltradas.value.map(s => ({
        material: s.material?.nome || '',
        patio: s.patio?.nome || '',
        tipo: s.tipo_movimentacao || '',
        quantidade: s.quantidade || 0,
        unidade: s.unidade_medida?.unidade || '',
        data_saida: s.data_saida ? new Date(s.data_saida).toLocaleDateString('pt-BR') : '',
        numero_romaneio: s.numero_romaneio || '',
        destino: s.destino || s.destino_patio?.nome || ''
    }));

    gerarPDF(
        'SAÍDA E TRANSFERÊNCIA DE MATERIAL',
        dados,
        [
            { field: 'material', header: 'Material' },
            { field: 'patio', header: 'Pátio' },
            { field: 'tipo', header: 'Tipo' },
            { field: 'quantidade', header: 'Quantidade' },
            { field: 'unidade', header: 'Unidade' },
            { field: 'data_saida', header: 'Data Saída' },
            { field: 'numero_romaneio', header: 'Romaneio' },
            { field: 'destino', header: 'Destino' }
        ],
        'saida_transferencia.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarPlanilha = () => {
    const dados = saidasFiltradas.value.map(s => ({
        'Material': s.material?.nome || '',
        'Pátio': s.patio?.nome || '',
        'Tipo': s.tipo_movimentacao || '',
        'Quantidade': s.quantidade || 0,
        'Unidade': s.unidade_medida?.unidade || '',
        'Data Saída': s.data_saida ? new Date(s.data_saida).toLocaleDateString('pt-BR') : '',
        'Nº Romaneio': s.numero_romaneio || '',
        'Destino': s.destino || s.destino_patio?.nome || ''
    }));

    exportarExcel(dados, 'saida_transferencia.xlsx', 'Saídas');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha exportada com sucesso', life: 3000 });
};

onMounted(carregar);
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>SAÍDA E TRANSFERÊNCIA DE MATERIAL</h2>
            <div class="flex gap-2">
                <Button label="Imprimir" icon="pi pi-print" @click="imprimirRelatorio" />
                <Button label="Exportar planilha" icon="pi pi-file-excel" severity="success" @click="exportarPlanilha" />
            </div>
        </div>

        <div class="grid mb-4">
            <div class="col-12 md:col-4">
                <label class="block mb-2">Nº. romaneio</label>
                <InputText v-model="filtroRomaneio" placeholder="Número do romaneio" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Pátio</label>
                <Dropdown v-model="filtroPatio" :options="patios" optionLabel="nome" optionValue="id" class="w-full" placeholder="Todos" />
            </div>
        </div>

        <DataTable :value="saidasFiltradas" :loading="loading" dataKey="id" :paginator="true" :rows="20">
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
            <Column field="numero_romaneio" header="Romaneio" />
            <Column field="destino" header="Destino">
                <template #body="{ data }">
                    {{ data.destino || data.destino_patio?.nome || '' }}
                </template>
            </Column>
        </DataTable>
    </div>
</template>

