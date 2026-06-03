import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Card, Space, Tag, Input, Modal, message, Form, InputNumber } from 'antd'
import { PlusOutlined, SettingOutlined } from '@ant-design/icons'

interface Product {
  key: string
  name: string
  model: string
  category: string
  spec: string
  basePrice: string
  status: string
}

const initialProducts: Product[] = [
  { key: '1', name: '无菌检测隔离器', model: 'ISO-1500', category: '无菌隔离器', spec: '工作舱1500×800×1800，ISO 5', basePrice: '120K-220K USD', status: 'active' },
  { key: '2', name: 'VHP灭菌隔离器', model: 'VHP-1200', category: 'VHP灭菌隔离器', spec: '工作舱1200×700×1600，VHP灭菌', basePrice: '45K-85K USD', status: 'active' },
  { key: '3', name: '集成式隔离器', model: 'INT-2000', category: '集成隔离器', spec: '多功能集成，全自动控制', basePrice: '420K-850K USD', status: 'active' },
  { key: '4', name: '负压隔离器', model: 'NEG-1000', category: '负压隔离器', spec: '负压维持，生物安全防护', basePrice: '150K-280K USD', status: 'active' },
  { key: '5', name: '百级层流传递窗', model: 'PB-LF-500', category: '传递窗', spec: '百级层流，不锈钢304', basePrice: '15K-35K USD', status: 'active' },
  { key: '6', name: 'VHP灭菌传递箱', model: 'PB-VHP-500', category: '传递窗', spec: 'VHP灭菌，双门互锁', basePrice: '25K-55K USD', status: 'active' },
]

export default function Products() {
  const navigate = useNavigate()
  const [data, setData] = useState(initialProducts)
  const [search, setSearch] = useState('')

  const filtered = data.filter(item => !search || item.name.includes(search) || item.model.includes(search))

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>产品目录</h2>
          <p>管理产品型号、规格和标准配置</p>
        </div>
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => navigate('/products/config')}>选型配置</Button>
          <Button type="primary" icon={<PlusOutlined />}>新增产品</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Input placeholder="搜索产品名称或型号" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} allowClear />
      </Card>

      <Table dataSource={filtered} pagination={false} columns={[
        { title: '产品名称', dataIndex: 'name', key: 'name' },
        { title: '型号', dataIndex: 'model', key: 'model' },
        { title: '分类', dataIndex: 'category', key: 'category', render: (t: string) => <Tag color="blue">{t}</Tag> },
        { title: '规格说明', dataIndex: 'spec', key: 'spec' },
        { title: '参考报价', dataIndex: 'basePrice', key: 'basePrice' },
        { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => s === 'active' ? <Tag color="green">在售</Tag> : <Tag color="red">停售</Tag> },
      ]} />
    </div>
  )
}
