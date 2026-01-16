<script setup lang="ts">
// import { onMounted, ref } from 'vue'
// import testSearch from './preview/testSearch.vue'
// import testRangeInput from './preview/testRangeInput.vue'
// import treeSelectDialog from './preview/treeSelectDialog.vue'
// import dataImportWizard from './preview/dataImportWizard.vue'
// import imageUploadPro from './preview/imageUploadPro.vue'
// import testVirtualList from './preview/testVirtualList.vue'
import { highlight, languages } from 'prismjs/components/prism-core'
import { nextTick, onMounted, ref } from 'vue'
import testErrorMinitor from './preview/testErrorMinitor.vue'
import { initRequestInstance } from '@minilo/utils'
import testSourceMap from './preview/testSourceMap.vue'

const editorRef = ref<any>(null)
// 模拟的错误位置
const code = ref('')
const errorLine = ref(0)
const errorColumn = ref(0)
const codeLines = ref<string[]>([])
const axios = initRequestInstance({
  baseURL: '/api'
})

const highlighter = (code: string) => {
  return highlight(code, languages.js)
}

const highlightErrorPosition = () => {
  if (!editorRef.value || errorLine.value === 0 || codeLines.value.length === 0) return

  const editorEl = editorRef.value.$el // 根元素：<pre class="prism-editor__editor">
  if (!editorEl) return

  // ========== 步骤1：定位错误行对应的「文本范围」 ==========
  // 计算错误行之前的所有行的总字符数（包含换行）
  const charCountBeforeErrorLine = codeLines.value
    .slice(0, errorLine.value - 1)
    .reduce((total, line) => total + line.length + 1, 0) // +1 是换行符长度

  // 错误行的文本长度
  const errorLineTextLength = codeLines.value[errorLine.value - 1].length

  // ========== 步骤2：在DOM中找到错误行的文本节点，包裹高亮容器 ==========
  // 获取编辑器内的所有文本节点（合并为一个字符串）
  const fullText = editorEl.textContent || ''
  // 截取错误行的文本范围
  const errorLineText = fullText.substring(
    charCountBeforeErrorLine,
    charCountBeforeErrorLine + errorLineTextLength
  )

  // 用「临时标记」替换错误行文本，再恢复为带高亮样式的HTML（避免破坏语法高亮的token）
  const tempMarker = `__ERROR_LINE_MARKER__${Date.now()}__`
  let highlightedHTML = editorEl.innerHTML.replace(
    errorLineText,
    `<span class="error-line-wrapper">${errorLineText}</span>`
  )

  // ========== 步骤3：在错误行内高亮错误列 ==========
  const errorLineWrapperHTML =
    highlightedHTML.match(/<span class="error-line-wrapper">([\s\S]*?)<\/span>/)?.[1] || ''
  if (errorLineWrapperHTML) {
    // 拆分错误行文本，包裹错误列字符
    const before = errorLineWrapperHTML.substring(0, errorColumn.value - 1)
    const errorChar = errorLineWrapperHTML.substring(errorColumn.value - 1, errorColumn.value)
    const after = errorLineWrapperHTML.substring(errorColumn.value)
    // 替换为带列高亮的HTML
    highlightedHTML = highlightedHTML.replace(
      /<span class="error-line-wrapper">([\s\S]*?)<\/span>/,
      `<span class="error-line-wrapper">${before}<span class="error-char">${errorChar}</span>${after}</span>`
    )
  }

  // 把处理后的HTML写回编辑器
  editorEl.innerHTML = highlightedHTML
}

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
