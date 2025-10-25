// 基础类型定义
export interface Field {
  id: string
  name: string
  type: FieldType
  width?: number
  required?: boolean
  options?: any
}

export enum FieldType {
  Text = 'text',
  Number = 'number',
  Select = 'select',
  MultiSelect = 'multi-select',
  Date = 'date',
  Checkbox = 'checkbox',
  URL = 'url',
  Email = 'email',
  Phone = 'phone',
  Attachment = 'attachment',
  LongText = 'long-text',
  Rating = 'rating',
  Formula = 'formula',
  Lookup = 'lookup',
  Rollup = 'rollup',
  Count = 'count',
  CreatedTime = 'created-time',
  LastModifiedTime = 'last-modified-time',
  CreatedBy = 'created-by',
  LastModifiedBy = 'last-modified-by',
  AutoNumber = 'auto-number',
  Barcode = 'barcode',
  Button = 'button'
}

export interface Record {
  id: string
  [key: string]: any
}

export interface View {
  id: string
  name: string
  type: ViewType
  properties?: any
}

export enum ViewType {
  Grid = 'grid',
  Gallery = 'gallery',
  Kanban = 'kanban',
  Calendar = 'calendar',
  Timeline = 'timeline',
  Gantt = 'gantt',
  Form = 'form'
}

export interface TableData {
  fields: Field[]
  records: Record[]
  views: View[]
  currentViewId?: string
}

// 表格操作类型
export interface TableOperations {
  addField: (field: Omit<Field, 'id'>) => void
  updateField: (fieldId: string, updates: Partial<Field>) => void
  deleteField: (fieldId: string) => void
  addRecord: (record: Omit<Record, 'id'>) => void
  updateRecord: (recordId: string, updates: Partial<Record>) => void
  deleteRecord: (recordId: string) => void
  addView: (view: Omit<View, 'id'>) => void
  updateView: (viewId: string, updates: Partial<View>) => void
  deleteView: (viewId: string) => void
}

// 上下文菜单项
export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  separator?: boolean
}

// 字段配置
export interface FieldConfig {
  name: string
  type: FieldType
  required?: boolean
  options?: any
}
