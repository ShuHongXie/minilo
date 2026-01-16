<script setup lang="ts">
import { highlight, languages } from 'prismjs/components/prism-core'
import { nextTick, onMounted, ref } from 'vue'
import { initRequestInstance } from '@minilo/utils'

const editorRef = ref<any>(null)
const code = ref('')
const errorLine = ref(0)
const errorColumn = ref(0)
// 拆分代码为行数组，用于定位错误行
const codeLines = ref<string[]>([])

const axios = initRequestInstance({
  baseURL: '/api'
})

const highlighter = (code: string) => {
  return highlight(code, languages.typescript || languages.javascript)
}

// 核心工具函数：移除HTML标签，提取纯文本
const removeHtmlTags = (html: string) => {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

// 核心工具函数：遍历DOM文本节点，定位指定字符位置并插入高亮标签
const insertHighlightAtPosition = (
  parentEl: HTMLElement,
  start: number,
  end: number,
  column: number
) => {
  let currentOffset = 0 // 累计遍历的字符数
  const walker = document.createTreeWalker(parentEl, NodeFilter.SHOW_TEXT, null, false)
  let targetTextNode: Text | null = null
  let nodeStartOffset = 0 // 目标节点内的起始偏移
  let nodeEndOffset = 0 // 目标节点内的结束偏移
  let columnOffset = 0 // 错误列在目标节点内的偏移

  // 第一步：找到包含错误行的文本节点
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text
    const textLength = textNode.textContent?.length || 0

    // 找到包含错误行起始位置的节点
    if (currentOffset + textLength > start) {
      targetTextNode = textNode
      nodeStartOffset = start - currentOffset
      nodeEndOffset = Math.min(end - currentOffset, textLength)
      // 计算错误列在该节点内的偏移
      columnOffset = column - currentOffset
      break
    }
    currentOffset += textLength
  }

  if (!targetTextNode) return

  const text = targetTextNode.textContent || ''
  // 第二步：拆分文本节点，包裹错误行
  const beforeLine = text.substring(0, nodeStartOffset)
  const errorLineText = text.substring(nodeStartOffset, nodeEndOffset)
  const afterLine = text.substring(nodeEndOffset)

  // 创建错误行包裹容器
  const errorLineWrapper = document.createElement('span')
  errorLineWrapper.className = 'error-line-wrapper'

  // 第三步：在错误行内拆分错误列
  const beforeChar = errorLineText.substring(0, columnOffset - nodeStartOffset)
  const errorChar = errorLineText.substring(
    columnOffset - nodeStartOffset,
    columnOffset - nodeStartOffset + 1
  )
  const afterChar = errorLineText.substring(columnOffset - nodeStartOffset + 1)

  // 组装错误行内容（包含列高亮）
  errorLineWrapper.innerHTML = `${beforeChar}<span class="error-char">${errorChar}</span>${afterChar}`

  // 替换原文本节点
  targetTextNode.parentNode?.replaceChild(document.createTextNode(beforeLine), targetTextNode)
  targetTextNode.parentNode?.insertBefore(errorLineWrapper, targetTextNode.nextSibling)
  targetTextNode.parentNode?.insertBefore(
    document.createTextNode(afterLine),
    errorLineWrapper.nextSibling
  )
}

// 重构后的高亮函数
const highlightErrorPosition = () => {
  if (!editorRef.value || errorLine.value === 0 || errorColumn.value === 0) {
    console.warn('高亮条件不满足：行号/列号无效')
    return
  }

  const editorEl = editorRef.value.$el
  if (!editorEl) return

  // ========== 关键修正：从编辑器DOM中提取纯文本（去标签） ==========
  const editorHTML = editorEl.innerHTML
  // 移除所有HTML标签，得到和编辑器显示一致的纯文本
  const cleanText = removeHtmlTags(editorHTML)
  // 按换行拆分：得到渲染后编辑器内实际的行数组（和显示的行1:1对应）
  const renderedLines = cleanText.split('\n')

  // 校验行号有效性
  if (errorLine.value > renderedLines.length) {
    console.warn(`错误行号${errorLine.value}超出代码总行数${renderedLines.length}`)
    return
  }

  // ========== 重新计算错误行的字符范围（基于渲染后的纯文本） ==========
  // 计算错误行之前所有行的总字符数（包含换行符）
  const charCountBeforeErrorLine = renderedLines
    .slice(0, errorLine.value - 1)
    .reduce((total, line) => total + line.length + 1, 0) // +1 是换行符\n

  // 错误行的结束字符位置
  const errorLineText = renderedLines[errorLine.value - 1]
  const charCountEndErrorLine = charCountBeforeErrorLine + errorLineText.length

  // ========== 校验错误列有效性 ==========
  if (errorColumn.value > errorLineText.length) {
    console.warn(`错误列号${errorColumn.value}超出该行字符数${errorLineText.length}`)
    console.warn('错误行文本：', errorLineText)
    return
  }

  // ========== 插入高亮样式（不破坏原有语法高亮） ==========
  insertHighlightAtPosition(
    editorEl,
    charCountBeforeErrorLine, // 错误行起始字符位置
    charCountEndErrorLine, // 错误行结束字符位置
    charCountBeforeErrorLine + errorColumn.value // 错误列的全局字符位置
  )
}

onMounted(() => {
  axios
    .post('/minitor/analyze', {
      error: `TypeError: Cannot read properties of undefined (reading 'func')\n    at btnJsClick (http://172.18.108.26:8081/assets/index-bUNAx0aa.js:7855:36)\n    at callWithErrorHandling (http://172.18.108.26:8081/assets/index-bUNAx0aa.js:2025:23)\n    at callWithAsyncErrorHandling (http://172.18.108.26:8081/assets/index-bUNAx0aa.js:2032:21)\n    at HTMLButtonElement.invoker (http://172.18.108.26:8081/assets/index-bUNAx0aa.js:7382:9)`
    })
    .then((res) => {
      code.value = res.data.sourceContent
      errorLine.value = res.data.line
      errorColumn.value = res.data.column
      // 拆分代码为行数组（核心：按换行符拆分）
      codeLines.value = code.value.split('\n')
      console.log('codeLines', codeLines.value)

      nextTick(() => {
        // 延迟确保语法高亮完全渲染
        setTimeout(() => {
          highlightErrorPosition()
        }, 100)
      })
    })
})
</script>

<template>
  <div class="app-container">
    <prism-editor
      class="my-editor"
      v-model="code"
      :highlight="highlighter"
      readonly
      :line-numbers="true"
      ref="editorRef"
    />
  </div>
</template>

<style lang="scss">
.my-editor {
  height: 600px;
  font-size: 14px;
  line-height: 1.5;
  border-radius: 8px;
  border: 1px solid #eee;
  --prism-editor-line-number-width: 60px;
  margin-top: 20px;
}

// 错误行样式（穿透scoped）
::v-deep .error-line-wrapper {
  display: block; // 让错误行独立成块
  background-color: rgba(255, 220, 220, 0.5) !important;
  border-left: 3px solid #d32f2f !important;
  padding-left: 7px !important;
  margin-left: -7px !important; // 补偿padding，避免整体偏移
}

// 错误列字符样式
::v-deep .error-char {
  background-color: #ff4444 !important;
  color: white !important;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: bold;
}
</style>
