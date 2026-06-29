<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '用户', prop: 'userId', width: 160 },
  { label: '激活', prop: 'active', tag: true },
  { label: '购物车项', prop: 'items' },
];
</script>

<template>
  <ResourceBoard accent="#b78338" title="购物车" description="查看设计加入购物车后的报价快照。" :columns="columns" :loader="crystalApi.carts" />
</template>
