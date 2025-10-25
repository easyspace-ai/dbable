import React, { useEffect, useRef } from 'react'
import { 
  Edit, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Pin, 
  Trash2,
  Plus,
  Copy,
  Scissors,
  Clipboard
} from 'lucide-react'
import { useTableStore } from '../store'

interface ContextMenuProps {
  x: number
  y: number
  type: 'cell' | 'row' | 'column' | 'field'
  targetId?: string
  onClose: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  type,
  targetId,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const { 
    fields, 
    addField, 
    deleteField, 
    addRecord, 
    deleteRecord
  } = useTableStore()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleEditProperties = () => {
    // 这里可以打开字段属性编辑器
    console.log('Edit properties for:', targetId)
    onClose()
  }

  const handleSortAscending = () => {
    console.log('Sort ascending')
    onClose()
  }

  const handleSortDescending = () => {
    console.log('Sort descending')
    onClose()
  }

  const handleInsertLeft = () => {
    const fieldIndex = fields.findIndex(f => f.id === targetId)
    if (fieldIndex !== -1) {
      addField({
        name: '新字段',
        type: 'text' as any,
        width: 200
      })
    }
    onClose()
  }

  const handleInsertRight = () => {
    const fieldIndex = fields.findIndex(f => f.id === targetId)
    if (fieldIndex !== -1) {
      addField({
        name: '新字段',
        type: 'text' as any,
        width: 200
      })
    }
    onClose()
  }

  const handleFreezeToHere = () => {
    console.log('Freeze to here')
    onClose()
  }

  const handleDeleteField = () => {
    if (targetId) {
      deleteField(targetId)
    }
    onClose()
  }

  const handleDeleteRow = () => {
    if (targetId) {
      deleteRecord(targetId)
    }
    onClose()
  }

  const handleAddRow = () => {
    addRecord({})
    onClose()
  }

  const getMenuItems = () => {
    switch (type) {
      case 'field':
        return [
          { icon: Edit, label: '编辑属性', onClick: handleEditProperties },
          { icon: ArrowUp, label: '升序', onClick: handleSortAscending },
          { icon: ArrowDown, label: '降序', onClick: handleSortDescending },
          { icon: ArrowLeft, label: '向左插入', onClick: handleInsertLeft },
          { icon: ArrowRight, label: '向右插入', onClick: handleInsertRight },
          { icon: Pin, label: 'Freeze to Here', onClick: handleFreezeToHere },
          { icon: Trash2, label: '删除字段', onClick: handleDeleteField, danger: true }
        ]
      
      case 'row':
        return [
          { icon: Plus, label: '添加行', onClick: handleAddRow },
          { icon: Trash2, label: '删除行', onClick: handleDeleteRow, danger: true }
        ]
      
      case 'cell':
        return [
          { icon: Copy, label: '复制', onClick: () => console.log('Copy') },
          { icon: Scissors, label: '剪切', onClick: () => console.log('Cut') },
          { icon: Clipboard, label: '粘贴', onClick: () => console.log('Paste') }
        ]
      
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          className={`context-menu-item ${item.danger ? 'danger' : ''}`}
          onClick={item.onClick}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </button>
      ))}
    </div>
  )
}
