const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

// ============ 常量 ============
const CONTENT_WIDTH = 9026; // A4 with 1440 margins: 11906 - 2*1440
const BLUE = "1F4E79";
const LIGHT_BLUE = "D6E4F0";
const DARK = "333333";
const GRAY = "666666";
const WHITE = "FFFFFF";
const BLACK = "000000";

// ============ 样式工具 ============
const bdr = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color });
const borders = { top: bdr(), bottom: bdr(), left: bdr(), right: bdr() };
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: WHITE }, bottom: { style: BorderStyle.NONE, size: 0, color: WHITE }, left: { style: BorderStyle.NONE, size: 0, color: WHITE }, right: { style: BorderStyle.NONE, size: 0, color: WHITE } };

const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 120, line: 360, ...opts.spacing },
  alignment: opts.align || AlignmentType.JUSTIFIED,
  indent: opts.indent || undefined,
  children: [new TextRun({ text, font: "微软雅黑", size: 21, color: DARK, ...opts.run })]
});

const pH1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 200 },
  children: [new TextRun({ text, font: "微软雅黑", size: 32, bold: true, color: BLUE })]
});

const pH2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 160 },
  children: [new TextRun({ text, font: "微软雅黑", size: 28, bold: true, color: BLUE })]
});

const pH3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 120 },
  children: [new TextRun({ text, font: "微软雅黑", size: 24, bold: true, color: DARK })]
});

const emptyP = () => new Paragraph({ spacing: { after: 60 }, children: [] });

const headerCell = (text, width) => new TableCell({
  borders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: BLUE, type: ShadingType.CLEAR },
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  verticalAlign: "center",
  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, font: "微软雅黑", size: 20, bold: true, color: WHITE })] })]
});

const dataCell = (text, width, opts = {}) => new TableCell({
  borders,
  width: { size: width, type: WidthType.DXA },
  shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
  margins: { top: 50, bottom: 50, left: 100, right: 100 },
  verticalAlign: "center",
  children: [new Paragraph({ alignment: opts.align || AlignmentType.LEFT, children: [new TextRun({ text, font: "微软雅黑", size: 20, color: DARK })] })]
});

const makeTable = (headers, rows, colWidths) => {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map((h, i) => headerCell(h, colWidths[i])) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => dataCell(cell, colWidths[ci], { shading: ri % 2 === 1 ? LIGHT_BLUE : undefined }))
      }))
    ]
  });
};

// ============ 编号定义 ============
const numbering = {
  config: [
    { reference: "bullet1", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "num1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "num2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "num3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "num4", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "num5", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "num6", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "num7", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "num8", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "bullet2", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "bullet3", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "bullet4", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "bullet5", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]
};

// ============ 文档主体 ============
const doc = new Document({
  numbering,
  styles: {
    default: { document: { run: { font: "微软雅黑", size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "微软雅黑", color: BLUE },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "微软雅黑", color: BLUE },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "微软雅黑", color: DARK },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [
    // ========== 封面 ==========
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: [
        emptyP(), emptyP(), emptyP(), emptyP(), emptyP(), emptyP(), emptyP(), emptyP(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
          new TextRun({ text: "企业售前标准化体系建设规划", font: "微软雅黑", size: 52, bold: true, color: BLUE })
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
          new TextRun({ text: "——从 0 到 1 的完整实施方案", font: "微软雅黑", size: 28, color: GRAY })
        ]}),
        emptyP(), emptyP(), emptyP(), emptyP(), emptyP(), emptyP(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
          new TextRun({ text: "编制依据：GB/T 15496、GB/T 15497、GB/T 15498、GB/T 35778", font: "微软雅黑", size: 22, color: GRAY })
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
          new TextRun({ text: "适用领域：医药隔离器及洁净设备售前技术支持", font: "微软雅黑", size: 22, color: GRAY })
        ]}),
        emptyP(), emptyP(), emptyP(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
          new TextRun({ text: "文件编号：STD-PRE-V1.0", font: "微软雅黑", size: 22, color: DARK })
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
          new TextRun({ text: "版本号：V1.0", font: "微软雅黑", size: 22, color: DARK })
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
          new TextRun({ text: "编制日期：2026 年 5 月", font: "微软雅黑", size: 22, color: DARK })
        ]}),
        emptyP(), emptyP(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "[企业名称]", font: "微软雅黑", size: 26, bold: true, color: BLUE })
        ]}),
      ]
    },
    // ========== 目录 ==========
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: [
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "目  录", font: "微软雅黑", size: 36, bold: true, color: BLUE })] }),
        new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
      ]
    },
    // ========== 正文 ==========
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "企业售前标准化体系建设规划  STD-PRE-V1.0", font: "微软雅黑", size: 16, color: GRAY })]
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "第 ", font: "微软雅黑", size: 18, color: GRAY }),
            new TextRun({ children: [PageNumber.CURRENT], font: "微软雅黑", size: 18, color: GRAY }),
            new TextRun({ text: " 页 / 共 ", font: "微软雅黑", size: 18, color: GRAY }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "微软雅黑", size: 18, color: GRAY }),
            new TextRun({ text: " 页", font: "微软雅黑", size: 18, color: GRAY }),
          ]
        })] })
      },
      children: [

// ====================== 第一章 总则与背景 ======================
pH1("第一章  总则与背景"),

pH2("1.1 编制目的"),
p("本规划旨在为企业在医药隔离器及洁净设备售前技术支持领域建立一套完整的标准化体系。通过系统性地编制、实施和持续改进技术标准、管理标准和工作标准，实现售前工作从经验驱动向标准驱动的转变，提升售前方案质量、缩短响应周期、降低合规风险，最终增强企业的核心竞争力。"),
p("本规划遵循 GB/T 15496-2017《企业标准体系 要求》、GB/T 15497-2017《企业标准体系 产品实现》、GB/T 15498-2017《企业标准体系 基础保障》及 GB/T 35778-2017《企业标准化工作 指南》等国家标准，确保体系建设过程的规范性和权威性。"),

pH2("1.2 编制依据"),
p("本规划的编制依据以下国家和行业标准："),
makeTable(
  ["标准编号", "标准名称", "适用范围"],
  [
    ["GB/T 15496-2017", "企业标准体系 要求", "标准体系总体框架与编制原则"],
    ["GB/T 15497-2017", "企业标准体系 产品实现", "技术标准体系的结构设计"],
    ["GB/T 15498-2017", "企业标准体系 基础保障", "管理标准体系与工作标准体系"],
    ["GB/T 35778-2017", "企业标准化工作 指南", "标准化工作的组织与实施流程"],
    ["GB/T 1.1-2020", "标准化工作导则 第1部分：标准化文件的结构和起草规则", "标准文件的格式规范"],
    ["GB 50457-2019", "医药工业洁净厂房设计标准", "医药洁净厂房设计技术要求"],
    ["GB/T 25915-2021", "洁净室及相关受控环境", "隔离器洁净等级技术依据"],
    ["ISO 14644", "洁净室及相关受控环境", "国际标准参考"],
  ],
  [2000, 3800, 3226]
),
emptyP(),

pH2("1.3 适用范围"),
p("本规划适用于企业售前技术支持部门及相关协作部门的标准化工作，具体覆盖："),
new Paragraph({ numbering: { reference: "bullet1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "医药隔离器（无菌隔离器、VHP 隔离器、负压隔离器、集成隔离器）的售前技术方案编制", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "售前技术选型、配置报价、方案评审与客户交付全流程", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "售前与研发、生产、质量、注册等部门的接口协调", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet1", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "售前技术文档的管理、版本控制与持续改进", font: "微软雅黑", size: 21, color: DARK })] }),

pH2("1.4 标准化工作原则"),
p("根据 GB/T 15496 的要求，本体系的标准化工作遵循以下基本原则："),
makeTable(
  ["原则", "内涵说明", "售前实践要求"],
  [
    ["系统性", "标准体系应覆盖售前工作的全部环节，形成有机整体", "从客户需求识别到方案交付全流程标准化"],
    ["科学性", "标准内容应基于科学原理和实践验证", "技术参数依据法规标准，报价模型基于成本分析"],
    ["先进性", "标准应体现行业最新技术和管理水平", "跟踪 FDA、EU GMP Annex 1 等最新法规动态"],
    ["适用性", "标准应适合企业实际情况和行业特点", "兼顾不同隔离器类型和客户场景的差异化需求"],
    ["规范性", "标准的编制和实施应符合国家标准化法律法规", "遵循 GB/T 1.1 格式，建立审批发布流程"],
  ],
  [1200, 3500, 4326]
),
emptyP(),

// ====================== 第二章 体系架构设计 ======================
pH1("第二章  标准体系架构设计"),

pH2("2.1 总体框架"),
p("根据 GB/T 15496-2017 的要求，企业标准体系由技术标准体系、管理标准体系和工作标准体系三个子体系构成。结合售前业务特点，本规划将三个子体系分别对应为：售前技术标准体系（TS）、售前管理标准体系（MS）和售前工作标准体系（WS），形成'一体三翼'的标准化架构。"),
emptyP(),
p("体系框架概览："),
makeTable(
  ["子体系", "编号前缀", "覆盖范围", "标准数量（规划）"],
  [
    ["售前技术标准体系", "TS", "产品技术规范、方案设计、配置参数、合规要求", "约 40-50 项"],
    ["售前管理标准体系", "MS", "流程管理、质量管控、文档管理、信息管理", "约 25-35 项"],
    ["售前工作标准体系", "WS", "岗位职责、能力要求、绩效考核、行为规范", "约 15-20 项"],
  ],
  [2200, 1200, 3800, 1826]
),
emptyP(),

pH2("2.2 售前技术标准体系（TS）"),
pH3("2.2.1 TS-100 产品技术基础标准"),
p("产品技术基础标准是整个技术标准体系的根基，定义隔离器产品的核心分类、基本参数和通用技术要求。"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["TS-101", "隔离器产品分类与编码规范", "定义无菌/VHP/负压/集成四类隔离器的分类编码规则"],
    ["TS-102", "隔离器通用技术参数标准", "规定舱体尺寸、材质、密封性、洁净等级等基础参数"],
    ["TS-103", "隔离器洁净等级技术要求", "依据 ISO 14644 定义各等级隔离器的洁净度指标"],
    ["TS-104", "隔离器安全防护技术规范", "OEB/OEL 等级对应的安全防护要求与验证方法"],
    ["TS-105", "隔离器核心部件选型标准", "手套系统、传递窗、RTP 接口等关键部件的选型规范"],
  ],
  [1500, 3000, 4526]
),
emptyP(),

pH3("2.2.2 TS-200 方案设计标准"),
p("方案设计标准规范售前技术方案的编制流程、内容要求和输出模板。"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["TS-201", "售前方案编制通用规范", "方案文件的结构、章节、审批流程等通用要求"],
    ["TS-202", "无菌隔离器方案设计规范", "无菌隔离器的配置选型、工艺适配、合规审查要点"],
    ["TS-203", "VHP 隔离器方案设计规范", "汽化过氧化氢灭菌系统的配置与验证方案要求"],
    ["TS-204", "负压隔离器方案设计规范", "负压防护隔离器的排风过滤、压差控制等设计要点"],
    ["TS-205", "集成隔离器方案设计规范", "产线级集成隔离器的布局、接口、自动化集成方案"],
    ["TS-206", "隔离器选型矩阵", "基于客户工艺需求的隔离器类型推荐决策矩阵"],
    ["TS-207", "方案配置清单模板规范", "标准化的方案配置清单格式与填写规范"],
  ],
  [1500, 3200, 4326]
),
emptyP(),

pH3("2.2.3 TS-300 配置报价标准"),
p("配置报价标准确保售前报价的准确性和一致性，避免因人为因素导致的报价偏差。"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["TS-301", "隔离器配置报价模型规范", "标准化的成本核算模型、利润率和汇率换算规则"],
    ["TS-302", "标准配置价格表管理规范", "各类型隔离器标准配置的价格表编制与更新机制"],
    ["TS-303", "选配项价格管理规范", "可选配置项的价格定义、组合规则与折扣策略"],
    ["TS-304", "多币种报价换算标准", "人民币/美元/欧元报价的汇率更新与换算规则"],
    ["TS-305", "报价有效期与变更管理", "报价有效期、价格变更条件和客户通知机制"],
  ],
  [1500, 3200, 4326]
),
emptyP(),

pH3("2.2.4 TS-400 合规与验证标准"),
p("医药行业对合规性要求极高，售前阶段必须确保方案符合相关法规和验证要求。"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["TS-401", "FDA 21 CFR Part 11 合规要求", "电子记录与电子签名相关要求在售前方案中的体现"],
    ["TS-402", "EU GMP Annex 1 适应性要求", "欧盟 GMP 附录一对隔离器方案的具体要求清单"],
    ["TS-403", "中国 GMP 合规要求", "中国药品生产质量管理规范对隔离器的合规要求"],
    ["TS-404", "验证方案（IQ/OQ/PQ）模板", "安装/运行/性能确认的标准方案模板与检查清单"],
    ["TS-405", "合规审查清单", "售前方案提交前的法规合规性逐项审查清单"],
  ],
  [1500, 3600, 3926]
),
emptyP(),

pH2("2.3 售前管理标准体系（MS）"),
pH3("2.3.1 MS-100 流程管理标准"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["MS-101", "售前项目立项与分配流程", "客户需求评估、项目分级、售前资源分配的标准流程"],
    ["MS-102", "售前方案编制与评审流程", "方案从需求调研到内部评审再到客户提交的完整流程"],
    ["MS-103", "售前技术交流管理流程", "技术交流会、工厂参观、方案演示的组织规范"],
    ["MS-104", "售前到售后的交接流程", "售前方案与合同技术附件向工程实施部门的交接规范"],
    ["MS-105", "售前异常问题处理流程", "技术变更、客户投诉、方案修订的应急处理机制"],
  ],
  [1500, 3200, 4326]
),
emptyP(),

pH3("2.3.2 MS-200 质量管控标准"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["MS-201", "售前方案质量评价标准", "方案完整性、准确性、合规性的量化评价指标"],
    ["MS-202", "售前标准化审查实施办法", "定期标准化审查的频次、范围、方法和整改要求"],
    ["MS-203", "售前体系检查管理办法", "标准体系运行状态的检查评估机制"],
    ["MS-204", "售前不合格项纠正与预防", "不符合标准要求的项目纠正措施与预防机制"],
  ],
  [1500, 3600, 3926]
),
emptyP(),

pH3("2.3.3 MS-300 文档管理标准"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["MS-301", "售前标准文件编码规则", "标准文件编号、版本号、修订状态的编码体系"],
    ["MS-302", "售前标准文件编制与审批流程", "标准文件的起草、审核、批准、发布的标准程序"],
    ["MS-303", "售前文档版本控制规范", "文档变更的版本管理、修订记录和追溯要求"],
    ["MS-304", "售前档案管理与归档标准", "项目档案的分类、归档周期、保管期限与销毁规则"],
  ],
  [1500, 3600, 3926]
),
emptyP(),

pH3("2.3.4 MS-400 标准化信息管理标准"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["MS-401", "法规标准信息收集与更新制度", "国内外相关法规和技术标准的跟踪收集与更新机制"],
    ["MS-402", "行业技术情报管理制度", "竞品技术动态、行业趋势的信息采集与分析方法"],
    ["MS-403", "客户需求信息管理规范", "客户需求信息的采集、分类、分析和标准化转化流程"],
    ["MS-404", "售前知识库建设与管理规范", "技术知识库的结构设计、内容维护与使用规范"],
    ["MS-405", "标准化培训管理规范", "标准化知识培训的策划、实施、考核与效果评估"],
  ],
  [1500, 3600, 3926]
),
emptyP(),

pH2("2.4 售前工作标准体系（WS）"),
pH3("2.4.1 WS-100 岗位职责标准"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["WS-101", "售前工程师岗位说明书", "售前工程师的职责范围、权限和任职条件"],
    ["WS-102", "售前主管岗位说明书", "售前团队管理的职责、绩效指标和管理权限"],
    ["WS-103", "售前技术审核员岗位说明书", "方案技术审核的职责、资质要求和审批权限"],
    ["WS-104", "售前标准化专员岗位说明书", "标准化体系维护和推进的职责范围"],
  ],
  [1500, 3200, 4326]
),
emptyP(),

pH3("2.4.2 WS-200 能力与培训标准"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["WS-201", "售前工程师能力素质模型", "售前岗位所需的技术能力、沟通能力和商业能力分级标准"],
    ["WS-202", "售前工程师入职培训大纲", "新入职售前人员的系统培训课程与考核要求"],
    ["WS-203", "售前技能持续提升规划", "在职售前人员的技能进阶路径与培训计划"],
    ["WS-204", "售前资质认证管理规范", "售前岗位所需资质证书的清单、获取与维护要求"],
  ],
  [1500, 3200, 4326]
),
emptyP(),

pH3("2.4.3 WS-300 绩效与考核标准"),
makeTable(
  ["标准编号", "标准名称", "主要内容概述"],
  [
    ["WS-301", "售前绩效指标体系", "方案通过率、响应时效、客户满意度等 KPI 定义"],
    ["WS-302", "售前绩效考核实施办法", "绩效数据的采集方法、考核周期和结果应用"],
    ["WS-303", "售前标准化贡献评估", "对标准化工作的参与度和贡献度的评估标准"],
  ],
  [1500, 3600, 3926]
),
emptyP(),

// ====================== 第三章 标准化组织架构 ======================
pH1("第三章  标准化组织架构与职责"),

pH2("3.1 组织架构设计"),
p("根据 GB/T 35778 的要求，企业应建立明确的标准化组织架构，确保标准化工作的有效推进。售前标准化组织架构采用'领导层-管理层-执行层'三级管理模式。"),
makeTable(
  ["层级", "角色", "组成人员", "主要职责"],
  [
    ["领导层", "标准化管理委员会", "分管副总、技术总监、质量总监", "战略决策、资源保障、重大标准审批"],
    ["管理层", "售前标准化工作组", "售前主管、标准化专员、各类型售前骨干", "体系规划、标准编制组织、实施监督"],
    ["执行层", "售前标准化执行小组", "全体售前工程师", "标准执行、反馈问题、参与修订"],
  ],
  [1000, 1800, 2800, 3426]
),
emptyP(),

pH2("3.2 岗位职责与分工"),
pH3("3.2.1 标准化管理委员会职责"),
new Paragraph({ numbering: { reference: "num1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "审批售前标准化体系建设的总体规划和年度工作计划", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "审定发布技术标准体系和管理标准体系的核心标准", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "协调跨部门标准化工作的资源调配和冲突解决", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num1", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "对标准化体系运行效果进行年度评审和战略调整", font: "微软雅黑", size: 21, color: DARK })] }),

pH3("3.2.2 售前标准化工作组职责"),
new Paragraph({ numbering: { reference: "num2", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "组织制定售前标准体系的建设方案和实施路线图", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num2", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "组织协调技术标准、管理标准和工作标准的编制工作", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num2", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "开展标准化审查和体系检查，监督标准执行情况", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num2", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "组织标准化培训、经验交流和持续改进活动", font: "微软雅黑", size: 21, color: DARK })] }),

pH2("3.3 资源保障"),
p("为确保标准化工作的有效开展，需要以下资源保障："),
makeTable(
  ["资源类型", "具体内容", "保障方式"],
  [
    ["人力资源", "专职标准化专员 1 名，兼职标准化成员 3-5 名", "纳入部门编制，明确岗位职责"],
    ["经费保障", "标准编制、培训、外部咨询等年度预算", "纳入部门年度预算计划"],
    ["信息资源", "标准法规数据库、行业期刊、竞品资料库", "订阅标准化信息服务平台"],
    ["工具平台", "文档管理系统、知识库平台、项目管理系统", "统一部署信息化管理工具"],
    ["时间保障", "标准编制和评审的专项工时", "每月不少于 2 个工作日用于标准化工作"],
  ],
  [1500, 3500, 4026]
),
emptyP(),

// ====================== 第四章 实施路线图 ======================
pH1("第四章  实施路线图"),

pH2("4.1 总体实施策略"),
p("售前标准化体系建设采用'统筹规划、分步实施、急用先行、持续迭代'的策略。整个建设周期规划为 18 个月，分为四个阶段推进："),
emptyP(),
makeTable(
  ["阶段", "时间周期", "阶段目标", "关键里程碑"],
  [
    ["第一阶段：基础搭建", "第 1-3 个月", "建立组织架构，发布基础标准", "组织成立、首批 10 项核心标准发布"],
    ["第二阶段：框架完善", "第 4-8 个月", "完善三大子体系标准", "标准覆盖率达到 60% 以上"],
    ["第三阶段：深化运行", "第 9-14 个月", "全面推行，持续优化", "体系试运行，首次标准化审查"],
    ["第四阶段：持续改进", "第 15-18 个月", "体系认证，固化成果", "通过体系评审，建立 PDCA 循环"],
  ],
  [1600, 1400, 2600, 3426]
),
emptyP(),

pH2("4.2 第一阶段：基础搭建（第 1-3 个月）"),
pH3("4.2.1 组织筹备"),
new Paragraph({ numbering: { reference: "num3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "成立标准化管理委员会，明确分管领导和成员名单（第 1 周）", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "成立售前标准化工作组，指定标准化专员（第 2 周）", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "召开标准化体系建设启动会，宣贯建设目标和计划（第 2 周）", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num3", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "完成售前现状调研，识别标准化需求与差距（第 3-4 周）", font: "微软雅黑", size: 21, color: DARK })] }),

pH3("4.2.2 首批标准编制"),
p("优先编制使用频次最高、对业务影响最大的核心标准："),
makeTable(
  ["序号", "标准编号", "标准名称", "编制责任人", "完成时间"],
  [
    ["1", "MS-102", "售前方案编制与评审流程", "售前主管", "第 6 周"],
    ["2", "TS-201", "售前方案编制通用规范", "资深售前", "第 7 周"],
    ["3", "TS-102", "隔离器通用技术参数标准", "技术骨干", "第 7 周"],
    ["4", "TS-301", "隔离器配置报价模型规范", "售前主管", "第 8 周"],
    ["5", "TS-206", "隔离器选型矩阵", "全体骨干", "第 8 周"],
    ["6", "MS-301", "售前标准文件编码规则", "标准化专员", "第 5 周"],
    ["7", "TS-405", "合规审查清单", "质量骨干", "第 9 周"],
    ["8", "MS-401", "法规标准信息收集与更新制度", "标准化专员", "第 9 周"],
    ["9", "WS-101", "售前工程师岗位说明书", "售前主管", "第 10 周"],
    ["10", "MS-303", "售前文档版本控制规范", "标准化专员", "第 10 周"],
  ],
  [600, 1200, 3200, 1300, 2726]
),
emptyP(),

pH2("4.3 第二阶段：框架完善（第 4-8 个月）"),
pH3("4.3.1 技术标准体系完善"),
new Paragraph({ numbering: { reference: "bullet2", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "完成 TS-200 系列全部方案设计标准的编制与发布", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet2", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "完成 TS-300 系列配置报价标准的编制与发布", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet2", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "完成 TS-400 系列合规与验证标准的编制与发布", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet2", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "建立技术标准的定期更新机制，跟踪法规变化", font: "微软雅黑", size: 21, color: DARK })] }),

pH3("4.3.2 管理标准与工作标准完善"),
new Paragraph({ numbering: { reference: "bullet3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "完成 MS 系列全部管理标准的编制与发布", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "完成 WS 系列全部工作标准的编制与发布", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet3", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "开展首轮标准化全员培训", font: "微软雅黑", size: 21, color: DARK })] }),

pH2("4.4 第三阶段：深化运行（第 9-14 个月）"),
pH3("4.4.1 体系试运行"),
new Paragraph({ numbering: { reference: "num4", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "在全部售前项目中正式执行标准化流程", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num4", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "建立标准执行的日常监督和问题反馈机制", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num4", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "按月收集标准执行数据，分析问题并持续优化", font: "微软雅黑", size: 21, color: DARK })] }),

pH3("4.4.2 首次标准化审查"),
p("在第 12 个月组织首次全面标准化审查（详见第五章），评估体系运行效果，识别改进机会。"),

pH2("4.5 第四阶段：持续改进（第 15-18 个月）"),
pH3("4.5.1 体系评审与认证"),
new Paragraph({ numbering: { reference: "num5", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "组织标准化管理体系年度评审", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num5", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "根据评审结果修订和完善标准体系", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num5", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "固化标准化工作成果，建立常态化运行机制", font: "微软雅黑", size: 21, color: DARK })] }),

pH3("4.5.2 PDCA 持续改进循环"),
p("建立 Plan-Do-Check-Act 持续改进循环机制："),
makeTable(
  ["阶段", "活动内容", "输出成果"],
  [
    ["Plan（策划）", "年度标准化工作计划编制，识别改进需求", "年度标准化工作计划"],
    ["Do（实施）", "标准编制、培训宣贯、试点推行", "新编/修订标准文件"],
    ["Check（检查）", "标准化审查、体系检查、数据分析", "审查报告、检查报告"],
    ["Act（改进）", "问题整改、标准修订、经验推广", "整改报告、优化方案"],
  ],
  [1600, 3800, 3626]
),
emptyP(),

// ====================== 第五章 标准化审查 ======================
pH1("第五章  标准化审查"),

pH2("5.1 审查目的与范围"),
p("标准化审查是对售前标准化体系运行状态的系统性评估活动。其目的是发现标准体系中存在的不足和改进机会，确保标准体系的适宜性、充分性和有效性。"),
p("审查范围覆盖售前标准化体系的三大子体系，包括："),
new Paragraph({ numbering: { reference: "bullet4", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "技术标准体系：标准内容的准确性、完整性和时效性", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet4", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "管理标准体系：流程的执行情况和管控效果", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet4", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "工作标准体系：岗位标准的落实情况和人员能力匹配度", font: "微软雅黑", size: 21, color: DARK })] }),

pH2("5.2 审查类型与频次"),
makeTable(
  ["审查类型", "频次", "审查内容", "组织者"],
  [
    ["日常审查", "持续进行", "标准执行中的问题反馈和即时整改", "售前工程师/标准化专员"],
    ["定期审查", "每季度一次", "阶段性标准执行情况综合评估", "售前标准化工作组"],
    ["专项审查", "按需开展", "特定标准或流程的深度评估", "标准化工作组 + 相关部门"],
    ["全面审查", "每年一次", "体系整体运行状态的全面评审", "标准化管理委员会"],
  ],
  [1400, 1400, 3500, 2726]
),
emptyP(),

pH2("5.3 审查流程"),
pH3("5.3.1 审查准备"),
new Paragraph({ numbering: { reference: "num6", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "制定审查计划：明确审查范围、时间安排、审查组成员和分工", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num6", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "编制审查检查表：根据审查类型制定详细的检查项和评分标准", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num6", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "收集基础资料：调取标准文件、执行记录、项目档案等", font: "微软雅黑", size: 21, color: DARK })] }),

pH3("5.3.2 审查实施"),
new Paragraph({ numbering: { reference: "num7", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "文件审查：检查标准文件的完整性和时效性，确认所有标准均现行有效", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num7", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "现场审查：通过抽样检查售前项目，评估标准的实际执行情况", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num7", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "人员访谈：与售前工程师交流，了解标准执行中的困难和建议", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num7", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "数据分析：汇总审查数据，进行量化评估和趋势分析", font: "微软雅黑", size: 21, color: DARK })] }),

pH3("5.3.3 审查结果处理"),
new Paragraph({ numbering: { reference: "num8", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "编制审查报告：包括审查发现、不符合项清单、改进建议和整改要求", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num8", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "不符合项分级：按严重程度分为 A（严重）、B（一般）、C（轻微）三级", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num8", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "整改跟踪：制定整改计划，明确责任人和完成时限，跟踪验证整改效果", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num8", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "结果通报：向标准化管理委员会报告审查结果，重大问题提交管理层决策", font: "微软雅黑", size: 21, color: DARK })] }),

pH2("5.4 审查评分标准"),
makeTable(
  ["评估维度", "权重", "优秀（90-100）", "合格（70-89）", "不合格（<70）"],
  [
    ["标准完整性", "25%", "覆盖全部业务环节，无遗漏", "覆盖主要环节，个别缺失", "覆盖不足，存在明显空白"],
    ["标准准确性", "25%", "内容准确，与法规一致", "基本准确，个别偏差", "存在明显错误或法规冲突"],
    ["执行一致性", "25%", "全员严格执行，偏差率<5%", "大部分执行，偏差率5-15%", "执行不到位，偏差率>15%"],
    ["改进有效性", "25%", "问题及时整改，持续优化", "问题基本整改", "整改不力，重复发生"],
  ],
  [1200, 700, 2200, 2200, 2726]
),
emptyP(),

// ====================== 第六章 体系检查 ======================
pH1("第六章  体系检查"),

pH2("6.1 检查目的与原则"),
p("体系检查是对售前标准化体系结构和运行机制的系统化诊断，不同于审查聚焦于'执行效果'，体系检查更侧重于'体系本身的合理性'——包括标准之间的协调性、覆盖的完整性、层级的合理性以及与外部标准的对接情况。"),
p("体系检查遵循以下原则："),
new Paragraph({ numbering: { reference: "bullet5", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "全面性：检查应覆盖标准体系的全部子体系和所有层级", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet5", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "客观性：以数据和事实为依据，避免主观判断", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet5", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "可追溯性：检查过程和结果应有完整记录，便于追溯", font: "微软雅黑", size: 21, color: DARK })] }),

pH2("6.2 检查内容与方法"),
pH3("6.2.1 标准体系结构检查"),
makeTable(
  ["检查项目", "检查内容", "检查方法", "判定标准"],
  [
    ["体系覆盖性", "标准是否覆盖售前全部业务环节", "逐项比对业务流程与标准目录", "覆盖率 >= 90%"],
    ["层级合理性", "标准层级划分是否清晰合理", "分析标准之间的引用和隶属关系", "无交叉、无空白"],
    ["标准协调性", "不同标准之间是否存在矛盾或重复", "交叉比对标准内容", "无矛盾、重复率 < 10%"],
    ["编码规范性", "标准编号是否符合编码规则", "核对编码格式", "100% 符合"],
    ["版本时效性", "所有标准是否为最新有效版本", "核对版本号和发布日期", "过期标准数量 = 0"],
  ],
  [1500, 3000, 2500, 2026]
),
emptyP(),

pH3("6.2.2 标准内容质量检查"),
makeTable(
  ["检查项目", "检查内容", "检查方法", "判定标准"],
  [
    ["格式规范性", "是否符合 GB/T 1.1 格式要求", "逐项核对格式要素", "100% 符合"],
    ["内容完整性", "是否包含适用范围、术语定义、正文、附录", "审查标准文件结构", "核心要素齐全"],
    ["可操作性", "标准要求是否明确、具体、可执行", "抽样评估执行可行性", "可执行率 >= 95%"],
    ["法规符合性", "技术标准是否引用最新法规版本", "核对引用文件清单", "100% 有效引用"],
  ],
  [1500, 3000, 2500, 2026]
),
emptyP(),

pH2("6.3 检查流程"),
p("体系检查流程分为五个步骤："),
new Paragraph({ spacing: { after: 80, line: 360 }, children: [new TextRun({ text: "步骤一  检查策划：制定检查方案，组建检查组，明确检查范围和方法", font: "微软雅黑", size: 21, color: DARK, bold: true })] }),
p("由标准化工作组牵头，制定年度体系检查方案，明确检查的时间安排、检查范围、检查组成员分工和检查方法。检查组建议由标准化专员、技术骨干和质量管理人员组成。"),
new Paragraph({ spacing: { after: 80, line: 360 }, children: [new TextRun({ text: "步骤二  自查自评：各部门对照标准体系目录进行自我评估", font: "微软雅黑", size: 21, color: DARK, bold: true })] }),
p("在正式检查前，组织售前部门开展自查自评，填写体系自评表，梳理本部门标准执行中存在的问题和改进建议。"),
new Paragraph({ spacing: { after: 80, line: 360 }, children: [new TextRun({ text: "步骤三  现场检查：检查组开展文件审查和现场核实", font: "微软雅黑", size: 21, color: DARK, bold: true })] }),
p("检查组根据检查方案开展文件审查和现场核实，逐项填写检查记录，对发现的问题进行分类分级。"),
new Paragraph({ spacing: { after: 80, line: 360 }, children: [new TextRun({ text: "步骤四  报告编制：汇总检查结果，编制体系检查报告", font: "微软雅黑", size: 21, color: DARK, bold: true })] }),
p("检查报告应包括：检查概况、检查发现（按问题类别分类）、不符合项清单、体系成熟度评价、改进建议和检查结论。"),
new Paragraph({ spacing: { after: 80, line: 360 }, children: [new TextRun({ text: "步骤五  整改验证：跟踪验证整改措施的实施效果", font: "微软雅黑", size: 21, color: DARK, bold: true })] }),
p("对检查发现的不符合项制定整改计划，明确整改责任人、完成时间和验证标准。在整改完成后进行复查验证。"),

pH2("6.4 体系成熟度评价模型"),
p("引入体系成熟度评价模型，对标准化体系的运行成熟度进行量化评估："),
makeTable(
  ["成熟度等级", "等级名称", "特征描述", "典型表现"],
  [
    ["1 级", "初始级", "标准化意识薄弱，依赖个人经验", "无正式标准文件，流程不统一"],
    ["2 级", "可重复级", "建立了基本标准，初步规范", "有部分标准文件，执行不严格"],
    ["3 级", "已定义级", "标准体系完整，流程规范化", "标准覆盖主要业务，执行率较高"],
    ["4 级", "已管理级", "体系运行稳定，量化监控", "有审查检查机制，持续改进"],
    ["5 级", "持续优化级", "体系自适应优化，行业领先", "数据驱动决策，标杆参考"],
  ],
  [1200, 1400, 2800, 3626]
),
emptyP(),

// ====================== 第七章 标准化信息管理 ======================
pH1("第七章  标准化信息管理"),

pH2("7.1 信息管理目标"),
p("标准化信息管理是标准化体系高效运行的基础保障。其核心目标是："),
new Paragraph({ numbering: { reference: "bullet1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "确保售前人员能够及时获取并正确使用最新的标准文件", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "建立外部法规和技术标准的持续跟踪与更新机制", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "构建售前知识库，实现技术经验的沉淀和共享", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet1", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "提供数据支撑，为标准化审查和体系检查提供决策依据", font: "微软雅黑", size: 21, color: DARK })] }),

pH2("7.2 信息分类与采集"),
pH3("7.2.1 外部标准法规信息"),
p("建立外部标准法规信息的分类采集体系："),
makeTable(
  ["信息类别", "信息来源", "采集频次", "责任人"],
  [
    ["国际标准", "ISO、ICH、WHO 官方发布渠道", "每月", "标准化专员"],
    ["国家/行业标准", "国家标准化管理委员会、行业标准网", "每月", "标准化专员"],
    ["法规指南", "NMPA、FDA、EMA、PMDA 官方网站", "每周", "质量部门接口人"],
    ["药典标准", "中国药典、USP、EP、JP 更新公告", "每季度", "技术骨干"],
    ["行业动态", "行业期刊、展会、技术论坛", "持续", "全体售前人员"],
  ],
  [1500, 3200, 1200, 3126]
),
emptyP(),

pH3("7.2.2 内部标准信息"),
new Paragraph({ numbering: { reference: "num1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "标准文件库：所有在售标准的电子版和纸质版归档管理", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "标准变更记录：每次标准修订的变更说明和审批记录", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num1", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "项目案例库：典型售前项目的方案模板和经验总结", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num1", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "培训资料库：标准化培训课件、视频和考核记录", font: "微软雅黑", size: 21, color: DARK })] }),

pH2("7.3 信息管理平台"),
p("建议部署或开发售前标准化信息管理平台，实现以下功能："),
makeTable(
  ["功能模块", "功能描述", "优先级"],
  [
    ["标准文件库管理", "标准的上传、分类、检索、下载、版本控制", "高"],
    ["法规变更预警", "外部法规变更的自动推送和影响分析", "高"],
    ["知识库管理", "技术经验的录入、分类、检索和评价", "高"],
    ["培训管理", "培训计划的发布、在线学习、考核评估", "中"],
    ["审查检查管理", "审查检查任务的分配、记录和报告生成", "中"],
    ["数据统计分析", "标准使用情况、审查结果的数据可视化", "低"],
  ],
  [2000, 4500, 2526]
),
emptyP(),

pH2("7.4 信息更新与维护机制"),
p("建立标准信息的定期更新与维护机制："),
makeTable(
  ["维护活动", "频次", "责任人", "输出成果"],
  [
    ["外部法规标准查新", "每月", "标准化专员", "法规标准更新通报"],
    ["标准有效性复核", "每季度", "标准化工作组", "标准有效性确认报告"],
    ["知识库内容更新", "每双周", "全体售前人员", "新增/更新知识条目"],
    ["平台系统维护", "每月", "IT 支持", "系统运行报告"],
    ["年度信息回顾", "每年", "标准化工作组", "年度信息管理报告"],
  ],
  [1800, 1000, 1800, 4426]
),
emptyP(),

// ====================== 第八章 标准文件管理 ======================
pH1("第八章  标准文件管理"),

pH2("8.1 文件生命周期管理"),
p("标准文件从编制到废止经历完整的生命周期，每个阶段都有明确的管理要求："),
makeTable(
  ["生命周期阶段", "主要活动", "管理要求"],
  [
    ["起草", "标准内容的编写和内部讨论", "遵循 GB/T 1.1 格式，使用标准模板"],
    ["审查", "技术审查和合规性审查", "至少 2 名审核人，记录审查意见"],
    ["批准", "主管领导或委员会审批", "签署审批意见，确认发布"],
    ["发布", "标准文件的正式分发和生效", "统一编号，通知相关人员"],
    ["实施", "标准的贯彻执行和培训", "确保相关人员知悉和理解"],
    ["复审", "定期评估标准的持续适用性", "每 2 年至少复审一次"],
    ["修订", "根据复审结果修订标准", "保留修订记录和版本对比"],
    ["废止", "不再适用的标准的正式废止", "发布废止通知，回收旧版文件"],
  ],
  [1400, 2600, 5026]
),
emptyP(),

pH2("8.2 编码规则"),
p("标准文件编码采用'体系前缀-编号-版本号'的三段式格式："),
makeTable(
  ["编码段", "格式", "示例", "说明"],
  [
    ["体系前缀", "TS / MS / WS", "TS", "技术标准 / 管理标准 / 工作标准"],
    ["标准编号", "XXX", "TS-201", "三位数字，按类别分段编码"],
    ["版本号", "Vx.y", "TS-201-V2.1", "x 为主版本号，y 为修订版本号"],
  ],
  [1600, 1800, 2000, 3626]
),
emptyP(),

pH2("8.3 版本控制"),
p("版本变更遵循以下规则："),
new Paragraph({ numbering: { reference: "bullet2", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "主版本号（x）变更：标准结构或核心内容发生重大变化时升级", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet2", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "修订版本号（y）变更：标准部分内容修正或补充时升级", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet2", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "每次版本变更必须附带变更说明，注明变更内容、原因和影响范围", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet2", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "新版标准发布后，旧版标准自动失效，归档保留以备追溯", font: "微软雅黑", size: 21, color: DARK })] }),

// ====================== 第九章 评价与改进 ======================
pH1("第九章  评价与持续改进"),

pH2("9.1 评价指标体系"),
p("建立售前标准化工作的量化评价指标体系，定期评估体系运行效果："),
makeTable(
  ["指标类别", "指标名称", "计算方法", "目标值"],
  [
    ["标准覆盖率", "业务流程标准覆盖率", "已标准化流程数 / 总流程数 x 100%", ">= 90%"],
    ["标准时效性", "过期标准占比", "过期标准数 / 总标准数 x 100%", "= 0%"],
    ["执行一致性", "标准执行符合率", "抽查符合项数 / 总抽查项数 x 100%", ">= 90%"],
    ["响应效率", "方案编制周期缩短率", "(改进前周期 - 改进后周期) / 改进前周期 x 100%", ">= 20%"],
    ["质量指标", "方案一次通过率", "一次通过审查的方案数 / 总方案数 x 100%", ">= 85%"],
    ["人员能力", "标准化培训覆盖率", "参加培训人数 / 应培训人数 x 100%", "= 100%"],
    ["客户满意度", "方案客户满意度", "客户满意评分 / 满分 x 100%", ">= 85%"],
  ],
  [1200, 1800, 3400, 2626]
),
emptyP(),

pH2("9.2 持续改进机制"),
p("持续改进是标准化体系保持生命力的关键。建立以下改进机制："),
new Paragraph({ numbering: { reference: "num3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "问题驱动改进：从标准化审查和体系检查中发现问题，制定改进措施并跟踪验证", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "数据驱动改进：通过指标数据的趋势分析，识别体系薄弱环节并针对性优化", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "创新驱动改进：引入新技术（如 AI 辅助方案生成、自动化合规检查），提升标准化工作效率", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "num3", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "标杆驱动改进：对标行业优秀实践，学习借鉴先进经验", font: "微软雅黑", size: 21, color: DARK })] }),

pH2("9.3 改进效果验证"),
p("每项改进措施实施后，应进行效果验证："),
new Paragraph({ numbering: { reference: "bullet3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "制定验证计划：明确验证的方法、时间、标准和责任人", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "执行验证：按计划开展验证活动，收集数据和证据", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet3", level: 0 }, spacing: { after: 60, line: 360 }, children: [new TextRun({ text: "记录结果：形成验证报告，记录改进效果和经验教训", font: "微软雅黑", size: 21, color: DARK })] }),
new Paragraph({ numbering: { reference: "bullet3", level: 0 }, spacing: { after: 120, line: 360 }, children: [new TextRun({ text: "固化推广：验证有效的改进措施纳入标准体系，向其他领域推广", font: "微软雅黑", size: 21, color: DARK })] }),

// ====================== 第十章 附录 ======================
pH1("第十章  附录"),

pH2("附录 A  售前标准体系结构图（文字描述）"),
p("本体系采用三层架构，各层说明如下："),
emptyP(),
p("第一层：售前技术标准体系（TS）"),
p("  TS-100 产品技术基础标准（分类编码、技术参数、洁净等级、安全防护、核心部件选型）"),
p("  TS-200 方案设计标准（编制规范、无菌/VHP/负压/集成方案、选型矩阵、配置清单）"),
p("  TS-300 配置报价标准（报价模型、价格表、选配管理、多币种换算、有效期管理）"),
p("  TS-400 合规与验证标准（FDA/ EU GMP/ 中国 GMP 合规、IQ/OQ/PQ 模板、审查清单）"),
emptyP(),
p("第二层：售前管理标准体系（MS）"),
p("  MS-100 流程管理标准（立项分配、编制评审、技术交流、交接流程、异常处理）"),
p("  MS-200 质量管控标准（质量评价、标准化审查、体系检查、纠正预防）"),
p("  MS-300 文档管理标准（编码规则、编制审批、版本控制、档案归档）"),
p("  MS-400 标准化信息管理标准（法规更新、技术情报、需求管理、知识库、培训管理）"),
emptyP(),
p("第三层：售前工作标准体系（WS）"),
p("  WS-100 岗位职责标准（工程师、主管、审核员、标准化专员）"),
p("  WS-200 能力与培训标准（素质模型、入职培训、技能提升、资质认证）"),
p("  WS-300 绩效与考核标准（KPI 体系、考核实施、贡献评估）"),
emptyP(),

pH2("附录 B  首批标准编制计划表"),
makeTable(
  ["序号", "标准编号", "标准名称", "优先级", "编制周期"],
  [
    ["1", "MS-301", "售前标准文件编码规则", "P0", "2 周"],
    ["2", "MS-102", "售前方案编制与评审流程", "P0", "4 周"],
    ["3", "TS-201", "售前方案编制通用规范", "P0", "5 周"],
    ["4", "TS-102", "隔离器通用技术参数标准", "P0", "5 周"],
    ["5", "TS-301", "隔离器配置报价模型规范", "P0", "6 周"],
    ["6", "TS-206", "隔离器选型矩阵", "P0", "6 周"],
    ["7", "TS-405", "合规审查清单", "P0", "7 周"],
    ["8", "MS-401", "法规标准信息收集与更新制度", "P1", "7 周"],
    ["9", "WS-101", "售前工程师岗位说明书", "P1", "8 周"],
    ["10", "MS-303", "售前文档版本控制规范", "P1", "8 周"],
  ],
  [600, 1200, 3200, 1000, 3026]
),
emptyP(),

pH2("附录 C  标准化审查检查表示例"),
makeTable(
  ["序号", "检查项目", "检查内容", "评分（0-10）", "备注"],
  [
    ["1", "标准覆盖率", "技术标准是否覆盖全部隔离器类型", "", ""],
    ["2", "流程标准化", "售前方案编制是否遵循统一流程", "", ""],
    ["3", "报价一致性", "同类项目报价差异率是否在允许范围内", "", ""],
    ["4", "合规审查", "方案提交前是否完成合规性审查", "", ""],
    ["5", "文档管理", "标准文件是否全部纳入版本控制", "", ""],
    ["6", "培训执行", "新标准发布后是否完成全员培训", "", ""],
    ["7", "知识积累", "项目经验是否及时纳入知识库", "", ""],
    ["8", "持续改进", "上次审查问题是否全部整改完毕", "", ""],
  ],
  [600, 1400, 3200, 1500, 2326]
),
emptyP(),

// 文件结束
new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [
  new TextRun({ text: "—— 文件结束 ——", font: "微软雅黑", size: 22, color: GRAY })
] }),

      ]
    }
  ]
});

// 生成文件
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("E:\\Workbuddy\\Claw\\售前标准化体系建设规划.docx", buffer);
  fs.writeFileSync("E:\\Workbuddy\\Claw\\gen-result.txt", "SUCCESS: " + buffer.length + " bytes");
}).catch(err => {
  fs.writeFileSync("E:\\Workbuddy\\Claw\\gen-result.txt", "ERROR: " + err.message + "\n" + err.stack);
});
