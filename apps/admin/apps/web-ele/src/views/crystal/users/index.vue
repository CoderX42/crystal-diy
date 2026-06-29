<script lang="ts" setup>
import { crystalApi } from '#/api/crystal';
import ResourceBoard from '../components/ResourceBoard.vue';

const columns = [
  { label: 'OpenID', prop: 'openid', width: 220 },
  { label: '昵称', prop: 'nickname' },
  { label: '手机号', prop: 'phone' },
  { label: '启用', prop: 'enabled', tag: true },
  { label: '最近登录', prop: 'lastLoginAt', width: 180 },
];

const actions = [
  {
    label: '编辑',
    type: 'primary' as const,
    payload: (row: Record<string, unknown>) =>
      JSON.stringify({ nickname: row.nickname, phone: row.phone, profile: row.profile ?? {}, enabled: row.enabled ?? true }, null, 2),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateAppUser(String(row._id), payload),
  },
  {
    label: '启停',
    type: 'warning' as const,
    payload: (row: Record<string, unknown>) => JSON.stringify({ enabled: !row.enabled }, null, 2),
    handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => crystalApi.updateAppUser(String(row._id), payload),
  },
];
</script>

<template>
  <ResourceBoard
    accent="#416b91"
    title="小程序用户"
    description="查看微信小程序用户、画像资料和登录状态。"
    :columns="columns"
    :loader="crystalApi.appUsers"
    :actions="actions"
  />
</template>
