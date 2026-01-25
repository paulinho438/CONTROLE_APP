<script setup>
import { ref, onBeforeMount, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLayout } from '@/layout/composables/layout';

import PermissionsService from '@/service/PermissionsService';

const permissionService = new PermissionsService();

const route = useRoute();

const { layoutConfig, layoutState, setActiveMenuItem, onMenuToggle } = useLayout();

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    permissions: [],
    index: {
        type: Number,
        default: 0
    },
    root: {
        type: Boolean,
        default: true
    },
    parentItemKey: {
        type: String,
        default: null
    }
});

const isActiveMenu = ref(false);
const itemKey = ref(null);

onBeforeMount(() => {
    itemKey.value = props.parentItemKey ? props.parentItemKey + '-' + props.index : String(props.index);

    const activeItem = layoutState.activeMenuItem;

    isActiveMenu.value = activeItem === itemKey.value || activeItem ? activeItem.startsWith(itemKey.value + '-') : false;

});

watch(
    () => layoutConfig.activeMenuItem.value,
    (newVal) => {
        isActiveMenu.value = newVal === itemKey.value || newVal.startsWith(itemKey.value + '-');
    }
);
const itemClick = (event, item) => {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    const { overlayMenuActive, staticMenuMobileActive } = layoutState;

    if ((item.to || item.url) && (staticMenuMobileActive.value || overlayMenuActive.value)) {
        onMenuToggle();
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    const foundItemKey = item.items ? (isActiveMenu.value ? props.parentItemKey : itemKey) : itemKey.value;

    setActiveMenuItem(foundItemKey);
};

const checkActiveRoute = (item) => {
    return route.path === item.to;
};

/**
 * Verifica se um item de menu ou qualquer um de seus subitens tem permissão
 * Retorna true se o item ou pelo menos um subitem tiver permissão
 */
const hasAnyPermission = (item) => {
    // Se o item tem subitens, verificar se pelo menos um subitem tem permissão
    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
        // Verificar recursivamente se pelo menos um subitem tem permissão
        const hasVisibleChild = item.items.some(child => hasAnyPermission(child));
        
        // Se nenhum subitem tem permissão, o item pai não deve aparecer
        if (!hasVisibleChild) {
            return false;
        }
        
        // Se pelo menos um subitem tem permissão, o item pai deve aparecer
        // Não verificar a permissão do item pai se ele tem subitens,
        // pois a visibilidade depende dos subitens
        return true;
    }
    
    // Se não tem subitens, verificar a permissão do próprio item
    // Se não tiver permissão definida, considerar como visível (para compatibilidade)
    if (!item.permission) {
        return true;
    }
    
    return permissionService.hasPermissions(item.permission);
};
</script>

<template>
    <li v-if="item.visible !== false && hasAnyPermission(item)" :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
        <!-- Label do item raiz: só mostra se tiver permissão OU se tiver subitens com permissão -->
        <div v-if="root && (!item.permission || permissionService.hasPermissions(item.permission) || (item.items && hasAnyPermission(item)))" class="layout-menuitem-root-text">{{ item.label }}</div>
        <!-- Link para item com subitens: mostra se não tiver permissão definida OU se tiver permissão OU se algum subitem tiver permissão -->
        <a v-if="(!item.to || item.items) && (!item.permission || permissionService.hasPermissions(item.permission) || (item.items && hasAnyPermission(item)))" :href="item.url" @click="itemClick($event, item, index)" :class="item.class" :target="item.target" tabindex="0">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label  }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </a>
        <!-- Link para item sem subitens: verifica permissão normalmente -->
        <router-link v-if="item.to && !item.items && (!item.permission || permissionService.hasPermissions(item.permission))" @click="itemClick($event, item, index)" :class="[item.class, { 'active-route': checkActiveRoute(item) }]" tabindex="0" :to="item.to">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </router-link>
        <!-- Subitens: mostra se não tiver permissão definida OU se tiver permissão OU se algum subitem tiver permissão -->
        <Transition v-if="item.items && (!item.permission || permissionService.hasPermissions(item.permission) || hasAnyPermission(item))" name="layout-submenu">
            <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
                <app-menu-item v-for="(child, i) in item.items" :key="child" :index="i" :item="child" :parentItemKey="itemKey" :root="false"></app-menu-item>
            </ul>
        </Transition>
    </li>
</template>

<style lang="scss" scoped></style>
