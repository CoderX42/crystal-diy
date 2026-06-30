<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';

import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: '动作', prop: 'action', tag: true, width: 180 },
  { label: '管理员', prop: 'adminId', width: 220 },
  { label: '详情', prop: 'detail' },
  { label: '时间', prop: 'createdAt', width: 190 },
];
</script>

<template>
  <ResourceBoard
    accent="#3f6f7c"
    title="审计日志"
    description="追踪后台关键操作、权限变更和运营安全事件。"
    :columns="columns"
    :loader="crystalApi.auditLogs"
    :creator="crystalApi.createAuditLog"
    create-example='{"action":"manual-note","adminId":"admin","detail":{"note":"手工审计备注"}}'
  />
</template>
