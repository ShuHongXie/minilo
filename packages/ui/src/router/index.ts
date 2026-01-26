import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入预览组件
import OneComponent from '../preview/one.vue'
import TwoComponent from '../preview/two.vue'

// 定义路由
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'One',
    component: OneComponent,
    meta: { title: 'One Page' }
  },
  {
    path: '/two',
    name: 'Two',
    component: TwoComponent,
    meta: { title: 'Two Page' }
  }
]

// 创建路由器实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
