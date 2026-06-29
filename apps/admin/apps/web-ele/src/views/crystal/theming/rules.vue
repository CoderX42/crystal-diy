<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '主题类型', prop: 'themeType', tag: true },
  { label: '规则名称', prop: 'name' },
  { label: '条件', prop: 'conditions' },
  { label: '推荐 SKU', prop: 'recommendedSkuIds' },
  { label: '启用', prop: 'enabled', tag: true },
];

const actions = [
  {
    label: '编辑',
    type: 'primary' as const,
    payload: (row: Record<string, unknown>) =>
      JSON.stringify(
        {
          themeType: row.themeType,
          name: row.name,
          conditions: row.conditions ?? {},
          recommendedSkuIds: row.recommendedSkuIds ?? [],
          enabled: row.enabled ?? true,
        },
        null,
        2,
      ),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateTheme(String(row._id), payload),
  },
  {
    label: '启停',
    type: 'warning' as const,
    payload: (row: Record<string, unknown>) => JSON.stringify({ enabled: !row.enabled }, null, 2),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateTheme(String(row._id), payload),
  },
];
</script>

<template>
  <ResourceBoard
    accent="#7c5aa6"
    title="主题推荐规则"
    description="配置五行、星座、MBTI、生肖/本命年主题进入选品的推荐规则。"
    :columns="columns"
    :loader="crystalApi.themes"
    :creator="crystalApi.createTheme"
    :actions="actions"
    create-example='{"themeType":"wuxing","name":"木元素舒展","conditions":{"element":"wood"},"recommendedSkuIds":["SKU_ID"],"enabled":true}'
  />
</template>
