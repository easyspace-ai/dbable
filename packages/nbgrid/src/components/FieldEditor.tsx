import React, { useState } from 'react'
import { X, Check } from 'lucide-react'
import { FieldType } from '../types'
import { FieldIcon } from './FieldIcon'

interface FieldEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (field: { name: string; type: FieldType; width: number }) => void
  initialField?: { name: string; type: FieldType; width: number }
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialField
}) => {
  const [fieldName, setFieldName] = useState(initialField?.name || '')
  const [fieldType, setFieldType] = useState<FieldType>(initialField?.type || FieldType.Text)
  const [width, setWidth] = useState(initialField?.width || 200)

  const fieldTypes = [
    { type: FieldType.Text, label: '单行文本', icon: FieldType.Text },
    { type: FieldType.LongText, label: '长文本', icon: FieldType.LongText },
    { type: FieldType.Number, label: '数字', icon: FieldType.Number },
    { type: FieldType.Select, label: '单选', icon: FieldType.Select },
    { type: FieldType.MultiSelect, label: '多选', icon: FieldType.MultiSelect },
    { type: FieldType.Date, label: '日期', icon: FieldType.Date },
    { type: FieldType.Checkbox, label: '复选框', icon: FieldType.Checkbox },
    { type: FieldType.URL, label: 'URL', icon: FieldType.URL },
    { type: FieldType.Email, label: '邮箱', icon: FieldType.Email },
    { type: FieldType.Phone, label: '电话', icon: FieldType.Phone },
    { type: FieldType.Attachment, label: '附件', icon: FieldType.Attachment },
    { type: FieldType.Rating, label: '评分', icon: FieldType.Rating },
    { type: FieldType.Formula, label: '公式', icon: FieldType.Formula },
    { type: FieldType.Lookup, label: '查找', icon: FieldType.Lookup },
    { type: FieldType.Rollup, label: '汇总', icon: FieldType.Rollup },
    { type: FieldType.Count, label: '计数', icon: FieldType.Count },
    { type: FieldType.CreatedTime, label: '创建时间', icon: FieldType.CreatedTime },
    { type: FieldType.LastModifiedTime, label: '最后修改时间', icon: FieldType.LastModifiedTime },
    { type: FieldType.CreatedBy, label: '创建者', icon: FieldType.CreatedBy },
    { type: FieldType.LastModifiedBy, label: '最后修改者', icon: FieldType.LastModifiedBy },
    { type: FieldType.AutoNumber, label: '自动编号', icon: FieldType.AutoNumber },
    { type: FieldType.Barcode, label: '条码', icon: FieldType.Barcode },
    { type: FieldType.Button, label: '按钮', icon: FieldType.Button }
  ]

  const handleSave = () => {
    if (fieldName.trim()) {
      onSave({
        name: fieldName.trim(),
        type: fieldType,
        width
      })
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="field-editor"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}
    >
      <div 
        className="field-editor-content" 
        style={{ 
          width: '28rem', 
          maxHeight: '80vh', 
          overflowY: 'auto',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>字段配置</h2>
          <button
            onClick={onClose}
            style={{ padding: '0.25rem', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '0.25rem' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Field Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              字段名称
            </label>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
              用户在界面中看到的显示名称
            </p>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              onKeyDown={handleKeyPress}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem', 
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.backgroundColor = 'white'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
                e.target.style.backgroundColor = '#fafafa'
                e.target.style.boxShadow = 'none'
              }}
              placeholder="字段1"
              autoFocus
            />
          </div>

          {/* Field Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              字段类型
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', maxHeight: '12rem', overflowY: 'auto', padding: '0.25rem' }}>
              {fieldTypes.map((type) => (
                <button
                  key={type.type}
                  onClick={() => setFieldType(type.type)}
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    border: fieldType === type.type ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    background: fieldType === type.type ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    fontSize: '0.875rem',
                    fontWeight: fieldType === type.type ? '500' : '400',
                    boxShadow: fieldType === type.type ? '0 4px 6px -1px rgba(59, 130, 246, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (fieldType !== type.type) {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (fieldType !== type.type) {
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                >
                  <FieldIcon type={type.type} style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                  <span>{type.label}</span>
                  {fieldType === type.type && (
                    <Check style={{ width: '1rem', height: '1rem', color: '#3b82f6', marginLeft: 'auto' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Width */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              列宽
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem', 
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.backgroundColor = 'white'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
                e.target.style.backgroundColor = '#fafafa'
                e.target.style.boxShadow = 'none'
              }}
              min="100"
              max="1000"
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={onClose}
            style={{ 
              padding: '0.75rem 1.5rem', 
              color: '#6b7280', 
              background: 'transparent', 
              border: '1px solid #d1d5db', 
              borderRadius: '0.5rem', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
              e.currentTarget.style.borderColor = '#9ca3af'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = '#d1d5db'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!fieldName.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: fieldName.trim() ? '#2563eb' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: fieldName.trim() ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: fieldName.trim() ? '0 4px 6px -1px rgba(37, 99, 235, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (fieldName.trim()) {
                e.currentTarget.style.backgroundColor = '#1d4ed8'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(37, 99, 235, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (fieldName.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
              }
            }}
          >
            创建字段
          </button>
        </div>
      </div>
    </div>
  )
}
