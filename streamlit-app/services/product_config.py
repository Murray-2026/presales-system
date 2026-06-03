"""
产品配置数据模型 - 标准产品定义与可定制选项
"""
from typing import Dict, List, Optional

# ==================== 产品配置定义 ====================

class ProductOption:
    """产品可配置选项"""
    def __init__(self, name: str, price_mod: float = 0, model_mod: str = "", desc: str = ""):
        self.name = name
        self.price_mod = price_mod
        self.model_mod = model_mod
        self.desc = desc

    def to_dict(self):
        return {"name": self.name, "price_mod": self.price_mod, "model_mod": self.model_mod, "desc": self.desc}


class StandardConfig:
    """预定义标准配置"""
    def __init__(self, name: str, options: Dict[str, str], desc: str = ""):
        self.name = name
        self.options = options
        self.desc = desc

    def to_dict(self):
        return {"name": self.name, "options": self.options, "desc": self.desc}


class ProductType:
    """产品类型定义"""
    def __init__(self, name: str, model_base: str, base_price: float, spec: str,
                 compliance: List[str], option_groups: Dict[str, List[ProductOption]],
                 standard_configs: List[StandardConfig], custom_params: Optional[Dict] = None):
        self.name = name
        self.model_base = model_base
        self.base_price = base_price
        self.spec = spec
        self.compliance = compliance
        self.option_groups = option_groups  # {group_name: [ProductOption, ...]}
        self.standard_configs = standard_configs
        self.custom_params = custom_params or {}  # e.g. {"min_volume": 0.1, "price_per_m3": 50000}

    def get_option_groups(self) -> Dict[str, List[dict]]:
        return {k: [o.to_dict() for o in v] for k, v in self.option_groups.items()}

    def get_standard_configs(self) -> List[dict]:
        return [c.to_dict() for c in self.standard_configs]

    def calculate_price(self, selected_options: Dict[str, str], custom_values: Optional[Dict] = None) -> Dict:
        """计算配置总价"""
        total = self.base_price
        details = [{"item": "基础主机", "qty": 1, "price": self.base_price, "note": self.model_base}]
        model_suffix = ""

        for group_name, option_name in selected_options.items():
            if group_name in self.option_groups:
                for opt in self.option_groups[group_name]:
                    if opt.name == option_name:
                        if opt.price_mod > 0:
                            total += opt.price_mod
                            details.append({"item": f"{group_name}: {opt.name}", "qty": 1, "price": opt.price_mod, "note": opt.desc})
                        if opt.model_mod:
                            model_suffix += opt.model_mod
                        break

        # 自定义参数（如VHP传递窗尺寸）
        price_extra = 0
        if custom_values:
            for param, val in custom_values.items():
                if param in self.custom_params:
                    cp = self.custom_params[param]
                    if cp.get("type") == "volume" and val:
                        min_v = cp.get("min", 0)
                        extra_vol = max(0, val - min_v)
                        price_extra = extra_vol * cp.get("price_per_unit", 0)
                        if price_extra > 0:
                            total += price_extra
                            details.append({"item": f"尺寸定制 (超基础 {min_v}m³)", "qty": round(extra_vol, 2), "price": round(price_extra), "note": f"实际{val}m³"})

        model = self.model_base + model_suffix
        return {"total_price": total, "model": model, "details": details, "base_price": self.base_price, "extra_price": price_extra}


# ==================== 产品库 ====================

def get_all_product_types() -> Dict[str, ProductType]:
    """获取所有产品类型"""
    return {
        "无菌检测隔离器": ProductType(
            name="无菌检测隔离器",
            model_base="ISO-1500",
            base_price=150000,
            spec="工作舱1500×800×1800mm，ISO 5洁净等级，不锈钢304，适用于无菌检查、阳性检测",
            compliance=["中国GMP", "EU GMP Annex 1", "FDA"],
            option_groups={
                "腔体配置": [
                    ProductOption("单腔体", 0, "", "标准单腔体配置"),
                    ProductOption("2手套单腔体", 5000, "-2G", "单腔体配2个手套口"),
                    ProductOption("4手套单腔体", 12000, "-4G", "单腔体配4个手套口"),
                ],
                "传递舱": [
                    ProductOption("不带传递舱", 0, "", "标准配置，无传递舱"),
                    ProductOption("带传递舱", 25000, "-PT", "额外配置传递舱，含紫外灭菌和互锁"),
                ],
                "材质": [
                    ProductOption("304不锈钢", 0, "", "标准304不锈钢（SUS304）"),
                    ProductOption("316L不锈钢", 15000, "-316L", "耐腐蚀316L不锈钢"),
                ],
                "控制系统": [
                    ProductOption("PLC+触摸屏", 0, "", "标准PLC控制+触摸屏人机界面"),
                    ProductOption("PLC+触摸屏+远程监控", 12000, "-RM", "支持Web/APP远程查看和数据导出"),
                ],
                "验证文件": [
                    ProductOption("IQ/OQ", 0, "", "安装确认+运行确认"),
                    ProductOption("IQ/OQ/PQ", 15000, "-V", "含性能确认全套"),
                ],
            },
            standard_configs=[
                StandardConfig("标准型", {"腔体配置": "单腔体", "传递舱": "不带传递舱", "材质": "304不锈钢", "控制系统": "PLC+触摸屏", "验证文件": "IQ/OQ"}, "基础配置，满足常规无菌检测需求"),
                StandardConfig("增强型", {"腔体配置": "2手套单腔体", "传递舱": "带传递舱", "材质": "304不锈钢", "控制系统": "PLC+触摸屏+远程监控", "验证文件": "IQ/OQ/PQ"}, "增强配置，带传递舱和远程监控"),
                StandardConfig("旗舰型", {"腔体配置": "4手套单腔体", "传递舱": "带传递舱", "材质": "316L不锈钢", "控制系统": "PLC+触摸屏+远程监控", "验证文件": "IQ/OQ/PQ"}, "旗舰配置，4手套口+316L+传递舱+全套验证"),
            ],
        ),
        "无菌操作隔离器": ProductType(
            name="无菌操作隔离器",
            model_base="VHP-1200",
            base_price=65000,
            spec="工作舱1200×700×1600mm，VHP汽化过氧化氢灭菌，304不锈钢，适用于无菌操作和日常灭菌",
            compliance=["中国GMP", "EU GMP Annex 1"],
            option_groups={
                "腔体配置": [
                    ProductOption("标准单腔体", 0, "", "标准尺寸1200×700×1600mm"),
                    ProductOption("加大腔体", 15000, "-XL", "加大尺寸1500×800×1800mm"),
                ],
                "材质": [
                    ProductOption("304不锈钢", 0, "", "标准304不锈钢"),
                    ProductOption("316L不锈钢", 12000, "-316L", "耐腐蚀316L不锈钢"),
                ],
                "控制系统": [
                    ProductOption("PLC+触摸屏", 0, "", "标准控制"),
                    ProductOption("PLC+触摸屏+数据记录", 8000, "-DR", "含审计追踪和数据导出"),
                ],
                "验证文件": [
                    ProductOption("IQ/OQ", 0, ""),
                    ProductOption("IQ/OQ+FAT", 8000, "-F", "含出厂验收测试"),
                    ProductOption("IQ/OQ+FAT+SAT", 15000, "-FS", "含出厂验收和现场验收测试"),
                ],
            },
            standard_configs=[
                StandardConfig("标准型", {"腔体配置": "标准单腔体", "材质": "304不锈钢", "控制系统": "PLC+触摸屏", "验证文件": "IQ/OQ"}, "基础配置，满足常规无菌操作需求"),
                StandardConfig("专业型", {"腔体配置": "标准单腔体", "材质": "304不锈钢", "控制系统": "PLC+触摸屏+数据记录", "验证文件": "IQ/OQ+FAT"}, "带数据记录和出厂验收"),
                StandardConfig("加强型", {"腔体配置": "加大腔体", "材质": "316L不锈钢", "控制系统": "PLC+触摸屏+数据记录", "验证文件": "IQ/OQ+FAT+SAT"}, "大腔体+316L+FAT+SAT全套"),
            ],
        ),
        "集成式隔离器": ProductType(
            name="集成式隔离器",
            model_base="INT-2000",
            base_price=580000,
            spec="多功能集成，全自动控制，可定制工作舱尺寸",
            compliance=["中国GMP", "EU GMP Annex 1", "FDA", "WHO"],
            option_groups={
                "自动化等级": [
                    ProductOption("半自动", 0, "", "基础自动化控制"),
                    ProductOption("全自动", 80000, "-FA", "全自动运行，无人值守"),
                ],
                "腔体尺寸": [
                    ProductOption("标准尺寸", 0, "", "2000×1000×2000mm"),
                    ProductOption("加大尺寸", 100000, "-XL", "2500×1200×2200mm"),
                ],
                "材质": [
                    ProductOption("304不锈钢", 0, ""),
                    ProductOption("316L不锈钢", 30000, "-316L"),
                ],
                "验证文件": [
                    ProductOption("IQ/OQ", 0, ""),
                    ProductOption("IQ/OQ/PQ", 25000, "-V"),
                ],
            },
            standard_configs=[
                StandardConfig("标准型", {"自动化等级": "半自动", "腔体尺寸": "标准尺寸", "材质": "304不锈钢", "验证文件": "IQ/OQ"}, "基础集成式配置"),
                StandardConfig("全自动型", {"自动化等级": "全自动", "腔体尺寸": "标准尺寸", "材质": "304不锈钢", "验证文件": "IQ/OQ/PQ"}, "全自动运行，全套验证"),
            ],
        ),
        "负压隔离器": ProductType(
            name="负压隔离器",
            model_base="NEG-1000",
            base_price=200000,
            spec="负压维持-50Pa，生物安全防护，HEPA过滤",
            compliance=["中国GMP", "生物安全等级BSL-2/3", "WHO"],
            option_groups={
                "防护等级": [
                    ProductOption("BSL-2", 0, "", "生物安全二级防护"),
                    ProductOption("BSL-3", 50000, "-B3", "生物安全三级防护，加强密封"),
                ],
                "腔体配置": [
                    ProductOption("标准单腔体", 0, "", "1000×700×1600mm"),
                    ProductOption("双腔体", 60000, "-DC", "双腔独立运行"),
                ],
                "过滤系统": [
                    ProductOption("HEPA H14", 0, "", "标准HEPA高效过滤"),
                    ProductOption("HEPA H14+活性炭", 10000, "-AC", "HEPA+活性炭除味"),
                ],
                "监控系统": [
                    ProductOption("本地监控", 0, "", "触摸屏本地监控"),
                    ProductOption("远程监控", 15000, "-RM", "Web/APP远程监控+报警"),
                ],
            },
            standard_configs=[
                StandardConfig("标准型", {"防护等级": "BSL-2", "腔体配置": "标准单腔体", "过滤系统": "HEPA H14", "监控系统": "本地监控"}, "基础负压隔离器配置"),
                StandardConfig("专业型", {"防护等级": "BSL-3", "腔体配置": "标准单腔体", "过滤系统": "HEPA H14+活性炭", "监控系统": "远程监控"}, "BSL-3专业防护，带远程监控"),
            ],
        ),
        "百级层流传递窗": ProductType(
            name="百级层流传递窗",
            model_base="PB-LF-500",
            base_price=25000,
            spec="百级层流HEPA过滤，不锈钢304，紫外灭菌",
            compliance=["中国GMP"],
            option_groups={
                "尺寸": [
                    ProductOption("标准型 500×500×500mm", 0, "", "标准传递窗尺寸"),
                    ProductOption("加大型 600×600×600mm", 5000, "-L", "加大传递窗尺寸"),
                ],
                "材质": [
                    ProductOption("304不锈钢", 0, ""),
                    ProductOption("316L不锈钢", 5000, "-316L"),
                ],
                "紫外灭菌": [
                    ProductOption("带紫外灭菌", 0, "", "标准紫外灭菌灯"),
                    ProductOption("紫外+VHP接口", 8000, "-VHP", "预留VHP灭菌接口"),
                ],
                "互锁方式": [
                    ProductOption("机械互锁", 0, ""),
                    ProductOption("电子互锁", 3000, "-EL"),
                ],
            },
            standard_configs=[
                StandardConfig("标准型", {"尺寸": "标准型 500×500×500mm", "材质": "304不锈钢", "紫外灭菌": "带紫外灭菌", "互锁方式": "机械互锁"}),
                StandardConfig("洁净型", {"尺寸": "标准型 500×500×500mm", "材质": "316L不锈钢", "紫外灭菌": "紫外+VHP接口", "互锁方式": "电子互锁"}),
            ],
        ),
        "VHP灭菌传递箱": ProductType(
            name="VHP灭菌传递箱",
            model_base="PB-VHP-500",
            base_price=40000,
            spec="VHP灭菌，双门互锁，304不锈钢，可定制内部尺寸",
            compliance=["中国GMP", "EU GMP Annex 1"],
            option_groups={
                "尺寸规格": [
                    ProductOption("标准 500×500×500mm (0.125m³)", 0, "", "标准尺寸0.125m³"),
                    ProductOption("定制尺寸", 0, "-C", "按需定制内部尺寸（最小0.1m³）"),
                ],
                "材质": [
                    ProductOption("304不锈钢", 0, ""),
                    ProductOption("316L不锈钢", 8000, "-316L"),
                ],
                "灭菌方式": [
                    ProductOption("VHP汽化过氧化氢", 0, ""),
                    ProductOption("VHP+干热辅助", 10000, "-DH"),
                ],
                "控制系统": [
                    ProductOption("PLC控制", 0, ""),
                    ProductOption("PLC+数据记录", 5000, "-DR"),
                ],
            },
            standard_configs=[
                StandardConfig("标准型", {"尺寸规格": "标准 500×500×500mm (0.125m³)", "材质": "304不锈钢", "灭菌方式": "VHP汽化过氧化氢", "控制系统": "PLC控制"}, "标准VHP传递箱"),
                StandardConfig("记录型", {"尺寸规格": "标准 500×500×500mm (0.125m³)", "材质": "316L不锈钢", "灭菌方式": "VHP+干热辅助", "控制系统": "PLC+数据记录"}, "带数据记录的高级配置"),
            ],
            custom_params={
                "volume": {"type": "volume", "min": 0.1, "price_per_unit": 50000, "unit": "m³", "label": "内部容积 (m³)"},
            },
        ),
    }


def get_product_type(name: str) -> Optional[ProductType]:
    """按名称获取产品类型"""
    products = get_all_product_types()
    return products.get(name)


def find_best_config(product_type: ProductType, urs_params: Dict) -> Dict:
    """根据URS分析结果推荐最佳标准配置"""
    text_indicators = {}
    for key, vals in urs_params.items():
        if isinstance(vals, list):
            for v in vals:
                text_indicators[v.lower()] = True

    scores = []
    for config in product_type.standard_configs:
        score = 0
        for opt_group, opt_name in config.options.items():
            # 更高配置加分
            for o in product_type.option_groups.get(opt_group, []):
                if o.name == opt_name and o.price_mod > 0:
                    score += 1

        # URS中提及"远程"、"监控"等加分
        if any("远程" in str(k) for k in text_indicators):
            if any("远程" in v for v in config.options.values()):
                score += 3

        scores.append({"config": config, "score": score})

    scores.sort(key=lambda x: x["score"], reverse=True)
    return scores[0] if scores else {"config": product_type.standard_configs[0], "score": 0}
