<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'INÍCIO',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard', permission: 'dashboard.view' }]
    },
    {
        label: 'MOVIMENTAÇÕES',
        items: [
            { label: 'Entradas', icon: 'pi pi-fw pi-arrow-down', to: '/entradas', permission: 'entradas.view' },
            { label: 'Saídas', icon: 'pi pi-fw pi-arrow-up', to: '/saidas', permission: 'saidas.view' },
            { label: 'Transferências', icon: 'pi pi-fw pi-send', to: '/transferencias', permission: 'transferencias.view' },
            { label: 'Balanço', icon: 'pi pi-fw pi-chart-line', to: '/balanco', permission: 'balanco.view' }
        ]
    },
    {
        label: 'CADASTROS',
        items: [
            { label: 'Grupos', icon: 'pi pi-fw pi-list', to: '/grupos', permission: 'grupos.view' },
            { label: 'Materiais', icon: 'pi pi-fw pi-box', to: '/materiais', permission: 'materiais.view' },
            { label: 'Pátios', icon: 'pi pi-fw pi-map-marker', to: '/patios', permission: 'patios.view' },
            { label: 'Fornecedores', icon: 'pi pi-fw pi-truck', to: '/fornecedores', permission: 'fornecedores.view' },
            { label: 'Unidades de Medida', icon: 'pi pi-fw pi-tags', to: '/unidades-medida', permission: 'unidades-medida.view' },
            { label: 'Colaboradores', icon: 'pi pi-fw pi-users', to: '/colaboradores', permission: 'colaboradores.view' },
            { label: 'Notas Fiscais', icon: 'pi pi-fw pi-file', to: '/notas-fiscais', permission: 'notas-fiscais.view' }
        ]
    },
    {
        label: 'PREVISÕES',
        items: [
            { label: 'Planejamento', icon: 'pi pi-fw pi-calendar', to: '/previsoes', permission: 'previsoes.view' },
            { label: 'Previsão Geral', icon: 'pi pi-fw pi-chart-bar', to: '/previsao-geral', permission: 'previsao-geral.view' },
            { label: 'Previsão por Pátio', icon: 'pi pi-fw pi-table', to: '/previsao-por-patio', permission: 'previsao-por-patio.view' }
        ]
    },
    {
        label: 'CONSULTAS',
        items: [
            { label: 'Consultas', icon: 'pi pi-fw pi-search', to: '/consultas', permission: 'dashboard.view' },
            { label: 'Histórico Notas Fiscais', icon: 'pi pi-fw pi-history', to: '/historico-notas-fiscais', permission: 'notas-fiscais.view' },
            { label: 'Progresso Recebimento', icon: 'pi pi-fw pi-chart-pie', to: '/progresso-recebimento', permission: 'dashboard.view' },
            { label: 'Saída e Transferência', icon: 'pi pi-fw pi-exchange', to: '/saida-transferencia', permission: 'saidas.view' }
        ]
    },
    {
        label: 'ADMINISTRAÇÃO',
        items: [
            { label: 'Permissões', icon: 'pi pi-fw pi-lock', to: '/permissoes', permission: 'permissoes.view' },
            { label: 'Usuários', icon: 'pi pi-fw pi-user', to: '/usuarios', permission: 'usuarios.view' }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item.label || i">
            <app-menu-item :item="item" :index="i" :root="true" :parentItemKey="item.label"></app-menu-item>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
