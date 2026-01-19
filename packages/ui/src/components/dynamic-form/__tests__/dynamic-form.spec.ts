import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import MlDynamicForm from '../index.vue'
import { ElForm, ElInput, ElSelect, ElButton } from 'element-plus'

describe('MlDynamicForm', () => {
  // 测试表单配置
  const formConfig = [
    {
      label: '用户名',
      prop: 'username',
      type: 'input',
      required: true,
      placeholder: '请输入用户名'
    },
    {
      label: '密码',
      prop: 'password',
      type: 'input',
      inputType: 'password',
      required: true,
      placeholder: '请输入密码'
    },
    {
      label: '性别',
      prop: 'gender',
      type: 'select',
      required: true,
      placeholder: '请选择性别',
      options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' }
      ]
    }
  ]

  // 测试初始数据
  const initialData = {
    username: 'test',
    password: '',
    gender: ''
  }

  describe('props', () => {
    it('正确渲染默认属性', () => {
      const wrapper = mount(MlDynamicForm, {
        props: {
          formConfig,
          initialData
        }
      })

      expect(wrapper.props('formConfig')).toEqual(formConfig)
      expect(wrapper.props('initialData')).toEqual(initialData)
      expect(wrapper.props('labelWidth')).toBe('120px')
      expect(wrapper.props('gutter')).toBe(20)
      expect(wrapper.props('showActions')).toBe(true)
    })

    it('接受自定义属性', () => {
      const wrapper = mount(MlDynamicForm, {
        props: {
          formConfig,
          initialData,
          labelWidth: '150px',
          gutter: 30,
          showActions: false
        }
      })

      expect(wrapper.props('labelWidth')).toBe('150px')
      expect(wrapper.props('gutter')).toBe(30)
      expect(wrapper.props('showActions')).toBe(false)
    })
  })

  describe('渲染', () => {
    it('正确渲染表单字段', () => {
      const wrapper = mount(MlDynamicForm, {
        props: {
          formConfig,
          initialData
        }
      })

      // 检查是否渲染了ElForm
      expect(wrapper.findComponent({ name: 'ElForm' }).exists()).toBe(true)

      // 检查是否渲染了输入框
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      expect(inputs).toHaveLength(2)

      // 检查是否渲染了选择器
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      expect(selects).toHaveLength(1)

      // 检查是否渲染了操作按钮
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      expect(buttons).toHaveLength(2)
    })

    it('当showActions为false时不渲染操作按钮', () => {
      const wrapper = mount(MlDynamicForm, {
        props: {
          formConfig,
          initialData,
          showActions: false
        }
      })

      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      expect(buttons).toHaveLength(0)
    })

    it('正确设置表单初始值', () => {
      const wrapper = mount(MlDynamicForm, {
        props: {
          formConfig,
          initialData
        }
      })

      // 检查用户名输入框的值
      const usernameInput = wrapper.findComponent({ name: 'ElInput' })
      expect(usernameInput.props('modelValue')).toBe('test')
    })
  })

  describe('事件', () => {
    it('触发提交事件', async () => {
      const wrapper = mount(MlDynamicForm, {
        props: {
          formConfig,
          initialData
        }
      })

      // 填写表单数据
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[1].setValue('123456')

      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[0].setValue('male')

      // 点击提交按钮
      const submitButton = wrapper.findAllComponents({ name: 'ElButton' })[0]
      await submitButton.trigger('click')

      // 检查是否触发了submit事件
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')).toHaveLength(1)
    })

    it('触发重置事件', async () => {
      const wrapper = mount(MlDynamicForm, {
        props: {
          formConfig,
          initialData
        }
      })

      // 填写表单数据
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[1].setValue('123456')

      // 点击重置按钮
      const resetButton = wrapper.findAllComponents({ name: 'ElButton' })[1]
      await resetButton.trigger('click')

      // 检查是否触发了reset事件
      expect(wrapper.emitted('reset')).toBeTruthy()
      expect(wrapper.emitted('reset')).toHaveLength(1)
    })
  })

  describe('方法', () => {
    it('暴露的方法可被调用', () => {
      const wrapper = mount(MlDynamicForm, {
        props: {
          formConfig,
          initialData
        }
      })

      // 检查是否暴露了方法
      expect(wrapper.vm.formRef).toBeDefined()
      expect(wrapper.vm.formData).toBeDefined()
      expect(wrapper.vm.handleSubmit).toBeDefined()
      expect(wrapper.vm.handleReset).toBeDefined()
      expect(wrapper.vm.validate).toBeDefined()
    })
  })

  describe('字段显隐', () => {
    it('根据visibleCondition过滤字段', () => {
      const dynamicFormConfig = [
        {
          label: '用户名',
          prop: 'username',
          type: 'input',
          required: true,
          placeholder: '请输入用户名'
        },
        {
          label: '密码',
          prop: 'password',
          type: 'input',
          inputType: 'password',
          required: true,
          placeholder: '请输入密码',
          visibleCondition: (formData: any) => formData.username === 'admin'
        }
      ]

      const wrapper = mount(MlDynamicForm, {
        props: {
          formConfig: dynamicFormConfig,
          initialData: { username: 'test' }
        }
      })

      // 初始状态下，密码字段应该不可见
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      expect(inputs).toHaveLength(1)
    })
  })
})
