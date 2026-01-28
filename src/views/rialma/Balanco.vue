<script setup>
import { onMounted, ref, computed } from 'vue';
import DashboardService from '@/service/DashboardService';
import GrupoService from '@/service/GrupoService';
import MaterialService from '@/service/MaterialService';
import { useToast } from 'primevue/usetoast';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const dashboardService = new DashboardService();
const grupoService = new GrupoService();
const materialService = new MaterialService();

const grupos = ref([]);
const materiais = ref([]);
const filtroGrupo = ref(null);
const filtroMaterial = ref(null);
const pesquisaMaterial = ref('');
const resumo = ref({ patios: [], grupos: [] });
const loading = ref(false);

const materiaisFiltrados = computed(() => {
    if (!filtroGrupo.value) return materiais.value;
    return materiais.value.filter(m => m.grupo_id === filtroGrupo.value);
});

const carregarFiltros = async () => {
    try {
        const [gruposResp, materiaisResp] = await Promise.all([grupoService.getAll(), materialService.getAll()]);
        grupos.value = gruposResp.data.data || [];
        materiais.value = materiaisResp.data.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar filtros', life: 3000 });
    }
};

const carregarResumo = async () => {
    loading.value = true;
    try {
        const response = await dashboardService.resumoEstoque({
            grupos: filtroGrupo.value ? [filtroGrupo.value] : [],
            materiais: filtroMaterial.value ? [filtroMaterial.value] : []
        });
        resumo.value = response.data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar balanço', life: 3000 });
    }
    loading.value = false;
};

const imprimirRelatorio = () => {
    const dados = [];
    resumo.value.grupos.forEach(grupo => {
        grupo.materiais.forEach(material => {
            dados.push({
                grupo: grupo.nome,
                material: material.material,
                estoque_atual: material.total_recebido || 0,
                previsto: material.estoque_previsto || 0,
                diferenca: material.diferenca || 0
            });
        });
    });

    gerarPDF(
        'RELATÓRIO DE BALANÇO DE MATERIAL',
        dados,
        [
            { field: 'grupo', header: 'Grupo' },
            { field: 'material', header: 'Material' },
            { field: 'estoque_atual', header: 'Estoque Atual' },
            { field: 'previsto', header: 'Previsto' },
            { field: 'diferenca', header: 'Diferença' }
        ],
        'relatorio_balanco.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarPlanilha = () => {
    const dados = [];
    resumo.value.grupos.forEach(grupo => {
        grupo.materiais.forEach(material => {
            dados.push({
                'Grupo': grupo.nome,
                'Material': material.material,
                'Estoque Atual': material.total_recebido || 0,
                'Previsto': material.estoque_previsto || 0,
                'Diferença': material.diferenca || 0
            });
        });
    });

    exportarExcel(dados, 'relatorio_balanco.xlsx', 'Balanço');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha exportada com sucesso', life: 3000 });
};

onMounted(async () => {
    await carregarFiltros();
    await carregarResumo();
});
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>BALANÇO DE MATERIAL</h2>
            <div class="flex gap-2">
                <Button label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirRelatorio" />
                <Button label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarPlanilha" />
            </div>
        </div>

        <div class="grid mb-4">
            <div class="col-12 md:col-6">
                <label class="block mb-2">Pesquisar grupo</label>
                <Dropdown v-model="filtroGrupo" :options="grupos" optionLabel="nome" optionValue="id" class="w-full" placeholder="Todos" @change="carregarResumo" />
            </div>
            <div class="col-12 md:col-6">
                <label class="block mb-2">Pesquisar material</label>
                <Dropdown v-model="filtroMaterial" :options="materiaisFiltrados" optionLabel="nome" optionValue="id" class="w-full" placeholder="Todos" :disabled="!filtroGrupo" @change="carregarResumo" />
            </div>
        </div>

        <div v-if="loading" class="flex align-items-center justify-content-center" style="min-height: 200px;">
            <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="3" />
        </div>

        <div v-else v-for="grupo in resumo.grupos" :key="grupo.id" class="mb-4">
            <h4 class="mb-2">Grupo: {{ grupo.nome }}</h4>
            <DataTable :value="grupo.materiais" dataKey="id">
                <Column field="material" header="Material" />
                <Column field="estoque_previsto" header="Previsto" />
                <Column field="total_recebido" header="Total Recebido" />
                <Column field="diferenca" header="Diferença">
                    <template #body="{ data }">
                        <span :class="data.diferenca < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'">
                            {{ data.diferenca }}
                        </span>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

