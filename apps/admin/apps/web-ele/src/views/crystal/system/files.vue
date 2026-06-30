<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElButton, ElCard, ElDescriptions, ElDescriptionsItem, ElMessage, ElTag, ElUpload } from 'element-plus';
import type { UploadRequestOptions } from 'element-plus';

import { crystalApi } from '#/api/crystal';

const uploading = ref(false);
const uploaded = ref<Record<string, any> | null>(null);

async function upload(option: UploadRequestOptions) {
  uploading.value = true;
  try {
    uploaded.value = (await crystalApi.uploadFile(option.file as File)) as Record<string, any>;
    ElMessage.success('文件上传成功');
    option.onSuccess?.(uploaded.value);
  } catch {
    ElMessage.error('文件上传失败');
  } finally {
    uploading.value = false;
  }
}

function copyUrl() {
  if (!uploaded.value?.url) return;
  navigator.clipboard?.writeText(String(uploaded.value.url));
  ElMessage.success('文件 URL 已复制');
}
</script>

<template>
  <Page description="上传后台维护素材、内容封面和念卡海报所需文件。" title="文件上传">
    <ElCard class="rounded-6" shadow="never">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-base font-semibold">本地文件资产</div>
            <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">文件会保存到服务端 uploads 目录，并返回可访问 URL。</div>
          </div>
          <ElTag effect="plain" type="success">需要 file:upload 权限</ElTag>
        </div>
      </template>

      <ElUpload drag :http-request="upload" :show-file-list="false" class="w-full">
        <div class="py-8">
          <div class="text-lg font-semibold">拖拽文件到这里，或点击选择</div>
          <div class="mt-2 text-sm text-[var(--el-text-color-secondary)]">适用于商品图、内容图、模板素材等运营资源。</div>
        </div>
      </ElUpload>

      <div v-if="uploaded" class="mt-5 rounded border border-dashed p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="font-semibold">最近上传结果</div>
          <ElButton size="small" type="primary" @click="copyUrl">复制 URL</ElButton>
        </div>
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="原文件名">{{ uploaded.originalName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="MIME">{{ uploaded.mimeType }}</ElDescriptionsItem>
          <ElDescriptionsItem label="大小">{{ uploaded.size }} bytes</ElDescriptionsItem>
          <ElDescriptionsItem label="URL">
            <a :href="uploaded.url" target="_blank" class="text-primary underline">{{ uploaded.url }}</a>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <div v-if="uploading" class="mt-4 text-sm text-[var(--el-text-color-secondary)]">上传中，请稍候...</div>
    </ElCard>
  </Page>
</template>
