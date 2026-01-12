<script setup lang="ts">
import { Login } from '@minilo/core'
import { login, getCaptcha, getInfo } from '#/apis/sdk.gen'
import { useUserStore } from '@minilo/store'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ref, onMounted } from 'vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// 登录加载状态
const loginLoading = ref(false)

// 验证码相关状态
const captchaData = ref<{ id: string; img: string }>({
  id: '',
  img: ''
})

// 获取验证码
const fetchCaptcha = async () => {
  try {
    const res: any = await getCaptcha()
    // 拦截器已处理 code === 200，这里直接使用 data
    captchaData.value = {
      id: res.data.id,
      img: res.data.img
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    // 错误已在拦截器中显示，这里只记录日志
  }
}

// 登录提交函数
const handleLogin = async (formData: {
  username: string
  password: string
  code?: string
  rememberMe?: boolean
}) => {
  loginLoading.value = true
  try {
    const res: any = await login({
      body: {
        username: formData.username,
        password: formData.password,
        captchaId: captchaData.value.id,
        captcha: formData.code
      }
    })
    console.log(res)

    // 保存 token
    const token = res.data.token
    userStore.setToken(token)

    // 获取用户信息和权限
    try {
      const infoRes: any = await getInfo()
      const { permissions, userInfo } = infoRes.data
      // 保存用户信息
      userStore.setUserInfo(userInfo)
      // 保存权限
      if (permissions && Array.isArray(permissions)) {
        userStore.setPermissionList(permissions)
      }
    } catch (infoError) {
      console.warn('获取用户信息失败:', infoError)
      // 获取用户信息失败不影响登录，继续跳转
    }

    ElMessage.success('登录成功')
    // 跳转到首页或原始目标页面
    // 解码 redirect 参数（因为路由守卫中使用了 encodeURIComponent）
    const redirectParam = route.query.redirect as string
    const redirect = redirectParam ? decodeURIComponent(redirectParam) : '/'
    router.push(redirect)
  } catch (error: any) {
    console.error('登录失败:', error)
    // 登录失败后刷新验证码
    await fetchCaptcha()
  } finally {
    loginLoading.value = false
  }
}

// 组件挂载时获取验证码
onMounted(async () => {
  await fetchCaptcha()
})
</script>

<template>
  <Login
    :submit-fn="handleLogin"
    :captcha-image="captchaData.img"
    :loading="loginLoading"
    @refresh-captcha="fetchCaptcha"
  />
</template>

<style lang="scss" scoped></style>
