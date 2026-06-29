<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '订单号', prop: 'orderNo', width: 210 },
  { label: '用户', prop: 'userId', width: 160 },
  { label: '金额', prop: 'totalAmount' },
  { label: '状态', prop: 'status', tag: true },
  { label: '物流', prop: 'shippingInfo' },
];

const actions = [
  {
    label: '发货',
    type: 'success' as const,
    payload: () => '{"carrier":"顺丰速运","trackingNo":"SF0000000000","addressSnapshot":{"receiver":"客户","phone":"13800000000"}}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.shipOrder(String(row.orderNo), payload),
  },
];
</script>

<template>
  <ResourceBoard accent="#a84f3c" title="订单中心" description="处理订单支付、发货、收货与交易状态。" :columns="columns" :loader="crystalApi.orders" :actions="actions" />
</template>
