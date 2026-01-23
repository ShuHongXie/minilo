import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { vitePluginReplaceVersion, vitePluginUploadSourcemap } from '@minilo/minitor/plugin'

const outDir = 'dist'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())

  return {
    build: {
      //打包后文件目录
      outDir,
      //css代码分割
      cssCodeSplit: true,
      //压缩
      minify: false,
      sourcemap: 'hidden'
    },
    css: {
      // 确保所有 CSS 都被正确处理
      modules: {
        localsConvention: 'camelCaseOnly'
      }
    },
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
      conditions: ['development', 'browser', 'import', 'module', 'default'],
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
      vitePluginReplaceVersion(),
      vitePluginUploadSourcemap({
        projectName: 'test-project',
        mappingApiUrl: 'http://127.0.0.1:4000/minitor/mapping',
        cosConfig: {
          bucket: 'sourcemap-1300014307',
          region: 'ap-guangzhou',
          cosPathPrefix: 'sourcemap/',
          secretId: env.VITE_SECRET_ID as string,
          secretKey: env.VITE_SECRET_KEY as string
        }
      })

      // dts({
      //   tsconfigPath: './tsconfig.prod.json',
      //   outDir: 'build/es'
      // }),
      // dts({
      //   tsconfigPath: './tsconfig.prod.json',
      //   outDir: 'build/lib'
      // })
    ]
  }
})
