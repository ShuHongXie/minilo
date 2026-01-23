/**
 * @description 获取应用版本号
 * @author xieshuhong
 * @return {*}
 */
export const getAppVersion = () => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="build-version"]')
  return meta?.content || ''
}
