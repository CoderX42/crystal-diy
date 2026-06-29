<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '标题', prop: 'title' },
  { label: '类型', prop: 'type', tag: true },
  { label: '状态', prop: 'status', tag: true },
  { label: '内容配置', prop: 'payload' },
];

const actions = [
  {
    label: '编辑',
    type: 'primary' as const,
    payload: (row: Record<string, unknown>) => JSON.stringify({ type: row.type, title: row.title, payload: row.payload ?? {} }, null, 2),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateContent(String(row._id), payload),
  },
  {
    label: '发布',
    type: 'success' as const,
    payload: () => '{"status":"published"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.auditContent(String(row._id), payload),
  },
  {
    label: '驳回',
    type: 'danger' as const,
    payload: () => '{"status":"rejected"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.auditContent(String(row._id), payload),
  },
  {
    label: '归档',
    type: 'warning' as const,
    payload: () => '{"status":"archived"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.auditContent(String(row._id), payload),
  },
];
</script>

<template>
  <ResourceBoard
    accent="#a84f3c"
    title="内容与首页配置"
    description="管理百科文章、首页模块、Banner 和内容审核。"
    :columns="columns"
    :loader="crystalApi.content"
    :creator="crystalApi.createContent"
    :actions="actions"
    create-example='{"type":"article","title":"白水晶寓意","payload":{"summary":"清澈、专注、净化"}}'
  />
</template>
