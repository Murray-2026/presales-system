import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Tag, Space, Input, Select, Modal, message } from 'antd'
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface Proposal {
  key: string
  title: string
  product: string
  customer: string
  language: string
  status: string
  createdAt: string
}

const initialData: Proposal[] = [
  { key: '1', title: '无菌隔离器技术方案 - 某生物科技', product: '无菌隔离器', customer: '某生物科技', language: '中文', status: 'draft', createdAt: '2026-05-28' },
  { key: '2', title: 'VHP灭菌传递窗方案 - 某医药', product: 'VHP传递窗', customer: '某医药公司', language: '中英双语', status: 'completed', createdAt: '2026-05-20' },
  { key: '3', title: '集成式隔离器方案 - 某研究院', product: '集成隔离器', customer: '某研究院', language: '中文', status: 'draft', createdAt: '2026-06-01' },
]

export default function Proposals() {
  const navigate = useNavigate()
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')
  const [filterLang, setFilterLang] = useState<string>('')

  const filtered = data.filter(item => {
    const matchSearch = !search || item.title.includes(search) || item.customer.includes(search)
    const matchLang = !filterLang || item.language === filterLang
    return matchSearch && matchLang
  })

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，确定吗？',
      onOk: () => {
        setData(prev => prev.filter(item => item.key !== key))
        message.success('已删除')
      },
    })
  }

  const columns: ColumnsType<Proposal> = [
    { title: '方案名称', dataIndex: 'title', key: 'title', render: (text) => <a onClick={() => navigate(`/proposals/${text}`)}>{text}</a> },
    { title: '产品类型', dataIndex: 'product', key: 'product' },
    { title: '客户', dataIndex: 'customer', key: 'customer' },
    { title: '语言', dataIndex: 'language', key: 'language' },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (s) => s === 'draft' ? <Tag color="orange">草稿</Tag> : <Tag color="green">已完成</Tag>
    },
    { title: '创建日期', dataIndex: 'createdAt', key: 'createdAt' },
    { title: '操作', key: 'action',
      render: (_, record) => (
        <Space>
          <a onClick={() => navigate(`/proposals/${record.key}`)}>编辑</a>
          <a onClick={() => message.success('导出中，稍后下载')}>导出DOCX</a>
          <a style={{ color: '#ff4d4f' }} onClick={() => handleDelete(record.key)}>删除</a>
        </Space>
      )
    },
  ]

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>方案管理</h2>
          <p>管理所有售前技术方案，快速生成专业文档</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => navigate('/proposals/new')}>
          新建方案
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input placeholder="搜索方案名称或客户" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} allowClear />
          <Select placeholder="语言筛选" value={filterLang || undefined} onChange={v => setFilterLang(v || '')} allowClear style={{ width: 140 }}>
            <Select.Option value="中文">中文</Select.Option>
            <Select.Option value="中英双语">中英双语</Select.Option>
            <Select.Option value="英文">英文</Select.Option>
          </Select>
        </Space>
      </Card>

      <Table columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} />
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #f0f0f0', ...style }}>{children}</div>
}
