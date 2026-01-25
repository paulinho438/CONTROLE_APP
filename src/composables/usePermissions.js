import { computed } from 'vue';
import { useStore } from 'vuex';
import PermissionsService from '@/service/PermissionsService';

export function usePermissions() {
    const store = useStore();
    const permissionService = new PermissionsService();

    const hasPermission = (permission) => {
        return store.getters?.permissions?.includes(permission) || false;
    };

    const hasAnyPermission = (permissions) => {
        if (!Array.isArray(permissions)) {
            return hasPermission(permissions);
        }
        return permissions.some(perm => hasPermission(perm));
    };

    const hasAllPermissions = (permissions) => {
        if (!Array.isArray(permissions)) {
            return hasPermission(permissions);
        }
        return permissions.every(perm => hasPermission(perm));
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions
    };
}

