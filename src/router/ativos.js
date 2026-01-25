const ativosRoutes = [
    {
        path: '/ativos',
        redirect: '/ativos/controle',
        children: [
            {
                path: 'controle',
                name: 'ativosControle',
                component: () => import('@/views/ativos/AtivosList.vue')
            },
            {
                path: 'add',
                name: 'ativosAdd',
                component: () => import('@/views/ativos/AtivosForm.vue')
            },
            {
                path: ':id',
                name: 'ativosEdit',
                component: () => import('@/views/ativos/AtivosForm.vue')
            },
            {
                path: 'consulta',
                name: 'ativosConsulta',
                component: () => import('@/views/ativos/AtivosDetalhes.vue')
            },
            // Cadastros Auxiliares - Filiais
            {
                path: 'filiais',
                name: 'ativosFiliaisList',
                component: () => import('@/views/ativos/FiliaisList.vue')
            },
            {
                path: 'filiais/add',
                name: 'ativosFiliaisAdd',
                component: () => import('@/views/ativos/FiliaisForm.vue')
            },
            {
                path: 'filiais/:id',
                name: 'ativosFiliaisEdit',
                component: () => import('@/views/ativos/FiliaisForm.vue')
            },
            // Cadastros Auxiliares - Locais
            {
                path: 'locais',
                name: 'ativosLocaisList',
                component: () => import('@/views/ativos/LocaisList.vue')
            },
            {
                path: 'locais/add',
                name: 'ativosLocaisAdd',
                component: () => import('@/views/ativos/LocaisForm.vue')
            },
            {
                path: 'locais/:id',
                name: 'ativosLocaisEdit',
                component: () => import('@/views/ativos/LocaisForm.vue')
            },
            // Cadastros Auxiliares - Descrições Padrão
            {
                path: 'descricoes-padrao',
                name: 'ativosDescricoesPadraoList',
                component: () => import('@/views/ativos/DescricoesPadraoList.vue')
            },
            {
                path: 'descricoes-padrao/add',
                name: 'ativosDescricoesPadraoAdd',
                component: () => import('@/views/ativos/DescricoesPadraoForm.vue')
            },
            {
                path: 'descricoes-padrao/:id',
                name: 'ativosDescricoesPadraoEdit',
                component: () => import('@/views/ativos/DescricoesPadraoForm.vue')
            }
        ]
    }
];

export default ativosRoutes;

