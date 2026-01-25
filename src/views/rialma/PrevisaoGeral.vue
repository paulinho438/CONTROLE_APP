<script setup>
import { onMounted, ref, computed } from 'vue';
import PrevisaoService from '@/service/PrevisaoService';
import GrupoService from '@/service/GrupoService';
import { useToast } from 'primevue/usetoast';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const service = new PrevisaoService();
const grupoService = new GrupoService();

const previsoes = ref([]);
const grupos = ref([]);
const gruposSelecionados = ref([]);
const loading = ref(false);

const previsoesFiltradas = computed(() => {
    if (gruposSelecionados.value.length === 0) return previsoes.value;
    const ids = gruposSelecionados.value.map((g) => g.id);
    return previsoes.value.filter((p) => ids.includes(p.grupo_id));
});

const carregar = async () => {
    loading.value = true;
    try {
        const [prevResp, gruposResp] = await Promise.all([service.getAll(), grupoService.getAll()]);
        previsoes.value = prevResp.data.data || [];
        grupos.value = gruposResp.data.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar previsões', life: 3000 });
    }
    loading.value = false;
};

const imprimir = () => {
    const dados = previsoesFiltradas.value.map(p => ({
        grupo: p.grupo?.nome || '',
        material: p.material?.nome || '',
        patio: p.patio?.nome || '',
        quantidade_prevista: p.quantidade_prevista || 0,
        unidade: p.unidade_medida?.unidade || ''
    }));

    gerarPDF(
        'PREVISÃO GERAL',
        dados,
        [
            { field: 'grupo', header: 'Grupo' },
            { field: 'material', header: 'Material' },
            { field: 'patio', header: 'Pátio' },
            { field: 'quantidade_prevista', header: 'Previsto' },
            { field: 'unidade', header: 'Unidade' }
        ],
        'previsao_geral.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarPlanilha = () => {
    const dados = previsoesFiltradas.value.map(p => ({
        'Grupo': p.grupo?.nome || '',
        'Material': p.material?.nome || '',
        'Pátio': p.patio?.nome || '',
        'Quantidade Prevista': p.quantidade_prevista || 0,
        'Unidade': p.unidade_medida?.unidade || ''
    }));

    exportarExcel(dados, 'previsao_geral.xlsx', 'Previsão Geral');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha exportada com sucesso', life: 3000 });
};

onMounted(carregar);
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>Previsão Geral</h2>
            <div class="flex gap-2">
                <Button label="Imprimir" icon="pi pi-print" @click="imprimir" />
                <Button label="Exportar planilha" icon="pi pi-file-excel" severity="success" @click="exportarPlanilha" />
            </div>
        </div>
        <div class="mb-3">
            <label class="block mb-2">Filtrar grupos</label>
            <MultiSelect v-model="gruposSelecionados" :options="grupos" optionLabel="nome" display="chip" placeholder="Todos os grupos" class="w-full" />
        </div>
        <DataTable :value="previsoesFiltradas" :loading="loading" dataKey="id" :paginator="true" :rows="20">
            <Column field="grupo" header="Grupo" />
            <Column field="material" header="Material" />
            <Column field="patio" header="Pátio" />
            <Column field="quantidade_prevista" header="Previsto" />
            <Column field="unidade_medida" header="Unidade" />
        </DataTable>
    </div>
</template>
