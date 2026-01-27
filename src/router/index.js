import { createRouter, createWebHashHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import store from '@/store';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                { path: '/', redirect: '/dashboard' },
                { path: '/dashboard', name: 'dashboard', component: () => import('@/views/rialma/Dashboard.vue') },
                { path: '/entradas', name: 'entradas', component: () => import('@/views/rialma/Entradas.vue') },
                { path: '/saidas', name: 'saidas', component: () => import('@/views/rialma/Saidas.vue') },
                { path: '/balanco', name: 'balanco', component: () => import('@/views/rialma/Balanco.vue') },
                { path: '/notas-fiscais', name: 'notas-fiscais', component: () => import('@/views/rialma/NotasFiscais.vue') },
                { path: '/transferencias', name: 'transferencias', component: () => import('@/views/rialma/Transferencias.vue') },
                { path: '/grupos', name: 'grupos', component: () => import('@/views/rialma/Grupos.vue') },
                { path: '/materiais', name: 'materiais', component: () => import('@/views/rialma/Materiais.vue') },
                { path: '/patios', name: 'patios', component: () => import('@/views/rialma/Patios.vue') },
                { path: '/fornecedores', name: 'fornecedores', component: () => import('@/views/rialma/Fornecedores.vue') },
                { path: '/unidades-medida', name: 'unidades-medida', component: () => import('@/views/rialma/UnidadesMedida.vue') },
                { path: '/colaboradores', name: 'colaboradores', component: () => import('@/views/rialma/Colaboradores.vue') },
                { path: '/previsoes', name: 'previsoes', component: () => import('@/views/rialma/Previsoes.vue') },
                { path: '/previsao-geral', name: 'previsao-geral', component: () => import('@/views/rialma/PrevisaoGeral.vue') },
                { path: '/previsao-por-patio', name: 'previsao-por-patio', component: () => import('@/views/rialma/PrevisaoPatio.vue') },
                { path: '/consultas', name: 'consultas', component: () => import('@/views/rialma/Consultas.vue') },
                { path: '/historico-notas-fiscais', name: 'historico-notas-fiscais', component: () => import('@/views/rialma/HistoricoNotasFiscais.vue') },
                { path: '/progresso-recebimento', name: 'progresso-recebimento', component: () => import('@/views/rialma/ProgressoRecebimento.vue') },
                { path: '/saida-transferencia', name: 'saida-transferencia', component: () => import('@/views/rialma/SaidaTransferencia.vue') },
                { path: '/permissoes', name: 'permissionsList', component: () => import('@/views/permissions/PermissionsList.vue') },
                { path: '/usuarios', name: 'usuarioList', component: () => import('@/views/usuarios/UsuarioList.vue') },
                { path: '/usuarios/add', name: 'usuarioAdd', component: () => import('@/views/usuarios/UsuarioForm.vue') },
                { path: '/usuarios/:id/edit', name: 'usuarioEdit', component: () => import('@/views/usuarios/UsuarioForm.vue') }
            ]
        },
        { path: '/login', name: 'login', component: () => import('@/views/pages/auth/Login.vue') },
        { path: '/access', name: 'accessDenied', component: () => import('@/views/pages/auth/Access.vue') }
    ]
});

router.beforeEach((to, from, next) => {
    const isAuth = store.getters.isAutenticated;
    if (to.meta.requiresAuth && !isAuth) {
        next({ name: 'login' });
        return;
    }
    next();
});

export default router;

