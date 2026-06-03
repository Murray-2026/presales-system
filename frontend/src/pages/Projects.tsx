import { Table, Card, Tag, Space, Select, Input, Button, Modal, Form, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

interface Project {
  key: string
  name: string
  customer: string
  stage: string
  stageColor: string
  amount: string
  engineer: string
  updatedAt: string
}

const initialProjects: Project[] = [
  { key: '1', name: '无菌隔离器技术方案', customer: '某生物科技有限公司', stage: '方案编制', stageColor: 'processing', amount: '150K USD', engineer: '寇豆码', updatedAt: '2026-06-02' },
  { key: '2', name: 'VHP传递窗方案', customer: '某医药公司', stage: '已报价', stageColor: 'blue', amount: '45K USD', engineer: '寇豆码', updatedAt: '2026-06-01' },
  { key: '3', name: '层流罩需求评估', customer: '某研究院', stage: '需求确认', stageColor: 'orange', amount: '待报价', engineer: '寇豆码', updatedAt: '2026-05-30' },
  { key: '4', name: 'VHP灭菌方案', customer: '某制药厂', stage: '已中标', stageColor: 'green', amount: '85K USD', engineer: '寇豆码', updatedAt: '2026-05-28' },
  { key: '5', name: '负压隔离器方案', customer: '某疾控中心', stage: '技术交流', stageColor: 'purple', amount: '200K USD', engineer: '寇豆码', updatedAt: '2026-05-25' },
]

export default function Projects() {
  const [data, setData] = useState(initialProjects)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('')

  const filtered = data.filter(item => {
    const matchSearch = !search || item.name.includes(search) || item.customer.includes(search)
    const matchStage = !stageFilter || item.stage === stageFilter
    return matchSearch && matchStage
  })

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>项目管理</h2>
          <p>跟踪售前项目全流程</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>新建项目</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input placeholder="搜索项目或客户" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} allowClear />
          <Select placeholder="阶段筛选" value={stageFilter || undefined} onChange={v => setStageFilter(v || '')} allowClear style={{ width: 140 }}>
            <Select.Option value="需求确认">需求确认</Select.Option>
            <Select.Option value="方案编制">方案编制</Select.Option>
            <Select.Option value="技术交流">技术交流</Select.Option>
            <Select.Option value="已报价">已报价</Select.Option>
            <Select.Option value="已中标">已中标</Select.Option>
          </Select>
        </Space>
      </Card>

      <Table dataSource={filtered} pagination={false} columns={[
        { title: '项目名称', dataIndex: 'name', key: 'name' },
        { title: '客户', dataIndex: 'customer', key: 'customer' },
        { title: '阶段', dataIndex: 'stage', key: 'stage', render: (t: string, r: Project) => <Tag color={r.stageColor}>{t}</Tag> },
        { title: '金额', dataIndex: 'amount', key: 'amount' },
        { title: '负责人', dataIndex: 'engineer', key: 'engineer' },
        { title: '最近更新', dataIndex: 'updatedAt', key: 'updatedAt' },
      ]} />
    </div>
  )
}
