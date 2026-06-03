"""
URS智能分析页面 - Streamlit 版
"""
import streamlit as st
import os
import tempfile
import time

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services'))

from urs_analyzer import URSAnalyzer
from proposal_generator import generate_proposal
from urs_parser import parse_urs_file

analyzer = URSAnalyzer()

def show_urs_page():
    st.title("📝 URS智能分析")
    st.markdown("<p style='color:#666'>输入用户需求规范（URS），自动分析需求并生成技术方案和报价单</p>", unsafe_allow_html=True)

    # 客户信息
    customer = st.text_input("客户公司名称（选填）", placeholder="例如：某生物科技公司")

    # 输入方式选择
    input_mode = st.radio("选择输入方式", ["输入URS文本", "上传URS文档"], horizontal=True)

    urs_text = ""
    
    if input_mode == "输入URS文本":
        urs_text = st.text_area(
            "粘贴URS文档内容",
            height=250,
            placeholder="""请粘贴URS文档内容，例如：

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

## 4. 数量：1台"""
        )
    else:
        uploaded_file = st.file_uploader("选择URS文档", type=["docx", "pdf", "txt"])
        if uploaded_file is not None:
            with st.spinner("正在解析文档..."):
                try:
                    # 保存到临时文件
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
    col1, col2, col3 = st.columns([1, 1, 3])
    with col1:
        analyze_clicked = st.button("🚀 开始分析", type="primary", use_container_width=True)
    with col2:
        clear_clicked = st.button("🗑️ 清空", use_container_width=True)

    if clear_clicked:
        st.rerun()

    if analyze_clicked and urs_text.strip():
        with st.spinner("正在分析URS需求..."):
            time.sleep(0.5)  # 给用户一点反馈感
            
            try:
                # 执行分析
                analysis = analyzer.analyze(urs_text)
                proposal = generate_proposal(analysis, customer, "中文")
                
                params = analysis.get("extracted_params", {})
                recommended = analysis.get("recommended_product", {})
                product = recommended.get("product", {})
                budget = analysis.get("requirements_summary", {}).get("estimated_budget", {})

                # ========== 显示结果 ==========
                st.markdown("---")
                st.markdown("## 📊 分析结果")

                # 需求概览
                with st.container(border=True):
                    st.markdown("### 📋 需求提取结果")
                    col_a, col_b = st.columns(2)
                    col_a.metric("URS内容长度", f"{analysis.get('raw_text_length', 0)} 字符")
                    col_b.metric("识别参数项", f"{len(params)} 项")

                    # 参数展示
                    param_labels = {
                        "chamber_size": "工作舱尺寸",
                        "sterilization": "灭菌方式",
                        "cleanliness": "洁净等级",
                        "material": "材质要求",
                        "compliance": "合规要求",
                        "quantity": "需求数量",
                        "control": "控制系统",
                    }
                    param_colors = {
                        "chamber_size": "blue",
                        "sterilization": "green",
                        "cleanliness": "purple",
                        "material": "orange",
                        "compliance": "red",
                        "quantity": "cyan",
                        "control": "geekblue",
                    }

                    tags_html = ""
                    for key, label in param_labels.items():
                        if key in params and params[key]:
                            vals = ", ".join(params[key])
                            tags_html += f"""<div style="margin:8px 0">
                                <span style="font-weight:500">{label}：</span>
                                <span style="background:#e6f4ff; padding:2px 8px; border-radius:4px; color:#1677ff">{vals}</span>
                            </div>"""
                    if tags_html:
                        st.markdown(tags_html, unsafe_allow_html=True)
                    else:
                        st.info("未识别到结构化参数")

                # 推荐产品
                if product:
                    with st.container(border=True):
                        confidence = recommended.get("confidence", 0)
                        st.markdown(f"### ✅ 推荐产品方案")
                        st.success(f"**{product.get('name')}**（型号：{product.get('model')}）  — 匹配度 {confidence}%")
                        st.markdown(f"- 规格：{product.get('spec')}")
                        st.markdown(f"- 参考报价：**${product.get('base_price_usd', 0):,} USD**")
                        if recommended.get("matched_keywords"):
                            keywords = ", ".join(recommended["matched_keywords"][:5])
                            st.markdown(f"- 匹配关键词：`{keywords}`")

                # 技术方案
                st.markdown("---")
                st.markdown("## 📄 技术方案预览")

                sections = proposal.get("sections", [])
                for i, section in enumerate(sections):
                    with st.container(border=True):
                        title = section.get("title", "")
                        price = section.get("price_range", "")
                        if price:
                            st.markdown(f"### {title}  <span style='color:#ff4d4f'>({price})</span>", unsafe_allow_html=True)
                        else:
                            st.markdown(f"### {title}")

                        content = section.get("content", "")
                        if content:
                            st.markdown(content)

                        table = section.get("table", [])
                        if table and len(table) > 1:
                            # 解析markdown表格并显示
                            header = table[0].split("|")[1:-1]
                            separator = table[1]
                            rows = []
                            for line in table[2:]:
                                cells = [c.strip() for c in line.split("|")[1:-1]]
                                if len(cells) == len(header):
                                    rows.append(cells)
                            if rows:
                                import pandas as pd
                                st.dataframe(
                                    pd.DataFrame(rows, columns=header),
                                    use_container_width=True,
                                    hide_index=True,
                                )

                # 操作按钮
                st.markdown("---")
                col_s1, col_s2 = st.columns(2)
                with col_s1:
                    if st.button("📥 导出为Markdown方案", use_container_width=True):
                        # 生成Markdown格式方案
                        md_content = f"# {proposal.get('title', '技术方案')}\n\n"
                        md_content += f"**客户**：{proposal.get('customer', '')}\n\n"
                        md_content += f"**日期**：{proposal.get('date', '')}\n\n"
                        md_content += "---\n\n"
                        for section in sections:
                            md_content += f"## {section.get('title', '')}\n\n"
                            md_content += section.get("content", "") + "\n\n"
                            table = section.get("table", [])
                            if table:
                                for line in table:
                                    md_content += line + "\n"
                                md_content += "\n"
                        
                        st.download_button(
                            label="⬇️ 下载方案文档",
                            data=md_content,
                            file_name=f"技术方案_{datetime.now().strftime('%Y%m%d')}.md",
                            mime="text/markdown",
                            use_container_width=True,
                        )
                with col_s2:
                    if st.button("🔄 重新分析", use_container_width=True):
                        st.rerun()

            except Exception as e:
                st.error(f"分析失败：{str(e)}")
                import traceback
                st.code(traceback.format_exc())

from datetime import datetime
