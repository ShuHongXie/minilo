<script setup lang="tsx">
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import OperationDialog from './components/operationDialog.vue'
import { searchProps, columns, defaultOperateItem, MenuType, menuTypeData } from './data.tsx'
import { createMenu, deleteMenu, updateMenu, getMenuTree } from '#/apis/sdk.gen'
import { cloneDeep } from '@minilo/utils'
import { useUserStore } from '@minilo/store'
import type { Menu } from '#/apis/types.gen.ts'
import type { MlSearchTable } from '@minilo/ui'

const userStore = useUserStore()

// 搜索表单---------------start-------------------
const form = ref({})
// 搜索表单---------------end-------------------

// 新增编辑操作----------------start-------------------
const operateDialogVisible = ref(false)
const operateType = ref('add') // add 新增 edit 修改
const menuTree = ref<Menu[]>([])
const searchTableRef = ref<InstanceType<typeof MlSearchTable> | null>(null)
const currentOperateItem = ref<Menu>(cloneDeep(defaultOperateItem))

// 获取菜单树
const loadMenuTree = () => {
  getMenuTree().then((res) => {
    res.data?.forEach((item: Menu) => {
      if (!item.parentId) {
        item.parentId = -1
      }
    })
    menuTree.value = [{ id: -1, name: '顶层菜单', children: res.data }]
    console.log(menuTree.value)
  })
}
// 操作
const handleOperate = (type: string, row?: any) => {
  if (type === 'edit') {
    currentOperateItem.value = {
      ...row,
      parentId: row.parentId ? row.parentId : -1
    }
    console.log(currentOperateItem.value)
  } else {
    currentOperateItem.value = row
      ? cloneDeep({
          ...defaultOperateItem,
          parentId: row.id
        })
      : cloneDeep(defaultOperateItem)
  }
  console.log(currentOperateItem.value)

  operateType.value = type
  operateDialogVisible.value = true
}

// 确认修改/编辑
const confirm = async () => {
  if (operateType.value === 'add') {
    createMenu({
      body: currentOperateItem.value
    }).then((res: any) => {
      ElMessage.success(res.msg)
      operateDialogVisible.value = false
      console.log(searchTableRef.value)
      currentOperateItem.value = cloneDeep(defaultOperateItem)
      searchTableRef.value?.handleSearch()
      loadMenuTree()
    })
  } else {
    updateMenu({
      path: {
        id: currentOperateItem.value.id as number
      },
      body: {
        ...currentOperateItem.value,
        parentId:
          currentOperateItem.value.parentId === -1 ? null : currentOperateItem.value.parentId
      }
    }).then((res: any) => {
      ElMessage.success(res.msg)
      operateDialogVisible.value = false
      currentOperateItem.value = cloneDeep(defaultOperateItem)
      searchTableRef.value?.handleSearch()
      loadMenuTree()
    })
  }
}

// 删除菜单
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除${menuTypeData[row.menuType]}【${row.name}】?`, 'Warning', {
    type: 'warning'
  }).then(() => {
    deleteMenu({
      path: {
        id: row.id
      }
    }).then((res: any) => {
      ElMessage.success(res.msg)
      searchTableRef.value?.handleSearch()
    })
  })
}

// 新增编辑操作----------------end---------------------

onMounted(() => {
  loadMenuTree()
})
</script>

<template>
  <div class="menu-manage">
    <MlSearchTable
      v-model:search="form"
      url="/api/menu/info"
      :headers="{ Authorization: `Bearer ${userStore.token}` }"
      ref="searchTableRef"
      :columns="columns"
      :search-props="searchProps"
      :show-pagination="false"
      response-data-field="data"
      :table-props="{
        showOverflowTooltip: true,
        highlightCurrentRow: true,
        defaultExpandAll: true,
        rowKey: 'id'
      }"
    >
      <template #operation="scope">
        <el-space>
          <el-link
            type="primary"
            v-if="scope.row.menuType !== MenuType['按钮']"
            @click="handleOperate('add', scope.row)"
            >新增</el-link
          >
          <el-link type="primary" @click="handleOperate('edit', scope.row)">编辑</el-link>
          <el-link type="danger" @click="handleDelete(scope.row)">删除</el-link>
        </el-space>
      </template>
      <template #prefix>
        <div>
          <el-button type="primary" :icon="Plus" @click="handleOperate('add')">新增</el-button>
        </div>
      </template>
    </MlSearchTable>
    <OperationDialog
      v-model:visible="operateDialogVisible"
      v-model:form="currentOperateItem"
      :type="operateType"
      :menu-list="menuTree"
      @confirm="confirm"
    ></OperationDialog>
  </div>
</template>

<style lang="scss" scoped>
.menu-manage {
  height: 100%;
  padding: 10px;
}
</style>
