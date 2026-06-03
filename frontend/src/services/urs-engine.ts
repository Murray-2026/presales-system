/**
 * URS 分析引擎（前端版）
 * 
 * 移植自 Python 后端 urs_analyzer.py + proposal_generator.py
 * 所有逻辑在浏览器端运行，无需后端 API
 */

// ==================== 产品知识库 ====================

export interface Product {
  id: string
  name: string
  model: string
  category: string
  spec: string
  base_price_usd: number
  key_features: string[]
  keywords: string[]
  min_size_mm: number
  compliance: string[]
}

export interface ProductMatch {
  product: Product
  score: number
  matched_keywords: string[]
  confidence: number
}

export interface ExtractedParams {
  chamber_size?: string[]
  cleanliness?: string[]
  sterilization?: string[]
  material?: string[]
  quantity?: string[]
  compliance?: string[]
  control?: string[]
  [key: string]: string[] | undefined
}

export interface BudgetEstimate {
  min: number
  max: number
  currency: string
  base_model: string
}

export interface RequirementSummary {
  identified_count: number
  key_parameters: Record<string, string[] | undefined>
  suggested_product: string
  suggested_model: string
  estimated_budget: BudgetEstimate
}

export interface AnalysisResult {
  extracted_params: ExtractedParams
  matched_products: ProductMatch[]
  recommended_product: ProductMatch | null
  requirements_summary: RequirementSummary
  raw_text_length: number
}

export interface ProposalSection {
  title: string
  content: string
  table?: string[]
  price_usd?: number
  price_range?: string
}

export interface Proposal {
  title: string
  customer: string
  date: string
  language: string
  product: Product
  sections: ProposalSection[]
}

// ==================== 产品知识库数据 ====================

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: '无菌检测隔离器',
    model: 'ISO-1500',
    category: '无菌隔离器',
    spec: '工作舱1500×800×1800mm，ISO 5洁净等级，不锈钢304',
    base_price_usd: 150000,
    key_features: ['无菌检测', '无菌试验', '阳性检测', '无菌检查', 'isolator', 'sterile test'],
    keywords: ['无菌', 'sterile', 'iso', '阳性', '检测', '试验'],
    min_size_mm: 1200,
    compliance: ['中国GMP', 'EU GMP Annex 1', 'FDA'],
  },
  {
    id: '2',
    name: 'VHP灭菌隔离器',
    model: 'VHP-1200',
    category: 'VHP灭菌隔离器',
    spec: '工作舱1200×700×1600mm，VHP汽化过氧化氢灭菌',
    base_price_usd: 65000,
    key_features: ['vhp灭菌', '过氧化氢灭菌', '汽化灭菌', 'vhp sterilization'],
    keywords: ['vhp', '过氧化氢', '汽化', '灭菌', 'hydrogen peroxide', 'vaporized'],
    min_size_mm: 1000,
    compliance: ['中国GMP', 'EU GMP Annex 1'],
  },
  {
    id: '3',
    name: '集成式隔离器',
    model: 'INT-2000',
    category: '集成隔离器',
    spec: '多功能集成，全自动控制，可定制工作舱尺寸',
    base_price_usd: 580000,
    key_features: ['集成', '全自动', '多功能', '定制', 'integrated', 'automated'],
    keywords: ['集成', '全自动', '多功能', '定制', '一体化', 'integrated'],
    min_size_mm: 1500,
    compliance: ['中国GMP', 'EU GMP Annex 1', 'FDA', 'WHO'],
  },
  {
    id: '4',
    name: '负压隔离器',
    model: 'NEG-1000',
    category: '负压隔离器',
    spec: '负压维持-50Pa，生物安全防护，HEPA过滤',
    base_price_usd: 200000,
    key_features: ['负压', '生物安全', '负压维持', 'negative pressure', 'biosafety', 'containment'],
    keywords: ['负压', '生物安全', 'negative pressure', 'containment', '防护', '安全柜'],
    min_size_mm: 1000,
    compliance: ['中国GMP', '生物安全等级BSL-2/3', 'WHO'],
  },
  {
    id: '5',
    name: '百级层流传递窗',
    model: 'PB-LF-500',
    category: '传递窗',
    spec: '百级层流HEPA过滤，不锈钢304，紫外灭菌',
    base_price_usd: 25000,
    key_features: ['传递窗', '层流', '百级', 'pass box', 'laminar flow', '紫外灭菌'],
    keywords: ['传递窗', '层流', 'pass box', '传递'],
    min_size_mm: 500,
    compliance: ['中国GMP'],
  },
  {
    id: '6',
    name: 'VHP灭菌传递箱',
    model: 'PB-VHP-500',
    category: '传递窗',
    spec: 'VHP灭菌，双门互锁，304不锈钢',
    base_price_usd: 40000,
    key_features: ['传递箱', 'vhp灭菌传递', '双门互锁', 'vhp pass box', 'decontamination'],
    keywords: ['传递箱', 'vhp传递', '灭菌传递', '传递窗vhp'],
    min_size_mm: 500,
    compliance: ['中国GMP', 'EU GMP Annex 1'],
  },
]

// ==================== 参数提取正则模式 ====================

const PARAM_PATTERNS: Record<string, RegExp[]> = {
  chamber_size: [
    /(\d+[×xX*]\d+[×xX*]\d+)\s*(mm|MM)?/g,
    /尺寸[：:为]?\s*(\d+[×xX*]\d+[×xX*]\d+)/gi,
    /工作舱[：:]?\s*(\d+[×xX*]\d+[×xX*]\d+)/gi,
  ],
  cleanliness: [
    /(ISO\s*\d+|Class\s*\d+|百级|万级|十万级|A级|B级|C级|D级)/gi,
    /洁净[等级度]?[：:]?\s*(\S+)/gi,
  ],
  sterilization: [
    /(VHP|汽化过氧化氢|过氧化氢|臭氧|紫外|高温灭菌|湿热灭菌|干热灭菌|辐照)/gi,
    /灭菌[方式方法]?[：:]?\s*(\S+)/gi,
  ],
  material: [
    /(不锈钢|SUS304|SUS316L|304不锈钢|316L不锈钢|316不锈钢)/gi,
    /材质[：:]?\s*(\S+)/gi,
  ],
  quantity: [
    /(\d+)\s*台/g,
    /数量[：:]?\s*(\d+)/gi,
    /需求[：:]?\s*(\d+)\s*台/gi,
  ],
  compliance: [
    /(GMP|FDA|EU\s*GMP|WHO|CE|ISO\s*\d+)/gi,
    /合规[：:]?\s*(\S+)/gi,
    /符合[：:]?\s*(\S+标准)/gi,
  ],
  control: [
    /(PLC|触摸屏|HMI|远程监控|SCADA|计算机化|数据记录|审计追踪)/gi,
    /控制[系统方式]?[：:]?\s*(\S+)/gi,
  ],
}

// ==================== 分析主引擎 ====================

/**
 * 从文本中提取结构化参数
 */
function extractParameters(text: string): ExtractedParams {
  const params: ExtractedParams = {}
  for (const [paramName, patterns] of Object.entries(PARAM_PATTERNS)) {
    const found = new Set<string>()
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern)
      for (const m of matches) {
        // 取第一个捕获组
        const val = m[1] || m[0]
        if (val && val.trim()) {
          found.add(val.trim())
        }
      }
    }
    if (found.size > 0) {
      params[paramName] = Array.from(found)
    }
  }
  return params
}

/**
 * 产品匹配
 */
function matchProducts(text: string, params: ExtractedParams): ProductMatch[] {
  const textLower = text.toLowerCase()
  const results: ProductMatch[] = []

  for (const product of PRODUCTS) {
    let score = 0
    const matchedKeywords: string[] = []

    // 关键词匹配（权重2）
    for (const kw of product.keywords) {
      if (textLower.includes(kw.toLowerCase())) {
        score += 2
        matchedKeywords.push(kw)
      }
    }

    // 特征词匹配（权重3）
    for (const feat of product.key_features) {
      if (textLower.includes(feat.toLowerCase())) {
        score += 3
        if (!matchedKeywords.includes(feat)) {
          matchedKeywords.push(feat)
        }
      }
    }

    // 合规要求匹配（权重1）
    for (const comp of product.compliance) {
      if (textLower.includes(comp.toLowerCase())) {
        score += 1
      }
    }

    // 尺寸参数匹配（权重1）
    if (params.chamber_size && params.chamber_size.length > 0) {
      score += 1
    }

    // 灭菌方式匹配（权重2）
    if (params.sterilization) {
      for (const s of params.sterilization) {
        if (product.keywords.some(kw => s.toLowerCase().includes(kw.toLowerCase()))) {
          score += 2
        }
      }
    }

    results.push({
      product,
      score,
      matched_keywords: matchedKeywords.slice(0, 5),
      confidence: 0, // 后续计算
    })
  }

  return results
}

/**
 * 计算匹配置信度 (0-100)
 */
function calculateConfidence(match: ProductMatch, _params: ExtractedParams): number {
  const maxPossible =
    PRODUCTS.reduce((sum, p) => sum + p.keywords.length * 2 + p.key_features.length * 3, 0) / PRODUCTS.length
  const raw = (match.score / Math.max(1, maxPossible)) * 100
  return Math.round(Math.min(raw, 100) * 10) / 10
}

/**
 * 估算预算
 */
function estimateBudget(matches: ProductMatch[], params: ExtractedParams): BudgetEstimate {
  if (matches.length === 0) {
    return { min: 0, max: 0, currency: 'USD', base_model: '' }
  }

  const top = matches[0].product
  const base = top.base_price_usd

  let multiplier = 1.0
  if (params.control) {
    if (params.control.some(c => c.includes('远程') || c.includes('计算机化'))) {
      multiplier += 0.15
    }
  }
  if (params.material) {
    if (params.material.some(m => m.includes('316'))) {
      multiplier += 0.10
    }
  }

  return {
    min: Math.round(base * multiplier * 0.9),
    max: Math.round(base * multiplier * 1.2),
    currency: 'USD',
    base_model: top.model,
  }
}

/**
 * 生成需求分析摘要
 */
function generateRequirements(
  text: string,
  params: ExtractedParams,
  matches: ProductMatch[]
): RequirementSummary {
  const topProduct = matches[0]?.product || null

  const keyParams: Record<string, string[] | undefined> = {}
  for (const k of ['chamber_size', 'sterilization', 'cleanliness', 'material', 'quantity']) {
    if (params[k]) {
      keyParams[k] = params[k]
    }
  }

  return {
    identified_count: Object.keys(params).length,
    key_parameters: keyParams,
    suggested_product: topProduct?.name || '需进一步分析',
    suggested_model: topProduct?.model || '',
    estimated_budget: estimateBudget(matches, params),
  }
}

// ==================== 导出函数 ====================

/**
 * 分析URS文本 - 完全前端版
 */
export function analyzeURSText(text: string): AnalysisResult {
  // 1. 提取参数
  const params = extractParameters(text)

  // 2. 匹配产品
  const matches = matchProducts(text, params)

  // 3. 计算置信度
  for (const match of matches) {
    match.confidence = calculateConfidence(match, params)
  }

  // 4. 排序：最佳匹配在前
  matches.sort((a, b) => b.score - a.score)

  // 5. 生成需求清单
  const requirements = generateRequirements(text, params, matches)

  return {
    extracted_params: params,
    matched_products: matches.slice(0, 3),
    recommended_product: matches[0] || null,
    requirements_summary: requirements,
    raw_text_length: text.length,
  }
}

// ==================== 方案生成器 ====================

/**
 * 根据URS分析结果自动生成技术方案和报价单
 */
export function generateProposal(
  analysis: AnalysisResult,
  customer: string = '',
  language: string = '中文'
): Proposal {
  const params = analysis.extracted_params
  const recommended = analysis.recommended_product
  const product = recommended?.product || PRODUCTS[0]
  const budget = analysis.requirements_summary.estimated_budget

  const proposal: Proposal = {
    title: `${product.name}技术方案`,
    customer: customer || '待确认客户',
    date: new Date().toISOString().slice(0, 10),
    language,
    product,
    sections: [],
  }

  // 1. 项目概述
  proposal.sections.push({
    title: '项目概述',
    content: generateProjectOverview(product, params, language),
  })

  // 2. 产品规格
  proposal.sections.push({
    title: '产品规格与技术参数',
    content: generateSpecifications(product, params, language),
  })

  // 3. 配置清单
  const config = generateConfigList(product, params, language)
  proposal.sections.push({
    title: '标准配置清单',
    content: config.text,
    table: config.table,
  })

  // 4. 合规与验证
  proposal.sections.push({
    title: '合规与验证',
    content: generateCompliance(product, language),
  })

  // 5. 报价
  proposal.sections.push({
    title: '报价概要',
    content: generateQuote(budget, language),
    price_usd: budget.min,
    price_range: `$${budget.min.toLocaleString()} - $${budget.max.toLocaleString()} USD`,
  })

  // 6. 可选配置
  proposal.sections.push({
    title: '可选配置项',
    content: generateOptions(language),
  })

  return proposal
}

function generateProjectOverview(product: Product, params: ExtractedParams, lang: string): string {
  if (lang === '中文') {
    let text =
      `本方案针对客户URS需求，推荐采用 ${product.name} (${product.model}) 型号产品。\n\n` +
      `${product.spec}\n\n` +
      '该方案充分考虑了客户在工艺需求、洁净等级、合规要求等方面的URS输入，' +
      '提供从设备交付到验证服务的完整解决方案。'
    if (params.chamber_size && params.chamber_size.length > 0) {
      text += `\n\n根据URS中提出的工作舱尺寸要求 (${params.chamber_size.join('、')})，推荐配置已满足或超过需求指标。`
    }
    return text
  }
  return (
    `This proposal is based on the customer's URS requirements, recommending the ${product.name} (${product.model}).\n\n` +
    `${product.spec}\n\n` +
    'The solution fully addresses the customer\'s process requirements, cleanliness levels, and compliance needs.'
  )
}

function generateSpecifications(product: Product, _params: ExtractedParams, lang: string): string {
  if (lang === '中文') {
    return [
      '| 参数 | 规格 |',
      '|------|------|',
      '| 工作舱材质 | 不锈钢304 (SUS304) |',
      '| 表面处理 | 内表面镜面抛光Ra≤0.4μm，外表面拉丝处理 |',
      '| 洁净等级 | ISO 5 (Class 100) |',
      '| 密封方式 | 充气密封/机械密封 |',
      '| 控制系统 | PLC + 触摸屏人机界面 |',
      '| 数据记录 | 支持数据导出和审计追踪 |',
    ].join('\n')
  }
  return [
    '| Parameter | Specification |',
    '|---|---|',
    '| Chamber Material | Stainless Steel 304 (SUS304) |',
    '| Surface Finish | Mirror polish Ra≤0.4μm interior, brushed exterior |',
    '| Cleanliness | ISO 5 (Class 100) |',
    '| Sealing | Inflatable seal / Mechanical seal |',
    '| Control System | PLC + Touch Screen HMI |',
    '| Data Recording | Data export and audit trail |',
  ].join('\n')
}

function generateConfigList(product: Product, _params: ExtractedParams, lang: string): { text: string; table: string[] } {
  const base = product.base_price_usd
  const items = [
    { name: '主机系统', qty: 1, price: base, note: '包含工作舱、控制系统、HEPA过滤' },
    { name: '传递窗/传递口', qty: 2, price: 0, note: '标准配置' },
    { name: '手套口组件', qty: 2, price: 0, note: '含手套' },
    { name: '紫外灭菌灯', qty: 1, price: 0, note: '标准配置' },
    { name: '压差监测系统', qty: 1, price: 0, note: '实时显示' },
    { name: 'IQ/OQ验证文件', qty: 1, price: 0, note: '中英文可选' },
  ]

  const labelName = lang === '中文' ? '配置项' : 'Item'
  const labelQty = lang === '中文' ? '数量' : 'Qty'
  const labelPrice = lang === '中文' ? '价格 (USD)' : 'Price (USD)'
  const labelNote = lang === '中文' ? '备注' : 'Note'

  const table: string[] = [
    `| ${labelName} | ${labelQty} | ${labelPrice} | ${labelNote} |`,
    '|---|---|---|---|',
  ]
  for (const item of items) {
    const priceStr = item.price > 0 ? `$${item.price.toLocaleString()}` : '标准配置'
    table.push(`| ${item.name} | ${item.qty} | ${priceStr} | ${item.note} |`)
  }

  const total = items.reduce((s, i) => s + i.price, 0)
  const text = total > 0 ? `**总价: $${total.toLocaleString()} USD**` : ''

  return { text, table }
}

function generateCompliance(product: Product, lang: string): string {
  const compliances = product.compliance

  if (lang === '中文') {
    return [
      '本产品符合以下标准与规范：\n',
      ...compliances.map(c => `- ✅ ${c}`),
      '',
      '提供完整的验证文件包：',
      '- 设计确认 (DQ)',
      '- 安装确认 (IQ)',
      '- 运行确认 (OQ)',
      '- 性能确认 (PQ) - 可选',
    ].join('\n')
  }
  return [
    'This product complies with the following standards:\n',
    ...compliances.map(c => `- ✅ ${c}`),
    '',
    'Complete validation documentation package:',
    '- Design Qualification (DQ)',
    '- Installation Qualification (IQ)',
    '- Operational Qualification (OQ)',
    '- Performance Qualification (PQ) - Optional',
  ].join('\n')
}

function generateQuote(budget: BudgetEstimate, lang: string): string {
  if (lang === '中文') {
    return (
      `**参考报价范围**\n\n` +
      `基础配置：$${budget.min.toLocaleString()} USD\n` +
      `高配范围：$${budget.max.toLocaleString()} USD\n\n` +
      '最终报价取决于URS确认的具体配置项、可选件及验证服务范围。\n' +
      '报价有效期：30天'
    )
  }
  return (
    `**Estimated Price Range**\n\n` +
    `Base Configuration: $${budget.min.toLocaleString()} USD\n` +
    `Fully Loaded: $${budget.max.toLocaleString()} USD\n\n` +
    'Final quote depends on confirmed URS configuration, options, and validation scope.\n' +
    'Quote valid for 30 days.'
  )
}

function generateOptions(lang: string): string {
  if (lang === '中文') {
    return [
      '| 可选配置 | 说明 | 参考价格 (USD) |',
      '|----------|------|---------------|',
      '| 材质升级316L | 耐腐蚀不锈钢 | +$8,000 |',
      '| 远程监控系统 | Web/APP远程查看 | +$12,000 |',
      '| PQ验证服务 | 性能确认全套 | +$15,000 |',
      '| 温湿度监测 | 实时记录+报警 | +$5,000 |',
      '| 审计追踪 | 21 CFR Part 11合规 | +$10,000 |',
    ].join('\n')
  }
  return [
    '| Option | Description | Price (USD) |',
    '|--------|-------------|-------------|',
    '| 316L Upgrade | Corrosion-resistant | +$8,000 |',
    '| Remote Monitoring | Web/APP access | +$12,000 |',
    '| PQ Validation | Performance Qualification | +$15,000 |',
    '| Temp/Humidity Monitor | Real-time + alarm | +$5,000 |',
    '| Audit Trail | 21 CFR Part 11 compliance | +$10,000 |',
  ].join('\n')
}

// ==================== 文档解析器 ====================

// 使用静态导入避免GitHub Pages子路径动态加载问题
import * as mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'

/**
 * 解析DOCX文件 - 使用 mammoth.js
 */
export async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

/**
 * 解析PDF文件 - 使用 pdfjs-dist
 */
export async function parsePdf(file: File): Promise<string> {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const textParts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item: any) => item.str).join(' ')
    if (pageText.trim()) {
      textParts.push(pageText.trim())
    }
  }
  return textParts.join('\n\n')
}

/**
 * 解析TXT文件
 */
export async function parseTxt(file: File): Promise<string> {
  return await file.text()
}

/**
 * 自动识别文件类型并解析
 */
export async function parseURSFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'docx':
      return parseDocx(file)
    case 'pdf':
      return parsePdf(file)
    case 'txt':
      return parseTxt(file)
    default:
      throw new Error(`不支持的文件格式: ${ext}，支持：DOCX, PDF, TXT`)
  }
}
