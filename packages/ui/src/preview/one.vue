<script setup lang="ts">
// import { onMounted, ref } from 'vue'
// import testSearch from './testSearch.vue'
// import testRangeInput from './testRangeInput.vue'
// import treeSelectDialog from './treeSelectDialog.vue'
// import dataImportWizard from './dataImportWizard.vue'
// import imageUploadPro from './imageUploadPro.vue'
// import testVirtualList from './testVirtualList.vue'
import { nextTick, onMounted, ref } from 'vue'
import testErrorMinitor from './testErrorMinitor.vue'
import { initRequestInstance } from '@minilo/utils'
import testSourceMap from './testSourceMap.vue'
</script>

<template>
  <div class="component-name">
    <router-link to="/two">to Two</router-link>
    <!-- <testSearch></testSearch> -->
    <!-- <testRangeInput></testRangeInput> -->
    <!-- <treeSelectDialog></treeSelectDialog> -->
    <!-- <imageUploadPro /> -->
    <!-- <testVirtualList /> -->
    <testErrorMinitor />
    <testSourceMap />
    <!-- <div class="source-map-viewer">{{ code }}</div> -->
    <!-- <prism-editor
      class="my-editor"
      v-model="code"
      :highlight="highlighter"
      readonly
      :line-numbers="true"
      ref="editorRef"
    >
    </prism-editor> -->
    <img src="../assets/t1.jpg" alt="" />
  </div>
</template>

<style lang="scss" scoped></style>
