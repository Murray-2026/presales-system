"""
URS分析引擎 - 规则匹配 + 产品推荐
从URS文本中提取结构化需求，匹配最佳产品方案
"""
import re
from typing import Dict, List, Any, Optional

# ==================== 产品知识库 ====================

PRODUCTS = [
    {
        "id": "1",
        "name": "无菌检测隔离器",
        "model": "ISO-1500",
        "category": "无菌隔离器",
        "spec": "工作舱1500×800×1800mm，ISO 5洁净等级，不锈钢304",
        "base_price_usd": 150000,
        "key_features": ["无菌检测", "无菌试验", "阳性检测", "无菌检查", "isolator", "sterile test"],
        "keywords": ["无菌", "sterile", "iso", "阳性", "检测", "试验"],
        "min_size_mm": 1200,
        "compliance": ["中国GMP", "EU GMP Annex 1", "FDA"],
    },
    {
        "id": "2",
        "name": "无菌操作隔离器",
        "model": "VHP-1200",
        "category": "无菌操作隔离器",
        "spec": "工作舱1200×700×1600mm，VHP汽化过氧化氢灭菌",
        "base_price_usd": 65000,
        "key_features": ["无菌操作", "vhp灭菌", "过氧化氢灭菌", "汽化灭菌", "vhp sterilization", "aseptic operation"],
        "keywords": ["无菌操作", "无菌", "vhp", "过氧化氢", "汽化", "灭菌", "hydrogen peroxide", "vaporized"],
        "min_size_mm": 1000,
        "compliance": ["中国GMP", "EU GMP Annex 1"],
    },
    {
        "id": "3",
        "name": "集成式隔离器",
        "model": "INT-2000",
        "category": "集成隔离器",
        "spec": "多功能集成，全自动控制，可定制工作舱尺寸",
        "base_price_usd": 580000,
        "key_features": ["集成", "全自动", "多功能", "定制", "integrated", "automated"],
        "keywords": ["集成", "全自动", "多功能", "定制", "一体化", "integrated"],
        "min_size_mm": 1500,
        "compliance": ["中国GMP", "EU GMP Annex 1", "FDA", "WHO"],
    },
    {
        "id": "4",
        "name": "负压隔离器",
        "model": "NEG-1000",
        "category": "负压隔离器",
        "spec": "负压维持-50Pa，生物安全防护，HEPA过滤",
        "base_price_usd": 200000,
        "key_features": ["负压", "生物安全", "负压维持", "negative pressure", "biosafety", "containment"],
        "keywords": ["负压", "生物安全", "negative pressure", "containment", "防护", "安全柜"],
        "min_size_mm": 1000,
        "compliance": ["中国GMP", "生物安全等级BSL-2/3", "WHO"],
    },
    {
        "id": "5",
        "name": "百级层流传递窗",
        "model": "PB-LF-500",
        "category": "传递窗",
        "spec": "百级层流HEPA过滤，不锈钢304，紫外灭菌",
        "base_price_usd": 25000,
        "key_features": ["传递窗", "层流", "百级", "pass box", "laminar flow", "紫外灭菌"],
        "keywords": ["传递窗", "层流", "pass box", "传递"],
        "min_size_mm": 500,
        "compliance": ["中国GMP"],
    },
    {
        "id": "6",
        "name": "VHP灭菌传递箱",
        "model": "PB-VHP-500",
        "category": "传递窗",
        "spec": "VHP灭菌，双门互锁，304不锈钢",
        "base_price_usd": 40000,
        "key_features": ["传递箱", "vhp灭菌传递", "双门互锁", "vhp pass box", "decontamination"],
        "keywords": ["传递箱", "vhp传递", "灭菌传递", "传递窗vhp"],
        "min_size_mm": 500,
        "compliance": ["中国GMP", "EU GMP Annex 1"],
    },
]

# ==================== 参数提取模式 ====================

PARAM_PATTERNS = {
    "chamber_size": [
        r'(\d+[×xX*]\d+[×xX*]\d+)\s*(mm|MM)?',
        r'尺寸[：:为]?\s*(\d+[×xX*]\d+[×xX*]\d+)',
        r'工作舱[：:]?\s*(\d+[×xX*]\d+[×xX*]\d+)',
    ],
    "cleanliness": [
        r'(ISO\s*\d+|Class\s*\d+|百级|万级|十万级|A级|B级|C级|D级)',
        r'洁净[等级度]?[：:]?\s*(\S+)',
    ],
    "sterilization": [
        r'(VHP|汽化过氧化氢|过氧化氢|臭氧|紫外|高温灭菌|湿热灭菌|干热灭菌|辐照)',
        r'灭菌[方式方法]?[：:]?\s*(\S+)',
    ],
    "material": [
        r'(不锈钢|SUS304|SUS316L|304不锈钢|316L不锈钢|316不锈钢)',
        r'材质[：:]?\s*(\S+)',
    ],
    "quantity": [
        r'(\d+)\s*台',
        r'数量[：:]?\s*(\d+)',
        r'需求[：:]?\s*(\d+)\s*台',
    ],
    "compliance": [
        r'(GMP|FDA|EU\s*GMP|WHO|CE|ISO\s*\d+)',
        r'合规[：:]?\s*(\S+)',
        r'符合[：:]?\s*(\S+标准)',
    ],
    "control": [
        r'(PLC|触摸屏|HMI|远程监控|SCADA|计算机化|数据记录|审计追踪)',
        r'控制[系统方式]?[：:]?\s*(\S+)',
    ],
}

# ==================== 分析引擎 ====================

class URSAnalyzer:
    """URS分析引擎"""

    def analyze(self, text: str) -> Dict[str, Any]:
        """对URS文本进行全面分析"""
        
        # 1. 提取参数
        params = self._extract_parameters(text)
        
        # 2. 匹配产品
        matches = self._match_products(text, params)
        
        # 3. 计算置信度
        for match in matches:
            match["confidence"] = self._calculate_confidence(match, params)
        
        # 4. 排序：最佳匹配在前
        matches.sort(key=lambda x: x["score"], reverse=True)
        
        # 5. 生成需求清单
        requirements = self._generate_requirements(text, params, matches)
        
        return {
            "extracted_params": params,
            "matched_products": matches[:3],  # 前3个最匹配
            "recommended_product": matches[0] if matches else None,
            "requirements_summary": requirements,
            "raw_text_length": len(text),
        }

    def _extract_parameters(self, text: str) -> Dict[str, List[str]]:
        """从文本中提取结构化参数"""
        params = {}
        for param_name, patterns in PARAM_PATTERNS.items():
            found = []
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                for m in matches:
                    # 如果匹配结果是tuple（有多组捕获），取第一个非空值
                    if isinstance(m, tuple):
                        val = next((x for x in m if x.strip()), m[0])
                    else:
                        val = m
                    if val.strip() not in found:
                        found.append(val.strip())
            if found:
                params[param_name] = found
        return params

    def _match_products(self, text: str, params: Dict) -> List[Dict]:
        """匹配最佳产品型号"""
        text_lower = text.lower()
        results = []
        
        for product in PRODUCTS:
            score = 0
            matched_keywords = []
            
            # 关键词匹配
            for kw in product["keywords"]:
                if kw.lower() in text_lower:
                    score += 2
                    matched_keywords.append(kw)
            
            # 特征词匹配（更高权重）
            for feat in product["key_features"]:
                if feat.lower() in text_lower:
                    score += 3
                    if feat not in matched_keywords:
                        matched_keywords.append(feat)
            
            # 合规要求匹配
            for comp in product["compliance"]:
                if comp.lower() in text_lower:
                    score += 1
                    
            # 尺寸匹配
            if "chamber_size" in params:
                score += 1
            
            # 灭菌方式匹配
            if "sterilization" in params:
                for s in params["sterilization"]:
                    if any(kw.lower() in s.lower() for kw in product["keywords"]):
                        score += 2
            
            results.append({
                "product": product,
                "score": score,
                "matched_keywords": matched_keywords[:5],
                "confidence": 0,  # 后续计算
            })
        
        return results

    def _calculate_confidence(self, match: Dict, params: Dict) -> float:
        """计算匹配置信度 (0-100)"""
        max_possible = sum(len(p["keywords"]) * 2 + len(p["key_features"]) * 3 for p in PRODUCTS) / len(PRODUCTS)
        raw = match["score"] / max(1, max_possible) * 100
        return round(min(raw, 100), 1)

    def _generate_requirements(self, text: str, params: Dict, matches: List[Dict]) -> Dict:
        """生成需求分析摘要"""
        top_product = matches[0]["product"] if matches else None
        
        return {
            "identified_count": len(params),
            "key_parameters": {
                k: v for k, v in params.items() 
                if k in ["chamber_size", "sterilization", "cleanliness", "material", "quantity"]
            },
            "suggested_product": top_product["name"] if top_product else "需进一步分析",
            "suggested_model": top_product["model"] if top_product else "",
            "estimated_budget": self._estimate_budget(matches, params),
        }

    def _estimate_budget(self, matches: List[Dict], params: Dict) -> Dict:
        """估算预算范围"""
        if not matches:
            return {"min": 0, "max": 0, "currency": "USD"}
        
        top = matches[0]["product"]
        base = top["base_price_usd"]
        
        # 根据配置项调整
        multiplier = 1.0
        if "control" in params:
            if any("远程" in c or "计算机化" in c for c in params["control"]):
                multiplier += 0.15
        if "material" in params:
            if any("316" in m for m in params["material"]):
                multiplier += 0.10
        
        return {
            "min": round(base * multiplier * 0.9),
            "max": round(base * multiplier * 1.2),
            "currency": "USD",
            "base_model": top["model"],
        }
