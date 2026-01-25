<script setup>
import { onMounted, ref, computed } from 'vue';
import PrevisaoService from '@/service/PrevisaoService';
import PatioService from '@/service/PatioService';
import { useToast } from 'primevue/usetoast';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';

const toast = useToast();
const service = new PrevisaoService();
const patioService = new PatioService();

const previsoes = ref([]);
const patios = ref([]);
const patioSelecionado = ref(null);
const loading = ref(false);

const previsoesFiltradas = computed(() => {
    if (!patioSelecionado.value) return previsoes.value;
    return previsoes.value.filter((p) => p.patio_id === patioSelecionado.value);
});

const carregar = async () => {
    loading.value = true;
    try {
        const [prevResp, patiosResp] = await Promise.all([service.getAll(), patioService.getAll()]);
        previsoes.value = prevResp.data.data || [];
        patios.value = patiosResp.data.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar previsões', life: 3000 });
    }
    loading.value = false;
};

const imprimir = () => {
    const dados = previsoesFiltradas.value.map(p => ({
        patio: p.patio?.nome || '',
        grupo: p.grupo?.nome || '',
        material: p.material?.nome || '',
        quantidade_prevista: p.quantidade_prevista || 0,
        unidade: p.unidade_medida?.unidade || ''
    }));

    gerarPDF(
        'PREVISÃO POR PÁTIO',
        dados,
        [
            { field: 'patio', header: 'Pátio' },
            { field: 'grupo', header: 'Grupo' },
            { field: 'material', header: 'Material' },
            { field: 'quantidade_prevista', header: 'Previsto' },
            { field: 'unidade', header: 'Unidade' }
        ],
        'previsao_patio.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarPlanilha = () => {
    const dados = previsoesFiltradas.value.map(p => ({
        'Pátio': p.patio?.nome || '',
        'Grupo': p.grupo?.nome || '',
        'Material': p.material?.nome || '',
        'Quantidade Prevista': p.quantidade_prevista || 0,
        'Unidade': p.unidade_medida?.unidade || ''
    }));

    exportarExcel(dados, 'previsao_patio.xlsx', 'Previsão Pátio');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha exportada com sucesso', life: 3000 });
};

onMounted(carregar);
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>Previsão por Pátio</h2>
            <div class="flex gap-2">
                <Button label="Imprimir" icon="pi pi-print" @click="imprimir" />
                <Button label="Exportar planilha" icon="pi pi-file-excel" severity="success" @click="exportarPlanilha" />
            </div>
        </div>
        <div class="mb-3">
            <label class="block mb-2">Pátio</label>
            <Dropdown v-model="patioSelecionado" :options="patios" optionLabel="nome" optionValue="id" class="w-full" placeholder="Todos os pátios" />
        </div>
        <DataTable :value="previsoesFiltradas" :loading="loading" dataKey="id" :paginator="true" :rows="20">
            <Column field="patio" header="Pátio" />
            <Column field="grupo" header="Grupo" />
            <Column field="material" header="Material" />
            <Column field="quantidade_prevista" header="Previsto" />
            <Column field="unidade_medida" header="Unidade" />
        </DataTable>
    </div>
</template>
