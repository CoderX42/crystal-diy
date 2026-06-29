<script lang="ts" setup>
import type { PropType } from 'vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import type { PageParams, PageResult } from '#/api/crystal';

interface BoardColumn {
  formatter?: (row: Record<string, unknown>) => string;
  label: string;
  prop: string;
  tag?: boolean;
  width?: number | string;
}

interface BoardAction {
  handler: (row: Record<string, unknown>, payload: Record<string, unknown>) => Promise<unknown>;
  label: string;
  payload?: (row: Record<string, unknown>) => string;
  type?: 'danger' | 'primary' | 'success' | 'warning';
}

type Loader = (params?: PageParams) => Promise<PageResult>;
type Creator = (payload: Record<string, unknown>) => Promise<unknown>;

const props = defineProps({
  accent: {
    default: '#8a6f4d',
    type: String,
  },
  actions: {
    default: () => [],
    type: Array as PropType<BoardAction[]>,
  },
  columns: {
    required: true,
    type: Array as PropType<BoardColumn[]>,
  },
  createExample: {
    default: '{}',
    type: String,
  },
  creator: {
    default: undefined,
    type: Function as PropType<Creator>,
  },
  description: {
    default: '',
    type: String,
  },
  loader: {
    required: true,
    type: Function as PropType<Loader>,
  },
  title: {
    required: true,
    type: String,
  },
});

const loading = ref(false);
const createDialogOpen = ref(false);
const actionDialogOpen = ref(false);
const payloadText = ref(props.createExample);
const actionPayloadText = ref('{}');
const tableData = ref<Record<string, unknown>[]>([]);
const activeAction = ref<BoardAction>();
const activeRow = ref<Record<string, unknown>>();
const query = reactive({ keyword: '', page: 1, pageSize: 20 });
const total = ref(0);

const hasCreator = computed(() => Boolean(props.creator));
const hasActions = computed(() => props.actions.length > 0);

function cellValue(row: Record<string, unknown>, column: BoardColumn) {
  if (column.formatter) return column.formatter(row);
  const value = row[column.prop];
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

async function load() {
  loading.value = true;
  try {
    const result = await props.loader(query);
    tableData.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

async function submitCreate() {
  if (!props.creator) return;
  try {
    const payload = JSON.parse(payloadText.value) as Record<string, unknown>;
    await props.creator(payload);
    ElMessage.success('已保存');
    createDialogOpen.value = false;
    await load();
  } catch (error) {
    ElMessage.error(error instanceof SyntaxError ? 'JSON 格式不正确' : '保存失败');
  }
}

function openAction(row: Record<string, unknown>, action: BoardAction) {
  activeRow.value = row;
  activeAction.value = action;
  actionPayloadText.value = action.payload?.(row) ?? '{}';
  actionDialogOpen.value = true;
}

async function submitAction() {
  if (!activeAction.value || !activeRow.value) return;
  try {
    const payload = JSON.parse(actionPayloadText.value) as Record<string, unknown>;
    await activeAction.value.handler(activeRow.value, payload);
    ElMessage.success('操作成功');
    actionDialogOpen.value = false;
    await load();
  } catch (error) {
    ElMessage.error(error instanceof SyntaxError ? 'JSON 格式不正确' : '操作失败');
  }
}

onMounted(load);
</script>

<template>
  <Page :description="description" :title="title">
    <div class="crystal-board" :style="{ '--crystal-accent': accent }">
      <div class="crystal-board__halo"></div>
      <ElCard class="crystal-board__toolbar" shadow="never">
        <div class="toolbar-inner">
          <div>
            <div class="eyebrow">YI NIAN YI CHUAN OPS</div>
            <div class="toolbar-title">{{ title }}</div>
          </div>
          <div class="toolbar-actions">
            <ElInput v-model="query.keyword" clearable placeholder="搜索名称 / 编号" @keyup.enter="load" />
            <ElButton @click="load">刷新</ElButton>
            <ElButton v-if="hasCreator" type="primary" @click="createDialogOpen = true">新增</ElButton>
          </div>
        </div>
      </ElCard>

      <ElCard class="crystal-board__table" shadow="never">
        <ElTable v-loading="loading" :data="tableData" border stripe>
          <ElTableColumn type="index" width="64" label="#" />
          <ElTableColumn
            v-for="column in columns"
            :key="column.prop"
            :label="column.label"
            :width="column.width"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <ElTag v-if="column.tag" effect="plain">{{ cellValue(row, column) }}</ElTag>
              <span v-else>{{ cellValue(row, column) }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn v-if="hasActions" fixed="right" label="操作" width="220">
            <template #default="{ row }">
              <ElButton
                v-for="action in actions"
                :key="action.label"
                link
                :type="action.type ?? 'primary'"
                @click="openAction(row, action)"
              >
                {{ action.label }}
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
        <div class="table-footer">共 {{ total }} 条记录 · 当前展示 {{ tableData.length }} 条</div>
      </ElCard>
    </div>

    <ElDialog v-model="createDialogOpen" width="680px" title="新增记录 JSON">
      <ElForm label-position="top">
        <ElFormItem label="请求体">
          <ElInput v-model="payloadText" type="textarea" :rows="14" spellcheck="false" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createDialogOpen = false">取消</ElButton>
        <ElButton type="primary" @click="submitCreate">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="actionDialogOpen" width="680px" :title="activeAction?.label ?? '操作'">
      <ElForm label-position="top">
        <ElFormItem label="操作参数 JSON">
          <ElInput v-model="actionPayloadText" type="textarea" :rows="12" spellcheck="false" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="actionDialogOpen = false">取消</ElButton>
        <ElButton type="primary" @click="submitAction">确认</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
.crystal-board {
  position: relative;
  display: grid;
  gap: 18px;
  overflow: hidden;
}

.crystal-board__halo {
  position: absolute;
  top: -130px;
  right: -120px;
  width: 360px;
  height: 360px;
  pointer-events: none;
  background: radial-gradient(circle, color-mix(in srgb, var(--crystal-accent), transparent 58%), transparent 68%);
  filter: blur(4px);
}

.crystal-board__toolbar,
.crystal-board__table {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--crystal-accent), transparent 72%);
  border-radius: 22px;
  background: linear-gradient(135deg, rgb(255 252 246 / 92%), rgb(255 255 255 / 82%));
}

.toolbar-inner {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
}

.eyebrow {
  color: var(--crystal-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
}

.toolbar-title {
  margin-top: 4px;
  color: #31251b;
  font-size: 22px;
  font-weight: 800;
}

.toolbar-actions {
  display: flex;
  min-width: 420px;
  gap: 10px;
}

.table-footer {
  margin-top: 14px;
  color: #8a7c70;
  font-size: 13px;
  text-align: right;
}
</style>
