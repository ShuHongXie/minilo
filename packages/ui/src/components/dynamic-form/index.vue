<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    :label-width="labelWidth"
    :class="bem('dynamic-form')"
    @submit.prevent
  >
    <!-- 栅格布局容器 -->
    <el-row :gutter="props.gutter || 20">
      <!-- 遍历JSON配置生成字段 -->
      <el-col
        v-for="(item, index) in filteredFormConfig"
        :key="item.prop || index"
        :span="item.span || 24"
        :offset="item.offset || 0"
      >
        <el-form-item
          :label="item.label"
          :prop="item.prop"
          :required="item.required || false"
          :rules="item.rules || []"
        >
          <!-- 优先渲染插槽：如果配置了slotName，使用具名插槽 -->
          <slot
            v-if="item.slotName"
            :name="item.slotName"
            :item="item"
            :formData="formData"
            :formRef="formRef"
          />

          <!-- 未配置插槽时，渲染默认控件 -->
          <template v-else>
            <!-- 输入框 -->
            <el-input
              v-if="item.type === 'input'"
              v-model="formData[item.prop]"
              :placeholder="item.placeholder || ''"
              :disabled="item.disabled || false"
              :type="item.inputType || 'text'"
              :maxlength="item.maxlength"
              show-word-limit
            />

            <!-- 下拉选择器 -->
            <el-select
              v-else-if="item.type === 'select'"
              v-model="formData[item.prop]"
              :placeholder="item.placeholder || ''"
              :disabled="item.disabled || false"
              :multiple="item.multiple || false"
            >
              <el-option
                v-for="option in item.options || []"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>

            <!-- 单选框组 -->
            <el-radio-group
              v-else-if="item.type === 'radio'"
              v-model="formData[item.prop]"
              :disabled="item.disabled || false"
            >
              <el-radio
                v-for="option in item.options || []"
                :key="option.value"
                :label="option.value"
              >
                {{ option.label }}
              </el-radio>
            </el-radio-group>

            <!-- 多选框组 -->
            <el-checkbox-group
              v-else-if="item.type === 'checkbox'"
              v-model="formData[item.prop]"
              :disabled="item.disabled || false"
            >
              <el-checkbox
                v-for="option in item.options || []"
                :key="option.value"
                :label="option.value"
              >
                {{ option.label }}
              </el-checkbox>
            </el-checkbox-group>

            <!-- 日期选择器 -->
            <el-date-picker
              v-else-if="item.type === 'date'"
              v-model="formData[item.prop]"
              :placeholder="item.placeholder || ''"
              :disabled="item.disabled || false"
              :type="item.dateType || 'date'"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />

            <!-- 开关 -->
            <el-switch
              v-else-if="item.type === 'switch'"
              v-model="formData[item.prop]"
              :disabled="item.disabled || false"
              :active-text="item.activeText || ''"
              :inactive-text="item.inactiveText || ''"
            />
          </template>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 表单操作按钮（可通过props控制显隐） -->
    <div :class="bem('dynamic-form', 'actions')" v-if="props.showActions">
      <el-button type="primary" @click="handleSubmit">提交</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElForm, ElMessage, type FormInstance } from 'element-plus'
import { bem } from '../../utils'

// 定义表单字段配置的TS类型（核心）
interface FormItemConfig {
  label: string // 字段标签
  prop: string // 字段唯一标识（对应formData的key）
  type: 'input' | 'select' | 'radio' | 'checkbox' | 'date' | 'switch' // 控件类型
  slotName?: string // 插槽名称（配置后优先渲染插槽）
  span?: number // 栅格跨度（默认24）
  offset?: number // 栅格偏移（默认0）
  required?: boolean // 是否必填
  placeholder?: string // 占位符
  disabled?: boolean // 是否禁用
  maxlength?: number // 输入框最大长度
  multiple?: boolean // 下拉选择是否多选
  inputType?: string // 输入框类型（text/password/number等）
  dateType?: string // 日期选择器类型（date/datetime/year等）
  activeText?: string // 开关激活文本
  inactiveText?: string // 开关未激活文本
  options?: Array<{ label: string; value: any }> // 选择类控件的选项
  rules?: any[] // 自定义校验规则
  visibleCondition?: (formData: Record<string, any>) => boolean // 字段显隐条件（联动）
}

// 组件Props定义
interface Props {
  formConfig: FormItemConfig[] // 核心：JSON表单配置
  initialData?: Record<string, any> // 表单初始值
  labelWidth?: string | number // 标签宽度
  gutter?: number // 栅格间距
  showActions?: boolean // 是否显示提交/重置按钮
}

// 组件Emits定义
const emit = defineEmits<{
  submit: [formData: Record<string, any>] // 提交事件：传递表单数据
  reset: [] // 重置事件
}>()

// 接收Props
const props = withDefaults(defineProps<Props>(), {
  labelWidth: '120px',
  gutter: 20,
  showActions: true,
  initialData: () => ({})
})

// 表单实例
const formRef = ref<FormInstance>()

// 表单数据（响应式）
const formData = reactive<Record<string, any>>({ ...props.initialData })

// 表单校验规则（合并配置中的rules）
const formRules = computed(() => {
  const rules: Record<string, any[]> = {}
  props.formConfig.forEach((item) => {
    if (item.required && !item.rules) {
      // 默认必填规则
      rules[item.prop] = [{ required: true, message: `请填写${item.label}`, trigger: 'blur' }]
    } else if (item.rules) {
      // 自定义规则
      rules[item.prop] = item.rules
    }
  })
  return rules
})

// 过滤后的表单配置（用于v-for，避免v-if和v-for混用）
const filteredFormConfig = computed(() => {
  return props.formConfig.filter((item) => isFieldVisible(item))
})

// 判断字段是否显示（支持联动）
const isFieldVisible = (item: FormItemConfig) => {
  if (item.visibleCondition) {
    return item.visibleCondition(formData)
  }
  return true
}

// 表单提交
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate() // 校验表单
    emit('submit', { ...formData }) // 触发提交事件，传递表单数据
    ElMessage.success('表单提交成功！')
  } catch (error) {
    ElMessage.error('表单校验失败，请检查必填项！')
    console.error('表单校验错误：', error)
  }
}

// 表单重置
const handleReset = () => {
  if (!formRef.value) return
  formRef.value.resetFields() // 重置表单字段
  Object.assign(formData, { ...props.initialData }) // 恢复初始值
  emit('reset') // 触发重置事件
  ElMessage.info('表单已重置！')
}

// 监听初始值变化（可选）
watch(
  () => props.initialData,
  (newVal) => {
    Object.assign(formData, newVal)
  },
  { deep: true }
)

// 暴露方法给父组件调用
defineExpose({
  formRef,
  formData,
  handleSubmit,
  handleReset,
  validate: () => formRef.value?.validate() // 暴露校验方法
})
</script>

<style scoped>
.ml-dynamic-form {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.ml-dynamic-form__actions {
  margin-top: 20px;
  text-align: center;
}

.ml-dynamic-form__actions button {
  margin: 0 8px;
}
</style>
