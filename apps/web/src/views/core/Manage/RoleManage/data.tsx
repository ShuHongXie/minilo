export const searchProps = {
  slots: [],
  span: 8,
  item: [
    {
      prop: 'roleName',
      formItemProps: {
        label: '角色名称'
      },
      input: {
        type: 'input',
        props: {
          placeholder: '请输入角色名称'
        }
      }
    },
    {
      prop: 'status',
      formItemProps: {
        label: '角色状态'
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
    },
    {
      prop: 'createTime',
      formItemProps: {
        label: '创建时间'
      },
      input: {
        type: 'date-picker',
        props: {
          type: 'daterange',
          startPlaceholder: '开始时间',
          endPlaceholder: '结束时间'
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
    prop: 'roleName',
    label: '角色名称',
    align: 'center'
  },
  {
    prop: 'status',
    label: '角色状态',
    align: 'center',
    slotName: 'status'
  },
  {
    prop: 'remark',
    label: '备注',
    align: 'center'
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
export const roleFormRules = ref({
  username: [
    {
      required: true,
      message: '请输入角色名',
      trigger: ['blur']
    }
  ]
})

// 菜单树设置
export const treeSettingSelect = ref([
  {
    label: '展开/折叠',
    id: 1,
    value: 'expand'
  },
  {
    label: '全选/全不选',
    id: 2,
    value: 'checkAll'
  },
  {
    label: '父子联动',
    id: 3,
    value: 'linkage'
  }
])

// 默认操作对象
export const defaultOperateItem = {
  roleName: '',
  menuIds: [],
  remark: '',
  roleSort: '',
  status: true
}
