import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Select, Button, Card, message, Space, Tabs, Switch } from 'antd'
import { ArrowLeftOutlined, FileWordOutlined, SaveOutlined } from '@ant-design/icons'

const { TextArea } = Input

const productOptions = [
  { label: '无菌隔离器', value: '无菌隔离器' },
  { label: 'VHP灭菌隔离器', value: 'VHP灭菌隔离器' },
  { label: '集成式隔离器', value: '集成式隔离器' },
  { label: '负压隔离器', value: '负压隔离器' },
  { label: '百级层流传递窗', value: '百级层流传递窗' },
  { label: 'VHP灭菌传递窗', value: 'VHP灭菌传递窗' },
]

export default function ProposalEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [bilingual, setBilingual] = useState(false)
  const [saving, setSaving] = useState(false)

  const isNew = !id || id === 'new'

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      // TODO: 调用后端API保存
      console.log('保存方案:', values)
      setTimeout(() => {
        setSaving(false)
        message.success('方案已保存')
        navigate('/proposals')
      }, 500)
    } catch {
      message.error('请检查表单填写')
    }
  }

  const handleExport = () => {
    message.loading('正在生成DOCX文档...')
    // TODO: 调用后端导出API
    setTimeout(() => {
      message.success('文档生成完成，已开始下载')
    }, 1500)
  }

  const templateContent = `# 项目概述

[在此描述客户需求和项目背景]

# 技术方案

## 产品选型

| 参数 | 规格 |
|------|------|
| 产品型号 | [待选择] |
| 工作舱尺寸 | [待填写] |
| 洁净等级 | ISO 5 (Class 100) |
| 灭菌方式 | VHP / 紫外 / 其他 |

## 配置清单

- 标准配置：[待选择]
- 可选配置：[待选择]

# 合规与验证

- 符合中国GMP 2010版要求
- 符合EU GMP Annex 1要求
- 提供完整IQ/OQ验证文件

# 报价概要

[待生成]`

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/proposals')}>返回</Button>
          <h2 style={{ margin: 0, fontSize: 18 }}>{isNew ? '新建方案' : '编辑方案'}</h2>
        </Space>
        <Space>
          <span style={{ fontSize: 13, color: '#666' }}>
            <Switch checked={bilingual} onChange={setBilingual} style={{ marginRight: 6 }} />
            {bilingual ? '中英双语模式' : '中文模式'}
          </span>
          <Button icon={<SaveOutlined />} type="primary" loading={saving} onClick={handleSave}>保存</Button>
          <Button icon={<FileWordOutlined />} onClick={handleExport}>导出DOCX</Button>
        </Space>
      </div>

      <Tabs defaultActiveKey="config" items={[
        {
          key: 'config',
          label: '方案配置',
          children: (
            <Card>
              <Form form={form} layout="vertical" initialValues={{ product: '无菌隔离器', language: '中文' }}>
                <Form.Item label="方案名称" name="title" rules={[{ required: true, message: '请输入方案名称' }]}>
                  <Input placeholder="例如：某客户无菌隔离器技术方案" />
                </Form.Item>
                <Form.Item label="客户名称" name="customer">
                  <Input placeholder="客户公司名称" />
                </Form.Item>
                <Form.Item label="产品类型" name="product" rules={[{ required: true }]}>
                  <Select options={productOptions} />
                </Form.Item>
                <Form.Item label="关键参数" name="params">
                  <Input.TextArea rows={4} placeholder="输入产品关键参数，如：工作舱尺寸、材质要求、洁净等级等" />
                </Form.Item>
                <Form.Item label="客户需求描述" name="requirements">
                  <TextArea rows={4} placeholder="客户的核心需求和关注点" />
                </Form.Item>
              </Form>
            </Card>
          )
        },
        {
          key: 'preview',
          label: '方案预览',
          children: (
            <Card>
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8, padding: 16, background: '#fafafa', borderRadius: 8, minHeight: 400 }}>
                {templateContent}
              </div>
            </Card>
          )
        },
      ]} />
    </div>
  )
}
