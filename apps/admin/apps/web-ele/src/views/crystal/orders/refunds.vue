<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '退款单号', prop: 'refundNo', width: 220 },
  { label: '订单号', prop: 'orderNo', width: 210 },
  { label: '状态', prop: 'status', tag: true },
  { label: '金额', prop: 'amount' },
  { label: '原因', prop: 'reason' },
  { label: '完成时间', prop: 'completedAt', width: 190 },
];

const actions = [
  {
    label: '完成退款',
    type: 'success' as const,
    payload: (row: Record<string, unknown>) => JSON.stringify({ refundNo: row.refundNo }, null, 2),
    handler: (_row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.completeRefund(payload),
  },
];
</script>

<template>
  <ResourceBoard
    accent="#8d5a32"
    title="退款管理"
    description="跟踪退款单状态，处理退款完成后的订单和库存回滚。"
    :columns="columns"
    :loader="crystalApi.refunds"
    :actions="actions"
  />
</template>
