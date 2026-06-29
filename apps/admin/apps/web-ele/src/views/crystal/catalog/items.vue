<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '名称', prop: 'name' },
  { label: '类型', prop: 'type', tag: true },
  { label: '材质', prop: 'material' },
  { label: '启用', prop: 'enabled', tag: true },
];

const actions = [
  {
    label: '编辑',
    type: 'primary' as const,
    payload: (row: Record<string, unknown>) =>
      JSON.stringify({ name: row.name, type: row.type, material: row.material, enabled: row.enabled ?? true }, null, 2),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateCatalogItem(String(row._id), payload),
  },
  {
    label: '启停',
    type: 'warning' as const,
    payload: (row: Record<string, unknown>) => JSON.stringify({ enabled: !row.enabled }, null, 2),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateCatalogItem(String(row._id), payload),
  },
];
</script>

<template>
  <ResourceBoard
    accent="#8a6f4d"
    title="商品素材库"
    description="维护水晶珠子、配饰、隔片、绳子和吊坠基础素材。"
    :columns="columns"
    :loader="crystalApi.catalogItems"
    :creator="crystalApi.createCatalogItem"
    :actions="actions"
    create-example='{"name":"白水晶圆珠 8mm","type":"bead","material":"白水晶","enabled":true}'
  />
</template>
