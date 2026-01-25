import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'

const createConfig = (input, outputDir, isPlugin = false) => ({
  input,
  external: isPlugin ? ['child_process', 'fs', 'path', 'url'] : ['vue', 'vue-router'],
  output: [
    {
      file: `dist/${outputDir}/index.cjs.js`,
      format: 'cjs',
      sourcemap: true
    },
    {
      file: `dist/${outputDir}/index.esm.js`,
      format: 'es',
      sourcemap: true
    },
    isPlugin
      ? null
      : {
          file: `dist/${outputDir}/index.umd.js`,
          format: 'umd',
          name: 'ErrorMonitor',
          sourcemap: true,
          plugins: [terser()]
        }
  ].filter(Boolean),
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: `dist/${outputDir}`
    })
  ]
})

export default [
  createConfig('./core/index.ts', 'core', false),
  createConfig('./plugin/index.ts', 'plugin', true),
  createConfig('./screen/index.ts', 'screen', false),
  createConfig('./vital/index.ts', 'vital', false)
]
