import { requestClient } from '#/api/request';

export interface PageResult<T = Record<string, unknown>> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PageParams {
  [key: string]: unknown;
  page?: number;
  pageSize?: number;
}

function getPage<T extends Record<string, unknown> = Record<string, unknown>>(url: string, params?: PageParams) {
  return requestClient.get<PageResult<T>>(url, { params });
}

function patchData(url: string, data: Record<string, unknown>) {
  return requestClient.request(url, { data, method: 'PATCH' });
}

export const crystalApi = {
  dashboardOverview: () => requestClient.get<Record<string, number>>('/admin/dashboard/overview'),

  catalogItems: (params?: PageParams) => getPage('/admin/catalog', params),
  createCatalogItem: (data: Record<string, unknown>) => requestClient.post('/admin/catalog', data),
  updateCatalogItem: (id: string, data: Record<string, unknown>) => patchData(`/admin/catalog/${id}`, data),
  skus: (params?: PageParams) => getPage('/admin/catalog/skus', params),
  createSku: (data: Record<string, unknown>) => requestClient.post('/admin/catalog/skus', data),
  updateSku: (id: string, data: Record<string, unknown>) => patchData(`/admin/catalog/skus/${id}`, data),
  adjustInventory: (id: string, data: Record<string, unknown>) => requestClient.post(`/admin/catalog/skus/${id}/inventory`, data),
  inventoryLogs: (id: string, params?: PageParams) => getPage(`/admin/catalog/skus/${id}/inventory-logs`, params),

  themes: (params?: PageParams) => getPage('/admin/themes', params),
  createTheme: (data: Record<string, unknown>) => requestClient.post('/admin/themes', data),
  updateTheme: (id: string, data: Record<string, unknown>) => patchData(`/admin/themes/${id}`, data),

  designs: (params?: PageParams) => getPage('/admin/designs', params),
  carts: (params?: PageParams) => getPage('/admin/carts', params),
  orders: (params?: PageParams) => getPage('/admin/orders', params),
  shipOrder: (orderNo: string, data: Record<string, unknown>) => requestClient.post(`/admin/orders/${orderNo}/ship`, data),

  payments: (params?: PageParams) => getPage('/admin/payments', params),
  refunds: (params?: PageParams) => getPage('/admin/refunds', params),
  markPaid: (orderNo: string, data: Record<string, unknown>) => requestClient.post(`/admin/payments/${orderNo}/mark-paid`, data),
  createRefund: (data: Record<string, unknown>) => requestClient.post('/admin/refunds', data),
  completeRefund: (data: Record<string, unknown>) => requestClient.post('/admin/refunds/complete', data),

  afterSales: (params?: PageParams) => getPage('/admin/after-sales', params),
  handleAfterSale: (id: string, data: Record<string, unknown>) => patchData(`/admin/after-sales/${id}`, data),

  reviews: (params?: PageParams) => getPage('/admin/reviews', params),
  auditReview: (id: string, data: Record<string, unknown>) => patchData(`/admin/reviews/${id}/audit`, data),

  bracelets: (params?: PageParams) => getPage('/admin/bracelets', params),
  auditBracelet: (id: string, data: Record<string, unknown>) => patchData(`/admin/bracelets/${id}/audit`, data),

  thoughtCards: (params?: PageParams) => getPage('/admin/thought-cards', params),
  thoughtCardTemplates: (params?: PageParams) => getPage('/admin/thought-card-templates', params),
  createThoughtCardTemplate: (data: Record<string, unknown>) => requestClient.post('/admin/thought-card-templates', data),
  updateThoughtCardTemplate: (id: string, data: Record<string, unknown>) => patchData(`/admin/thought-card-templates/${id}`, data),
  updateThoughtCard: (id: string, data: Record<string, unknown>) => patchData(`/admin/thought-cards/${id}`, data),
  rewriteThoughtCard: (id: string, data: Record<string, unknown>) => requestClient.post(`/admin/thought-cards/${id}/rewrite`, data),
  generateThoughtPoster: (id: string) => requestClient.post(`/admin/thought-cards/${id}/poster`),

  content: (params?: PageParams) => getPage('/admin/content', params),
  adminUsers: (params?: PageParams) => requestClient.get('/admin/users', { params }),
  updateAdminUser: (id: string, data: Record<string, unknown>) => patchData(`/admin/users/${id}`, data),
  appUsers: (params?: PageParams) => getPage('/admin/app-users', params),
  updateAppUser: (id: string, data: Record<string, unknown>) => patchData(`/admin/app-users/${id}`, data),
  roles: () => requestClient.get('/admin/rbac/roles'),
  permissions: () => requestClient.get('/admin/rbac/permissions'),
  createRole: (data: Record<string, unknown>) => requestClient.post('/admin/rbac/roles', data),
  updateRole: (id: string, data: Record<string, unknown>) => patchData(`/admin/rbac/roles/${id}`, data),
  createContent: (data: Record<string, unknown>) => requestClient.post('/admin/content', data),
  updateContent: (id: string, data: Record<string, unknown>) => patchData(`/admin/content/${id}`, data),
  auditContent: (id: string, data: Record<string, unknown>) => patchData(`/admin/content/${id}/audit`, data),
  uploadFile: (file: File) => {
    const data = new FormData();
    data.append('file', file);
    return requestClient.post('/admin/files/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
