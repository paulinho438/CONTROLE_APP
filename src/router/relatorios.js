const relatoriosRoutes = [
	{
		path: '/relatorios',
		redirect: '/relatorios/custos-centro-custo',
		children: [
			{
				path: 'custos-centro-custo',
				name: 'relatorioCustosCentroCusto',
				component: () => import('@/views/relatorios/CustosCentroCusto.vue')
			},
			{
				path: 'cotacoes',
				name: 'relatorioCotacoes',
				component: () => import('@/views/relatorios/RelatorioCotacoes.vue')
			},
			{
				path: 'custos-fornecedor',
				name: 'relatorioCustosFornecedor',
				component: () => import('@/views/relatorios/CustosFornecedor.vue')
			},
			{
				path: 'custos-solicitacao',
				name: 'relatorioCustosSolicitacao',
				component: () => import('@/views/relatorios/CustosSolicitacao.vue')
			},
			{
				path: 'historico-periodo',
				name: 'relatorioHistoricoPeriodo',
				component: () => import('@/views/relatorios/HistoricoPeriodo.vue')
			}
		]
	}
];

export default relatoriosRoutes;

