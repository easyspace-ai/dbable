# @easygrid/nbgrid

一个高性能的表格组件库，提供类似 Airtable 的功能，专为 EasyGrid 项目设计。

## 功能特性

- 📊 **高性能数据表格** - 基于 `@glideapps/glide-data-grid` 的虚拟化表格
- 🎨 **多种字段类型** - 支持文本、数字、日期、选择等 20+ 种字段类型
- 🖱️ **右键菜单** - 完整的上下文菜单支持
- ⚙️ **字段编辑器** - 可视化的字段配置界面
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🎯 **类型安全** - 完整的 TypeScript 支持
- 🔄 **状态管理** - 基于 Zustand 的轻量级状态管理
- 🎨 **主题支持** - 支持自定义主题

## 安装

```bash
# 在项目中使用 pnpm
pnpm add @easygrid/nbgrid

# 或使用 npm
npm install @easygrid/nbgrid
```

## 快速开始

### 基础用法

```tsx
import { NbGrid } from '@easygrid/nbgrid'
import '@easygrid/nbgrid/styles' // 引入样式

function App() {
  return (
    <NbGrid 
      height={600}
      width={1200}
      className="w-full h-full"
    />
  )
}
```

### 单独使用组件

```tsx
import { DataGrid, ViewToolbar, FieldEditor } from '@easygrid/nbgrid'

function CustomTable() {
  return (
    <div>
      <ViewToolbar />
      <DataGrid height={400} width={800} />
      <FieldEditor 
        isOpen={true}
        onClose={() => {}}
        onSave={(field) => console.log(field)}
      />
    </div>
  )
}
```

### 使用状态管理

```tsx
import { useTableStore } from '@easygrid/nbgrid'

function MyComponent() {
  const { fields, records, addField, updateRecord } = useTableStore()
  
  const handleAddField = () => {
    addField({
      name: '新字段',
      type: 'text',
      width: 200
    })
  }
  
  return (
    <div>
      <button onClick={handleAddField}>添加字段</button>
      {/* 其他组件 */}
    </div>
  )
}
```

## 字段类型

支持以下字段类型：

- **文本类**: 单行文本、长文本
- **数字类**: 数字、评分、自动编号
- **选择类**: 单选、多选
- **时间类**: 日期、创建时间、最后修改时间
- **联系类**: 邮箱、电话、URL
- **文件类**: 附件、条码
- **计算类**: 公式、查找、汇总、计数
- **系统类**: 创建者、最后修改者、按钮

## 开发

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建库
pnpm build

# 类型检查
pnpm type-check

# 清理构建文件
pnpm clean
```

### 演示

```bash
# 启动演示应用
pnpm demo
```

## API 参考

### 组件

- `NbGrid` - 主表格组件
- `DataGrid` - 数据表格组件
- `ViewToolbar` - 视图工具栏
- `FieldEditor` - 字段编辑器
- `ContextMenu` - 上下文菜单
- `FieldIcon` - 字段图标

### 状态管理

使用 `useTableStore` Hook 访问状态：

```tsx
const {
  // 数据
  fields,
  records,
  views,
  currentViewId,
  
  // 操作
  addField,
  updateField,
  deleteField,
  addRecord,
  updateRecord,
  deleteRecord,
  addView,
  updateView,
  deleteView
} = useTableStore()
```

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Zustand** - 状态管理
- **@glideapps/glide-data-grid** - 表格组件
- **Lucide React** - 图标库
- **Vite** - 构建工具

## 许可证

MIT License
