<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElCard, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { crystalApi } from '#/api/crystal';

const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);

async function load() {
  loading.value = true;
  try {
    rows.value = (await crystalApi.roles()) as Record<string, unknown>[];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page description="角色权限码与按钮级权限配置。" title="角色权限">
    <ElCard class="rounded-6" shadow="never">
      <ElTable v-loading="loading" :data="rows" border stripe>
        <ElTableColumn prop="code" label="编码" />
        <ElTableColumn prop="name" label="名称" />
        <ElTableColumn label="权限">
          <template #default="{ row }">
            <ElTag v-for="permission in row.permissions" :key="permission" class="mr-1 mb-1" effect="plain">{{ permission }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态">
          <template #default="{ row }"><ElTag>{{ row.enabled ? '启用' : '停用' }}</ElTag></template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </Page>
</template>
