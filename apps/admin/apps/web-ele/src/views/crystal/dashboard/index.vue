<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElCard, ElSkeleton, ElTag } from 'element-plus';

import { crystalApi } from '#/api/crystal';

const loading = ref(false);
const overview = ref<Record<string, number>>({});

const cards = [
  { key: 'pendingOrders', label: '待支付订单', tone: '#b78338' },
  { key: 'paidOrders', label: '待制作/发货', tone: '#277e62' },
  { key: 'lowStockSkus', label: '库存预警 SKU', tone: '#a84f3c' },
  { key: 'pendingAfterSales', label: '待处理售后', tone: '#7c5aa6' },
  { key: 'pendingThoughtCards', label: '待审念卡', tone: '#416b91' },
  { key: 'totalSales', label: '成交金额', tone: '#8a6f4d' },
];

async function load() {
  loading.value = true;
  try {
    overview.value = await crystalApi.dashboardOverview();
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page description="订单、库存、售后、念卡的实时运营雷达。" title="一念一串 · 运营看板">
    <ElSkeleton :loading="loading" animated>
      <div class="ops-grid">
        <ElCard v-for="card in cards" :key="card.key" class="metric-card" shadow="never" :style="{ '--tone': card.tone }">
          <div class="metric-card__label">{{ card.label }}</div>
          <div class="metric-card__value">{{ overview[card.key] ?? 0 }}</div>
          <ElTag effect="dark" round>今日关注</ElTag>
        </ElCard>
      </div>
    </ElSkeleton>
  </Page>
</template>

<style scoped>
.ops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}
.metric-card {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--tone), transparent 68%);
  border-radius: 24px;
  background:
    radial-gradient(circle at 85% 18%, color-mix(in srgb, var(--tone), transparent 62%), transparent 34%),
    linear-gradient(145deg, #fffaf1, #ffffff);
}
.metric-card__label {
  color: #76685a;
  font-size: 14px;
  letter-spacing: 0.08em;
}
.metric-card__value {
  margin: 20px 0 12px;
  color: #2c2118;
  font-size: 42px;
  font-weight: 900;
}
</style>
