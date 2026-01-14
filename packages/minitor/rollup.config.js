import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'

export default {
  input: 'src/index.ts', // 入口文件
  output: [
    // 1. CJS 格式 (给 Node.js 或旧版构建工具用)
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    // 2. ESM 格式 (给现代构建工具如 Vite/Webpack 用)
    {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    // 3. UMD 格式 (支持浏览器 <script> 标签直接引入)
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'ErrorMonitor', // 全局变量名，如 window.ErrorMonitor
      sourcemap: true,
      plugins: [terser()] // 压缩代码
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist'
    })
  ]
}
