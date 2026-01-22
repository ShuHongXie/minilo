<script setup lang="ts">
import { initRequestInstance } from '@minilo/utils'
import { ref, reactive, onMounted, defineProps, defineEmits } from 'vue'

/**
 * =========================================================================
 *  基础错误测试用例
 * =========================================================================
 */

// 1. JS 运行时错误 (ReferenceError)
// 预期：捕获到 'JavaScript Error'，包含堆栈信息
const btnJsClick = () => {
  const obj = {}
  console.log(obj.notExist.func()) // 典型空指针错误
}

const btnPromiseClick = () => {
  Promise.resolve.then((res) => {
    console.log(obj.notExist.func())
  })
  Promise.reject(new Error('这是一个未捕获的 Promise 错误！'))
}

const btnXhrClick = () => {
  const axios = initRequestInstance()
  axios
    .post('/minitor/analyze', {
      error: `Error: 这是 Vue 组件内部触发的错误！\n    at btnVueClick (http://172.18.108.26:8080/assets/index-bUNAx0aa.js:7876:17)\n    at callWithErrorHandling (http://172.18.108.26:8080/assets/index-bUNAx0aa.js:2025:23)\n    at callWithAsyncErrorHandling (http://172.18.108.26:8080/assets/index-bUNAx0aa.js:2032:21)\n    at HTMLButtonElement.invoker (http://172.18.108.26:8080/assets/index-bUNAx0aa.js:7382:9)`
    })
    .then((res) => {})
}

const btnFetchClick = () => {
  fetch('http://localhost:9999/not-exist') // 端口不存在
}

const btnResourceClick = () => {
  const img = document.createElement('img')
  img.src = '/404-image.png' // 图片资源不存在
  document.body.appendChild(img)
  // 稍后移除 DOM 元素以免影响页面美观
  setTimeout(() => document.body.removeChild(img), 100)
}

const message = ref('')
const btnVueClick = () => {
  throw new Error('这是 Vue 组件内部触发的错误！')
}
// 6. Vue 3 组件错误测试
// 原理：通过 app.config.errorHandler 全局捕获
// document.getElementById('btn-vue').onclick = () => {
//   const vueContainer = document.getElementById('vue-app');
//   vueContainer.style.display = 'block';

//   // 避免重复创建 Vue 实例
//   if (vueContainer.__vue_app__) return;

//   const app = Vue.createApp({
//     data() {
//       return { message: 'Hello Vue 3!' };
//     },
//     methods: {
//       triggerError() {
//         throw new Error('这是 Vue 组件内部触发的错误！');
//       },
//     },
//   });

//   // 核心：安装监控插件 (一行代码接入)
//   app.use(ErrorMonitor.VueErrorMonitorPlugin, {
//     reportUrl: 'http://localhost:3000/error-report',
//     projectName: 'Test-Playground-Vue',
//     environment: 'dev',
//   });

//   app.mount('#vue-app');
//   vueContainer.__vue_app__ = app;
// };
</script>

<template>
  <h1>🎯 Error Monitor SDK 靶场</h1>
  <p>点击下方按钮触发错误，观察<b>终端控制台</b>的报错输出。</p>

  <div class="btn-group">
    <button class="danger" id="btn-js" @click="btnJsClick">💥 触发 JS 运行时错误</button>
    <button class="danger" id="btn-promise" @click="btnPromiseClick">💥 触发 Promise Reject</button>
    <button class="danger" id="btn-xhr" @click="btnXhrClick">💥 触发 XHR 请求失败</button>
    <button class="danger" id="btn-fetch" @click="btnFetchClick">💥 触发 Fetch 请求失败</button>
    <button class="danger" id="btn-resource" @click="btnResourceClick">
      💥 触发 资源加载失败 (404)
    </button>
    <button class="danger" id="btn-vue" @click="btnVueClick">💥 触发 Vue 组件错误</button>
    <button class="danger" id="btn-react">💥 触发 React 组件错误</button>
  </div>

  <div
    id="vue-app"
    style="margin-top: 20px; border: 1px dashed #42b983; padding: 10px; display: none"
  >
    <h3>Vue 3 测试区域</h3>
    <p>{{ message }}</p>
    <button @click="btnVueClick">在 Vue 中触发错误</button>
  </div>

  <div>属性渲染错误示例</div>
  <!-- <div>{{ obj.b.c }}</div> -->
</template>

<style lang="scss" scoped>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
h1 {
  color: #333;
}
.btn-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}
button {
  padding: 12px 20px;
  font-size: 14px;
  cursor: pointer;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 6px;
  transition: all 0.2s;
}
button:hover {
  background-color: #e0e0e0;
  transform: translateY(-1px);
}
button:active {
  transform: translateY(1px);
}
.danger {
  color: #d32f2f;
  border-color: #d32f2f;
  background-color: #ffebee;
}
.danger:hover {
  background-color: #ffcdd2;
}
</style>
