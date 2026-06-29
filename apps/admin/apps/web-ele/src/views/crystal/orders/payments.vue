<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '订单号', prop: 'orderNo', width: 210 },
  { label: '渠道', prop: 'channel', tag: true },
  { label: '状态', prop: 'status', tag: true },
  { label: '金额', prop: 'amount' },
  { label: '交易号', prop: 'transactionId' },
];

const actions = [
  {
    label: '标记支付',
    type: 'success' as const,
    payload: () => '{"transactionId":"WX-MOCK-TRANSACTION"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.markPaid(String(row.orderNo), payload),
  },
  {
    label: '完成退款',
    type: 'success' as const,
    payload: () => '{"refundNo":"RF202601010000000000"}',
    handler: (_row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.completeRefund(payload),
  },
  {
    label: '发起退款',
    type: 'warning' as const,
    payload: (row: Record<string, unknown>) => JSON.stringify({ orderNo: row.orderNo, amount: row.amount ?? 0, reason: '用户申请退款' }, null, 2),
    handler: (_row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.createRefund(payload),
  },
];
</script>

<template>
  <ResourceBoard accent="#277e62" title="支付流水" description="查看微信支付预支付单、交易状态和退款入口。" :columns="columns" :loader="crystalApi.payments" :actions="actions" />
</template>
