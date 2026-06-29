import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'CrystalOps',
    path: '/crystal',
    redirect: '/crystal/dashboard',
    meta: { icon: 'lucide:gem', order: -10, title: '一念一串' },
    children: [
      {
        name: 'CrystalDashboard',
        path: '/crystal/dashboard',
        component: () => import('#/views/crystal/dashboard/index.vue'),
        meta: { icon: 'lucide:sparkles', title: '运营看板' },
      },
      {
        name: 'CrystalCatalog',
        path: '/crystal/catalog',
        redirect: '/crystal/catalog/items',
        meta: { icon: 'lucide:package', title: '商品中心' },
        children: [
          { name: 'CrystalCatalogItems', path: '/crystal/catalog/items', component: () => import('#/views/crystal/catalog/items.vue'), meta: { title: '商品素材' } },
          { name: 'CrystalCatalogSkus', path: '/crystal/catalog/skus', component: () => import('#/views/crystal/catalog/skus.vue'), meta: { title: 'SKU 库存' } },
        ],
      },
      {
        name: 'CrystalThemes',
        path: '/crystal/themes',
        component: () => import('#/views/crystal/theming/rules.vue'),
        meta: { icon: 'lucide:wand-sparkles', title: '主题推荐' },
      },
      {
        name: 'CrystalDiy',
        path: '/crystal/diy',
        redirect: '/crystal/diy/designs',
        meta: { icon: 'lucide:pen-tool', title: 'DIY 管理' },
        children: [
          { name: 'CrystalDesigns', path: '/crystal/diy/designs', component: () => import('#/views/crystal/diy/designs.vue'), meta: { title: '设计草稿' } },
          { name: 'CrystalCarts', path: '/crystal/diy/carts', component: () => import('#/views/crystal/diy/carts.vue'), meta: { title: '购物车' } },
        ],
      },
      {
        name: 'CrystalOrders',
        path: '/crystal/orders',
        redirect: '/crystal/orders/list',
        meta: { icon: 'lucide:receipt-text', title: '订单中心' },
        children: [
          { name: 'CrystalOrderList', path: '/crystal/orders/list', component: () => import('#/views/crystal/orders/orders.vue'), meta: { title: '订单' } },
          { name: 'CrystalPayments', path: '/crystal/orders/payments', component: () => import('#/views/crystal/orders/payments.vue'), meta: { title: '支付流水' } },
          { name: 'CrystalRefunds', path: '/crystal/orders/refunds', component: () => import('#/views/crystal/orders/refunds.vue'), meta: { title: '退款管理' } },
          { name: 'CrystalAfterSales', path: '/crystal/orders/after-sales', component: () => import('#/views/crystal/orders/after-sales.vue'), meta: { title: '售后' } },
          { name: 'CrystalReviews', path: '/crystal/orders/reviews', component: () => import('#/views/crystal/orders/reviews.vue'), meta: { title: '评价' } },
        ],
      },
      {
        name: 'CrystalBracelets',
        path: '/crystal/bracelets',
        redirect: '/crystal/bracelets/list',
        meta: { icon: 'lucide:circle-dot', title: '手串与念卡' },
        children: [
          { name: 'CrystalBraceletList', path: '/crystal/bracelets/list', component: () => import('#/views/crystal/bracelets/index.vue'), meta: { title: '手串册' } },
          { name: 'CrystalThoughtCards', path: '/crystal/bracelets/thought-cards', component: () => import('#/views/crystal/bracelets/thought-cards.vue'), meta: { title: '念卡记录' } },
          { name: 'CrystalThoughtTemplates', path: '/crystal/bracelets/templates', component: () => import('#/views/crystal/bracelets/templates.vue'), meta: { title: '念卡模板' } },
        ],
      },
      {
        name: 'CrystalUsers',
        path: '/crystal/users',
        component: () => import('#/views/crystal/users/index.vue'),
        meta: { icon: 'lucide:users', title: '用户中心' },
      },
      {
        name: 'CrystalContent',
        path: '/crystal/content',
        component: () => import('#/views/crystal/content/index.vue'),
        meta: { icon: 'lucide:file-text', title: '内容管理' },
      },
      {
        name: 'CrystalSystem',
        path: '/crystal/system',
        redirect: '/crystal/system/admin-users',
        meta: { icon: 'lucide:shield-check', title: '系统管理' },
        children: [
          { name: 'CrystalAdminUsers', path: '/crystal/system/admin-users', component: () => import('#/views/crystal/system/admin-users.vue'), meta: { title: '管理员' } },
          { name: 'CrystalRoles', path: '/crystal/system/roles', component: () => import('#/views/crystal/system/roles.vue'), meta: { title: '角色权限' } },
        ],
      },
    ],
  },
];

export default routes;
