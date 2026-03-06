<script setup>
import { onMounted, ref, watch } from 'vue';
import DashboardService from '@/service/DashboardService';
import GrupoService from '@/service/GrupoService';
import PatioService from '@/service/PatioService';
import { useToast } from 'primevue/usetoast';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const tituloSistema = import.meta.env.VITE_TITULO_SISTEMA || 'CONTROLE DE MATERIAL - SUBESTAÇÃO';
const dashboardService = new DashboardService();
const grupoService = new GrupoService();
const patioService = new PatioService();

const resumoGeral = ref({
    total_entradas: 0,
    total_saidas: 0,
    total_notas_fiscais: 0,
    total_materiais: 0
});
const resumoEstoque = ref({ patios: [], grupos: [] });
const grupos = ref([]);
const patios = ref([]);
const gruposSelecionados = ref([]);
const patiosSelecionados = ref([]);
const loading = ref(false);

const carregarResumoGeral = async () => {
    try {
        const response = await dashboardService.resumoGeral();
        resumoGeral.value = response.data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar resumo geral', life: 3000 });
    }
};

const carregarResumoEstoque = async () => {
    loading.value = true;
    try {
        const response = await dashboardService.resumoEstoque({
            grupos: gruposSelecionados.value.map((g) => g.id),
            patios: patiosSelecionados.value.map((p) => p.id)
        });
        resumoEstoque.value = response.data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar resumo de estoque', life: 3000 });
    }
    loading.value = false;
};

const carregarFiltros = async () => {
    try {
        const [gruposResp, patiosResp] = await Promise.all([
            grupoService.getAll(),
            patioService.getAll()
        ]);
        grupos.value = gruposResp.data.data || [];
        patios.value = patiosResp.data.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar filtros', life: 3000 });
    }
};

const exportarPDF = () => {
    const dados = [];
    resumoEstoque.value.grupos.forEach(grupo => {
        grupo.materiais.forEach(material => {
            const linha = {
                grupo: grupo.nome,
                material: material.material,
                previsto: material.estoque_previsto || 0
            };
            resumoEstoque.value.patios.forEach(patio => {
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
    resumoEstoque.value.patios.forEach(patio => {
        colunas.push({ field: patio.nome, header: patio.nome });
    });
    colunas.push({ field: 'total_recebido', header: 'Total Recebido' });
    colunas.push({ field: 'diferenca', header: 'Diferença' });

    gerarPDF('RELATÓRIO DE RESUMO DE ESTOQUE', dados, colunas, 'resumo_estoque.pdf');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarExcelResumo = () => {
    const dados = [];
    resumoEstoque.value.grupos.forEach(grupo => {
        grupo.materiais.forEach(material => {
            const linha = {
                'Grupo': grupo.nome,
                'Material': material.material,
                'Previsto': material.estoque_previsto || 0
            };
            resumoEstoque.value.patios.forEach(patio => {
                const entrada = material.entradas_por_patio?.find(p => p.patio_id === patio.id);
                linha[patio.nome] = entrada?.quantidade || 0;
            });
            linha['Total Recebido'] = material.total_recebido || 0;
            linha['Diferença'] = material.diferenca || 0;
            dados.push(linha);
        });
    });

    exportarExcel(dados, 'resumo_estoque.xlsx', 'Resumo Estoque');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha exportada com sucesso', life: 3000 });
};

watch([gruposSelecionados, patiosSelecionados], () => {
    carregarResumoEstoque();
}, { deep: true });

onMounted(async () => {
    await carregarFiltros();
    await carregarResumoGeral();
    await carregarResumoEstoque();
});
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 class="m-0">{{ tituloSistema }}</h2>
                    <small>Rialma Transmissora de Energia</small>
                </div>
                <div class="flex gap-2">
                    <Button label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="exportarPDF" />
                    <Button label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcelResumo" />
                    <Button label="Atualizar" icon="pi pi-refresh" severity="info" @click="carregarResumoEstoque" />
                </div>
            </div>
        </div>

        <div class="col-12 md:col-3">
            <Card>
                <template #title>Total de Entradas</template>
                <template #content>
                    <span class="text-2xl font-bold text-green-600">{{ resumoGeral.total_entradas }}</span>
                </template>
            </Card>
        </div>
        <div class="col-12 md:col-3">
            <Card>
                <template #title>Total de Saídas</template>
                <template #content>
                    <span class="text-2xl font-bold text-orange-600">{{ resumoGeral.total_saidas }}</span>
                </template>
            </Card>
        </div>
        <div class="col-12 md:col-3">
            <Card>
                <template #title>Notas Fiscais</template>
                <template #content>
                    <span class="text-2xl font-bold text-blue-600">{{ resumoGeral.total_notas_fiscais }}</span>
                </template>
            </Card>
        </div>
        <div class="col-12 md:col-3">
            <Card>
                <template #title>Materiais Cadastrados</template>
                <template #content>
                    <span class="text-2xl font-bold text-yellow-600">{{ resumoGeral.total_materiais }}</span>
                </template>
            </Card>
        </div>

        <div class="col-12">
            <div class="card">
                <h3>Resumo de Estoque por Grupo</h3>
                <div class="grid mb-3">
                    <div class="col-12 md:col-6">
                        <label class="block mb-2">Filtrar grupos</label>
                        <MultiSelect v-model="gruposSelecionados" :options="grupos" optionLabel="nome" display="chip" placeholder="Todos os grupos" class="w-full" />
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2">Filtrar pátios</label>
                        <MultiSelect v-model="patiosSelecionados" :options="patios" optionLabel="nome" display="chip" placeholder="Todos os pátios" class="w-full" />
                    </div>
                </div>

                <div v-if="loading" class="flex align-items-center justify-content-center" style="min-height: 200px;">
                    <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="3" />
                </div>

                <div v-else v-for="grupo in resumoEstoque.grupos" :key="grupo.id" class="mb-4">
                    <h4 class="mb-2 p-2" style="background-color: #e3f2fd;">GRUPO: {{ grupo.nome }}</h4>
                    <DataTable :value="grupo.materiais" dataKey="id" class="p-datatable-sm">
                        <Column field="material" header="Material" />
                        <Column field="estoque_previsto" header="Previsto" />
                        <Column v-for="patio in resumoEstoque.patios" :key="patio.id" :header="patio.nome">
                            <template #body="{ data }">
                                {{ data.entradas_por_patio?.find(p => p.patio_id === patio.id)?.quantidade || 0 }}
                            </template>
                        </Column>
                        <Column field="total_recebido" header="Total Recebido" />
                        <Column field="diferenca" header="Diferença">
                            <template #body="{ data }">
                                <span :class="data.diferenca < 0 ? 'text-red-600' : 'text-green-600'">
                                    {{ data.diferenca }}
                                </span>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>
    </div>
</template>
