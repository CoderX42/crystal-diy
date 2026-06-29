<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '订单号', prop: 'orderNo', width: 210 },
  { label: '类型', prop: 'type', tag: true },
  { label: '状态', prop: 'status', tag: true },
  { label: '原因', prop: 'reason' },
];

const actions = [
  {
    label: '同意',
    type: 'success' as const,
    payload: () => '{"status":"approved","remark":"同意售后申请"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.handleAfterSale(String(row._id), payload),
  },
  {
    label: '拒绝',
    type: 'danger' as const,
    payload: () => '{"status":"rejected","remark":"不符合售后条件"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.handleAfterSale(String(row._id), payload),
  },
];
</script>

<template>
  <ResourceBoard accent="#7c5aa6" title="售后处理" description="处理退款、退货、换货申请和售后状态流转。" :columns="columns" :loader="crystalApi.afterSales" :actions="actions" />
</template>
