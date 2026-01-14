import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

const outDir = 'minilo'

// https://vite.dev/config/
export default defineConfig({
  build: {
    //打包后文件目录
    outDir,
    //css代码分割
    cssCodeSplit: true,
    //压缩
    minify: false
  },
  css: {
    // 确保所有 CSS 都被正确处理
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  },
  server: {
    proxy: {
      '/egc-': {
        target: 'https://uat2-smart.hengdayun.com/',
        secure: false,
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:4000', // 后端接口地址
        changeOrigin: true, // 允许跨域
        rewrite: (path) => path.replace(/^\/api/, '') // 移除请求路径中的/api前缀
      }
    }
  },
  resolve: {
    conditions: ['development'],
    alias: {
      '#': resolve(__dirname, 'src'),
      minilo: resolve(__dirname, 'src/components')
    }
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    }),
    dts({
      tsconfigPath: './tsconfig.prod.json',
      outDir: 'build/es'
    }),
    dts({
      tsconfigPath: './tsconfig.prod.json',
      outDir: 'build/lib'
    })
  ]
})
