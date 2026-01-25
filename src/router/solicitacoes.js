const solicitacoesRoutes = [
	{
		path: '/solicitacoes',
		redirect: '/solicitacoes',
		children: [
			{
				path: '',
				name: 'solicitacoesList',
				component: () => import('@/views/solicitacoes/SolicitacoesList.vue')
			},
			{
				path: 'pendentes',
				name: 'solicitacoesPendentes',
				component: () => import('@/views/solicitacoes/SolicitacoesPendentes.vue')
			},
			{
				path: 'aprovar/:id',
				name: 'aprovarSolicitacao',
				props: true,
				component: () => import('@/views/solicitacoes/AprovarSolicitacao.vue')
			},
			{
				path: 'vincular/:id',
				name: 'vincularSolicitacao',
				props: true,
				component: () => import('@/views/solicitacoes/VincularSolicitacao.vue')
			},
			{
				path: ':id/edit',
				name: 'solicitacoesEdit',
				props: true,
				component: () => import('@/views/solicitacoes/SolicitacoesForm.vue')
			},
			{
				path: 'add',
				name: 'solicitacoesAdd',
				component: () => import('@/views/solicitacoes/SolicitacoesForm.vue')
			},
			{
				path: ':id/view',
				name: 'solicitacoesView',
				props: true,
				component: () => import('@/views/solicitacoes/SolicitacoesView.vue')
			},
			{
				path: 'relatorio',
				name: 'solicitacoesRelatorio',
				component: () => import('@/views/solicitacoes/SolicitacoesRelatorio.vue')
			},
			// Componente SolicitacoesAprovacao.vue não implementado - usando AprovarSolicitacao.vue no lugar
			// {
			// 	path: ':id/aprovacao',
			// 	name: 'solicitacoesAprovacao',
			// 	props: true,
			// 	component: () => import('@/views/solicitacoes/SolicitacoesAprovacao.vue')
			// }
		]
	},
	{
		path: '/solicitacoes_pendentes',
		redirect: '/solicitacoes/pendentes'
	},
	{
		path: '/aprovar_solicitacao/:id',
		redirect: (to) => `/solicitacoes/aprovar/${to.params.id}`
	},
	{
		path: '/vincular_solicitacao/:id',
		redirect: (to) => `/solicitacoes/vincular/${to.params.id}`
	}
];

export default solicitacoesRoutes;
