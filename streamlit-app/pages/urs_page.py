"""
URS智能分析页面 - 含文档生成和模板管理
"""
import streamlit as st
import os
import tempfile
import time
import pandas as pd
from datetime import datetime

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services'))

from urs_analyzer import URSAnalyzer
from proposal_generator import generate_proposal as gen_proposal_text
from urs_parser import parse_urs_file
from product_config import get_all_product_types, find_best_config
from template_engine import (
    generate_all_documents, analyze_template, fill_template,
    PLACEHOLDER_DEFINITIONS
)

analyzer = URSAnalyzer()


def show_urs_page():
    st.title("📝 URS智能分析")
    st.markdown("<p style='color:#666'>输入用户需求规范（URS），自动分析需求并生成技术方案、配置清单和报价文件</p>", unsafe_allow_html=True)

    # ===== 模板管理（侧边或折叠） =====
    with st.sidebar:
        st.markdown("### 📄 模板管理")
        st.caption("上传自定义DOCX模板替换默认模板")
        
        if "user_templates" not in st.session_state:
            st.session_state.user_templates = {}
        
        tmpl_col1, tmpl_col2, tmpl_col3 = st.columns(3)
        for col, tmpl_name in [(tmpl_col1, "技术方案"), (tmpl_col2, "配置清单"), (tmpl_col3, "报价单")]:
            with col:
                uploaded = st.file_uploader(
                    f"{tmpl_name}模板",
                    type=["docx"],
                    key=f"tmpl_{tmpl_name}",
                    label_visibility="collapsed",
                )
                if uploaded:
                    tmpl_bytes = uploaded.read()
                    try:
                        analysis = analyze_template(tmpl_bytes)
                        st.session_state.user_templates[tmpl_name] = tmpl_bytes
                        
                        if analysis["placeholders"]:
                            with st.expander(f"检测到 {len(analysis['placeholders'])} 个占位符", expanded=False):
                                for ph in analysis["placeholders"]:
                                    info = PLACEHOLDER_DEFINITIONS.get(ph, {})
                                    desc = info if isinstance(info, str) else info.get("description", "自定义")
                                    st.caption(f"  `{ph}` — {desc}")
                        st.success(f"✅ {tmpl_name}模板已加载")
                    except Exception as e:
                        st.error(f"模板解析失败: {str(e)[:80]}")

        if st.button("🔄 恢复默认模板", use_container_width=True):
            st.session_state.user_templates = {}
            st.success("已恢复默认模板")
            st.rerun()

        st.markdown("---")
        if st.session_state.user_templates:
            st.info(f"已加载 {len(st.session_state.user_templates)} 个自定义模板")
        else:
            st.info("使用默认模板")

    # ===== 主功能区 =====
    customer = st.text_input("客户公司名称（选填）", placeholder="例如：某生物科技公司",
                             key="urs_customer")

    input_mode = st.radio("选择输入方式", ["输入URS文本", "上传URS文档"], horizontal=True, key="urs_input_mode")

    urs_text = ""

    if input_mode == "输入URS文本":
        urs_text = st.text_area(
            "粘贴URS文档内容",
            height=250,
            key="urs_text_area",
            placeholder="""请粘贴URS文档内容，例如：

# 无菌隔离器用户需求规范

## 技术参数
- 工作舱尺寸：1800×800×1800mm
- 洁净等级：ISO 5 (Class 100)
- 灭菌方式：VHP汽化过氧化氢灭菌
- 材质要求：不锈钢304

## 合规要求
- 符合中国GMP 2010版
- 符合EU GMP Annex 1

## 数量：1台"""
        )
    else:
        uploaded_file = st.file_uploader("选择URS文档", type=["docx", "pdf", "txt"], key="urs_file")
        if uploaded_file is not None:
            with st.spinner("正在解析文档..."):
                try:
                    suffix = os.path.splitext(uploaded_file.name)[1]
                    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                        tmp.write(uploaded_file.getvalue())
                        tmp_path = tmp.name
                    urs_text = parse_urs_file(tmp_path)
                    os.unlink(tmp_path)
                    st.success(f"文档解析成功！共 {len(urs_text)} 字符")
                    with st.expander("查看提取的文本"):
                        st.text(urs_text[:2000] + ("..." if len(urs_text) > 2000 else ""))
                except Exception as e:
                    st.error(f"文档解析失败: {str(e)}")
                    return

    # 分析按钮
    col_a1, col_a2 = st.columns([1, 5])
    with col_a1:
        analyze_clicked = st.button("🚀 开始分析", type="primary", use_container_width=True)

    if analyze_clicked and urs_text.strip():
        with st.spinner("正在分析URS需求..."):
            time.sleep(0.3)

            try:
                # URS 分析
                analysis = analyzer.analyze(urs_text)
                proposal_text = gen_proposal_text(analysis, customer, "中文")

                params = analysis.get("extracted_params", {})
                recommended = analysis.get("recommended_product", {})
                product = recommended.get("product", {})
                budget = analysis.get("requirements_summary", {}).get("estimated_budget", {})

                # 存储到 session
                st.session_state["last_analysis"] = analysis
                st.session_state["last_proposal_text"] = proposal_text
                st.session_state["last_customer"] = customer
                st.session_state["last_urs_text"] = urs_text

                # ===== 显示结果 =====
                st.markdown("---")
                st.markdown("## 📊 分析结果")

                # 需求提取
                with st.container(border=True):
                    st.markdown("### 📋 需求提取结果")
                    col_m1, col_m2 = st.columns(2)
                    col_m1.metric("URS内容长度", f"{analysis.get('raw_text_length', 0)} 字符")
                    col_m2.metric("识别参数项", f"{len(params)} 项")

                    param_labels = {
                        "chamber_size": "工作舱尺寸", "sterilization": "灭菌方式",
                        "cleanliness": "洁净等级", "material": "材质要求",
                        "compliance": "合规要求", "quantity": "需求数量", "control": "控制系统",
                    }
                    for key, label in param_labels.items():
                        if key in params and params[key]:
                            vals = "、".join(params[key])
                            st.markdown(f"**{label}**：`{vals}`")

                # 推荐产品
                if product:
                    with st.container(border=True):
                        confidence = recommended.get("confidence", 0)
                        st.markdown(f"### ✅ 推荐产品方案")
                        st.success(f"**{product.get('name')}**（型号：{product.get('model')}） — 匹配度 {confidence}%")
                        st.markdown(f"规格：{product.get('spec')}")
                        st.markdown(f"参考报价：**${product.get('base_price_usd', 0):,} USD**")

                # ===== 文档生成区 =====
                st.markdown("---")
                st.markdown("## 📄 生成全套文档")

                col_g1, col_g2, col_g3 = st.columns(3)
                with col_g1:
                    gen_docx = st.button("📥 生成技术方案+配置清单+报价单", type="primary", use_container_width=True)
                with col_g2:
                    go_config = st.button("⚙️ 去产品配置页详细定制", use_container_width=True)
                with col_g3:
                    show_tmpl = st.button("📋 查看可用占位符", use_container_width=True)

                if go_config:
                    st.session_state.page = "产品配置"
                    st.rerun()

                if show_tmpl:
                    with st.expander("📋 模板占位符参考", expanded=True):
                        st.caption("上传自定义模板时，在DOCX中使用以下占位符会被自动识别和替换：")
                        cols = st.columns(3)
                        for i, (ph, desc) in enumerate(sorted(PLACEHOLDER_DEFINITIONS.items())):
                            cols[i % 3].markdown(f"`{{{{${ph}}}}}` — {desc}")

                if gen_docx:
                    with st.spinner("正在生成文档..."):
                        try:
                            # 构建数据
                            doc_data = {
                                "customer": customer or "待确认客户",
                                "project_name": f"{product.get('name', '')}采购项目",
                                "date": datetime.now().strftime("%Y-%m-%d"),
                                "date_year": str(datetime.now().year),
                                "product_name": product.get("name", ""),
                                "product_model": product.get("model", ""),
                                "product_spec": product.get("spec", ""),
                                "product_price": product.get("base_price_usd", 0),
                                "compliance": product.get("compliance", []),
                                "compliance_list": "\n".join([f"• {c}" for c in product.get("compliance", [])]),
                                "urs_params": params,
                                "urs_summary": f"URS共{analysis.get('raw_text_length', 0)}字符，识别{len(params)}项参数",
                                "matched_keywords": "、".join(recommended.get("matched_keywords", [])),
                                "confidence": f"{recommended.get('confidence', 0)}%",
                                "price_range": f"${budget.get('min', 0):,} - ${budget.get('max', 0):,} USD",
                                "config_summary": "基础配置",
                                "validity": "30天",
                                "payment_terms": "预付30%，验收合格后70%",
                                "delivery_time": "签订合同后45-60天",
                                "warranty": "整机质保1年",
                                "total_price": product.get("base_price_usd", 0),
                                "total_price_cny": f"¥{product.get('base_price_usd', 0) * 7.2:,.0f}",
                                "config_details": [
                                    {"item": f"{product.get('name', '')}主机", "qty": 1,
                                     "price": product.get("base_price_usd", 0),
                                     "note": f"型号 {product.get('model', '')}"},
                                    {"item": "标准配件包", "qty": 1, "price": 0, "note": "含手套口、紫外灯"},
                                    {"item": "IQ/OQ验证文档", "qty": 1, "price": 0, "note": "标准配置"},
                                ],
                                "material": "不锈钢304 (SUS304)",
                                "control_system": "PLC + 触摸屏人机界面",
                                "cleanliness": "ISO 5 (Class 100)",
                                "signature": "______________________",
                            }

                            # 生成文档
                            docs = generate_all_documents(doc_data, st.session_state.get("user_templates"))

                            # 提供下载
                            st.success("✅ 文档生成成功！点击下方按钮下载：")
                            dl_cols = st.columns(3)
                            for i, (fname, fbytes) in enumerate(docs.items()):
                                with dl_cols[i]:
                                    st.download_button(
                                        label=f"⬇️ {fname}",
                                        data=fbytes,
                                        file_name=fname,
                                        mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                        use_container_width=True,
                                    )

                            # 打包下载
                            if len(docs) > 1:
                                try:
                                    import zipfile
                                    zip_buf = io.BytesIO()
                                    with zipfile.ZipFile(zip_buf, 'w', zipfile.ZIP_DEFLATED) as zf:
                                        for fname, fbytes in docs.items():
                                            zf.writestr(fname, fbytes)
                                    zip_buf.seek(0)
                                    st.download_button(
                                        label="📦 下载全部 (ZIP)",
                                        data=zip_buf.getvalue(),
                                        file_name=f"URS文档包_{datetime.now().strftime('%Y%m%d')}.zip",
                                        mime="application/zip",
                                        use_container_width=True,
                                    )
                                except Exception:
                                    pass

                        except Exception as e:
                            st.error(f"文档生成失败: {str(e)}")
                            import traceback
                            st.code(traceback.format_exc())

                # 技术方案预览
                st.markdown("### 📄 技术方案预览")
                sections = proposal_text.get("sections", [])
                for i, section in enumerate(sections):
                    with st.container(border=True):
                        title = section.get("title", "")
                        price = section.get("price_range", "")
                        header = f"{title}" + (f"  <span style='color:#ff4d4f'>({price})</span>" if price else "")
                        st.markdown(f"#### {header}", unsafe_allow_html=True)
                        content = section.get("content", "")
                        if content:
                            st.markdown(content)

                        table = section.get("table", [])
                        if table and len(table) > 1:
                            header_cells = [c.strip() for c in table[0].split("|")[1:-1]]
                            rows = []
                            for line in table[2:]:
                                cells = [c.strip() for c in line.split("|")[1:-1]]
                                if len(cells) == len(header_cells):
                                    rows.append(cells)
                            if rows:
                                st.dataframe(pd.DataFrame(rows, columns=header_cells),
                                             use_container_width=True, hide_index=True)

                # 导出文本方案
                st.markdown("---")
                md_content = f"# {proposal_text.get('title', '技术方案')}\n\n"
                md_content += f"**客户**：{proposal_text.get('customer', '')}\n\n"
                md_content += f"**日期**：{proposal_text.get('date', '')}\n\n---\n\n"
                for section in proposal_text.get("sections", []):
                    md_content += f"## {section.get('title', '')}\n\n{section.get('content', '')}\n\n"
                st.download_button(
                    label="⬇️ 下载Markdown方案",
                    data=md_content,
                    file_name=f"技术方案_{datetime.now().strftime('%Y%m%d')}.md",
                    mime="text/markdown",
                )

            except Exception as e:
                st.error(f"分析失败：{str(e)}")
                import traceback
                st.code(traceback.format_exc())


import io
