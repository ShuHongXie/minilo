<script setup lang="ts">
import { NotFound } from '@minilo/core'
</script>

<template>
  <NotFound></NotFound>
</template>

<style lang="scss" scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  &-flag {
    font-size: 150px;
    font-weight: bold;
    border-right: 1px solid #000;
    padding-right: 14px;
    color: #000;
  }
  &-content {
    padding-left: 14px;
    text-align: left;
    max-width: 300px;
    display: flex;
    flex-direction: column;
    .title {
      &-header {
        font-size: 30px;
        font-weight: bold;
        line-height: 40px;
        margin-bottom: 10px;
        color: var(--el-color-primary);
      }
      &-text {
        font-size: 18px;
        line-height: 24px;
        color: var(--el-color-primary);
        margin-bottom: 10px;
      }
      &-tip {
        font-size: 13px;
        line-height: 20px;
        color: grey;
        margin-bottom: 10px;
      }
    }
  }
}
</style>
