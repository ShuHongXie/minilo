<script setup lang="ts">
import { Layout } from '@minilo/core'
import { useRouter } from 'vue-router'
import { useUserStore, useRoutesStore, useConfigStore } from '@minilo/store'
import { useInitStore } from '#/store/useInitStore'
import { ElMessageBox, ElMessage } from 'element-plus'
import { LOGIN_PATH } from '@minilo/utils'

const router = useRouter()
const userStore = useUserStore()
const routesStore = useRoutesStore()
const configStore = useConfigStore()
const initStore = useInitStore()

// 处理登出事件
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    userStore.logout()
    routesStore.resetRoutes()
    configStore.resetConfig()
    initStore.resetRouters()
    ElMessage.success('退出登录成功')
    router.replace({
      path: LOGIN_PATH,
      query: {
        redirect: encodeURIComponent(router.currentRoute.value.fullPath)
      }
    })
  } catch {
    // 用户取消登出
  }
}
</script>

<template>
  <Layout @logout="handleLogout"></Layout>
</template>

<style lang="scss" scoped></style>
