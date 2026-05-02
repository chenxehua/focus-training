<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

onLaunch(() => {
  // 恢复本地存储的 token
  userStore.restoreSession()
})

onShow(() => {
  // App 显示时刷新用户信息
})

onHide(() => {
  // App 隐藏
})
</script>

<template>
  <div />
</template>

<style lang="scss">
@import './uni.scss';
</style>
