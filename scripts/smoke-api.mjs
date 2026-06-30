#!/usr/bin/env node

const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000/api';
const adminUsername = process.env.ADMIN_DEFAULT_USERNAME ?? 'admin';
const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD ?? 'Admin@123456';
const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const state = {};

async function request(method, path, { token, body, expected = method === 'POST' ? [200, 201] : 200 } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  const expectedStatuses = Array.isArray(expected) ? expected : [expected];
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${method} ${path} expected ${expected}, got ${response.status}: ${JSON.stringify(payload)}`);
  }
  if (!payload || payload.code !== 0) {
    throw new Error(`${method} ${path} returned business error: ${JSON.stringify(payload)}`);
  }
  return payload.data;
}

async function uploadFile(path, { token, filename, content, mimeType = 'text/plain', expected = [200, 201] }) {
  const formData = new FormData();
  formData.append('file', new Blob([content], { type: mimeType }), filename);
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const payload = await response.json().catch(() => null);
  const expectedStatuses = Array.isArray(expected) ? expected : [expected];
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`POST ${path} expected ${expected}, got ${response.status}: ${JSON.stringify(payload)}`);
  }
  if (!payload || payload.code !== 0) {
    throw new Error(`POST ${path} returned business error: ${JSON.stringify(payload)}`);
  }
  return payload.data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function idOf(entity) {
  return entity?._id ?? entity?.id;
}

async function createCompletedOrder({ adminToken, appToken, productId, beadSku, cordSku, suffix }) {
  const designItems = [
    { instanceId: `bead-${suffix}`, skuId: idOf(beadSku), productId, category: 'bead', quantity: 1, position: 0 },
    { instanceId: `cord-${suffix}`, skuId: idOf(cordSku), productId, category: 'cord', quantity: 1, position: 1 },
  ];
  const quote = await request('POST', '/app/designs/quote', {
    token: appToken,
    body: { themeType: 'wuxing', items: designItems },
  });
  assert(quote.makeable === true, `design quote is not makeable: ${JSON.stringify(quote)}`);
  assert(quote.totalAmount === 100, `unexpected quote total ${quote.totalAmount}`);

  const cart = await request('POST', '/app/carts/designs', {
    token: appToken,
    body: { designId: quote.designId },
  });
  const cartId = idOf(cart);
  assert(cartId && cart.items?.length === 1, 'cart did not include design');

  const address = await request('POST', '/app/users/me/addresses', {
    token: appToken,
    body: {
      receiver: '联调用户',
      phone: '13800000000',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      detail: `联调路 ${suffix}`,
      isDefault: true,
    },
  });
  const addressId = idOf(address);
  assert(addressId, 'address id missing');

  const order = await request('POST', '/app/orders/from-cart', {
    token: appToken,
    body: { cartId, addressId },
  });
  assert(order.totalAmount === 100, `unexpected order total ${order.totalAmount}`);
  assert(order.status === 'pending_payment', `unexpected order status ${order.status}`);
  assert(order.inventoryStatus === 'locked', `unexpected inventory status ${order.inventoryStatus}`);

  const prepay = await request('POST', '/app/payments/wechat/prepay', {
    token: appToken,
    body: { orderNo: order.orderNo },
  });
  assert(prepay.prepayPayload?.provider === 'wechat_pay_v3', 'prepay payload provider missing');
  assert(prepay.prepayPayload?.requestBody?.amount?.total === 100, 'prepay amount mismatch');

  const paid = await request('POST', '/app/payments/wechat/callback', {
    body: { orderNo: order.orderNo, transactionId: `WX-${suffix}`, amount: 100 },
  });
  assert(paid.order?.status === 'paid', `payment did not mark order paid: ${JSON.stringify(paid.order)}`);

  const shipped = await request('POST', `/admin/orders/${order.orderNo}/ship`, {
    token: adminToken,
    body: {
      carrier: 'SF',
      trackingNo: `SF${suffix.replace(/\D/g, '').slice(0, 12)}`,
      addressSnapshot: order.addressSnapshot,
    },
  });
  assert(shipped.status === 'shipped', `ship did not mark order shipped: ${shipped.status}`);

  const completed = await request('POST', `/app/orders/${order.orderNo}/confirm-received`, {
    token: appToken,
  });
  assert(completed.status === 'completed', `confirm receipt did not complete order: ${completed.status}`);

  return { orderNo: order.orderNo, quote, cart, address, order, completed };
}

async function main() {
  console.log(`Smoke API base: ${baseUrl}`);

  const adminLogin = await request('POST', '/admin/auth/login', {
    body: { username: adminUsername, password: adminPassword },
  });
  const adminToken = adminLogin.accessToken;
  assert(adminToken, 'admin login did not return accessToken');

  const appLogin = await request('POST', '/app/auth/wechat-login', {
    body: { code: `smoke-${runId}`, profile: { nickname: '联调用户' } },
  });
  const appToken = appLogin.accessToken;
  assert(appToken, 'app login did not return accessToken');

  const product = await request('POST', '/admin/catalog', {
    token: adminToken,
    body: { name: `联调水晶-${runId}`, type: 'bead', material: '白水晶' },
  });
  const productId = idOf(product);
  assert(productId, 'catalog product id missing');

  const beadSku = await request('POST', '/admin/catalog/skus', {
    token: adminToken,
    body: {
      productId,
      skuCode: `BEAD-${runId}`,
      name: `联调主珠-${runId}`,
      category: 'bead',
      price: 88,
      stock: 12,
    },
  });
  const cordSku = await request('POST', '/admin/catalog/skus', {
    token: adminToken,
    body: {
      productId,
      skuCode: `CORD-${runId}`,
      name: `联调弹力绳-${runId}`,
      category: 'cord',
      price: 12,
      stock: 12,
    },
  });
  assert(idOf(beadSku) && idOf(cordSku), 'sku ids missing');

  const theme = await request('POST', '/admin/themes', {
    token: adminToken,
    body: {
      themeType: 'wuxing',
      name: `金水平衡-${runId}`,
      conditions: { element: 'metal' },
      recommendedSkuIds: [idOf(beadSku), idOf(cordSku)],
    },
  });
  assert(idOf(theme), 'theme id missing');

  const matched = await request('POST', '/app/themes/match', {
    body: { themeType: 'wuxing', profile: { element: 'metal' } },
  });
  assert(Array.isArray(matched.skus) && matched.skus.length >= 1, 'theme match returned no skus');

  const picker = await request('GET', '/app/catalog/picker');
  assert(picker.grouped?.bead?.some((item) => idOf(item) === idOf(beadSku)), 'picker missing bead sku');
  assert(picker.grouped?.cord?.some((item) => idOf(item) === idOf(cordSku)), 'picker missing cord sku');

  const primaryOrder = await createCompletedOrder({ adminToken, appToken, productId, beadSku, cordSku, suffix: runId });
  state.orderNo = primaryOrder.orderNo;

  const bracelet = await request('POST', '/app/bracelets', {
    token: appToken,
    body: { orderNo: state.orderNo, name: `联调手串-${runId}`, images: [], publicVisible: false },
  });
  state.braceletId = idOf(bracelet);
  assert(state.braceletId, 'bracelet id missing');

  const template = await request('POST', '/admin/thought-card-templates', {
    token: adminToken,
    body: { name: `联调海报模板-${runId}`, type: 'poster_9_16', config: { palette: 'warm' } },
  });
  state.templateId = idOf(template);
  assert(state.templateId, 'template id missing');

  const card = await request('POST', '/app/thought-cards/generate', {
    token: appToken,
    body: { braceletId: state.braceletId, templateId: state.templateId, seedText: '愿你今日安定发光' },
  });
  state.cardId = idOf(card);
  assert(state.cardId, 'thought card id missing');
  assert(card.solarTerm && card.solarTerm !== '节气待接入', `invalid solar term ${card.solarTerm}`);
  assert(Array.isArray(card.suitableFor) && card.suitableFor.length > 0, 'thought card suitableFor missing');

  const rewritten = await request('POST', `/app/thought-cards/${state.cardId}/rewrite`, {
    token: appToken,
    body: { instruction: '更温柔一些' },
  });
  assert(rewritten.status === 'rewritten', `rewrite status mismatch ${rewritten.status}`);

  const poster = await request('POST', `/app/thought-cards/${state.cardId}/poster`, {
    token: appToken,
  });
  assert(poster.status === 'poster_generated', `poster status mismatch ${poster.status}`);
  assert(String(poster.posterUrl).includes('/uploads/posters/'), `poster url invalid ${poster.posterUrl}`);

  const dashboard = await request('GET', '/admin/dashboard/overview', { token: adminToken });
  assert(typeof dashboard.pendingOrders === 'number', 'dashboard overview missing pendingOrders');
  assert(typeof dashboard.totalSales === 'number', 'dashboard overview missing totalSales');

  const review = await request('POST', '/app/reviews', {
    token: appToken,
    body: { orderNo: state.orderNo, rating: 5, content: '联调评价：佩戴舒适' },
  });
  const reviewId = idOf(review);
  assert(reviewId && review.status === 'pending', 'review was not created as pending');

  const auditedReview = await request('PATCH', `/admin/reviews/${reviewId}/audit`, {
    token: adminToken,
    body: { status: 'approved' },
  });
  assert(auditedReview.status === 'approved', 'review audit did not approve review');

  const refundOrder = await createCompletedOrder({ adminToken, appToken, productId, beadSku, cordSku, suffix: `${runId}-refund` });
  const afterSale = await request('POST', '/app/after-sales', {
    token: appToken,
    body: { orderNo: refundOrder.orderNo, type: 'refund', reason: '联调退款售后' },
  });
  const afterSaleId = idOf(afterSale);
  assert(afterSaleId && afterSale.status === 'pending', 'after-sale was not created as pending');

  const approvedAfterSale = await request('PATCH', `/admin/after-sales/${afterSaleId}`, {
    token: adminToken,
    body: { status: 'approved', remark: '联调同意退款' },
  });
  assert(approvedAfterSale.status === 'approved', 'after-sale was not approved');
  assert(approvedAfterSale.refundNo, 'approved after-sale did not create refundNo');

  const completedRefund = await request('POST', '/admin/refunds/complete', {
    token: adminToken,
    body: { refundNo: approvedAfterSale.refundNo },
  });
  assert(completedRefund.refund?.status === 'completed', 'refund was not completed');
  assert(completedRefund.order?.status === 'refunded', 'refunded order status mismatch');

  const content = await request('POST', '/admin/content', {
    token: adminToken,
    body: { type: 'article', title: `联调内容-${runId}`, payload: { body: '联调内容正文' } },
  });
  const contentId = idOf(content);
  assert(contentId && content.status === 'draft', 'content was not created as draft');

  const publishedContent = await request('PATCH', `/admin/content/${contentId}/audit`, {
    token: adminToken,
    body: { status: 'published' },
  });
  assert(publishedContent.status === 'published', 'content was not published');

  const appContent = await request('GET', '/app/content?type=article');
  assert(appContent.items?.some((item) => idOf(item) === contentId), 'published content missing in app list');
  const contentDetail = await request('GET', `/app/content/${contentId}`);
  assert(contentDetail.title === publishedContent.title, 'app content detail mismatch');

  const uploaded = await uploadFile('/admin/files/upload', {
    token: adminToken,
    filename: `smoke-${runId}.txt`,
    content: `smoke upload ${runId}`,
  });
  assert(uploaded.url?.includes('/uploads/'), `uploaded file url invalid ${uploaded.url}`);

  console.log('Smoke API passed');
  console.log(JSON.stringify({ orderNo: state.orderNo, braceletId: state.braceletId, cardId: state.cardId }, null, 2));
}

main().catch((error) => {
  console.error('Smoke API failed');
  console.error(error);
  process.exit(1);
});
