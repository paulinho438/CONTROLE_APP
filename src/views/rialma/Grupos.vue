<script setup>
import { onMounted, ref, computed } from 'vue';
import GrupoService from '@/service/GrupoService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import { gerarPDF, exportarExcel } from '@/utils/reportUtils';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();
const service = new GrupoService();
const { hasPermission } = usePermissions();
const grupos = ref([]);
const form = ref({ id: null, nome: '', data_cadastro: null });
const loading = ref(false);
const mostrarHistorico = ref(false);
const indiceAtual = ref(-1);

const grupoAtual = computed(() => {
    if (indiceAtual.value >= 0 && indiceAtual.value < grupos.value.length) {
        return grupos.value[indiceAtual.value];
    }
    return null;
});

const posicaoRegistro = computed(() => {
    if (indiceAtual.value < 0) return 'Novo registro';
    return `Registro ${indiceAtual.value + 1} de ${grupos.value.length}`;
});

const podeVoltar = computed(() => indiceAtual.value > 0);
const podeAvançar = computed(() => indiceAtual.value >= 0 && indiceAtual.value < grupos.value.length - 1);

const carregar = async () => {
    loading.value = true;
    try {
        const response = await service.getAll();
        grupos.value = response.data.data || [];
        // Só carrega o primeiro registro se não estiver em modo "Novo" e houver grupos
        if (grupos.value.length > 0 && indiceAtual.value < 0 && form.value.id !== null) {
            indiceAtual.value = 0;
            carregarRegistroAtual();
        } else if (grupos.value.length > 0 && indiceAtual.value >= 0) {
            // Se já estava em um registro, mantém a posição ou ajusta se necessário
            if (indiceAtual.value >= grupos.value.length) {
                indiceAtual.value = grupos.value.length - 1;
            }
            carregarRegistroAtual();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar grupos', life: 3000 });
    }
    loading.value = false;
};

const carregarRegistroAtual = () => {
    if (grupoAtual.value) {
        // Converte data de Y-m-d para Date object para o Calendar
        let dataCadastro = null;
        if (grupoAtual.value.data_cadastro || grupoAtual.value.created_at) {
            const dataStr = grupoAtual.value.data_cadastro || grupoAtual.value.created_at;
            if (dataStr) {
                try {
                    // Se está no formato Y-m-d, converte para Date
                    if (typeof dataStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
                        const [ano, mes, dia] = dataStr.split(' ')[0].split('-');
                        dataCadastro = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                    } else {
                        dataCadastro = new Date(dataStr);
                    }
                } catch (e) {
                    dataCadastro = null;
                }
            }
        }
        
        form.value = {
            id: grupoAtual.value.id,
            nome: grupoAtual.value.nome,
            data_cadastro: dataCadastro
        };
    }
};

const novo = () => {
    form.value = { id: null, nome: '', data_cadastro: new Date() };
    indiceAtual.value = -1;
    mostrarHistorico.value = false;
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
    if (!form.value.nome || form.value.nome.trim() === '') {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Nome do grupo é obrigatório', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        // Converte data de Date object para Y-m-d para o backend
        let dataCadastro = null;
        if (form.value.data_cadastro) {
            if (form.value.data_cadastro instanceof Date) {
                const ano = form.value.data_cadastro.getFullYear();
                const mes = String(form.value.data_cadastro.getMonth() + 1).padStart(2, '0');
                const dia = String(form.value.data_cadastro.getDate()).padStart(2, '0');
                dataCadastro = `${ano}-${mes}-${dia}`;
            } else if (typeof form.value.data_cadastro === 'string') {
                // Se já está em formato string, tenta converter
                try {
                    const date = new Date(form.value.data_cadastro);
                    const ano = date.getFullYear();
                    const mes = String(date.getMonth() + 1).padStart(2, '0');
                    const dia = String(date.getDate()).padStart(2, '0');
                    dataCadastro = `${ano}-${mes}-${dia}`;
                } catch (e) {
                    // Se está no formato dd/mm/yyyy, converte
                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(form.value.data_cadastro)) {
                        const [dia, mes, ano] = form.value.data_cadastro.split('/');
                        dataCadastro = `${ano}-${mes}-${dia}`;
                    } else {
                        dataCadastro = form.value.data_cadastro;
                    }
                }
            } else {
                dataCadastro = form.value.data_cadastro;
            }
        } else {
            // Se não tem data, usa a data atual
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            dataCadastro = `${ano}-${mes}-${dia}`;
        }
        
        const payload = {
            ...form.value,
            data_cadastro: dataCadastro
        };
        const response = await service.save(payload);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Grupo salvo com sucesso', life: 3000 });
        
        // Recarrega a lista
        const responseList = await service.getAll();
        grupos.value = responseList.data.data || [];
        
        // Se era um novo registro, busca o ID do registro salvo
        if (!form.value.id && response.data && response.data.data && response.data.data.id) {
            form.value.id = response.data.data.id;
        }
        
        // Posiciona no registro salvo
        if (form.value.id) {
            const index = grupos.value.findIndex(g => g.id === form.value.id);
            if (index >= 0) {
                indiceAtual.value = index;
                carregarRegistroAtual();
            } else {
                // Se não encontrou, pode ser que ainda não esteja na lista, tenta novamente
                await carregar();
                const indexRetry = grupos.value.findIndex(g => g.id === form.value.id);
                if (indexRetry >= 0) {
                    indiceAtual.value = indexRetry;
                    carregarRegistroAtual();
                }
            }
        } else {
            // Se ainda não tem ID, vai para o último registro
            if (grupos.value.length > 0) {
                indiceAtual.value = grupos.value.length - 1;
                carregarRegistroAtual();
            }
        }
    } catch (error) {
        toast.add({ 
            severity: 'error', 
            summary: 'Erro', 
            detail: error.response?.data?.message || 'Erro ao salvar grupo', 
            life: 3000 
        });
    }
    loading.value = false;
};

const editar = (grupo) => {
    const index = grupos.value.findIndex(g => g.id === grupo.id);
    if (index >= 0) {
        indiceAtual.value = index;
        carregarRegistroAtual();
    }
};

const remover = async (grupo) => {
    if (!confirm(`Deseja realmente excluir o grupo "${grupo.nome}"?`)) return;

    try {
        await service.delete(grupo.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Grupo excluído com sucesso', life: 3000 });
        await carregar();
        if (indiceAtual.value >= grupos.value.length) {
            indiceAtual.value = grupos.value.length - 1;
        }
        if (indiceAtual.value >= 0) {
            carregarRegistroAtual();
        } else {
            novo();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir grupo', life: 3000 });
    }
};

const imprimirRelatorio = () => {
    const dados = grupos.value.map(g => ({
        grupo: g.nome || '',
        data_cadastro: formatarData(g.data_cadastro || g.created_at)
    }));

    gerarPDF(
        'RELATÓRIO DE GRUPOS',
        dados,
        [
            { field: 'grupo', header: 'Grupo' },
            { field: 'data_cadastro', header: 'Data Cadastro' }
        ],
        'relatorio_grupos.pdf'
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório gerado com sucesso', life: 3000 });
};

const exportarExcelGrupos = () => {
    const dados = grupos.value.map(g => ({
        'Grupo': g.nome || '',
        'Data Cadastro': formatarData(g.data_cadastro || g.created_at)
    }));

    exportarExcel(dados, 'relatorio_grupos.xlsx', 'Grupos');
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha exportada com sucesso', life: 3000 });
};

const formatarData = (data) => {
    if (!data) return '-';
    try {
        // Se já está no formato Y-m-d, converte para pt-BR
        if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}/.test(data)) {
            const [ano, mes, dia] = data.split(' ')[0].split('-');
            return `${dia}/${mes}/${ano}`;
        }
        return new Date(data).toLocaleDateString('pt-BR');
    } catch (e) {
        return data;
    }
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
            <h2>GRUPO</h2>
            <div class="flex gap-2">
                <Button v-if="hasPermission('grupos.view')" label="Imprimir relatório" icon="pi pi-print" @click="imprimirRelatorio" />
                <Button v-if="hasPermission('grupos.view')" label="Exportar Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcelGrupos" />
            </div>
        </div>

        <div class="grid align-items-end mb-4">
            <div class="col-12 md:col-8">
                <label class="block mb-2">Grupo</label>
                <InputText v-model="form.nome" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
                <label class="block mb-2">Data do cadastro</label>
                <Calendar v-model="form.data_cadastro" dateFormat="dd/mm/yy" class="w-full" :disabled="!!form.id" />
            </div>
        </div>

        <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
                <Button label="Novo" icon="pi pi-plus" :disabled="!hasPermission('grupos.create')" @click="novo" />
                <Button label="Voltar" icon="pi pi-arrow-left" :disabled="!podeVoltar" @click="voltar" />
                <Button label="Avançar" icon="pi pi-arrow-right" :disabled="!podeAvançar" @click="avancar" />
                <Button v-if="hasPermission('grupos.delete')" label="Excluir" icon="pi pi-trash" severity="danger" :disabled="!form.id" @click="remover(form)" />
            </div>
            <div class="flex gap-2">
                <Button :label="mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'" 
                    :icon="mostrarHistorico ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    @click="mostrarHistorico = !mostrarHistorico" />
                <Button v-if="hasPermission('grupos.create') || hasPermission('grupos.edit')" label="Salvar e fechar" icon="pi pi-save" @click="salvar" />
            </div>
            <div class="text-sm text-color-secondary">{{ posicaoRegistro }}</div>
        </div>

        <DataTable v-if="mostrarHistorico" :value="grupos" :loading="loading" dataKey="id" class="mb-4" 
            :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]" paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="{first} a {last} de {totalRecords}">
            <Column field="nome" header="Grupo" />
            <Column field="data_cadastro" header="Data Cadastro">
                <template #body="{ data }">
                    <span v-if="data.data_cadastro">
                        {{ formatarData(data.data_cadastro) }}
                    </span>
                    <span v-else-if="data.created_at">
                        {{ formatarData(data.created_at) }}
                    </span>
                    <span v-else>-</span>
                </template>
            </Column>
            <Column header="Ações">
                <template #body="{ data }">
                    <Button v-if="hasPermission('grupos.edit')" icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button v-if="hasPermission('grupos.delete')" icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
        </div>
    </div>
</template>
