<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import UserService from '@/service/UserService';
import PermissionsService from '@/service/PermissionsService';
import { useToast } from 'primevue/usetoast';
import { usePermissions } from '@/composables/usePermissions';
import ProgressSpinner from 'primevue/progressspinner';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const userService = new UserService();
const permissionsService = new PermissionsService();
const { hasPermission } = usePermissions();

const form = ref({
    id: null,
    login: '',
    nome_completo: '',
    email: '',
    password: '',
    status: 'A',
    groups: []
});

const gruposDisponiveis = ref([]);
const loading = ref(false);
const salvando = ref(false);
const isEdit = computed(() => !!route.params.id);

const carregarGrupos = async () => {
    try {
        const response = await permissionsService.getAll();
        gruposDisponiveis.value = response.data.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar grupos de permissão', life: 3000 });
    }
};

const carregarUsuario = async () => {
    if (!isEdit.value) return;

    loading.value = true;
    try {
        const response = await userService.get(route.params.id);
        const usuario = response.data.data;
        
        form.value = {
            id: usuario.id,
            login: usuario.login,
            nome_completo: usuario.nome_completo,
            email: usuario.email || '',
            password: '',
            status: usuario.status,
            groups: usuario.groups ? usuario.groups.map(g => g.id) : []
        };
    } catch (error) {
        toast.add({ 
            severity: 'error', 
            summary: 'Erro', 
            detail: error.response?.data?.message || 'Erro ao carregar usuário', 
            life: 3000 
        });
        router.push({ name: 'usuarioList' });
    }
    loading.value = false;
};

const salvar = async () => {
    if (!form.value.login || form.value.login.trim() === '') {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Login é obrigatório', life: 3000 });
        return;
    }

    if (!form.value.nome_completo || form.value.nome_completo.trim() === '') {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Nome completo é obrigatório', life: 3000 });
        return;
    }

    if (!isEdit.value && (!form.value.password || form.value.password.trim() === '')) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Senha é obrigatória para novos usuários', life: 3000 });
        return;
    }

    salvando.value = true;
    try {
        const payload = { ...form.value };
        
        // Se está editando e não preencheu senha, remove do payload
        if (isEdit.value && (!payload.password || payload.password.trim() === '')) {
            delete payload.password;
        }

        await userService.save(payload);
        toast.add({ 
            severity: 'success', 
            summary: 'Sucesso', 
            detail: isEdit.value ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso', 
            life: 3000 
        });
        router.push({ name: 'usuarioList' });
    } catch (error) {
        toast.add({ 
            severity: 'error', 
            summary: 'Erro', 
            detail: error.response?.data?.message || 'Erro ao salvar usuário', 
            life: 3000 
        });
    }
    salvando.value = false;
};

const cancelar = () => {
    router.push({ name: 'usuarioList' });
};

onMounted(async () => {
    await carregarGrupos();
    await carregarUsuario();
});
</script>

<template>
    <div class="card" style="position: relative;">
        <div v-if="loading" class="flex align-items-center justify-content-center" style="min-height: 400px;">
            <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="3" />
        </div>
        <div v-else>
            <div class="flex justify-content-between align-items-center mb-4">
                <h2>{{ isEdit ? 'EDITAR USUÁRIO' : 'NOVO USUÁRIO' }}</h2>
            </div>

            <div class="grid mb-4">
                <div class="col-12 md:col-6">
                    <label class="block mb-2">Login <span class="text-red-500">*</span></label>
                    <InputText 
                        v-model="form.login" 
                        class="w-full" 
                        :disabled="isEdit"
                        placeholder="Digite o login do usuário"
                    />
                </div>
                <div class="col-12 md:col-6">
                    <label class="block mb-2">Nome Completo <span class="text-red-500">*</span></label>
                    <InputText 
                        v-model="form.nome_completo" 
                        class="w-full" 
                        placeholder="Digite o nome completo"
                    />
                </div>
                <div class="col-12 md:col-6">
                    <label class="block mb-2">E-mail</label>
                    <InputText 
                        v-model="form.email" 
                        type="email"
                        class="w-full" 
                        placeholder="Digite o e-mail"
                    />
                </div>
                <div class="col-12 md:col-6">
                    <label class="block mb-2">
                        Senha 
                        <span v-if="!isEdit" class="text-red-500">*</span>
                        <span v-else class="text-color-secondary text-sm">(deixe em branco para manter a atual)</span>
                    </label>
                    <Password 
                        v-model="form.password" 
                        class="w-full" 
                        :feedback="false"
                        toggleMask
                        placeholder="Digite a senha"
                    />
                </div>
                <div class="col-12 md:col-6">
                    <label class="block mb-2">Status <span class="text-red-500">*</span></label>
                    <SelectButton 
                        v-model="form.status" 
                        :options="[
                            { label: 'Ativo', value: 'A' },
                            { label: 'Inativo', value: 'I' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                    />
                </div>
                <div class="col-12">
                    <label class="block mb-2">Grupos de Permissão</label>
                    <MultiSelect 
                        v-model="form.groups" 
                        :options="gruposDisponiveis" 
                        optionLabel="name" 
                        optionValue="id" 
                        class="w-full" 
                        display="chip"
                        placeholder="Selecione os grupos de permissão"
                    />
                    <small class="text-color-secondary">
                        Selecione um ou mais grupos de permissão para atribuir ao usuário
                    </small>
                </div>
            </div>

            <div class="flex justify-content-end gap-2">
                <Button 
                    label="Cancelar" 
                    icon="pi pi-times" 
                    severity="secondary" 
                    @click="cancelar"
                />
                <Button 
                    v-if="hasPermission('usuarios.create') || hasPermission('usuarios.edit')"
                    :label="isEdit ? 'Atualizar' : 'Criar'" 
                    icon="pi pi-save" 
                    :loading="salvando"
                    @click="salvar"
                />
            </div>
        </div>
    </div>
</template>
