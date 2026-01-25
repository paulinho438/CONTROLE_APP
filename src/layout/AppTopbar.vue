<script setup>
import { computed } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import AuthService from '@/service/AuthService';
import store from '@/store';

const { layoutConfig, onMenuToggle, contextPath } = useLayout();
const router = useRouter();
const authService = new AuthService();

const logoUrl = computed(() => {
    return `${contextPath}layout/images/${layoutConfig.darkTheme.value ? 'logo' : 'logo'}.png`;
});

const userName = computed(() => store.getters.usuario?.nome_completo || store.getters.usuario?.login || 'Usuário');

const logout = async () => {
    await authService.logout();
    localStorage.removeItem('app.emp.token');
    store.commit('setAuthenticated', false);
    router.push({ name: 'login' });
};
</script>

<template>
    <div class="layout-topbar">
        <router-link to="/" class="layout-topbar-logo">
            <div class="logo-rialma">
                <img src="https://www.gruporialma.com.br/assets/logo_sem_fundo-Dbkuj9iO.png" alt="Logo Rialma" />
            </div>
        </router-link>

        <button class="p-link layout-menu-button layout-topbar-button" @click="onMenuToggle()">
            <i class="pi pi-bars"></i>
        </button>

        <div class="flex-1 flex justify-content-end align-items-center gap-3">
            <span class="hidden-on-small user-info">{{ userName }}</span>
            <button @click="logout()" class="p-link layout-topbar-button">
                <i class="pi pi-sign-out"></i>
                <span>Logout</span>
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.hidden-on-small {
    display: block;
}

.user-info {
    font-weight: 600;
    color: var(--text-color);
}

.logo-rialma {
    width: 120px;
    height: 50px;
    background-color: rgb(30, 58, 138);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    border-radius: 8px;
    overflow: hidden;
}

.logo-rialma img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

@media (max-width: 991px) {
    .hidden-on-small {
        display: none;
    }
}
</style>

