import { Row, Col, Card, Statistic, Table, Tag } from 'antd'
import { FileTextOutlined, AppstoreOutlined, ProjectOutlined, CheckCircleOutlined } from '@ant-design/icons'

const recentProjects = [
  { key: '1', name: '某生物科技隔离器项目', status: '进行中', statusColor: 'processing', updateTime: '2026-06-02' },
  { key: '2', name: '某医药公司传递窗方案', status: '已报价', statusColor: 'blue', updateTime: '2026-06-01' },
  { key: '3', name: '某研究院层流罩需求', status: '新需求', statusColor: 'orange', updateTime: '2026-05-30' },
  { key: '4', name: '某制药厂VHP灭菌方案', status: '已中标', statusColor: 'green', updateTime: '2026-05-28' },
]

export default function Dashboard() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>工作台</h2>
        <p>欢迎回来，今天有 3 个项目需要跟进</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="方案总数" value={28} prefix={<FileTextOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="产品型号" value={16} prefix={<AppstoreOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="进行中项目" value={5} prefix={<ProjectOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今年中标" value={12} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      <Card title="最近跟进项目" style={{ marginTop: 24 }}>
        <Table
          dataSource={recentProjects}
          columns={[
            { title: '项目名称', dataIndex: 'name', key: 'name' },
            { title: '状态', dataIndex: 'status', key: 'status',
              render: (text: string) => <Tag color="blue">{text}</Tag>
            },
            { title: '最近更新', dataIndex: 'updateTime', key: 'updateTime' },
          ]}
          pagination={false}
        />
      </Card>
    </div>
  )
}
