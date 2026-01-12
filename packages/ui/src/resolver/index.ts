import { kebabCase, libraryNamePrefixUpperCase, libraryName } from '../utils'

export const MiniloUiResolver = () => {
  console.log('MiniloUiResolver初始化')
  return {
    type: 'component' as const,
    resolve: (name: string) => {
      if (name.startsWith(libraryNamePrefixUpperCase)) {
        const componentName = kebabCase(name.slice(2))
        return {
          name,
          from: `@${libraryName}/ui/es/${componentName}`,
          sideEffects: [`@${libraryName}/ui/theme-chalk/ml-${componentName}`]
        }
      }
      return null
    }
  }
}
