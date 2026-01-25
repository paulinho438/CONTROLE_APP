const emprestimosRoutes = [
	{
		path: '/emprestimos',
		redirect: '/emprestimos',
		children: [
			// Componentes de empréstimos não implementados ainda - rotas comentadas para não quebrar o build
			// {
			// 	path: '/emprestimos',
			// 	name: 'emprestimosList',
			// 	component: () => import('@/views/solicitacoes/EmprestimosList.vue')
			// },
			// {
			// 	path: '/emprestimos/:id/edit',
			// 	name: 'emprestimosEdit',
			// 	component: () => import('@/views/solicitacoes/EmprestimosForm.vue')
			// },
			// {
			// 	path: '/emprestimos/add',
			// 	name: 'emprestimosAdd',
			// 	component: () => import('@/views/solicitacoes/EmprestimosForm.vue')
			// },
			// {
			// 	path: '/emprestimos/:id/view',
			// 	name: 'emprestimosView',
			// 	component: () => import('@/views/solicitacoes/EmprestimosView.vue')
			// },
			// {
			// 	path: '/emprestimos/:id/aprovacao',
			// 	name: 'emprestimosAprovacao',
			// 	component: () => import('@/views/solicitacoes/EmprestimosAprovacao.vue')
			// },
			{
				path: '/emprestimos/:id/aprovacao_contaspagar',
				name: 'emprestimosAprovacaoBoleto',
				component: () => import('@/views/contaspagar/ContaspagarAprovacao.vue')
			},
		]
	}
];

export default emprestimosRoutes;
