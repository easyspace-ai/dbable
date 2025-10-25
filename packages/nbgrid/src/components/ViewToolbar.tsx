import React from 'react'
import { 
  Grid3X3, 
  ChevronDown, 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreHorizontal, 
  Plus,
  Image,
  Calendar,
  BarChart3
} from 'lucide-react'
import { useTableStore } from '../store'

interface ViewToolbarProps {
  className?: string
}

export const ViewToolbar: React.FC<ViewToolbarProps> = ({ className = '' }) => {
  const { 
    views, 
    currentViewId, 
    records, 
    setAddingField
  } = useTableStore()

  const currentView = views.find(v => v.id === currentViewId)
  const recordCount = records.length

  // const handleAddView = () => {
  //   addView({
  //     name: '新视图',
  //     type: 'grid' as any
  //   })
  // }

  const handleAddField = () => {
    setAddingField(true)
  }

  const getViewIcon = (type: string) => {
    switch (type) {
      case 'grid':
        return <Grid3X3 className="w-4 h-4" />
      case 'gallery':
        return <Image className="w-4 h-4" />
      case 'calendar':
        return <Calendar className="w-4 h-4" />
      case 'kanban':
        return <BarChart3 className="w-4 h-4" />
      default:
        return <Grid3X3 className="w-4 h-4" />
    }
  }

  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white ${className}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
      {/* Left side - View selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          {getViewIcon(currentView?.type || 'grid')}
          <span style={{ fontWeight: '500', color: '#1f2937' }}>{currentView?.name || 'New View'}</span>
          <ChevronDown style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
        </div>
        <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>({recordCount})</span>
      </div>

      {/* Right side - Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {/* Search */}
        <button className="toolbar-button" title="搜索">
          <Search style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
        </button>

        {/* Filter */}
        <button className="toolbar-button" title="筛选">
          <Filter style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
        </button>

        {/* Sort */}
        <button className="toolbar-button" title="排序">
          <ArrowUpDown style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
        </button>

        {/* View options */}
        <button className="toolbar-button" title="视图选项">
          <MoreHorizontal style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
        </button>

        {/* Add field */}
        <button 
          onClick={handleAddField}
          className="toolbar-button" 
          title="添加字段"
          style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
        >
          <Plus style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>
    </div>
  )
}
