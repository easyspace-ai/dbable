import { create } from 'zustand'
import { Field, Record, View, FieldType, ViewType } from './types'

interface TableState {
  // 数据
  fields: Field[]
  records: Record[]
  views: View[]
  currentViewId?: string
  
  // UI 状态
  selectedCells: { [key: string]: boolean }
  selectedRows: Set<string>
  selectedColumns: Set<string>
  isAddingField: boolean
  isAddingRecord: boolean
  contextMenu: {
    visible: boolean
    x: number
    y: number
    type: 'cell' | 'row' | 'column' | 'field'
    targetId?: string
  }
  
  // 操作
  addField: (field: Omit<Field, 'id'>) => void
  updateField: (fieldId: string, updates: Partial<Field>) => void
  deleteField: (fieldId: string) => void
  addRecord: (record: Omit<Record, 'id'>) => void
  updateRecord: (recordId: string, updates: Partial<Record>) => void
  deleteRecord: (recordId: string) => void
  addView: (view: Omit<View, 'id'>) => void
  updateView: (viewId: string, updates: Partial<View>) => void
  deleteView: (viewId: string) => void
  
  // UI 操作
  setSelectedCells: (cells: { [key: string]: boolean }) => void
  setSelectedRows: (rows: Set<string>) => void
  setSelectedColumns: (columns: Set<string>) => void
  setAddingField: (adding: boolean) => void
  setAddingRecord: (adding: boolean) => void
  showContextMenu: (x: number, y: number, type: 'cell' | 'row' | 'column' | 'field', targetId?: string) => void
  hideContextMenu: () => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const useTableStore = create<TableState>((set) => ({
  // 初始数据
  fields: [
    { id: '1', name: 'title', type: FieldType.Text, width: 200 },
    { id: '2', name: '数字', type: FieldType.Number, width: 150 }
  ],
  records: [
    { id: '1', title: 'foo', '数字': null },
    { id: '2', title: 'foo', '数字': null },
    { id: '3', title: 'foo', '数字': null },
    { id: '4', title: '', '数字': null },
    { id: '5', title: '', '数字': null },
    { id: '6', title: '', '数字': null }
  ],
  views: [
    { id: '1', name: 'New View', type: ViewType.Grid }
  ],
  currentViewId: '1',
  
  // UI 状态
  selectedCells: {},
  selectedRows: new Set(),
  selectedColumns: new Set(),
  isAddingField: false,
  isAddingRecord: false,
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    type: 'cell'
  },
  
  // 数据操作
  addField: (field) => {
    const newField = { ...field, id: generateId() }
    set((state) => ({
      fields: [...state.fields, newField]
    }))
  },
  
  updateField: (fieldId, updates) => {
    set((state) => ({
      fields: state.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }))
  },
  
  deleteField: (fieldId) => {
    set((state) => {
      const fieldToDelete = state.fields.find(f => f.id === fieldId)
      if (!fieldToDelete) return state
      
      return {
        ...state,
        fields: state.fields.filter(field => field.id !== fieldId),
        records: state.records.map(record => {
          const { [fieldToDelete.name]: removed, ...rest } = record
          return rest as Record
        })
      }
    })
  },
  
  addRecord: (record) => {
    const newRecord = { ...record, id: generateId() }
    set((state) => ({
      records: [...state.records, newRecord]
    }))
  },
  
  updateRecord: (recordId, updates) => {
    set((state) => ({
      records: state.records.map(record => 
        record.id === recordId ? { ...record, ...updates } : record
      )
    }))
  },
  
  deleteRecord: (recordId) => {
    set((state) => ({
      records: state.records.filter(record => record.id !== recordId)
    }))
  },
  
  addView: (view) => {
    const newView = { ...view, id: generateId() }
    set((state) => ({
      views: [...state.views, newView]
    }))
  },
  
  updateView: (viewId, updates) => {
    set((state) => ({
      views: state.views.map(view => 
        view.id === viewId ? { ...view, ...updates } : view
      )
    }))
  },
  
  deleteView: (viewId) => {
    set((state) => ({
      views: state.views.filter(view => view.id !== viewId)
    }))
  },
  
  // UI 操作
  setSelectedCells: (cells) => set({ selectedCells: cells }),
  setSelectedRows: (rows) => set({ selectedRows: rows }),
  setSelectedColumns: (columns) => set({ selectedColumns: columns }),
  setAddingField: (adding) => set({ isAddingField: adding }),
  setAddingRecord: (adding) => set({ isAddingRecord: adding }),
  
  showContextMenu: (x, y, type, targetId) => {
    set({
      contextMenu: {
        visible: true,
        x,
        y,
        type,
        targetId
      }
    })
  },
  
  hideContextMenu: () => {
    set({
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        type: 'cell'
      }
    })
  }
}))
