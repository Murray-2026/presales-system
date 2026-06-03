import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Tag, Button, Space, message, Switch, Progress, Table } from 'antd'
import { PoweroffOutlined, SettingOutlined, ApiOutlined, ReloadOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons'

// 模拟设备状态数据
const mockDeviceData = {
  connected: true,
  deviceName: '隔离器缩比模型 v1.0',
  ip: '192.168.1.100',
  uptime: '2h 35m',
  sensors: {
    temperature: 24.5,
    humidity: 45.2,
    pressure: -15.8,
    doorState: 'closed',
    sterilizing: false,
  },
  logs: [
    { time: '14:32:15', event: '开门操作', result: 'success' },
    { time: '14:30:00', event: '温湿度数据上报', result: 'info' },
    { time: '14:25:40', event: '关门操作', result: 'success' },
    { time: '14:20:10', event: '传感器校准', result: 'info' },
    { time: '14:15:00', event: '设备上线', result: 'success' },
  ]
}

export default function DeviceMonitor() {
  const [device, setDevice] = useState(mockDeviceData)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [demoMode, setDemoMode] = useState(true) // 没有实物时使用模拟模式

  // 模拟实时数据更新
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      setDevice(prev => ({
        ...prev,
        sensors: {
          ...prev.sensors,
          temperature: +(prev.sensors.temperature + (Math.random() - 0.5) * 0.3).toFixed(1),
          humidity: +(prev.sensors.humidity + (Math.random() - 0.5) * 0.5).toFixed(1),
          pressure: +(prev.sensors.pressure + (Math.random() - 0.5) * 0.5).toFixed(1),
        }
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleDoorControl = (action: 'open' | 'close') => {
    const newState = action === 'open' ? 'opening' : 'closing'
    setDevice(prev => ({ ...prev, sensors: { ...prev.sensors, doorState: newState } }))

    setTimeout(() => {
      setDevice(prev => ({ ...prev, sensors: { ...prev.sensors, doorState: action === 'open' ? 'open' : 'closed' } }))
      message.success(action === 'open' ? '✅ 门已打开' : '✅ 门已关闭')
    }, 1500)
  }

  const handleSterilize = () => {
    setDevice(prev => ({ ...prev, sensors: { ...prev.sensors, sterilizing: true } }))
    message.loading({ content: 'VHP灭菌进行中...', key: 'sterilize', duration: 0 })
    setTimeout(() => {
      setDevice(prev => ({ ...prev, sensors: { ...prev.sensors, sterilizing: false } }))
      message.success({ content: '✅ VHP灭菌完成', key: 'sterilize' })
    }, 4000)
  }

  const doorStateColor = (state: string) => {
    switch (state) {
      case 'closed': return 'green'
      case 'open': return 'red'
      case 'opening':
      case 'closing': return 'orange'
      default: return 'default'
    }
  }

  const doorStateText = (state: string) => {
    switch (state) {
      case 'closed': return '已关闭'
      case 'open': return '已打开'
      case 'opening': return '正在打开...'
      case 'closing': return '正在关闭...'
      default: return '未知'
    }
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2><ApiOutlined style={{ marginRight: 8 }} />设备监控</h2>
          <p>实时监控隔离器缩比模型状态 · 远程控制 · 数据展示</p>
        </div>
        <Space>
          <Tag icon={demoMode ? <WarningOutlined /> : <CheckCircleOutlined />}
            color={demoMode ? 'orange' : 'green'}>
            {demoMode ? '模拟模式' : '已连接实物'}
          </Tag>
          <Switch checked={autoRefresh} onChange={setAutoRefresh}
            checkedChildren="实时" unCheckedChildren="暂停" />
        </Space>
      </div>

      {/* 设备状态卡片 */}
      <Row gutter={[12, 12]}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="设备状态" value={device.connected ? '在线' : '离线'}
              valueStyle={{ color: device.connected ? '#52c41a' : '#ff4d4f' }}
              prefix={device.connected ? <CheckCircleOutlined /> : <PoweroffOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="温度" value={device.sensors.temperature} suffix="°C" precision={1} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="湿度" value={device.sensors.humidity} suffix="%" precision={1} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="舱内压差" value={device.sensors.pressure} suffix="Pa" precision={1}
              valueStyle={{ color: device.sensors.pressure < 0 ? '#1677ff' : '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* 实物模型展示 + 控制区 */}
      <Row gutter={12} style={{ marginTop: 12 }}>
        <Col span={14}>
          <Card title="实物模型控制台" extra={
            <Space>
              <Button size="small" icon={<ReloadOutlined />}
                onClick={() => message.success('已刷新设备状态')}>刷新</Button>
              <Button size="small" icon={<SettingOutlined />}
                onClick={() => setDemoMode(!demoMode)}>
                {demoMode ? '切换实物模式' : '切换模拟模式'}
              </Button>
            </Space>
          }>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {/* 模型示意图 */}
              <svg width="280" height="180" viewBox="0 0 280 180" style={{ border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa' }}>
                <rect x="40" y="20" width="200" height="140" rx="8" fill="none" stroke="#378ADD" strokeWidth="2"/>
                <text x="140" y="55" textAnchor="middle" fontSize="12" fill="#666">隔离器腔体</text>
                <text x="140" y="75" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#1677ff">
                  {device.sensors.doorState === 'open' ? '○' : device.sensors.doorState === 'opening' ? '◐' : '●'}
                </text>
                <text x="140" y="100" textAnchor="middle" fontSize="11" fill="#999">
                  门状态: {doorStateText(device.sensors.doorState)}
                </text>
                {/* 门示意 */}
                <rect x="40" y={device.sensors.doorState === 'open' ? 100 : 110}
                  width="200" height={device.sensors.doorState === 'open' ? 40 : 50}
                  rx="4" fill={device.sensors.doorState === 'closed' ? '#52c41a' : '#ff4d4f'}
                  opacity="0.3" />
                <text x="140" y={device.sensors.doorState === 'open' ? 128 : 142}
                  textAnchor="middle" fontSize="10" fill="#666">
                  主门
                </text>
                {/* 传递窗 */}
                <rect x="240" y="60" width="20" height="40" rx="3" fill="#d9d9d9" stroke="#bbb" strokeWidth="1"/>
                <text x="250" y="115" textAnchor="middle" fontSize="9" fill="#999">传递窗</text>
              </svg>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                设备: {device.deviceName} | IP: {device.ip} | 运行: {device.uptime}
              </div>
            </div>

            <Row gutter={8} justify="center">
              <Col>
                <Button type="primary" icon={<ApiOutlined />}
                  onClick={() => handleDoorControl('open')}
                  disabled={device.sensors.doorState === 'open' || device.sensors.doorState === 'opening'}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                  开门
                </Button>
              </Col>
              <Col>
                <Button icon={<ApiOutlined />}
                  onClick={() => handleDoorControl('close')}
                  disabled={device.sensors.doorState === 'closed' || device.sensors.doorState === 'closing'}>
                  关门
                </Button>
              </Col>
              <Col>
                <Button icon={<WarningOutlined />}
                  onClick={handleSterilize}
                  disabled={device.sensors.sterilizing}
                  style={{ background: device.sensors.sterilizing ? undefined : '#722ed1', borderColor: '#722ed1', color: device.sensors.sterilizing ? undefined : '#fff' }}>
                  {device.sensors.sterilizing ? '灭菌中...' : 'VHP灭菌'}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 传感器详细数据 */}
        <Col span={10}>
          <Card title="传感器数据" size="small">
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#666' }}>温度趋势</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{device.sensors.temperature}°C</span>
              </div>
              <Progress percent={Math.round((device.sensors.temperature / 50) * 100)} size="small" strokeColor="#1677ff" />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#666' }}>湿度趋势</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{device.sensors.humidity}%</span>
              </div>
              <Progress percent={Math.round(device.sensors.humidity)} size="small" strokeColor="#52c41a" />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#666' }}>负压趋势</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{device.sensors.pressure}Pa</span>
              </div>
              <Progress percent={Math.round(Math.abs(device.sensors.pressure) / 50 * 100)} size="small" strokeColor="#722ed1" />
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: '#666' }}>最近操作记录</div>
              <Table
                dataSource={device.logs}
                columns={[
                  { title: '时间', dataIndex: 'time', key: 'time', width: 80 },
                  { title: '事件', dataIndex: 'event', key: 'event' },
                  { title: '结果', dataIndex: 'result', key: 'result', width: 70,
                    render: (r: string) => r === 'success' ? <Tag color="green" style={{ fontSize: 10 }}>成功</Tag> : <Tag color="blue" style={{ fontSize: 10 }}>信息</Tag>
                  },
                ]}
                pagination={false}
                size="small"
                showHeader={false}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 演示模式说明 */}
      {demoMode && (
        <Card size="small" style={{ marginTop: 12, background: '#FFFBE6', borderColor: '#FFE58F' }}>
          <div style={{ fontSize: 12, color: '#AD8B00' }}>
            <WarningOutlined style={{ marginRight: 8 }} />
            当前为<strong>模拟模式</strong>，数据为系统生成的模拟数据。
            连接实物ESP32后，点击"切换实物模式"即可接收真实传感器数据。
          </div>
        </Card>
      )}
    </div>
  )
}
