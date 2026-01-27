<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import UserService from '@/service/UserService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import ProgressSpinner from 'primevue/progressspinner';

const router = useRouter();
const toast = useToast();
const service = new UserService();
const { hasPermission } = usePermissions();
const usuarios = ref([]);
const loading = ref(false);

const carregar = async () => {
    loading.value = true;
    try {
        const response = await service.getAll();
        usuarios.value = response.data.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar usuários', life: 3000 });
    }
    loading.value = false;
};

const editar = (usuario) => {
    router.push({ name: 'usuarioEdit', params: { id: usuario.id } });
};

const remover = async (usuario) => {
    if (!confirm(`Deseja realmente excluir o usuário "${usuario.nome_completo}"?`)) return;

    try {
        await service.delete(usuario.id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário excluído com sucesso', life: 3000 });
        await carregar();
    } catch (error) {
        toast.add({ 
            severity: 'error', 
            summary: 'Erro', 
            detail: error.response?.data?.message || 'Erro ao excluir usuário', 
            life: 3000 
        });
    }
};

const formatarStatus = (status) => {
    return status === 'A' ? 'Ativo' : 'Inativo';
};

const getStatusSeverity = (status) => {
    return status === 'A' ? 'success' : 'danger';
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
                <h2>USUÁRIOS</h2>
                <Button 
                    v-if="hasPermission('usuarios.create')" 
                    label="Novo Usuário" 
                    icon="pi pi-plus" 
                    @click="router.push({ name: 'usuarioAdd' })" 
                />
            </div>

            <DataTable 
                :value="usuarios" 
                :loading="loading" 
                dataKey="id" 
                :paginator="true" 
                :rows="10" 
                :rowsPerPageOptions="[10, 20, 50, 100]" 
                paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                currentPageReportTemplate="{first} a {last} de {totalRecords}">
                <Column field="nome_completo" header="Nome Completo" sortable />
                <Column field="login" header="Login" sortable />
                <Column field="email" header="E-mail" sortable />
                <Column field="status" header="Status" sortable>
                    <template #body="{ data }">
                        <Tag :value="formatarStatus(data.status)" :severity="getStatusSeverity(data.status)" />
                    </template>
                </Column>
                <Column header="Grupos de Permissão">
                    <template #body="{ data }">
                        <span v-if="data.groups && data.groups.length > 0">
                            {{ data.groups.map(g => g.name).join(', ') }}
                        </span>
                        <span v-else class="text-color-secondary">Nenhum grupo</span>
                    </template>
                </Column>
                <Column header="Ações">
                    <template #body="{ data }">
                        <Button 
                            v-if="hasPermission('usuarios.edit')" 
                            icon="pi pi-pencil" 
                            class="p-button-text" 
                            @click="editar(data)" 
                        />
                        <Button 
                            v-if="hasPermission('usuarios.delete')" 
                            icon="pi pi-trash" 
                            class="p-button-text p-button-danger" 
                            @click="remover(data)" 
                        />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
