<script setup lang="tsx">
import { Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type CheckboxValueType, type FormInstance } from 'element-plus'
import {
  searchProps,
  columns,
  roleFormRules,
  treeSettingSelect,
  defaultOperateItem
} from './data.tsx'
import { createRole, updateRole, deleteRole, getMenuTree } from '#/apis/sdk.gen'
import { cloneDeep } from '@minilo/utils'
import { useUserStore } from '@minilo/store'
import type { MlSearchTable } from '@minilo/ui'

const selectColumns = ref([])
const form = ref({})
const userStore = useUserStore()

// 基础配置----------------start-------------------

const handleSelect = (val: any) => {
  selectColumns.value = val
}

// 参数编辑
const paramsHandler = (params: any) => {
  params.startCreateDate = params.createTime ? params.createTime[0] : null
  params.endCreateDate = params.createTime ? params.createTime[1] : null
  return params
}
// 基础配置----------------end-------------------

// 新增编辑操作----------------start-------------------
const operateDialogVisible = ref(false)
const operateType = ref('add') // add 新增 edit 修改
const menuTree = ref<any>([])
const ruleFormRef = ref<FormInstance | null>(null)
const searchTableRef = ref<InstanceType<typeof MlSearchTable> | null>(null)
const switchLoading = ref(false)
const currentOperateItem = ref<any>(cloneDeep(defaultOperateItem))
const treeRef = ref<any>()
const settingCheckedList = ref(['expand'])

// 获取菜单树
const loadMenuTree = () => {
  getMenuTree().then((res) => {
    menuTree.value = res.data
  })
}

// 树型菜单选中
const handleCheckedTree = (checkedNodes: any, checkedKeys: any) => {
  currentOperateItem.value.menuIds = checkedKeys.checkedKeys
}

// 1. 递归收集所有节点的 key（id）
const getAllNodeKeys = (data: any, keys = [] as any) => {
  data.forEach((node: any) => {
    keys.push(node.id) // 收集当前节点的 key
    if (node.children && node.children.length) {
      getAllNodeKeys(node.children, keys) // 递归处理子节点
    }
  })
  return keys
}

// 全选：勾选所有节点
const checkAll = () => {
  const allKeys = getAllNodeKeys(menuTree.value)
  treeRef.value?.setCheckedKeys(allKeys) // 批量设置勾选
  currentOperateItem.value.menuIds = allKeys
}

// 取消全选：清空所有勾选
const uncheckAll = () => {
  treeRef.value?.setCheckedKeys([]) // 传入空数组取消所有勾选
  currentOperateItem.value.menuIds = []
}

// 树形菜单树形设置
const handleChangeMenuProps = (key: string, value: any) => {
  console.log(key, value)

  if (key === 'expand') {
    if (value) {
      const nodes = treeRef.value?.store._getAllNodes()
      nodes.forEach((item: { expanded: boolean }) => {
        item.expanded = true
      })
    } else {
      const nodes = treeRef.value?.store._getAllNodes()
      nodes.forEach((item: { expanded: boolean }) => {
        item.expanded = false
      })
    }
  }

  if (key === 'checkAll') {
    if (value) {
      checkAll()
    } else {
      uncheckAll()
    }
  }
}

// 启动/禁用
const handleSwitchChange = (row: any) => {
  currentOperateItem.value = row
  switchLoading.value = true
  updateRole({
    path: {
      id: row.id
    },
    body: {
      status: row.status
    }
  })
    .then(() => {
      ElMessage.success(`角色${!row.status ? '停用' : '启用'}成功`)
      operateDialogVisible.value = false
      currentOperateItem.value = cloneDeep(defaultOperateItem)
      searchTableRef.value?.handleSearch()
    })
    .finally(() => {
      switchLoading.value = false
    })
}

// 操作
const handleOperate = (type: string, row?: any) => {
  operateType.value = type
  operateDialogVisible.value = true
  if (type === 'edit') {
    currentOperateItem.value = row
  } else {
    currentOperateItem.value = cloneDeep(defaultOperateItem)
  }
}

// 确认修改/编辑
const confirm = async (formEl: FormInstance | null) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      if (operateType.value === 'add') {
        createRole({
          body: currentOperateItem.value
        })
          .then((res: any) => {
            ElMessage.success(res.msg || '角色创建成功')
            operateDialogVisible.value = false
            console.log(searchTableRef.value)
            currentOperateItem.value = cloneDeep(defaultOperateItem)
            searchTableRef.value?.handleSearch()
          })
          .catch((err) => {
            console.log('error:', err)
          })
      } else {
        updateRole({
          path: {
            id: currentOperateItem.value.id
          },
          body: currentOperateItem.value
        }).then((res: any) => {
          ElMessage.success(res.msg || '角色更新成功')
          operateDialogVisible.value = false
          currentOperateItem.value = cloneDeep(defaultOperateItem)
          searchTableRef.value?.handleSearch()
        })
      }
    } else {
      console.log('error submit!', fields)
    }
  })
}

// 删除角色
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除角色【${row.roleName}】?`, 'Warning', {
    type: 'warning'
  }).then(() => {
    deleteRole({
      path: {
        id: row.id
      }
    }).then((res: any) => {
      ElMessage.success(res.msg)
      searchTableRef.value?.handleSearch()
    })
  })
}

const reset = () => {
  console.log('重置')
}

// 新增编辑操作----------------end-------------------

onMounted(() => {
  loadMenuTree()
})
</script>

<template>
  <div class="user-manage">
    <MlSearchTable
      v-model:search="form"
      url="/api/role/rolesByPage"
      :headers="{ Authorization: `Bearer ${userStore.token}` }"
      ref="searchTableRef"
      :columns="columns"
      :search-props="searchProps"
      :table-props="{
        showOverflowTooltip: true
      }"
      :params-handler="paramsHandler"
      @reset="reset"
      @select-all="handleSelect"
      @select="handleSelect"
    >
      <template #status="scope">
        <el-switch
          @click="handleSwitchChange(scope.row)"
          v-model="scope.row.status"
          :loading="currentOperateItem.id === scope.row.id && switchLoading"
          style="--el-switch-on-color: var(--el-color-primary)"
          inline-prompt
          :active-value="true"
          :inactive-value="false"
          active-text="启用"
          inactive-text="停用"
        />
      </template>
      <template #operation="scope">
        <el-space>
          <el-link type="primary" @click="handleOperate('edit', scope.row)">编辑</el-link>
          <el-link type="primary" @click="handleDelete(scope.row)">删除</el-link>
        </el-space>
      </template>
      <template #prefix>
        <div>
          <el-button type="primary" :icon="Plus" @click="handleOperate('add')">新增</el-button>
        </div>
      </template>
    </MlSearchTable>
    <el-dialog
      v-model="operateDialogVisible"
      @close="currentOperateItem = {}"
      :title="operateType === 'add' ? '新增角色' : '修改角色'"
      width="500"
      destroy-on-close
    >
      <el-form
        ref="ruleFormRef"
        :rules="roleFormRules"
        :model="currentOperateItem"
        label-width="90px"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item prop="roleName" label="角色名:">
              <el-input clearable v-model="currentOperateItem.roleName" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="角色状态:">
              <el-radio-group v-model="currentOperateItem.status">
                <el-radio :value="true">正常</el-radio>
                <el-radio :value="false">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="角色顺序:">
              <el-input-number
                clearable
                v-model.number="currentOperateItem.roleSort"
                :min="1"
                :max="999"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注:">
              <el-input
                style="width: 100%"
                clearable
                v-model.number="currentOperateItem.remark"
                type="textarea"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="选择菜单:">
              <div class="tree-container">
                <el-checkbox-group v-model="settingCheckedList">
                  <el-checkbox
                    v-for="item in treeSettingSelect"
                    :key="item.id"
                    :label="item.label"
                    :value="item.value"
                    @change="(value: CheckboxValueType) => handleChangeMenuProps(item.value, value)"
                  />
                </el-checkbox-group>
                <div class="tree-container__content">
                  <el-tree
                    @check="handleCheckedTree"
                    ref="treeRef"
                    style="max-width: 600px"
                    :data="menuTree"
                    :default-checked-keys="currentOperateItem?.menuIds"
                    show-checkbox
                    default-expand-all
                    :check-strictly="!settingCheckedList.includes('linkage')"
                    node-key="id"
                    :props="{
                      children: 'children',
                      label: 'name'
                    }"
                  />
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="operateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirm(ruleFormRef)">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.user-manage {
  height: 100%;
  padding: 10px;
}
.tree-container {
  width: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  &__content {
    flex: 1;
    border: 1px solid #dcdfe6;
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
  }
}
</style>
