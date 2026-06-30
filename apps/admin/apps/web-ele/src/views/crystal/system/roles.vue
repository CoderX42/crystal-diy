<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElCheckbox,
  ElCheckboxGroup,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { crystalApi } from '#/api/crystal';

type RoleRow = Record<string, any>;

const loading = ref(false);
const saving = ref(false);
const dialogOpen = ref(false);
const rows = ref<RoleRow[]>([]);
const permissions = ref<string[]>([]);
const activeRow = ref<RoleRow | null>(null);
const form = reactive({
  code: '',
  name: '',
  permissions: [] as string[],
  enabled: true,
});

const dialogTitle = computed(() => (activeRow.value ? '编辑角色' : '新建角色'));

async function load() {
  loading.value = true;
  try {
    const [roleRows, permissionRows] = await Promise.all([crystalApi.roles(), crystalApi.permissions()]);
    rows.value = roleRows as RoleRow[];
    permissions.value = permissionRows as string[];
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.code = '';
  form.name = '';
  form.permissions = [];
  form.enabled = true;
}

function openCreate() {
  activeRow.value = null;
  resetForm();
  dialogOpen.value = true;
}

function openEdit(row: RoleRow) {
  activeRow.value = row;
  form.code = String(row.code ?? '');
  form.name = String(row.name ?? '');
  form.permissions = Array.isArray(row.permissions) ? [...row.permissions] : [];
  form.enabled = row.enabled ?? true;
  dialogOpen.value = true;
}

async function submitRole() {
  if (!form.code.trim() || !form.name.trim()) {
    ElMessage.warning('请填写角色编码和名称');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      permissions: form.permissions,
      enabled: form.enabled,
    };
    if (activeRow.value) {
      await crystalApi.updateRole(String(activeRow.value._id), payload);
    } else {
      await crystalApi.createRole(payload);
    }
    ElMessage.success('角色已保存');
    dialogOpen.value = false;
    await load();
  } catch {
    ElMessage.error('角色保存失败');
  } finally {
    saving.value = false;
  }
}

async function toggleRole(row: RoleRow) {
  try {
    await crystalApi.updateRole(String(row._id), {
      code: row.code,
      name: row.name,
      permissions: row.permissions ?? [],
      enabled: !row.enabled,
    });
    ElMessage.success('状态已更新');
    await load();
  } catch {
    ElMessage.error('状态更新失败');
  }
}

onMounted(load);
</script>

<template>
  <Page description="角色权限码与按钮级权限配置。" title="角色权限">
    <ElCard class="rounded-6" shadow="never">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-base font-semibold">角色权限矩阵</div>
            <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">维护后台角色、启用状态和可访问的功能权限。</div>
          </div>
          <ElButton type="primary" @click="openCreate">新建角色</ElButton>
        </div>
      </template>

      <ElTable v-loading="loading" :data="rows" border stripe>
        <ElTableColumn prop="code" label="编码" min-width="150" />
        <ElTableColumn prop="name" label="名称" min-width="140" />
        <ElTableColumn label="权限" min-width="360">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <ElTag v-for="permission in row.permissions" :key="permission" effect="plain">{{ permission }}</ElTag>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="150">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEdit(row)">编辑</ElButton>
            <ElButton link type="warning" @click="toggleRole(row)">{{ row.enabled ? '停用' : '启用' }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogOpen" :title="dialogTitle" width="760px">
      <ElForm label-position="top">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ElFormItem label="角色编码">
            <ElInput v-model="form.code" placeholder="如 content_editor" />
          </ElFormItem>
          <ElFormItem label="角色名称">
            <ElInput v-model="form.name" placeholder="如 内容运营" />
          </ElFormItem>
        </div>
        <ElFormItem label="启用状态">
          <ElSwitch v-model="form.enabled" active-text="启用" inactive-text="停用" />
        </ElFormItem>
        <ElFormItem label="权限码">
          <ElCheckboxGroup v-model="form.permissions" class="grid max-h-[320px] grid-cols-1 gap-2 overflow-y-auto rounded border p-3 md:grid-cols-2">
            <ElCheckbox v-for="permission in permissions" :key="permission" :label="permission" border>{{ permission }}</ElCheckbox>
          </ElCheckboxGroup>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogOpen = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitRole">保存</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
