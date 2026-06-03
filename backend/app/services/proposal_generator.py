"""
方案生成器 - 根据URS分析结果自动生成技术方案和报价单
"""
from typing import Dict, Any
from datetime import datetime


def generate_proposal(analysis: Dict[str, Any], customer: str = "", language: str = "中文") -> Dict[str, Any]:
    """根据URS分析结果生成完整技术方案"""
    
    params = analysis.get("extracted_params", {})
    recommended = analysis.get("recommended_product", {})
    product = recommended.get("product", {})
    budget = analysis.get("requirements_summary", {}).get("estimated_budget", {})
    
    # 基本信息
    proposal = {
        "title": f"{product.get('name', '智能隔离器')}技术方案",
        "customer": customer or "待确认客户",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "language": language,
        "product": product,
        "sections": [],
    }
    
    # 1. 项目概述
    proposal["sections"].append({
        "title": "项目概述",
        "content": _generate_project_overview(product, params, language),
    })
    
    # 2. 产品规格
    proposal["sections"].append({
        "title": "产品规格与技术参数",
        "content": _generate_specifications(product, params, language),
    })
    
    # 3. 配置清单
    config_list = _generate_config_list(product, params, language)
    proposal["sections"].append({
        "title": "标准配置清单",
        "content": config_list["text"],
        "table": config_list["table"],
    })
    
    # 4. 合规与验证
    proposal["sections"].append({
        "title": "合规与验证",
        "content": _generate_compliance(product, language),
    })
    
    # 5. 报价
    proposal["sections"].append({
        "title": "报价概要",
        "content": _generate_quote(budget, language),
        "price_usd": budget.get("min", 0),
        "price_range": f"${budget.get('min', 0):,} - ${budget.get('max', 0):,} USD",
    })
    
    # 6. 可选配置
    proposal["sections"].append({
        "title": "可选配置项",
        "content": _generate_options(language),
    })
    
    return proposal


def _generate_project_overview(product: Dict, params: Dict, lang: str) -> str:
    if lang == "中文":
        text = (
            f"本方案针对客户URS需求，推荐采用 {product.get('name', '')} ({product.get('model', '')}) 型号产品。\n\n"
            f"{product.get('spec', '')}\n\n"
            "该方案充分考虑了客户在工艺需求、洁净等级、合规要求等方面的URS输入，"
            "提供从设备交付到验证服务的完整解决方案。"
        )
        if "chamber_size" in params:
            text += f"\n\n根据URS中提出的工作舱尺寸要求 ({'，'.join(params['chamber_size'])})，推荐配置已满足或超过需求指标。"
    else:
        text = (
            f"This proposal is based on the customer's URS requirements, recommending the {product.get('name', '')} ({product.get('model', '')}).\n\n"
            f"{product.get('spec', '')}\n\n"
            "The solution fully addresses the customer's process requirements, cleanliness levels, and compliance needs."
        )
    return text


def _generate_specifications(product: Dict, params: Dict, lang: str) -> str:
    specs = [
        ("工作舱材质", "不锈钢304 (SUS304)"),
        ("表面处理", "内表面镜面抛光Ra≤0.4μm，外表面拉丝处理"),
        ("洁净等级", "ISO 5 (Class 100)"),
        ("密封方式", "充气密封/机械密封"),
        ("控制系统", "PLC + 触摸屏人机界面"),
        ("数据记录", "支持数据导出和审计追踪"),
    ]
    
    if lang == "中文":
        lines = ["| 参数 | 规格 |", "|------|------|"]
        for name, val in specs:
            lines.append(f"| {name} | {val} |")
        return "\n".join(lines)
    else:
        lines = ["| Parameter | Specification |", "|---|---|"]
        eng_specs = [
            ("Chamber Material", "Stainless Steel 304 (SUS304)"),
            ("Surface Finish", "Mirror polish Ra≤0.4μm interior, brushed exterior"),
            ("Cleanliness", "ISO 5 (Class 100)"),
            ("Sealing", "Inflatable seal / Mechanical seal"),
            ("Control System", "PLC + Touch Screen HMI"),
            ("Data Recording", "Data export and audit trail"),
        ]
        for name, val in eng_specs:
            lines.append(f"| {name} | {val} |")
        return "\n".join(lines)


def _generate_config_list(product: Dict, params: Dict, lang: str) -> Dict:
    base = product.get("base_price_usd", 0)
    items = [
        {"name": "主机系统", "qty": 1, "price": base, "note": "包含工作舱、控制系统、HEPA过滤" if lang == "中文" else "Includes chamber, control system, HEPA filtration"},
        {"name": "传递窗/传递口", "qty": 2, "price": 0, "note": "标准配置" if lang == "中文" else "Standard configuration"},
        {"name": "手套口组件", "qty": 2, "price": 0, "note": "含手套" if lang == "中文" else "Including gloves"},
        {"name": "紫外灭菌灯", "qty": 1, "price": 0, "note": "标准配置" if lang == "中文" else "Standard"},
        {"name": "压差监测系统", "qty": 1, "price": 0, "note": "实时显示" if lang == "中文" else "Real-time display"},
        {"name": "IQ/OQ验证文件", "qty": 1, "price": 0, "note": "中英文可选" if lang == "中文" else "Chinese/English optional"},
    ]
    
    table = []
    label_name = "配置项" if lang == "中文" else "Item"
    label_qty = "数量" if lang == "中文" else "Qty"
    label_price = "价格 (USD)" if lang == "中文" else "Price (USD)"
    label_note = "备注" if lang == "中文" else "Note"
    
    table.append(f"| {label_name} | {label_qty} | {label_price} | {label_note} |")
    table.append("|---|---|---|---|")
    for item in items:
        price_str = f"${item['price']:,.0f}" if item["price"] > 0 else "标准配置" if lang == "中文" else "Standard"
        table.append(f"| {item['name']} | {item['qty']} | {price_str} | {item['note']} |")
    
    total = sum(item["price"] for item in items)
    text = f"**{'总价' if lang == '中文' else 'Total'}: ${total:,} USD**" if total > 0 else ""
    
    return {"text": text, "table": table}


def _generate_compliance(product: Dict, lang: str) -> str:
    compliances = product.get("compliance", ["中国GMP", "EU GMP Annex 1"])
    
    if lang == "中文":
        lines = ["本产品符合以下标准与规范：\n"]
        for c in compliances:
            lines.append(f"- ✅ {c}")
        lines.extend([
            "",
            "提供完整的验证文件包：",
            "- 设计确认 (DQ)",
            "- 安装确认 (IQ)",
            "- 运行确认 (OQ)",
            "- 性能确认 (PQ) - 可选",
        ])
    else:
        lines = ["This product complies with the following standards:\n"]
        for c in compliances:
            lines.append(f"- ✅ {c}")
        lines.extend([
            "",
            "Complete validation documentation package:",
            "- Design Qualification (DQ)",
            "- Installation Qualification (IQ)",
            "- Operational Qualification (OQ)",
            "- Performance Qualification (PQ) - Optional",
        ])
    return "\n".join(lines)


def _generate_quote(budget: Dict, lang: str) -> str:
    if lang == "中文":
        text = (
            f"**参考报价范围**\n\n"
            f"基础配置：${budget.get('min', 0):,} USD\n"
            f"高配范围：${budget.get('max', 0):,} USD\n\n"
            "最终报价取决于URS确认的具体配置项、可选件及验证服务范围。\n"
            "报价有效期：30天"
        )
    else:
        text = (
            f"**Estimated Price Range**\n\n"
            f"Base Configuration: ${budget.get('min', 0):,} USD\n"
            f"Fully Loaded: ${budget.get('max', 0):,} USD\n\n"
            "Final quote depends on confirmed URS configuration, options, and validation scope.\n"
            "Quote valid for 30 days."
        )
    return text


def _generate_options(lang: str) -> str:
    if lang == "中文":
        return (
            "| 可选配置 | 说明 | 参考价格 (USD) |",
            "|----------|------|---------------|",
            "| 材质升级316L | 耐腐蚀不锈钢 | +$8,000 |",
            "| 远程监控系统 | Web/APP远程查看 | +$12,000 |",
            "| PQ验证服务 | 性能确认全套 | +$15,000 |",
            "| 温湿度监测 | 实时记录+报警 | +$5,000 |",
            "| 审计追踪 | 21 CFR Part 11合规 | +$10,000 |",
        )
    else:
        return (
            "| Option | Description | Price (USD) |",
            "|--------|-------------|-------------|",
            "| 316L Upgrade | Corrosion-resistant | +$8,000 |",
            "| Remote Monitoring | Web/APP access | +$12,000 |",
            "| PQ Validation | Performance Qualification | +$15,000 |",
            "| Temp/Humidity Monitor | Real-time + alarm | +$5,000 |",
            "| Audit Trail | 21 CFR Part 11 compliance | +$10,000 |",
        )
