import { Plugin } from 'vite'
import { buildVersion } from './utils'

// 5. 替换HTML占位符插件
export const vitePluginReplaceVersion = (): Plugin => {
  return {
    name: 'vite-plugin-replace-version',
    transformIndexHtml(html) {
      return html.replace('__BUILD_VERSION__', buildVersion)
    }
  }
}
