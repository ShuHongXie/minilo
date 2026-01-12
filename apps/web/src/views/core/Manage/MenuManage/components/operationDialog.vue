<script setup lang="ts">
import { cloneDeep } from '@minilo/utils'
import {
  menuFormRules,
  menuTypeOptions,
  menuTypeData,
  defaultOperateItem,
  MenuType
} from '../data.tsx'
import type { FormInstance } from 'element-plus'
import type { Menu } from '#/apis/types.gen.ts'

defineProps({
  menuList: Array,
  type: {
    type: String,
    default: 'add'
  }
})

const emit = defineEmits(['confirm'])
const ruleFormRef = ref<FormInstance | null>(null)
const visible = defineModel<boolean>('visible', { default: false })
const form = defineModel<Menu>('form', {
  default: () => cloneDeep(defaultOperateItem)
})

// 确认提交
const handleSubmit = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate((valid, fields) => {
    if (valid) {
      emit('confirm')
    } else {
      console.log('校验出错!', fields)
    }
  })
}

// 菜单类型切换
const changeMenuType = (value: string | number | boolean | undefined): void => {
  form.value.permission = ''
  // 添加类型检查，确保value不为undefined再进行比较
  if ((value as number) === MenuType['按钮']) {
    form.value.component = ''
    form.value.path = ''
    if (form.value.meta) {
      form.value.meta.icon = ''
      form.value.meta.title = ''
      form.value.meta.orderNum = 0
    }
  }
}

// 菜单名称同步
const handleChangeMenuName = (value: string) => {
  if (form.value.menuType === MenuType['菜单'] && form.value.meta) {
    form.value.meta.title = value
  }
}
</script>

<template>
  <!-- 新增编辑菜单 -->
  <el-dialog v-model="visible" :title="type === 'add' ? '新增菜单' : '修改菜单'" width="700">
    <el-form ref="ruleFormRef" :rules="menuFormRules" :model="form" label-width="90px">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item prop="parentId" label="父级菜单:">
            <el-tree-select
              v-model="form.parentId"
              :data="menuList"
              check-strictly
              node-key="id"
              :props="{
                label: 'name'
              }"
              default-expand-all
              :render-after-expand="false"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="password" label="菜单类型:">
            <el-radio-group v-model="form.menuType" @change="changeMenuType">
              <el-radio :value="item.value" v-for="item in menuTypeOptions" :key="item.value">{{
                item.label
              }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="meta.icon" label="页面图标:">
            <div class="icon-input">
              <el-input
                :disabled="form.menuType === MenuType['按钮']"
                clearable
                v-model="form.meta!.icon"
              />
              <el-link
                type="primary"
                underline="never"
                href="https://icon-sets.iconify.design/"
                target="_blank"
                >复制iconify图标</el-link
              >
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="name" :label="`${menuTypeData[form.menuType as number]}名称:`">
            <el-input @input="handleChangeMenuName" clearable v-model="form.name" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="meta.orderNum" label="排序:">
            <el-input
              :disabled="form.menuType === MenuType['按钮']"
              clearable
              v-model.number="form.meta!.orderNum"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="component" label="组件名称:">
            <el-input
              :disabled="form.menuType === MenuType['按钮']"
              clearable
              v-model="form.component"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            v-if="form.menuType === MenuType['按钮']"
            prop="permission"
            label="权限标识:"
          >
            <el-input
              clearable
              v-model="form.permission"
              placeholder="遵循规范：模块:功能:操作，比如sys:user:add"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="path" label="路由跳转地址:" label-width="120px">
            <el-input
              :disabled="form.menuType === MenuType['按钮']"
              clearable
              v-model="form.path"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="`${menuTypeData[form.menuType as number]}状态:`">
            <el-radio-group v-model="form.status">
              <el-radio :value="true">正常</el-radio>
              <el-radio :value="false">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <!-- 菜单为菜单时专属 -->
        <template v-if="form.menuType === MenuType['菜单']">
          <el-col :span="12">
            <el-form-item prop="title" label="页面标题:">
              <el-input clearable disabled v-model="form.meta!.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="meta.isCache" label="是否缓存组件:" label-width="120px">
              <el-radio-group v-model="form.meta!.isCache">
                <el-radio :value="true">是</el-radio>
                <el-radio :value="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              prop="meta.showInBreadcrumb"
              label="是否显示在面包栏:"
              label-width="130px"
            >
              <el-radio-group v-model="form.meta!.showInBreadcrumb">
                <el-radio :value="true">是</el-radio>
                <el-radio :value="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="meta.showInTab" label="是否显示标签栏:" label-width="120px">
              <el-radio-group v-model="form.meta!.showInTab">
                <el-radio :value="true">是</el-radio>
                <el-radio :value="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </template>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
@use '@minilo/core/styles' as *;
.icon-input {
  width: 100%;
  gap: 10px;
  @include flex-start-center(nowrap, 10);
  .el-link {
    min-width: 200px;
    flex: 1;
    display: inline-block;
  }
}
</style>
