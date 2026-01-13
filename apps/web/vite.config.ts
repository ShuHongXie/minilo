import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { resolve } from 'path'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { transformWithTypesPlugin } from './src/vite-plugin/transform-with-types'
import { MiniloUiResolver } from '@minilo/ui/resolver'
import cdn from 'vite-plugin-cdn-import'
import { analyzer } from 'vite-bundle-analyzer'

export default defineConfig(({ mode }) => ({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true // 移除debugger
      }
    }
    // rollupOptions: {
    //   external: ['vue', 'vue-router', 'echarts'], // 添加这一行来排除这些库
    //   output: {
    //     globals: {
    //       vue: 'Vue',
    //       'vue-router': 'VueRouter',
    //       echarts: 'echarts'
    //     }
    //   }
    // }
  },
  server: {
    port: 3000, // 指定端口号
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // 后端接口地址
        changeOrigin: true, // 允许跨域
        rewrite: (path) => path.replace(/^\/api/, '') // 移除请求路径中的/api前缀
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // additionalData: `@use "@minilo/core/styles" as *;`
      }
    }
  },
  resolve: {
    alias: {
      '#': resolve(__dirname, 'src')
    }
    // dedupe: ['vue', 'pinia', 'vue-router', 'pinia-plugin-persistedstate', 'vue-i18n']
  },
  plugins: [
    vue(),
    vueJsx({
      transformOn: true, // 将 on:click 转换为 onClick
      mergeProps: true // 合并 props
    }),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia']
    }),
    Components({
      resolvers: [ElementPlusResolver(), MiniloUiResolver()],
      dts: 'src/types/components.d.ts'
      // dirs: ['./node_modules/@minilo/ui/build/es'],
      // deep: true
    }),
    // createSvgIconsPlugin({
    //   // 要缓存的图标文件夹
    //   iconDirs: [resolve(__dirname, 'src/assets/images/svg')],
    //   // 执行 icon name 的格式
    //   symbolId: 'icon-[name]'
    // }),
    transformWithTypesPlugin({
      // 配置选项
      input: './src/apis/client/client.gen.ts',
      output: './src/apis/client/client.gen.ts',
      enableBuild: true,
      enableDev: true // 启用开发时监听
    }),
    mode === 'development' && analyzer()
    // cdn({
    //   modules: [
    //     {
    //       name: 'echarts',
    //       var: 'echarts',
    //       path: 'https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.min.js'
    //     }
    //   ]
    // })
  ]
}))
