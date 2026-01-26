import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import { staticRoutes } from './routes'
import { createRouterGuard } from './guard'

const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_HISTORY === 'hash'
      ? createWebHashHistory(import.meta.env.VITE_BASE)
      : createWebHistory(import.meta.env.VITE_BASE),
  // 应该添加到路由的初始路由列表。
  routes: staticRoutes,
  scrollBehavior: (to, _from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    return to.hash ? { behavior: 'smooth', el: to.hash } : { left: 0, top: 0 }
  }
})

// const resetRoutes = () => resetStaticRoutes(router, routes)
const resetRoutes = () => {}

createRouterGuard(router)

// 处理路由加载错误（通常是发布新版本后，用户停留在老页面导致的 ChunkLoadError）
router.onError((error) => {
  console.error('路由错误:', error)
  const pattern = /Loading chunk (\d)+ failed/g
  const isChunkLoadFailed = error.message.match(pattern)

  if (isChunkLoadFailed || error.message.includes('Failed to fetch dynamically imported module')) {
    console.log('检测到 Chunk 加载失败，尝试刷新页面...')
    window.location.reload()
  }
})

export { resetRoutes, router }
