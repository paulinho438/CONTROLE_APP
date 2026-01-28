<script setup>
import { onMounted, ref, computed } from 'vue';
import DashboardService from '@/service/DashboardService';
import GrupoService from '@/service/GrupoService';
import { useToast } from 'primevue/usetoast';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';

const toast = useToast();
const dashboardService = new DashboardService();
const grupoService = new GrupoService();

const grupos = ref([]);
const gruposSelecionados = ref([]);
const resumo = ref({ patios: [], grupos: [] });
const loading = ref(false);

const carregarFiltros = async () => {
    try {
        const gruposResp = await grupoService.getAll();
        grupos.value = gruposResp.data.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar grupos', life: 3000 });
    }
};

const carregarProgresso = async () => {
    loading.value = true;
    try {
        const response = await dashboardService.resumoEstoque({
            grupos: gruposSelecionados.value.map(g => g.id)
        });
        resumo.value = response.data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar progresso', life: 3000 });
    }
    loading.value = false;
};

const imprimirProgresso = () => {
    const dados = [];
    resumo.value.grupos.forEach(grupo => {
        grupo.materiais.forEach(material => {
            const linha = {
                grupo: grupo.nome,
                material: material.material,
                previsto: material.estoque_previsto || 0
            };
            resumo.value.patios.forEach(patio => {
                const entrada = material.entradas_por_patio?.find(p => p.patio_id === patio.id);
                linha[patio.nome] = entrada?.quantidade || 0;
            });
            linha.total_recebido = material.total_recebido || 0;
            linha.diferenca = material.diferenca || 0;
            dados.push(linha);
        });
    });

    const colunas = [
        { field: 'grupo', header: 'Grupo' },
        { field: 'material', header: 'Material' },
        { field: 'previsto', header: 'Previsto' }
    ];
    resumo.value.patios.forEach(patio => {
        colunas.push({ field: patio.nome, header: patio.nome });
    });
    colunas.push({ field: 'total_recebido', header: 'Total Recebido' });
    colunas.push({ field: 'diferenca', header: 'Diferença' });

    gerarPDF('RELATÓRIO DE PROGRESSO DE RECEBIMENTO', dados, colunas, 'progresso_recebimento.pdf');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarPlanilha = () => {
    const dados = [];
    resumo.value.grupos.forEach(grupo => {
        grupo.materiais.forEach(material => {
            const linha = {
                'Grupo': grupo.nome,
                'Material': material.material,
                'Previsto': material.estoque_previsto || 0
            };
            resumo.value.patios.forEach(patio => {
                const entrada = material.entradas_por_patio?.find(p => p.patio_id === patio.id);
                linha[patio.nome] = entrada?.quantidade || 0;
            });
            linha['Total Recebido'] = material.total_recebido || 0;
            linha['Diferença'] = material.diferenca || 0;
            dados.push(linha);
        });
    });

    exportarExcel(dados, 'progresso_recebimento.xlsx', 'Progresso');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha exportada com sucesso', life: 3000 });
};

onMounted(async () => {
    await carregarFiltros();
    await carregarProgresso();
});
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>PROGRESSO DE RECEBIMENTO</h2>
            <div class="flex gap-2">
                <Button label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="imprimirProgresso" />
                <Button label="Exportar planilha" icon="pi pi-file-excel" severity="success" @click="exportarPlanilha" />
                <Button label="Atualizar" icon="pi pi-refresh" severity="info" @click="carregarProgresso" />
            </div>
        </div>

        <div class="grid mb-4">
            <div class="col-12 md:col-6">
                <label class="block mb-2">Filtrar grupo</label>
                <MultiSelect v-model="gruposSelecionados" :options="grupos" optionLabel="nome" display="chip" placeholder="Todos os grupos" class="w-full" />
            </div>
            <div class="col-12 md:col-6 flex align-items-end">
                <Button label="Aplicar filtros" icon="pi pi-filter" @click="carregarProgresso" />
            </div>
        </div>

        <div v-if="loading" class="text-center p-4">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>

        <div v-else>
            <div v-for="grupo in resumo.grupos" :key="grupo.id" class="mb-4">
                <h4 class="mb-2 p-2" style="background-color: #e3f2fd;">GRUPO: {{ grupo.nome }}</h4>
                <DataTable :value="grupo.materiais" dataKey="id" class="p-datatable-sm">
                    <Column field="material" header="Material" />
                    <Column field="estoque_previsto" header="Previsto" />
                    <Column v-for="patio in resumo.patios" :key="patio.id" :header="patio.nome">
                        <template #body="{ data }">
                            {{ data.entradas_por_patio?.find(p => p.patio_id === patio.id)?.quantidade || 0 }}
                        </template>
                    </Column>
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
    </div>
</template>

