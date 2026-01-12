<script setup lang="tsx">
import { Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { searchProps, columns, formRules } from './data'
import { getRolesList, createUserByAdmin, updateUser, deleteUser } from '#/apis/sdk.gen'
import { cloneDeep } from '@minilo/utils'
import { useUserStore } from '@minilo/store'
import type { GetRoleListDto } from '#/apis/types.gen'
import type { MlSearchTable } from '@minilo/ui'

// 扩展GetRoleListDto类型，添加id字段
type RoleListItem = GetRoleListDto & { id: number }

const defaultOperateItem = {
  username: '',
  password: '',
  nickname: '',
  telephone: '',
  email: '',
  status: true,
  rolesId: []
}

const selectColumns = ref([])
const form = ref({})
const userStore = useUserStore()

// 基础配置----------------start-------------------
const handleSelect = (val: any) => {
  selectColumns.value = val
}
// 基础配置----------------end-------------------

// 新增编辑操作----------------start-------------------

const operateDialogVisible = ref(false)
const operateType = ref('add') // 1 新增 2 修改
const rolesList = ref<RoleListItem[]>([])
const ruleFormRef = ref<FormInstance | null>(null)
const searchTableRef = ref<InstanceType<typeof MlSearchTable> | null>(null)
const switchLoading = ref(false)
const currentOperateItem = ref<any>(defaultOperateItem)

// 获取所有角色列表
const loadRoleList = () => {
  getRolesList().then((res) => {
    rolesList.value = res.data as RoleListItem[]
  })
}

// 启动/禁用
const handleSwitchChange = (row: any) => {
  currentOperateItem.value = row
  switchLoading.value = true
  updateUser({
    body: currentOperateItem.value
  })
    .then(() => {
      ElMessage.success(`用户${!row.status ? '停用' : '启用'}成功`)
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

const confirm = async (formEl: FormInstance | null) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      if (operateType.value === 'add') {
        createUserByAdmin({
          body: currentOperateItem.value
        }).then((res: any) => {
          ElMessage.success(res.msg || '用户创建成功')
          operateDialogVisible.value = false
          console.log(searchTableRef.value)
          currentOperateItem.value = cloneDeep(defaultOperateItem)
          searchTableRef.value?.handleSearch()
        })
      } else {
        updateUser({
          body: currentOperateItem.value
        }).then((res: any) => {
          ElMessage.success(res.msg || '用户更新成功')
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
  ElMessageBox.confirm(`确认删除账户【${row.username}】?`, 'Warning', {
    type: 'warning'
  }).then(() => {
    deleteUser({
      path: { userId: row.id }
    }).then((res: any) => {
      ElMessage.success(res.msg)
      searchTableRef.value?.handleSearch()
    })
  })
}

const reset = () => {
  console.log('重置')
}

onMounted(() => {
  loadRoleList()
})
// 新增编辑操作----------------end-------------------
</script>

<template>
  <div class="user-manage">
    <MlSearchTable
      v-model:search="form"
      url="/api/user/list"
      :headers="{ Authorization: `Bearer ${userStore.token}` }"
      ref="searchTableRef"
      :columns="columns"
      :search-props="searchProps"
      @reset="reset"
      @select-all="handleSelect"
      @select="handleSelect"
      v-permission="'sys:user:list'"
    >
      <template #status="scope">
        <el-switch
          v-permission.disable="'sys:user:edit'"
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
          <el-link
            v-permission="'sys:user:edit'"
            type="primary"
            @click="handleOperate('edit', scope.row)"
            >编辑</el-link
          >
          <el-link v-permission="'sys:user:del'" type="primary" @click="handleDelete(scope.row)"
            >删除</el-link
          >
        </el-space>
      </template>
      <template #prefix>
        <div>
          <el-button type="primary" :icon="Plus" @click="handleOperate('add')">新增</el-button>
        </div>
      </template>
    </MlSearchTable>
    <!-- 新增编辑用户 -->
    <el-dialog
      v-model="operateDialogVisible"
      @close="currentOperateItem = {}"
      :title="operateType === 'add' ? '新增用户' : '修改用户'"
      width="700"
    >
      <el-form ref="ruleFormRef" :rules="formRules" :model="currentOperateItem" label-width="90px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="username" label="账户:">
              <el-input clearable v-model="currentOperateItem.username" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="operateType === 'add'">
            <el-form-item prop="password" label="密码:">
              <el-input
                clearable
                v-model="currentOperateItem.password"
                type="password"
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="nickname" label="用户昵称:">
              <el-input clearable v-model="currentOperateItem.nickname" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="telephone" label="手机号码:">
              <el-input clearable v-model="currentOperateItem.telephone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="email" label="邮箱地址:">
              <el-input clearable v-model="currentOperateItem.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户状态:">
              <el-radio-group v-model="currentOperateItem.status">
                <el-radio :value="1">正常</el-radio>
                <el-radio :value="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="选择角色:">
              <el-select
                v-model="currentOperateItem.rolesId"
                multiple
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option
                  v-for="item in rolesList"
                  :key="item.id"
                  :label="item.roleName"
                  :value="item.id"
                />
              </el-select>
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
</style>
