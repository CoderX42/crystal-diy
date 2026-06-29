<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '名称', prop: 'name' },
  { label: '用户', prop: 'userId', width: 160 },
  { label: '订单号', prop: 'orderNo', width: 210 },
  { label: '公开', prop: 'publicVisible', tag: true },
  { label: '图片', prop: 'images' },
];

const actions = [
  {
    label: '设为公开',
    type: 'success' as const,
    payload: () => '{"publicVisible":true}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.auditBracelet(String(row._id), payload),
  },
  {
    label: '设为隐藏',
    type: 'warning' as const,
    payload: () => '{"publicVisible":false}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.auditBracelet(String(row._id), payload),
  },
];
</script>

<template>
  <ResourceBoard accent="#416b91" title="手串册" description="管理制作完成后的用户手串记录和公开审核。" :columns="columns" :loader="crystalApi.bracelets" :actions="actions" />
</template>
