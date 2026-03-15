<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>Importar do Excel</h5>
                <p>Faça o upload da planilha contendo as abas de Grupos, Materiais, Pátios, Fornecedores, Unidades, Colaboradores e Notas Fiscais.</p>

                <div class="flex align-items-center mb-4">
                    <FileUpload 
                        mode="basic" 
                        name="file" 
                        accept=".xls,.xlsx" 
                        :maxFileSize="10000000" 
                        :customUpload="true"
                        @select="onFileSelect" 
                        @clear="onFileClear"
                        chooseLabel="Escolher Arquivo"
                        class="p-button-outlined mr-2"
                    />
                    
                    <Button 
                        label="Iniciar Importação" 
                        icon="pi pi-upload" 
                        @click="uploadFile" 
                        :disabled="!selectedFile || isProcessing"
                        class="p-button-primary"
                    />
                </div>

                <ProgressBar v-if="isProcessing" mode="indeterminate" class="mb-4" />

                <div v-if="batchResult" class="mt-4">
                    <Message severity="success" v-if="batchResult.status === 'completed'">
                        Importação concluída com sucesso! (ID: {{ batchResult.id }})
                    </Message>
                    <Message severity="error" v-else-if="batchResult.status === 'failed'">
                        Falha na importação. Verifique o arquivo e tente novamente.
                    </Message>
                    
                    <div class="grid" v-if="batchResult.summary && !batchResult.summary.exception">
                        <div class="col-12 md:col-3">
                            <div class="card mb-0 bg-blue-50">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <span class="block text-500 font-medium mb-3">Total Processado</span>
                                        <div class="text-900 font-medium text-xl">{{ batchResult.total_rows }}</div>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width: 2.5rem; height: 2.5rem">
                                        <i class="pi pi-list text-blue-500 text-xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 md:col-3">
                            <div class="card mb-0 bg-green-50">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <span class="block text-500 font-medium mb-3">Inseridos</span>
                                        <div class="text-900 font-medium text-xl">{{ batchResult.inserted_rows }}</div>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-green-100 border-round" style="width: 2.5rem; height: 2.5rem">
                                        <i class="pi pi-plus text-green-500 text-xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 md:col-3">
                            <div class="card mb-0 bg-yellow-50">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <span class="block text-500 font-medium mb-3">Atualizados/Ignorados</span>
                                        <div class="text-900 font-medium text-xl">{{ batchResult.updated_rows + batchResult.ignored_rows }}</div>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-yellow-100 border-round" style="width: 2.5rem; height: 2.5rem">
                                        <i class="pi pi-refresh text-yellow-500 text-xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 md:col-3">
                            <div class="card mb-0 bg-red-50">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <span class="block text-500 font-medium mb-3">Erros/Inconsistências</span>
                                        <div class="text-900 font-medium text-xl">{{ batchResult.error_rows }}</div>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-red-100 border-round" style="width: 2.5rem; height: 2.5rem">
                                        <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card" v-if="batchResult && batchResult.summary && !batchResult.summary.exception">
                <h5>Resumo por Aba</h5>
                <TabView>
                    <TabPanel v-for="(data, sheet) in filteredSummary" :key="sheet" :header="sheet">
                        <div class="flex flex-column gap-3">
                            <div class="flex gap-4">
                                <div><strong>Inseridos:</strong> {{ data.inserted }}</div>
                                <div><strong>Atualizados:</strong> {{ data.updated }}</div>
                                <div><strong>Ignorados:</strong> {{ data.ignored }}</div>
                                <div><strong class="text-red-500">Erros:</strong> {{ data.error_count }}</div>
                            </div>
                            
                            <div v-if="data.error_count > 0 && sheetErrors[sheet]">
                                <h6>Detalhamento de Erros</h6>
                                <DataTable :value="sheetErrors[sheet]" :paginator="true" :rows="10" responsiveLayout="scroll">
                                    <Column field="row_number" header="Linha" style="width: 10%"></Column>
                                    <Column field="error_message" header="Mensagem de Inconsistência" style="width: 40%"></Column>
                                    <Column header="Dados da Linha" style="width: 50%">
                                        <template #body="slotProps">
                                            <div class="text-xs" style="word-break: break-all; max-height: 100px; overflow-y: auto;">
                                                {{ slotProps.data.row_data }}
                                            </div>
                                        </template>
                                    </Column>
                                </DataTable>
                            </div>
                            <div v-else-if="data.error_count > 0">
                                <div class="text-500 text-sm mt-2"><i class="pi pi-spin pi-spinner mr-2"></i> Carregando detalhamento dos erros...</div>
                            </div>
                        </div>
                    </TabPanel>
                </TabView>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import axios from '@/plugins/axios'; 

const toast = useToast();
const selectedFile = ref(null);
const isProcessing = ref(false);
const batchResult = ref(null);
const allErrors = ref([]);

const onFileSelect = (event) => {
    selectedFile.value = event.files[0];
};

const onFileClear = () => {
    selectedFile.value = null;
    batchResult.value = null;
    allErrors.value = [];
};

const uploadFile = async () => {
    if (!selectedFile.value) return;

    const formData = new FormData();
    formData.append('file', selectedFile.value);

    isProcessing.value = true;
    batchResult.value = null;
    allErrors.value = [];

    try {
        const response = await axios.post('/import-excel', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.data.success) {
            batchResult.value = response.data.batch;
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Arquivo processado.', life: 3000 });
            
            if (batchResult.value.error_rows > 0) {
                fetchErrors(batchResult.value.id);
            }
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao importar arquivo', life: 5000 });
        if (error.response?.data?.error) {
            console.error(error.response.data.error);
        }
    } finally {
        isProcessing.value = false;
    }
};

const fetchErrors = async (batchId) => {
    try {
        const response = await axios.get(`/import-excel/${batchId}/errors`);
        allErrors.value = response.data;
    } catch (error) {
        console.error('Failed to fetch specific errors', error);
    }
};

const filteredSummary = computed(() => {
    if (!batchResult.value || !batchResult.value.summary || batchResult.value.summary.exception) return {};
    return batchResult.value.summary;
});

const sheetErrors = computed(() => {
    const grouped = {};
    if (Object.keys(filteredSummary.value).length > 0) {
        Object.keys(filteredSummary.value).forEach(sheet => {
            grouped[sheet] = allErrors.value.filter(e => e.sheet_name === sheet);
        });
    }
    return grouped;
});
</script>

<style scoped>
</style>
