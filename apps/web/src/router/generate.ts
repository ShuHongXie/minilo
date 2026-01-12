import type { RouteMeta, RouteRecordRaw } from 'vue-router'
import { cloneDeep } from '@minilo/utils'
import Layout from '#/views/core/Layout.vue'
// 匹配views里面所有的.vue文件
const modules = import.meta.glob('../views/**/*.vue')
console.log(modules)

export const generateRoutes = (routerData: RouteRecordRaw[]) => {
  let data = cloneDeep(routerData)
  let menuData = [] as any
  menuData = generateMenus(data, menuData).sort((a: any, b: any) => (a?.no ?? 999) - (b?.no ?? 999))
  data = formatRoutes(data)
  console.log('generateRoutes 原始数据:', routerData)
  console.log('generateRoutes 处理后的 dynamicRoutes:', data)
  return {
    menuData,
    dynamicRoutes: data
  }
}

export const formatRoutes = (routes: any[]) => {
  routes.forEach((item) => {
    console.log(
      'formatRoutes 处理路由:',
      item.path,
      'menuType:',
      item.menuType,
      'component:',
      item.component
    )

    if ((item.component as any) === 'Layout') {
      item.component = Layout
    } else if (item.menuType === 1) {
      // menuType === 1 是目录/分组，不需要组件
      // 如果有子路由，自动重定向到第一个子路由
      if (item.children && item.children.length > 0) {
        const firstChild = item.children[0]
        item.redirect = firstChild.path
        console.log(`目录路由 ${item.path} 重定向到: ${item.redirect}`)
      }
      // 删除 component 字段，避免路由匹配问题
      delete item.component
    } else if (item.path && item.menuType === 2) {
      // menuType === 2 表示是菜单页面，需要加载组件
      // 使用 path 字段来匹配组件
      const componentPath = `../views${item.path}.vue`
      item.component = modules[componentPath]

      console.log(`尝试加载组件: ${componentPath}, 结果:`, item.component ? '✅ 成功' : '❌ 失败')

      if (!item.component) {
        console.warn(`组件未找到: ${componentPath}`)
        console.log('可用的模块:', Object.keys(modules))
      }
    }

    if (item.children && item.children.length) {
      formatRoutes(item.children)
    }
  })
  return routes
}

/**
 * 根据路由配置生成菜单数据
 * @param routes - 路由配置数组，类型为 RouteRecordRaw
 * @returns 返回符合菜单配置的数据数组
 */
export const generateMenus = (routes: any[], menuData: any = []) => {
  // 遍历路由配置数组
  routes.forEach((item: any) => {
    const { path, redirect, name: routeName, meta = {} as RouteMeta } = item
    const {
      link = '',
      title,
      icon,
      showInBreadcrumb = true,
      showInTab = true,
      showInMenu = true
    } = meta
    const menu = {
      path: link || path || redirect,
      name: title || routeName,
      icon,
      showInBreadcrumb,
      showInTab,
      showInMenu,
      children: []
    }
    if (item.component === 'Layout') {
      if (item.children && item.children.length) {
        generateMenus(item.children, menuData)
      }
    } else {
      if (item.children) {
        menu.children = generateMenus(item.children)
      }
      menuData.push(menu)
    }
  })
  return menuData
}
