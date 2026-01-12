export const searchProps = {
  slots: [],
  item: [
    {
      prop: 'nickname',
      formItemProps: {
        label: '用户昵称'
      },
      input: {
        type: 'input',
        props: {
          placeholder: '请输入用户昵称'
        }
      }
    },
    {
      prop: 'username',
      formItemProps: {
        label: '登录ID'
      },
      input: {
        type: 'input',
        props: {
          placeholder: '请输入登录ID'
        }
      }
    },
    {
      prop: 'telephone',
      formItemProps: {
        label: '联系电话'
      },
      input: {
        type: 'input',
        props: {
          placeholder: '请输入联系电话'
        }
      }
    },
    {
      prop: 'status',
      formItemProps: {
        label: '用户状态'
      },
      input: {
        type: 'select',
        props: {
          placeholder: '请选择状态',
          labelWidth: '140px',
          labelKey: 'label',
          valueKey: 'value',
          clearable: true,
          options: [
            {
              label: '停用',
              value: false
            },
            {
              label: '启用',
              value: true
            }
          ]
        }
      }
    }
  ]
}

// 表格字段
export const columns = ref([
  {
    type: 'selection'
  },
  {
    prop: 'index',
    label: '序号',
    align: 'center',
    type: 'index',
    width: 80
  },
  {
    prop: 'username',
    label: '账户名',
    align: 'center'
  },
  {
    prop: 'nickname',
    label: '用户昵称',
    align: 'center'
  },
  {
    prop: 'telephone',
    label: '手机号码',
    align: 'center'
  },
  {
    prop: 'status',
    label: '用户状态',
    align: 'center',
    slotName: 'status'
  },
  {
    prop: 'rolesName',
    label: '关联角色',
    align: 'center',
    render: (row: any) => {
      return <span>{row.rolesName.join(',')}</span>
    }
  },
  {
    prop: 'createTime',
    label: '创建时间',
    align: 'center',
    width: 180
  },
  {
    prop: 'operation',
    label: '操作',
    fixed: 'right',
    align: 'center',
    slotName: 'operation'
  }
])

// 编辑规则
export const formRules = ref({
  username: [
    {
      required: true,
      message: '请输入账户名',
      trigger: ['blur']
    }
  ],
  nickname: [
    {
      required: true,
      message: '请输入用户昵称',
      trigger: ['blur']
    }
  ],
  password: [
    {
      required: true,
      message: '请输入手机号码',
      trigger: ['blur']
    }
  ],
  // 邮箱验证规则
  email: [
    {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: '邮箱格式不正确（示例：xxx@xxx.com）',
      trigger: ['blur', 'change']
    }
  ],
  telephone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入有效的11位手机号码',
      trigger: ['blur', 'change']
    }
  ]
})
