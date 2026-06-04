"""
产品配置页面 - 标准产品选择/定制配置
支持单选组和多选组（内置配件/传感器/文件资料）
"""
import streamlit as st
import pandas as pd
from services.product_config import get_all_product_types, find_best_config, ProductType


def show_product_config_page(initial_product: str = None, initial_urs_params: dict = None):
    """显示产品配置页面"""
    st.title("📦 产品配置")

    products = get_all_product_types()
    product_names = list(products.keys())

    if initial_product and initial_product in products:
        default_idx = product_names.index(initial_product)
    else:
        default_idx = 0

    selected_name = st.selectbox("选择产品类型", product_names, index=default_idx)
    product = products[selected_name]

    # 产品信息
    with st.container(border=True):
        col_i1, col_i2 = st.columns([2, 1])
        with col_i1:
            st.markdown(f"### {product.name}")
            st.markdown(f"**基础型号**：{product.model_base}　**基价**：**${product.base_price:,} USD**")
            st.markdown(f"**规格**：{product.spec}")
            st.markdown(f"**合规标准**：{'　'.join([f'`{c}`' for c in product.compliance])}", unsafe_allow_html=True)
        with col_i2:
            st.metric("基础价格", f"${product.base_price:,}", "USD")

    # 标准配置选择
    st.markdown("### 标准配置方案")
    standard_configs = product.get_standard_configs()
    config_options = [f"{c['name']}：{c.get('desc', '')}" for c in standard_configs]

    selected_config_idx = 0
    if initial_urs_params:
        best = find_best_config(product, initial_urs_params)
        for i, c in enumerate(standard_configs):
            if c["name"] == best["config"].name:
                selected_config_idx = i
                break

    chosen_config = st.radio(
        "选择一个预定义配置方案",
        config_options,
        index=selected_config_idx,
        format_func=lambda x: x,
    )
    config_idx = config_options.index(chosen_config)
    selected_std_config = standard_configs[config_idx]

    # 加载标准配置
    current_options = dict(selected_std_config["options"])
    multi_defaults = selected_std_config.get("multi_defaults", {})

    st.markdown("### 详细定制")
    st.caption("基于标准配置修改，或完全自定义。点击选项可查看详细说明")

    custom_params_vals = {}
    all_selected = {}
    multi_selections = {}

    # ===== 单选组 =====
    for group_name, option_choices in product.get_option_groups().items():
        choice_names = [o["name"] for o in option_choices]
        # 带价格标注
        display_names = []
        for o in option_choices:
            pm = o["price_mod"]
            if pm > 0:
                display_names.append(f"{o['name']} (+${pm:,})")
            elif pm < 0:
                display_names.append(f"{o['name']} (-${abs(pm):,})")
            else:
                display_names.append(o["name"])

        default_choice = current_options.get(group_name, choice_names[0])
        default_idx = choice_names.index(default_choice) if default_choice in choice_names else 0

        # 获取当前选项的详细描述作为 help
        curr_help = option_choices[default_idx].get("desc", "")
        selected_display = st.selectbox(
            f"**{group_name}**",
            display_names,
            index=default_idx,
            help=curr_help,
        )
        selected_name = choice_names[display_names.index(selected_display)]
        all_selected[group_name] = selected_name

        # 在下面显示当前选中项的描述
        for o in option_choices:
            if o["name"] == selected_name and o.get("desc"):
                st.caption(f"💡 {o['desc']}")
                break

    # ===== 多选组（如内置配件、传感器、文件资料） =====
    for group_name in product.multi_select_groups:
        items = product.get_multi_select_items(group_name)
        if not items:
            continue

        st.markdown(f"### {group_name}")
        st.caption("勾选需要的项目")

        # 获取默认选择
        default_selected = multi_defaults.get(group_name, [])
        default_names = default_selected if isinstance(default_selected, list) else []

        selected_in_group = []
        for item in items:
            name = item["name"]
            pm = item["price_mod"]
            desc = item.get("desc", "")
            label = f"{name}" + (f"  (+${pm:,})" if pm > 0 else "")

            is_checked = name in default_names
            checked = st.checkbox(label, value=is_checked, key=f"multi_{group_name}_{name}",
                                  help=desc)
            if checked:
                selected_in_group.append(name)
                if desc:
                    st.caption(f"💡 {desc}")

        multi_selections[group_name] = selected_in_group

    # ===== 自定义参数 =====
    if product.custom_params:
        st.markdown("### 自定义参数")
        for param_name, param_config in product.custom_params.items():
            if param_config.get("type") == "volume":
                min_v = param_config.get("min", 0)
                unit = param_config.get("unit", "m³")
                default_v = min_v + 0.1
                custom_params_vals[param_name] = st.number_input(
                    f"{param_config.get('label', param_name)}（最小{min_v}{unit}，超出部分按${param_config.get('price_per_unit', 0):,}/{unit}计费）",
                    min_value=float(min_v), value=float(default_v), step=0.05,
                    format="%.2f",
                )

    # ===== 价格计算 =====
    price_result = product.calculate_price(
        all_selected,
        custom_params_vals if custom_params_vals else None,
        multi_selections if multi_selections else None,
    )

    st.markdown("---")
    st.markdown("### 💰 价格明细")

    col_p1, col_p2, col_p3 = st.columns(3)
    with col_p1:
        st.metric("基础价格", f"${price_result['base_price']:,}", "USD")
    with col_p2:
        extra = price_result['total_price'] - price_result['base_price']
        delta_str = f"+${extra:,}" if extra > 0 else "$0"
        st.metric("选配增加", delta_str, "USD" if extra > 0 else "")
    with col_p3:
        st.metric("配置总价", f"${price_result['total_price']:,}", "USD",
                  delta=f"型号: {price_result['model']}")

    # 明细表
    st.markdown("#### 明细")
    details = price_result["details"]
    detail_rows = []
    for d in details:
        detail_rows.append({
            "项目": d["item"],
            "数量": d["qty"],
            "价格": f"${d['price']:,}" if d['price'] > 0 else "标配",
            "备注": d["note"],
        })
    if detail_rows:
        st.dataframe(pd.DataFrame(detail_rows), use_container_width=True, hide_index=True,
                     column_config={"价格": st.column_config.TextColumn("价格")})

    # 保存配置
    st.session_state["last_config"] = {
        "product": product.name,
        "model": price_result["model"],
        "base_price": price_result["base_price"],
        "total_price": price_result["total_price"],
        "options": all_selected,
        "multi_selections": multi_selections,
        "custom_params": custom_params_vals,
        "details": details,
    }

    return st.session_state["last_config"]
