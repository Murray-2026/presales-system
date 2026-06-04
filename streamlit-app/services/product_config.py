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
    def __init__(self, name: str, options: Dict[str, str], desc: str = "",
                 multi_defaults: Optional[Dict[str, List[str]]] = None):
        self.name = name
        self.options = options
        self.desc = desc
        self.multi_defaults = multi_defaults or {}  # {"内置配件": ["内置VHPS灭菌发生器"], ...}

    def to_dict(self):
        return {"name": self.name, "options": self.options, "desc": self.desc, "multi_defaults": self.multi_defaults}


class ProductType:
    """产品类型定义"""
    def __init__(self, name: str, model_base: str, base_price: float, spec: str,
                 compliance: List[str], option_groups: Dict[str, List[ProductOption]],
                 standard_configs: List[StandardConfig], custom_params: Optional[Dict] = None,
                 multi_select_groups: Optional[List[str]] = None,
                 multi_select_items: Optional[Dict[str, List[ProductOption]]] = None):
        self.name = name
        self.model_base = model_base
        self.base_price = base_price
        self.spec = spec
        self.compliance = compliance
        self.option_groups = option_groups  # {group_name: [ProductOption, ...]} 单选组
        self.standard_configs = standard_configs
        self.custom_params = custom_params or {}
        self.multi_select_groups = multi_select_groups or []  # 支持多选的组名列表
        self.multi_select_items = multi_select_items or {}  # 多选组的选项 {group_name: [ProductOption, ...]}

    def get_option_groups(self) -> Dict[str, List[dict]]:
        return {k: [o.to_dict() for o in v] for k, v in self.option_groups.items()}

    def is_multi_select(self, group_name: str) -> bool:
        return group_name in self.multi_select_groups

    def get_multi_select_items(self, group_name: str) -> List[dict]:
        items = self.multi_select_items.get(group_name, [])
        return [o.to_dict() for o in items]

    def calculate_price(self, selected_options: Dict[str, str], custom_values: Optional[Dict] = None,
                        multi_selections: Optional[Dict[str, List[str]]] = None) -> Dict:
        """计算配置总价"""
        total = self.base_price
        details = [{"item": "基础主机", "qty": 1, "price": self.base_price, "note": self.model_base}]
        model_suffix = ""

        # 处理单选组
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

        # 处理多选组（如内置配件）
        multi_selections = multi_selections or {}
        for group_name, selected_names in multi_selections.items():
            if group_name in self.multi_select_groups and group_name in self.option_groups:
                for opt in self.option_groups[group_name]:
                    if opt.name in selected_names and opt.price_mod > 0:
                        total += opt.price_mod
                        details.append({"item": f"{group_name}: {opt.name}", "qty": 1, "price": opt.price_mod, "note": opt.desc})

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
            spec="工作舱1500×800×1800mm，ISO 5洁净等级，不锈钢304，适用于无菌检查（薄膜过滤法）、阳性检测",
            compliance=["中国GMP", "EU GMP Annex 1", "FDA", "WHO GMP"],
            multi_select_groups=["内置配件", "传感器配置", "文件资料"],
            option_groups={
                "结构形式": [
                    ProductOption("Only M（仅主舱体）", 0, "-M", "仅主舱体，无附加传递窗，适用于空间有限的独立操作"),
                    ProductOption("LP+M（左传递窗+主舱体）", 15000, "-LPM", "左侧配置一个标准传递窗，用于物料传入/传出，适合基本的物流需求"),
                    ProductOption("M+RP（主舱体+右传递窗）", 15000, "-MRP", "右侧配置一个标准传递窗，适合现场布局限制的场景"),
                    ProductOption("LP+M+RP（左传递窗+主舱体+右传递窗）", 28000, "-LPMRP", "左右各一个传递窗，左进右出形成物流通道，最常用配置"),
                    ProductOption("LP+M+R（左传递窗+主舱体+RTP口）", 35000, "-LPMR", "左侧传递窗+右侧RTP快速转移口，用于需要无菌对接传递的工艺"),
                    ProductOption("LP+M+B（左传递窗+主舱体+BIBO袋）", 40000, "-LPMB", "左侧传递窗+右侧BIBO连续袋系统，用于大批量连续出料"),
                ],
                "洁净等级": [
                    ProductOption("Class A (ISO 5) 动态", 0, "", "动态A级（ISO 5），无菌操作全过程中维持A级环境，最严格标准"),
                    ProductOption("Class A 静态（仅静态A级）", -5000, "-AS", "仅静态时维持A级，操作时允许B级，适用于部分QC实验室"),
                ],
                "材质": [
                    ProductOption("304不锈钢（SUS304）", 0, "", "标准304不锈钢，适用于常规无菌检测环境"),
                    ProductOption("316L不锈钢（SUS316L）", 15000, "-316L", "耐腐蚀316L不锈钢，适用于腐蚀性试剂或高要求环境"),
                ],
                "安装房间洁净等级": [
                    ProductOption("Class B", 0, "", "B级背景环境，最严格安装要求"),
                    ProductOption("Class C", 0, "-CC", "C级背景环境，常见QC实验室配置"),
                    ProductOption("Class D", 0, "-CD", "D级背景环境"),
                    ProductOption("CNC（受控非分级区）", 0, "-CNC", "受控但非分级区域，最低安装要求"),
                ],
                "手套配置": [
                    ProductOption("分体式手套（Hypalon袖套+丁腈手套）", 0, "", "标准配置，袖套和手套可分开更换，成本低、维护方便，无菌检测推荐方案"),
                    ProductOption("一体式手套", 8000, "-1G", "袖套和手套一体成型，密封性更好，推荐用于负压/高活隔离器"),
                ],
                "控制系统": [
                    ProductOption("PLC+触摸屏（标准）", 0, "", "标准PLC控制+触摸屏人机界面，含基础数据记录"),
                    ProductOption("PLC+触摸屏+21 CFR Part 11合规", 18000, "-P11", "含电子签名、审计追踪、数据完整性，符合FDA 21 CFR Part 11要求"),
                ],
            },
            # 内置配件 - 多选，用multi_selections传入
            # 传感器配置 - 多选
            # 文件资料 - 多选
            multi_select_items={
                "内置配件": [
                    ProductOption("内置VHPS灭菌发生器", 25000, "",
                        "集成于隔离器内的汽化过氧化氢灭菌系统，用于舱体内部周期性灭菌去污，无需外接发生装置"),
                    ProductOption("内置无菌检测泵", 8000, "",
                        "集成于工作台面的薄膜过滤用真空/压力泵，用于无菌检查的膜过滤法操作，标配2联设计"),
                    ProductOption("内置粒子计数器", 12000, "",
                        "集成式环境悬浮粒子监测，实时显示ISO等级，支持数据记录和报警，用于在线环境监测"),
                    ProductOption("内置浮游菌采样器", 12000, "",
                        "集成式浮游菌采样，配合培养皿进行空气微生物监测，用于环境菌落计数"),
                    ProductOption("水/气喷枪（CIP）", 5000, "",
                        "用于舱体内壁在线清洗（CIP），配合纯化水和压缩空气，减少人工擦拭操作"),
                    ProductOption("防震台", 8000, "",
                        "高精度称重专用防震平台，隔离来自地面的振动干扰，用于精密称量操作"),
                    ProductOption("视频监控系统", 6000, "",
                        "内置高清摄像头，实时监控并记录舱内操作过程，用于操作追溯和培训"),
                ],
                "传感器配置": [
                    ProductOption("H2O2高浓度传感器（灭菌监测）", 8000, "",
                        "安装于舱体内部，实时监测VHP灭菌过程中的过氧化氢浓度（高量程），用于灭菌循环验证"),
                    ProductOption("H2O2低浓度传感器（残留监测）", 10000, "",
                        "安装于舱体排风口，监测灭菌后排残的过氧化氢浓度（低量程ppb级），确保操作人员安全"),
                    ProductOption("H2O2便携式浓度传感器（人员防护）", 5000, "",
                        "可移动式过氧化氢浓度监测仪，用于操作人员随身佩戴或区域定点监测，确保工作环境安全"),
                    ProductOption("温湿度传感器", 3000, "",
                        "集成式温度和湿度监测，实时记录舱内环境参数，支持数据导出"),
                    ProductOption("压差传感器", 3000, "",
                        "监测舱体与背景环境的压差，确保隔离器密封性和定向气流"),
                ],
                "文件资料": [
                    ProductOption("FAT（出厂验收测试）", 8000, "",
                        "Factory Acceptance Test，在供应商工厂进行出厂前验收测试。按双方确认的测试协议执行，含测试报告"),
                    ProductOption("SAT（现场验收测试）", 10000, "",
                        "Site Acceptance Test，在客户现场安装后进行验收测试。按双方确认的协议执行，含测试报告"),
                    ProductOption("DQ（设计确认）", 6000, "",
                        "Design Qualification，确认设备设计符合URS要求，含设计文件审核"),
                    ProductOption("FS（功能规格说明）", 5000, "",
                        "Functional Specification，详细描述设备各项功能的技术规格文档"),
                    ProductOption("HDS/SDS（硬件/软件设计规格）", 8000, "",
                        "Hardware/Software Design Specification，硬件和软件设计详细说明文档"),
                    ProductOption("IQ/OQ（安装/运行确认）", 12000, "",
                        "Installation/Operational Qualification，安装确认和运行确认验证服务，含验证报告"),
                ],
            },
            standard_configs=[
                StandardConfig("标准型",
                    {"结构形式": "LP+M+RP（左传递窗+主舱体+右传递窗）", "洁净等级": "Class A (ISO 5) 动态",
                     "材质": "304不锈钢（SUS304）", "安装房间洁净等级": "Class C",
                     "手套配置": "分体式手套（Hypalon袖套+丁腈手套）", "控制系统": "PLC+触摸屏（标准）"},
                    "基础配置，适用于常规无菌检测实验室",
                    {"内置配件": ["内置VHPS灭菌发生器"], "传感器配置": ["H2O2高浓度传感器（灭菌监测）"], "文件资料": ["IQ/OQ（安装/运行确认）"]}),
                StandardConfig("增强型",
                    {"结构形式": "LP+M+RP（左传递窗+主舱体+右传递窗）", "洁净等级": "Class A (ISO 5) 动态",
                     "材质": "304不锈钢（SUS304）", "安装房间洁净等级": "Class C",
                     "手套配置": "分体式手套（Hypalon袖套+丁腈手套）", "控制系统": "PLC+触摸屏+21 CFR Part 11合规"},
                    "增强配置，含21 CFR Part 11合规和内置检测泵",
                    {"内置配件": ["内置VHPS灭菌发生器", "内置无菌检测泵", "内置粒子计数器"],
                     "传感器配置": ["H2O2高浓度传感器（灭菌监测）", "H2O2低浓度传感器（残留监测）"],
                     "文件资料": ["FAT（出厂验收测试）", "IQ/OQ（安装/运行确认）"]}),
                StandardConfig("旗舰型",
                    {"结构形式": "LP+M+R（左传递窗+主舱体+RTP口）", "洁净等级": "Class A (ISO 5) 动态",
                     "材质": "316L不锈钢（SUS316L）", "安装房间洁净等级": "Class B",
                     "手套配置": "分体式手套（Hypalon袖套+丁腈手套）", "控制系统": "PLC+触摸屏+21 CFR Part 11合规"},
                    "旗舰配置，含RTP口+316L+全套传感器和验证文件",
                    {"内置配件": ["内置VHPS灭菌发生器", "内置无菌检测泵", "内置粒子计数器", "内置浮游菌采样器", "视频监控系统"],
                     "传感器配置": ["H2O2高浓度传感器（灭菌监测）", "H2O2低浓度传感器（残留监测）",
                                   "H2O2便携式浓度传感器（人员防护）", "温湿度传感器", "压差传感器"],
                     "文件资料": ["FAT（出厂验收测试）", "SAT（现场验收测试）", "DQ（设计确认）",
                                "FS（功能规格说明）", "HDS/SDS（硬件/软件设计规格）", "IQ/OQ（安装/运行确认）"]}),
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
