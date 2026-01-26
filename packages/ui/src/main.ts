import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as echarts from 'echarts' // 引入echarts
import VueCropper from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import { VueErrorMonitorPlugin } from '@minilo/minitor'
import { WebVitalsPlugin } from '@minilo/minitor/vital'
import router from './router'

const app = createApp(App)
app.use(ElementPlus)
app.use(VueCropper)
app.use(router)
app.config.globalProperties.$echarts = echarts // 全局使用
app.use(VueErrorMonitorPlugin, {
  reportUrl: 'http://localhost:3000/error-report',
  projectName: 'Test-Playground',
  environment: 'dev'
})

app.use(WebVitalsPlugin, {
  projectName: 'ui',
  buildVersion: 'v1.0.0', // 建议从 package.json 读取
  router, // 传入路由实例，自动切换采集
  metrics: ['CLS', 'LCP', 'INP', 'FCP', 'TTFB'], // 推荐只采集核心指标
  getUserId: () => {
    // 从本地存储获取用户ID（示例）
    const user = localStorage.getItem('user_info')
    return user ? JSON.parse(user).id : null
  }
  // 可选：自定义上报（覆盖默认的 sendErrorData）
  // customReporter: (data) => {
  //   console.log('Web Vitals 数据:', data)
  // }
})

app.mount('#app')
