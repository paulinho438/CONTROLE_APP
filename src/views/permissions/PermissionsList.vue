<script setup>
import { onMounted, ref } from 'vue';
import PermissionsService from '@/service/PermissionsService';

const service = new PermissionsService();
const grupos = ref([]);
const itens = ref([]);
const form = ref({ id: null, name: '', permitems: [] });
const loading = ref(false);

const carregar = async () => {
    loading.value = true;
    const [gruposResp, itensResp] = await Promise.all([service.getAll(), service.getItems()]);
    grupos.value = gruposResp.data.data;
    itens.value = itensResp.data.data;
    loading.value = false;
};

const salvar = async () => {
    await service.save(form.value);
    form.value = { id: null, name: '', permitems: [] };
    await carregar();
};

const editar = (grupo) => {
    form.value = { id: grupo.id, name: grupo.name, permitems: grupo.items || [] };
};

const remover = async (grupo) => {
    await service.deletePermission(grupo.id);
    await carregar();
};

onMounted(carregar);
</script>

<template>
    <div class="card">
        <h2>Permissões</h2>
        <div class="grid align-items-end mb-4">
            <div class="col-12 md:col-4">
                <label class="block mb-2">Grupo</label>
                <InputText v-model="form.name" class="w-full" />
            </div>
            <div class="col-12 md:col-8">
                <label class="block mb-2">Permissões</label>
                <MultiSelect v-model="form.permitems" :options="itens" optionLabel="name" optionValue="id" class="w-full" display="chip" />
            </div>
            <div class="col-12 md:col-4 flex gap-2">
                <Button label="Salvar" icon="pi pi-save" @click="salvar" />
                <Button label="Limpar" icon="pi pi-times" severity="secondary" @click="form = { id: null, name: '', permitems: [] }" />
            </div>
        </div>

        <DataTable :value="grupos" :loading="loading" dataKey="id">
            <Column field="name" header="Grupo" />
            <Column header="Permissões">
                <template #body="{ data }">
                    {{ (data.items || []).length }} permissões
                </template>
            </Column>
            <Column header="Ações">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" class="p-button-text" @click="editar(data)" />
                    <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="remover(data)" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
