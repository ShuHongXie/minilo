<script setup lang="ts">
import { onMounted, ref } from 'vue'
import testSearch from './preview/testSearch.vue'
import testRangeInput from './preview/testRangeInput.vue'
import treeSelectDialog from './preview/treeSelectDialog.vue'
import dataImportWizard from './preview/dataImportWizard.vue'
import imageUploadPro from './preview/imageUploadPro.vue'
import testVirtualList from './preview/testVirtualList.vue'
import { useScroll } from '@minilo/utils'

const { scrollPosition, isReached, checkThreshold, updateThreshold } = useScroll({
  container: window,
  initialThreshold: 100,
  onReach: (reached) => {
    console.log('滚动阈值到达状态:', reached)
  },
  direction: 'vertical',
  throttleTime: 200
})
</script>

<template>
  <div class="app-container">
    <!-- <testSearch></testSearch> -->
    <!-- <testRangeInput></testRangeInput> -->
    <!-- <treeSelectDialog></treeSelectDialog> -->
    <imageUploadPro />
    <!-- <testVirtualList /> -->
  </div>
</template>

<style lang="scss">
// @import './style/index.scss';
@use './style/index.scss' as *;
</style>
