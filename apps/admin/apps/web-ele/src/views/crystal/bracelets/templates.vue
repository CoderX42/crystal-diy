<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '名称', prop: 'name' },
  { label: '类型', prop: 'type', tag: true },
  { label: '配置', prop: 'config' },
  { label: '启用', prop: 'enabled', tag: true },
];

const actions = [
  {
    label: '编辑',
    type: 'primary' as const,
    payload: (row: Record<string, unknown>) =>
      JSON.stringify(
        {
          name: row.name,
          type: row.type,
          config: row.config ?? {},
          enabled: row.enabled ?? true,
        },
        null,
        2,
      ),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateThoughtCardTemplate(String(row._id), payload),
  },
  {
    label: '启停',
    type: 'warning' as const,
    payload: (row: Record<string, unknown>) => JSON.stringify({ enabled: !row.enabled }, null, 2),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateThoughtCardTemplate(String(row._id), payload),
  },
];
</script>

<template>
  <ResourceBoard
    accent="#277e62"
    title="念卡模板"
    description="维护文案模板和 9:16 海报模板配置。"
    :columns="columns"
    :loader="crystalApi.thoughtCardTemplates"
    :creator="crystalApi.createThoughtCardTemplate"
    :actions="actions"
    create-example='{"name":"月白静心 9:16","type":"poster_9_16","config":{"ratio":"9:16","palette":"moon-white"}}'
  />
</template>
