<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '订单号', prop: 'orderNo', width: 210 },
  { label: '用户', prop: 'userId', width: 160 },
  { label: '评分', prop: 'rating' },
  { label: '状态', prop: 'status', tag: true },
  { label: '内容', prop: 'content' },
];

const actions = [
  {
    label: '通过',
    type: 'success' as const,
    payload: () => '{"status":"approved"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.auditReview(String(row._id), payload),
  },
  {
    label: '拒绝',
    type: 'danger' as const,
    payload: () => '{"status":"rejected"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.auditReview(String(row._id), payload),
  },
];
</script>

<template>
  <ResourceBoard accent="#8a6f4d" title="评价审核" description="查看评价内容并进行公开审核。" :columns="columns" :loader="crystalApi.reviews" :actions="actions" />
</template>
