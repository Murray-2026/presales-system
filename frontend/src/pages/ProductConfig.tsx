import { useState } from 'react'
import { Card, Row, Col, Form, Select, InputNumber, Button, Table, Tag, message, Divider, Space } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons'

const productModels = [
  { label: '无菌检测隔离器 ISO-1500', value: 'ISO-1500', basePrice: 150000 },
  { label: 'VHP灭菌隔离器 VHP-1200', value: 'VHP-1200', basePrice: 65000 },
  { label: '集成式隔离器 INT-2000', value: 'INT-2000', basePrice: 580000 },
  { label: '负压隔离器 NEG-1000', value: 'NEG-1000', basePrice: 200000 },
  { label: '百级层流传递窗 PB-LF-500', value: 'PB-LF-500', basePrice: 25000 },
  { label: 'VHP灭菌传递箱 PB-VHP-500', value: 'PB-VHP-500', basePrice: 40000 },
]

const options = {
  material: [
    { label: '不锈钢304（标准）', value: '304', price: 0 },
    { label: '不锈钢316L', value: '316L', price: 8000 },
  ],
  control: [
    { label: 'PLC触摸屏（标准）', value: 'plc', price: 0 },
    { label: 'PLC触摸屏+远程监控', value: 'plc_remote', price: 12000 },
  ],
  validation: [
    { label: 'IQ/OQ（标准）', value: 'iqoq', price: 0 },
    { label: 'IQ/OQ/PQ全套', value: 'full', price: 15000 },
  ],
}

export default function ProductConfig() {
  const [form] = Form.useForm()
  const [configItems, setConfigItems] = useState<any[]>([])

  const handleCalculate = () => {
    const values = form.getFieldsValue()
    if (!values.product) {
      message.warning('请先选择产品型号')
      return
    }

    const product = productModels.find(p => p.value === values.product)
    const materialOpt = options.material.find(o => o.value === values.material)
    const controlOpt = options.control.find(o => o.value === values.control)
    const validationOpt = options.validation.find(o => o.value === values.validation)

    const items = [
      { name: '主机（' + product?.label + '）', qty: 1, unitPrice: product?.basePrice || 0 },
      { name: '材质升级 - ' + materialOpt?.label, qty: 1, unitPrice: materialOpt?.price || 0 },
      { name: '控制系统 - ' + controlOpt?.label, qty: 1, unitPrice: controlOpt?.price || 0 },
      { name: '验证服务 - ' + validationOpt?.label, qty: 1, unitPrice: validationOpt?.price || 0 },
    ].filter(i => i.unitPrice >= 0)

    setConfigItems(items)
    message.success('配置计算完成')
  }

  const total = configItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>返回</Button>
          <h2 style={{ margin: 0, fontSize: 18 }}>选型配置器</h2>
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={10}>
          <Card title="选择配置" style={{ height: '100%' }}>
            <Form form={form} layout="vertical" initialValues={{ material: '304', control: 'plc', validation: 'iqoq' }}>
              <Form.Item label="产品型号" name="product" rules={[{ required: true, message: '请选择' }]}>
                <Select options={productModels} placeholder="请选择产品型号" />
              </Form.Item>
              <Form.Item label="箱体材质" name="material">
                <Select options={options.material} />
              </Form.Item>
              <Form.Item label="控制系统" name="control">
                <Select options={options.control} />
              </Form.Item>
              <Form.Item label="验证服务" name="validation">
                <Select options={options.validation} />
              </Form.Item>
              <Button type="primary" block onClick={handleCalculate}>计算报价</Button>
            </Form>
          </Card>
        </Col>

        <Col span={14}>
          <Card title="配置清单与报价" extra={<Space><Button icon={<FileTextOutlined />} onClick={() => message.success('方案文档生成中')}>生成方案</Button><Button icon={<DownloadOutlined />} onClick={() => message.success('报价单导出中')}>导出报价</Button></Space>}>
            {configItems.length > 0 ? (
              <>
                <Table dataSource={configItems.map((item, idx) => ({ ...item, key: idx }))} pagination={false} columns={[
                  { title: '配置项', dataIndex: 'name', key: 'name' },
                  { title: '数量', dataIndex: 'qty', key: 'qty', width: 80 },
                  { title: '单价(USD)', dataIndex: 'unitPrice', key: 'unitPrice', width: 120, render: (v: number) => '$' + v.toLocaleString() },
                  { title: '小计(USD)', key: 'subtotal', width: 120, render: (_: any, record: any) => '$' + (record.unitPrice * record.qty).toLocaleString() },
                ]} />
                <Divider />
                <div style={{ textAlign: 'right', fontSize: 18 }}>
                  <span style={{ color: '#666' }}>总计：</span>
                  <span style={{ fontWeight: 600, color: '#1677ff' }}>${total.toLocaleString()} USD</span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>请先选择产品型号和配置项，点击"计算报价"</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
