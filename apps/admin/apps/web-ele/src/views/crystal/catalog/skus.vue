<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: 'SKU 编码', prop: 'skuCode', width: 160 },
  { label: '名称', prop: 'name' },
  { label: '分类', prop: 'category', tag: true },
  { label: '售价', prop: 'price' },
  { label: '库存', prop: 'stock' },
  { label: '锁定', prop: 'lockedStock' },
];

const actions = [
  {
    label: '编辑',
    type: 'primary' as const,
    payload: (row: Record<string, unknown>) =>
      JSON.stringify(
        {
          productId: row.productId,
          skuCode: row.skuCode,
          name: row.name,
          category: row.category,
          price: row.price,
          enabled: row.enabled ?? true,
        },
        null,
        2,
      ),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateSku(String(row._id), payload),
  },
  {
    label: '入库',
    type: 'success' as const,
    payload: () => '{"type":"inbound","quantity":10,"remark":"后台补货"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.adjustInventory(String(row._id), payload),
  },
  {
    label: '锁定',
    type: 'warning' as const,
    payload: () => '{"type":"lock","quantity":1,"remark":"订单占用"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.adjustInventory(String(row._id), payload),
  },
  {
    label: '解锁',
    payload: () => '{"type":"unlock","quantity":1,"remark":"释放占用"}',
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.adjustInventory(String(row._id), payload),
  },
  {
    label: '启停',
    type: 'warning' as const,
    payload: (row: Record<string, unknown>) => JSON.stringify({ enabled: !row.enabled }, null, 2),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateSku(String(row._id), payload),
  },
];
</script>

<template>
  <ResourceBoard
    accent="#277e62"
    title="SKU 与库存"
    description="管理可售 SKU、价格、库存和锁定库存，支持入库、锁定、解锁。"
    :columns="columns"
    :loader="crystalApi.skus"
    :creator="crystalApi.createSku"
    :actions="actions"
    create-example='{"productId":"PRODUCT_ID","skuCode":"BEAD-WHITE-8MM","name":"白水晶圆珠 8mm","category":"bead","price":12,"stock":200,"enabled":true}'
  />
</template>
