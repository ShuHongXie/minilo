<script setup lang="ts">
// import { onMounted, ref } from 'vue'
// import testSearch from './preview/testSearch.vue'
// import testRangeInput from './preview/testRangeInput.vue'
// import treeSelectDialog from './preview/treeSelectDialog.vue'
// import dataImportWizard from './preview/dataImportWizard.vue'
// import imageUploadPro from './preview/imageUploadPro.vue'
// import testVirtualList from './preview/testVirtualList.vue'
import { nextTick, onMounted, ref } from 'vue'
import testErrorMinitor from './preview/testErrorMinitor.vue'
import { initRequestInstance } from '@minilo/utils'
import testSourceMap from './preview/testSourceMap.vue'

const editorRef = ref<any>(null)
// 模拟的错误位置

onMounted(() => {
  // axios
  //   .post('/minitor/analyze', {
  //     error: `TypeError: Cannot read properties of undefined (reading 'func')\n    at btnJsClick (http://172.18.108.26:8081/assets/index-bUNAx0aa.js:7855:36)\n    at callWithErrorHandling (http://172.18.108.26:8081/assets/index-bUNAx0aa.js:2025:23)\n    at callWithAsyncErrorHandling (http://172.18.108.26:8081/assets/index-bUNAx0aa.js:2032:21)\n    at HTMLButtonElement.invoker (http://172.18.108.26:8081/assets/index-bUNAx0aa.js:7382:9)`
  //   })
  //   .then((res) => {
  //     console.log(res)
  //     code.value = res.data.sourceContent
  //     errorLine.value = res.data.line
  //     errorColumn.value = res.data.column
  //     console.log(res.data.sourceContent)
  //     nextTick(() => {
  //       highlightErrorPosition()
  //     })
  //   })
})
</script>

<template>
  <div class="app-container">
    <!-- <testSearch></testSearch> -->
    <!-- <testRangeInput></testRangeInput> -->
    <!-- <treeSelectDialog></treeSelectDialog> -->
    <!-- <imageUploadPro /> -->
    <!-- <testVirtualList /> -->
    <testErrorMinitor />
    <testSourceMap />
    <!-- <div class="source-map-viewer">{{ code }}</div> -->
    <!-- <prism-editor
      class="my-editor"
      v-model="code"
      :highlight="highlighter"
      readonly
      :line-numbers="true"
      ref="editorRef"
    >
    </prism-editor> -->
  </div>
</template>

<style lang="scss">
// @import './style/index.scss';
@use './style/index.scss' as *;
.custom-editor {
  height: 500px;
  font-size: 14px;
  border-radius: 8px;
  --prism-editor-line-number-width: 50px; // 加宽行号区域
}

// 错误字符高亮样式
::v-deep .error-char {
  background-color: #ff4444;
  color: white;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: bold;
}
</style>
