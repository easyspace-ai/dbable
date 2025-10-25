import React, { useCallback, useMemo, useRef } from 'react'
import DataEditor, {
  type DataEditorProps,
  type DataEditorRef,
  type GridCell,
  type GridColumn,
  type Item,
  GridCellKind
} from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'
import { useTableStore } from '../store'
import { FieldType } from '../types'
// import { FieldIcon } from './FieldIcon'
import { ContextMenu } from './ContextMenu'

interface DataGridProps {
  className?: string
  height?: number
  width?: number
}

export const DataGrid: React.FC<DataGridProps> = ({ 
  className = '',
  height = 400,
  width = 800
}) => {
  const gridRef = useRef<DataEditorRef>(null)
  const { 
    fields, 
    records, 
    contextMenu,
    showContextMenu,
    hideContextMenu,
    updateRecord,
    addRecord
  } = useTableStore()

  // 生成列配置
  const columns: GridColumn[] = useMemo(() => {
    return fields.map(field => ({
      id: field.id,
      title: field.name,
      width: field.width || 200,
      hasMenu: true
    }))
  }, [fields])

  // 获取单元格内容
  const getCellContent = useCallback(([col, row]: Item): GridCell => {
    const field = fields[col]
    const record = records[row]
    
    if (!field || !record) {
      return {
        kind: GridCellKind.Text,
        data: '',
        displayData: '',
        allowOverlay: true,
        readonly: false
      }
    }

    const value = record[field.name]
    
    // 根据字段类型返回不同的单元格类型
    switch (field.type) {
      case FieldType.Number:
        return {
          kind: GridCellKind.Number,
          data: value || 0,
          displayData: value?.toString() || '',
          allowOverlay: true,
          readonly: false
        }
      
      case FieldType.Checkbox:
        return {
          kind: GridCellKind.Boolean,
          data: !!value,
          allowOverlay: false,
          readonly: false
        }
      
      case FieldType.URL:
        return {
          kind: GridCellKind.Uri,
          data: value || '',
          displayData: value || '',
          allowOverlay: false,
          onClickUri: () => {
            if (value) window.open(value, '_blank')
          }
        }
      
      case FieldType.Email:
        return {
          kind: GridCellKind.Uri,
          data: value || '',
          displayData: value || '',
          allowOverlay: false,
          onClickUri: () => {
            if (value) window.open(`mailto:${value}`)
          }
        }
      
      default:
        return {
          kind: GridCellKind.Text,
          data: value || '',
          displayData: value || '',
          allowOverlay: true,
          allowWrapping: true,
          readonly: false
        }
    }
  }, [fields, records])

  // 单元格编辑
  const onCellEdited = useCallback(([col, row]: Item, newValue: GridCell) => {
    const field = fields[col]
    const record = records[row]
    
    if (!field || !record) return

    let parsedValue: any = 'data' in newValue ? newValue.data : ''

    // 根据字段类型解析值
    switch (field.type) {
      case FieldType.Number:
        parsedValue = typeof parsedValue === 'number' ? parsedValue : Number(parsedValue) || 0
        break
      case FieldType.Checkbox:
        parsedValue = !!parsedValue
        break
      default:
        parsedValue = parsedValue
    }

    updateRecord(record.id, {
      [field.name]: parsedValue
    })
  }, [fields, records, updateRecord])

  // 添加新行
  const onRowAppended = useCallback(() => {
    const newRecord: Record<string, any> = {}
    fields.forEach(field => {
      newRecord[field.name] = field.type === FieldType.Number ? 0 : ''
    })
    addRecord(newRecord)
  }, [fields, addRecord])

  // 列头点击（显示上下文菜单）
  const onHeaderClicked = useCallback((col: number, event: any) => {
    event.preventDefault()
    const field = fields[col]
    if (field) {
      showContextMenu(event.bounds.x, event.bounds.y, 'field', field.id)
    }
  }, [fields, showContextMenu])

  // 单元格右键菜单
  // const onCellContextMenu = useCallback(([col, row]: Item, event: any) => {
  //   event.preventDefault()
  //   const field = fields[col]
  //   const record = records[row]
  //   
  //   if (field && record) {
  //     showContextMenu(event.clientX, event.clientY, 'cell', `${field.id}-${record.id}`)
  //   }
  // }, [fields, records, showContextMenu])

  const config: DataEditorProps = {
    width,
    height,
    columns,
    rows: records.length,
    getCellContent,
    onCellEdited,
    onRowAppended,
    onHeaderClicked,
    // onCellContextMenu, // 暂时注释掉，因为 glide-data-grid 可能不支持这个属性
    rowMarkers: 'both',
    smoothScrollX: true,
    smoothScrollY: true,
    keybindings: {
      search: true
    }
  }

  return (
    <div className={`relative ${className}`}>
      <DataEditor
        ref={gridRef}
        {...config}
      />
      
      {/* 上下文菜单 */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          targetId={contextMenu.targetId}
          onClose={hideContextMenu}
        />
      )}
    </div>
  )
}
