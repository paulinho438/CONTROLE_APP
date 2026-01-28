<script setup>
import { ref } from 'vue';
import SaidaService from '@/service/SaidaService';
import { useToast } from 'primevue/usetoast';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const service = new SaidaService();

const numeroRomaneio = ref('');
const romaneio = ref(null);
const loading = ref(false);

const buscarRomaneio = async () => {
    if (!numeroRomaneio.value?.trim()) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o número do romaneio', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        const response = await service.getRomaneio(numeroRomaneio.value.trim());
        romaneio.value = response.data.data;
        if (!romaneio.value || !romaneio.value.cabecalho) {
            toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Romaneio não encontrado', life: 3000 });
            romaneio.value = null;
        }
    } catch (error) {
        romaneio.value = null;
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           'Erro ao buscar romaneio';
        toast.add({ severity: 'error', summary: 'Erro', detail: errorMessage, life: 3000 });
    }
    loading.value = false;
};

const formatarData = (data) => {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
};
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>CONSULTA DE ROMANEIO</h2>
        </div>

        <div class="grid mb-4">
            <div class="col-12 md:col-6">
                <label class="block mb-2">Nº. Romaneio</label>
                <div class="flex gap-2">
                    <InputText 
                        v-model="numeroRomaneio" 
                        placeholder="Digite o número do romaneio" 
                        class="flex-1" 
                        @keyup.enter="buscarRomaneio"
                    />
                    <Button label="Buscar" icon="pi pi-search" @click="buscarRomaneio" :loading="loading" />
                </div>
            </div>
        </div>

        <ProgressSpinner v-if="loading" />

        <div v-if="romaneio && !loading" class="romaneio-container">
            <!-- Cabeçalho do Romaneio -->
            <Card class="mb-4">
                <template #title>
                    <div class="text-center">
                        <h3 class="m-0">ROMANEIO N° {{ romaneio.cabecalho?.numero_romaneio || '' }}</h3>
                    </div>
                </template>
                <template #content>
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label class="font-semibold">Data da saída:</label>
                                <div>{{ formatarData(romaneio.cabecalho?.data_saida) }}</div>
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label class="font-semibold">Pátio:</label>
                                <div>{{ romaneio.cabecalho?.patio || '-' }}</div>
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label class="font-semibold">Destino:</label>
                                <div>{{ romaneio.cabecalho?.destino || '-' }}</div>
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label class="font-semibold">Tipo:</label>
                                <div>{{ romaneio.cabecalho?.tipo_movimentacao || '-' }}</div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Materiais e Quantidades -->
            <Card class="mb-4">
                <template #title>Materiais e Quantidades</template>
                <template #content>
                    <DataTable :value="romaneio.materiais" :paginator="false" class="p-datatable-sm">
                        <Column field="material" header="Material">
                            <template #body="{ data }">
                                {{ data.material || '-' }}
                            </template>
                        </Column>
                        <Column field="quantidade" header="Quantidade">
                            <template #body="{ data }">
                                {{ data.quantidade || 0 }}
                            </template>
                        </Column>
                        <Column field="unidade_medida" header="Unidade">
                            <template #body="{ data }">
                                {{ data.unidade_medida || '-' }}
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Assinaturas -->
            <Card>
                <template #title>Assinaturas</template>
                <template #content>
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="field text-center">
                                <label class="block mb-3 font-semibold">Responsável</label>
                                <div class="assinatura-box">
                                    <div class="assinatura-nome">{{ romaneio.cabecalho?.responsavel || '-' }}</div>
                                    <div class="assinatura-linha mt-3"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="field text-center">
                                <label class="block mb-3 font-semibold">Solicitante</label>
                                <div class="assinatura-box">
                                    <div class="assinatura-nome">{{ romaneio.cabecalho?.grupo || '-' }}</div>
                                    <div class="assinatura-linha mt-3"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.romaneio-container {
    max-width: 1200px;
    margin: 0 auto;
}

.assinatura-box {
    min-height: 120px;
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 4px;
}

.assinatura-nome {
    min-height: 40px;
    font-size: 1rem;
}

.assinatura-linha {
    border-top: 1px solid #000;
    margin-top: 60px;
    padding-top: 5px;
    font-size: 0.875rem;
    color: #6c757d;
}
</style>
