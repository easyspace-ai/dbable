import React from 'react'
import { 
  Type, 
  Hash, 
  CheckSquare, 
  Calendar, 
  Link, 
  Mail, 
  Phone, 
  Paperclip, 
  FileText, 
  Star,
  Calculator,
  Eye,
  BarChart3,
  Clock,
  User,
  Hash as AutoNumber,
  QrCode,
  MousePointer
} from 'lucide-react'
import { FieldType } from '../types'

interface FieldIconProps {
  type: FieldType
  className?: string
}

const iconMap: Record<FieldType, React.ComponentType<any>> = {
  [FieldType.Text]: Type,
  [FieldType.Number]: Hash,
  [FieldType.Select]: CheckSquare,
  [FieldType.MultiSelect]: CheckSquare,
  [FieldType.Date]: Calendar,
  [FieldType.Checkbox]: CheckSquare,
  [FieldType.URL]: Link,
  [FieldType.Email]: Mail,
  [FieldType.Phone]: Phone,
  [FieldType.Attachment]: Paperclip,
  [FieldType.LongText]: FileText,
  [FieldType.Rating]: Star,
  [FieldType.Formula]: Calculator,
  [FieldType.Lookup]: Eye,
  [FieldType.Rollup]: BarChart3,
  [FieldType.Count]: Hash,
  [FieldType.CreatedTime]: Clock,
  [FieldType.LastModifiedTime]: Clock,
  [FieldType.CreatedBy]: User,
  [FieldType.LastModifiedBy]: User,
  [FieldType.AutoNumber]: AutoNumber,
  [FieldType.Barcode]: QrCode,
  [FieldType.Button]: MousePointer
}

export const FieldIcon: React.FC<FieldIconProps> = ({ type, className = 'w-4 h-4' }) => {
  const IconComponent = iconMap[type] || Type
  
  return <IconComponent className={className} />
}
