import { useState } from 'react'
import { Card, Input, Button, Upload, Tabs, Tag, Table, Descriptions, message, Spin, Space, Divider, Alert } from 'antd'
import { UploadOutlined, RobotOutlined, FileTextOutlined, DownloadOutlined, BulbOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import axios from 'axios'

const { TextArea } = Input

export default function URSInput() {
  const [ursText, setUrsText] = useState('')
  const [customer, setCustomer] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('input')

  // 分析URS文本
  const handleAnalyzeText = async () => {
    if (!ursText.trim()) {
      message.warning('请先输入URS内容')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post('/api/urs/analyze-text', {
        text: ursText,
        customer: customer,
        language: '中文',
      })
      setResult(res.data)
      setActiveTab('result')
      message.success('分析完成！')
    } catch (err) {
      message.error('分析失败，请检查后端是否运行')
    } finally {
      setLoading(false)
    }
  }

  // 上传URS文档
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file as Blob)
      formData.append('customer', customer)
      const res = await axios.post('/api/urs/analyze-file', formData)
      setResult(res.data)
      setActiveTab('result')
      message.success('文档解析完成！')
      onSuccess?.(res.data)
    } catch (err) {
      onError?.(err as Error)
      message.error('文档解析失败')
    } finally {
      setLoading(false)
    }
  }

  const params = result?.analysis?.extracted_params || {}
  const recommended = result?.analysis?.recommended_product || {}
  const proposal = result?.proposal || {}

  return (
    <div className="page-container">
      <div className="page-header">
        <h2><RobotOutlined style={{ marginRight: 8 }} />URS智能分析</h2>
        <p>输入用户需求规范（URS），自动分析需求并生成技术方案和报价单</p>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'input',
          label: 'URS输入',
          children: (
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Card title="客户信息（选填）">
                <Input placeholder="客户公司名称" value={customer} onChange={e => setCustomer(e.target.value)} style={{ maxWidth: 400 }} />
              </Card>

              <Card title="方式一：输入URS文本">
                <TextArea
                  rows={10}
                  value={ursText}
                  onChange={e => setUrsText(e.target.value)}
                  placeholder={`请粘贴URS文档内容，例如：

# 无菌隔离器用户需求规范

## 1. 项目背景
某生物科技公司新建QC实验室，需采购一台无菌检查隔离器。

## 2. 技术参数
- 工作舱尺寸：1800×800×1800mm
- 洁净等级：ISO 5 (Class 100)
- 灭菌方式：VHP汽化过氧化氢灭菌
- 材质要求：不锈钢304
- 控制系统：PLC触摸屏，需支持数据记录

## 3. 合规要求
- 符合中国GMP 2010版
- 符合EU GMP Annex 1

## 4. 数量：1台`}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
                <Button type="primary" icon={<RobotOutlined />} onClick={handleAnalyzeText} loading={loading} style={{ marginTop: 12 }} size="large">
                  开始分析
                </Button>
              </Card>

              <Card title="方式二：上传URS文档">
                <Upload.Dragger
                  accept=".docx,.pdf,.txt"
                  customRequest={handleUpload}
                  showUploadList={false}
                  style={{ padding: 24 }}
                >
                  <p style={{ fontSize: 16, marginBottom: 8 }}>
                    <UploadOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                  </p>
                  <p>点击或拖拽URS文档到此区域</p>
                  <p style={{ color: '#999', fontSize: 12 }}>支持 DOCX、PDF、TXT 格式</p>
                </Upload.Dragger>
              </Card>
            </Space>
          )
        },
        {
          key: 'result',
          label: '分析结果',
          disabled: !result,
          children: !result ? null : (
            <Spin spinning={loading}>
              <Space direction="vertical" style={{ width: '100%' }} size={16}>

                {/* 需求概览 */}
                <Card title={<><BulbOutlined /> 需求提取结果</>}>
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="URS内容长度">{result.analysis.raw_text_length} 字符</Descriptions.Item>
                    <Descriptions.Item label="识别参数项">{Object.keys(params).length} 项</Descriptions.Item>
                    {params.chamber_size && (
                      <Descriptions.Item label="工作舱尺寸" span={2}>
                        {params.chamber_size.map((s: string) => <Tag key={s} color="blue">{s}</Tag>)}
                      </Descriptions.Item>
                    )}
                    {params.sterilization && (
                      <Descriptions.Item label="灭菌方式" span={2}>
                        {params.sterilization.map((s: string) => <Tag key={s} color="green">{s}</Tag>)}
                      </Descriptions.Item>
                    )}
                    {params.cleanliness && (
                      <Descriptions.Item label="洁净等级" span={2}>
                        {params.cleanliness.map((s: string) => <Tag key={s} color="purple">{s}</Tag>)}
                      </Descriptions.Item>
                    )}
                    {params.material && (
                      <Descriptions.Item label="材质要求" span={2}>
                        {params.material.map((s: string) => <Tag key={s}>{s}</Tag>)}
                      </Descriptions.Item>
                    )}
                    {params.compliance && (
                      <Descriptions.Item label="合规要求" span={2}>
                        {params.compliance.map((s: string) => <Tag key={s} color="orange">{s}</Tag>)}
                      </Descriptions.Item>
                    )}
                    {params.quantity && (
                      <Descriptions.Item label="需求数量" span={2}>
                        {params.quantity.map((s: string) => <Tag key={s} color="red">{s}</Tag>)}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>

                {/* 推荐产品 */}
                {recommended.product && (
                  <Card title={<><CheckCircleOutlined style={{ color: '#52c41a' }} /> 推荐产品方案</>}>
                    <Alert
                      type="success"
                      message={
                        <span>
                          推荐产品：<strong>{recommended.product.name}</strong>（型号：{recommended.product.model}）
                          <Tag color="blue" style={{ marginLeft: 8 }}>匹配度 {recommended.confidence}%</Tag>
                        </span>
                      }
                      description={
                        <div>
                          <p>{recommended.product.spec}</p>
                          <p>参考报价：${recommended.product.base_price_usd?.toLocaleString()} USD</p>
                          <p>匹配关键词：{recommended.matched_keywords?.map((k: string) => <Tag key={k}>{k}</Tag>)}</p>
                        </div>
                      }
                      showIcon
                    />
                  </Card>
                )}

                {/* 技术方案预览 */}
                {proposal.sections && proposal.sections.map((section: any, idx: number) => (
                  <Card key={idx} title={section.title} extra={section.price_range ? <Tag color="red">{section.price_range}</Tag> : null}>
                    <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8 }}>
                      {section.content}
                    </div>
                    {section.table && (
                      <div style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 13 }}>
                        {section.table.map((line: string, i: number) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}

                {/* 操作按钮 */}
                <Card>
                  <Space>
                    <Button type="primary" icon={<FileTextOutlined />} onClick={() => message.success('技术方案导出中...')}>
                      导出DOCX方案
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => message.success('报价单导出中...')}>
                      导出报价单
                    </Button>
                    <Button onClick={() => { setResult(null); setActiveTab('input') }}>
                      重新输入
                    </Button>
                  </Space>
                </Card>

              </Space>
            </Spin>
          )
        }
      ]} />
    </div>
  )
}
