import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as echarts from 'echarts' // 引入echarts
import VueCropper from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import { VueErrorMonitorPlugin } from '@minilo/minitor'
import { PrismEditor } from 'vue-prism-editor'
import 'vue-prism-editor/dist/prismeditor.min.css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/themes/prism.css'

const app = createApp(App)
app.use(ElementPlus)
app.use(VueCropper)
app.config.globalProperties.$echarts = echarts // 全局使用
app.use(VueErrorMonitorPlugin, {
  reportUrl: 'http://localhost:3000/error-report',
  projectName: 'Test-Playground',
  environment: 'dev'
})
app.component('PrismEditor', PrismEditor)

app.mount('#app')
