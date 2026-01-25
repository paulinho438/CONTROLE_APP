const comprasRoutes = [
  {
    path: '/compras',
    redirect: '/compras/pedidos',
    children: [
      {
        path: 'pedidos',
        name: 'pedidosCompraList',
        component: () => import('@/views/compras/PedidosCompraList.vue')
      },
      {
        path: 'pedidos/:id',
        name: 'pedidoCompraDetalhes',
        component: () => import('@/views/compras/PedidoCompraDetalhes.vue')
      }
    ]
  }
];

export default comprasRoutes;

