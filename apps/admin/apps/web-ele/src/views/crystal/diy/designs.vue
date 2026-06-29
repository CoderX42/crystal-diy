<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '用户', prop: 'userId', width: 160 },
  { label: '状态', prop: 'status', tag: true },
  { label: '报价快照', prop: 'quoteSnapshot' },
  { label: '设计项', prop: 'items' },
];
</script>

<template>
  <ResourceBoard
    accent="#416b91"
    title="DIY 设计草稿"
    description="查看用户创作台草稿、报价快照和不可制作原因。"
    :columns="columns"
    :loader="crystalApi.designs"
  />
</template>
