<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '标题', prop: 'title' },
  { label: '手串', prop: 'braceletId', width: 160 },
  { label: '节气', prop: 'solarTerm', tag: true },
  { label: '状态', prop: 'status', tag: true },
  { label: '海报', prop: 'posterUrl' },
];

const actions = [
  {
    label: '编辑念卡',
    payload: (row: Record<string, unknown>) => JSON.stringify({ title: row.title, thought: row.thought, suitableFor: row.suitableFor ?? [] }, null, 2),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateThoughtCard(String(row._id), payload),
  },
  {
    label: '重写',
    type: 'warning' as const,
    payload: () => '{"instruction":"请改写得更温柔、更适合分享"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.rewriteThoughtCard(String(row._id), payload),
  },
  {
    label: '生成海报',
    type: 'success' as const,
    payload: () => '{}',
    handler: (row: Record<string, unknown>) => crystalApi.generateThoughtPoster(String(row._id)),
  },
];
</script>

<template>
  <ResourceBoard accent="#b78338" title="念卡记录" description="查看系统生成的名字、念、宜、节气信息和海报状态。" :columns="columns" :loader="crystalApi.thoughtCards" :actions="actions" />
</template>
