<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElButton, ElCard, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { crystalApi } from '#/api/crystal';

const loading = ref(false);
const dialogOpen = ref(false);
const rows = ref<Record<string, unknown>[]>([]);
const activeRow = ref<Record<string, unknown> | null>(null);
const payloadText = ref('{}');

async function load() {
  loading.value = true;
  try {
    rows.value = (await crystalApi.adminUsers()) as Record<string, unknown>[];
  } finally {
    loading.value = false;
  }
}

function openEdit(row: Record<string, unknown>) {
  activeRow.value = row;
  payloadText.value = JSON.stringify(
    {
      nickname: row.nickname,
      roleIds: Array.isArray(row.roles) ? row.roles.map((role: any) => role._id ?? role) : [],
      enabled: row.enabled ?? true,
    },
    null,
    2,
  );
  dialogOpen.value = true;
}

function openToggle(row: Record<string, unknown>) {
  activeRow.value = row;
  payloadText.value = JSON.stringify({ enabled: !row.enabled }, null, 2);
  dialogOpen.value = true;
}

async function submitEdit() {
  if (!activeRow.value) return;
  try {
    const payload = JSON.parse(payloadText.value) as Record<string, unknown>;
    await crystalApi.updateAdminUser(String(activeRow.value._id), payload);
    ElMessage.success('操作成功');
    dialogOpen.value = false;
    await load();
  } catch (error) {
    ElMessage.error(error instanceof SyntaxError ? 'JSON 格式不正确' : '操作失败');
  }
}

onMounted(load);
</script>

<template>
  <Page description="管理后台账号、角色与启用状态。" title="管理员">
    <ElCard class="rounded-6" shadow="never">
      <ElTable v-loading="loading" :data="rows" border stripe>
        <ElTableColumn prop="username" label="账号" />
        <ElTableColumn prop="nickname" label="昵称" />
        <ElTableColumn label="状态">
          <template #default="{ row }"><ElTag>{{ row.enabled ? '启用' : '停用' }}</ElTag></template>
        </ElTableColumn>
        <ElTableColumn prop="lastLoginAt" label="最近登录" />
        <ElTableColumn fixed="right" label="操作" width="160">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEdit(row)">编辑</ElButton>
            <ElButton link type="warning" @click="openToggle(row)">启停</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogOpen" width="680px" title="管理员操作 JSON">
      <ElForm label-position="top">
        <ElFormItem label="请求体">
          <ElInput v-model="payloadText" type="textarea" :rows="12" spellcheck="false" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogOpen = false">取消</ElButton>
        <ElButton type="primary" @click="submitEdit">确认</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
