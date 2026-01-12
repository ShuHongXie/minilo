import { router } from './router'
import { createApp, watchEffect } from 'vue'
import { initI18n } from '@minilo/locales'
import { initPersistStores } from '@minilo/store/init'
import { useTitle } from '@minilo/store'
import { ElLoading } from 'element-plus'
import * as echarts from 'echarts' // 引入echarts

import App from './App.vue'
import NProgress from 'nprogress'
import directives from './directives'

// import 'virtual:svg-icons-register'
import 'nprogress/nprogress.css'
import 'element-plus/dist/index.css'
import './assets/scss/global.scss'
import '@minilo/core/styles'
// import '@minilo/ui/theme-'

import initOpenApiInstance from '#/config/axios'
// import Minilo from '@minilo/ui'

export const init = async () => {
  NProgress.configure({ showSpinner: false })
  const app = createApp(App)
  // 状态管理注册
  initPersistStores(app)
  // axios实例注册
  initOpenApiInstance({
    baseURL: import.meta.env.VITE_BASE_URL
  })
  app.directive('loading', ElLoading.directive)
  // 路由注册
  app.use(router)
  // 国际化注册
  await initI18n(app)

  // 动态标题
  const title = useTitle()
  watchEffect(() => {
    const pageTitle = router.currentRoute.value.meta.title as string
    title.value = pageTitle
  })

  // echarts使用
  app.config.globalProperties.$echarts = echarts // 全局使用

  // 注册指令
  app.use(directives)

  app.mount('#app')
}
