import React from 'react'
import { DataGrid } from './DataGrid'
import { ViewToolbar } from './ViewToolbar'
import { FieldEditor } from './FieldEditor'
import { useTableStore } from '../store'

interface AirtableDemoProps {
  className?: string
  height?: number
  width?: number
}

export const AirtableDemo: React.FC<AirtableDemoProps> = ({
  className = '',
  height = 600,
  width = 1200
}) => {
  const { isAddingField, setAddingField } = useTableStore()

  const handleFieldSave = (field: { name: string; type: any; width: number }) => {
    // 这里会调用 store 的 addField 方法
    console.log('Saving field:', field)
    setAddingField(false)
  }

  return (
    <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
      {/* 工具栏 */}
      <ViewToolbar />
      
      {/* 数据表格 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <DataGrid 
          height={height - 60} // 减去工具栏高度
          width={width}
          trailingRowOptions={{
            hint: 'New row...',
            sticky: true,
            tint: true
          }}
        />
      </div>

      {/* 字段编辑器 */}
      <FieldEditor
        isOpen={isAddingField}
        onClose={() => setAddingField(false)}
        onSave={handleFieldSave}
      />
    </div>
  )
}
