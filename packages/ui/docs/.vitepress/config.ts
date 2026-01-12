import { defineConfig } from 'vitepress'
import { resolve } from 'path'

// SSR 环境 polyfill
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb: any) => setTimeout(cb, 16)
}
if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  globalThis.cancelAnimationFrame = (id: any) => clearTimeout(id)
}
export default defineConfig({
  title: 'Minilo-UI',
  description: 'Minilo-UI组件库',
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:4000', // 后端接口地址
          changeOrigin: true, // 允许跨域
          rewrite: (path) => path.replace(/^\/api/, '') // 移除请求路径中的/api前缀
        }
      }
    },
    resolve: {
      alias: {
        '#': resolve(__dirname, '../../src'),
        '@minilo/utils': resolve(__dirname, '../../../utils/index.ts'),
        '@minilo/types': resolve(__dirname, '../../../types/index.ts')
      }
    },
    // define 配置会导致覆盖 polyfill，已移除
    // define: {
    //   'globalThis.requestAnimationFrame': 'undefined',
    //   'globalThis.cancelAnimationFrame': 'undefined'
    // },
    ssr: {
      noExternal: [
        'element-plus',
        '@minilo/types',
        '@vueuse/core',
        'lodash.clonedeep',
        'defu',
        'echarts',
        'vue-cropper'
      ]
    },
    optimizeDeps: {
      exclude: ['@minilo/utils', '@minilo/types']
    },
    build: {
      rollupOptions: {
        external: [
          'crypto',
          'stream',
          'util',
          'http',
          'https',
          'path',
          'fs',
          'zlib',
          'url',
          'vue-router', // 文档不需要 vue-router
          '@minilo/store' // 文档不需要 store
        ]
      }
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' },
      { text: '组件', link: '/components/chart' }
    ],

    sidebar: [
      {
        text: '开始',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '组件总览', link: '/guide/' }
        ]
      },
      {
        text: '基础组件',
        items: [
          { text: 'MlChart 图表', link: '/components/chart' },
          { text: 'MlSearch 搜索', link: '/components/search' },
          { text: 'MlDetail 详情', link: '/components/detail' },
          { text: 'MlButton 按钮', link: '/components/button' },
          { text: 'MlNumberRangeInput 数值范围输入框', link: '/components/number-range-input' },
          { text: 'MlTreeSelect 树形选择', link: '/components/tree-select' },
          { text: 'MlTreeSelectDialog 树形选择对话框', link: '/components/tree-select-dialog' },
          { text: 'MlTreeSelectDrawer 树形选择抽屉', link: '/components/tree-select-drawer' }
        ]
      },
      {
        text: '复杂组件',
        items: [
          { text: 'MlImageUploadPro 图片上传裁剪', link: '/components/image-upload-pro' },
          { text: 'MlSearchTable 搜索表格', link: '/components/search-table' },
          { text: 'MlVirtualList 虚拟列表', link: '/components/virtual-list' }
        ]
      },
      {
        text: '@minilo/utils 工具库',
        items: [{ text: 'Request 请求工具', link: '/utils/request' }]
      }
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/ShuHongXie/minilo' }]
  }
})
