"""
售前项目管理系统 - Streamlit 应用入口
"""
import streamlit as st
import pandas as pd
from datetime import datetime

st.set_page_config(
    page_title="售前项目管理系统",
    page_icon="⚙️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ==================== 侧边栏导航 ====================

st.sidebar.markdown("""
<div style="text-align:center; padding:12px 0">
    <h2 style="margin:0; color:#1677ff">⚙️ 售前管理系统</h2>
    <p style="color:#888; font-size:12px; margin-top:4px">Presales Management System</p>
</div>
""", unsafe_allow_html=True)

pages = {
    "📊 工作台": "Dashboard",
    "📝 URS智能分析": "URS分析",
    "📦 产品配置": "产品配置",
    "📋 方案管理": "方案管理",
}

if "page" not in st.session_state:
    st.session_state.page = "工作台"

for label, key in pages.items():
    btn_type = "primary" if st.session_state.page == key else "secondary"
    if st.sidebar.button(label, use_container_width=True, type=btn_type):
        st.session_state.page = key
        st.rerun()

st.sidebar.markdown("---")
st.sidebar.markdown(
    f"<div style='color:#999; font-size:12px; text-align:center'>v2.0 Streamlit版<br>{datetime.now().strftime('%Y-%m-%d')}</div>",
    unsafe_allow_html=True,
)

# ==================== 页面路由 ====================

page = st.session_state.get("page", "工作台")

if page == "Dashboard":
    st.title("📊 工作台")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("项目总数", "12", "+3")
    with col2:
        st.metric("进行中", "5")
    with col3:
        st.metric("已完成", "7")
    with col4:
        st.metric("本月新增", "2", "+1")

    st.markdown("### 📌 最近项目")
    projects_data = {
        "项目名称": ["某生物公司QC实验室无菌隔离器", "某制药厂VHP灭菌改造", "某医院负压隔离病房"],
        "状态": ["进行中", "已完成", "方案阶段"],
        "金额(USD)": ["$150,000", "$65,000", "$200,000"],
        "更新时间": ["2026-06-01", "2026-05-28", "2026-05-25"],
    }
    st.dataframe(pd.DataFrame(projects_data), use_container_width=True, hide_index=True)

    st.markdown("### 💡 快捷操作")
    col_a, col_b, col_c = st.columns(3)
    with col_a:
        if st.button("🔍 开始URS分析", use_container_width=True):
            st.session_state.page = "URS分析"
            st.rerun()
    with col_b:
        if st.button("📦 浏览产品", use_container_width=True):
            st.session_state.page = "产品配置"
            st.rerun()
    with col_c:
        if st.button("📋 查看方案", use_container_width=True):
            st.session_state.page = "方案管理"
            st.rerun()

elif page == "URS分析":
    from pages.urs_page import show_urs_page
    show_urs_page()

elif page == "产品配置":
    from pages.product_config_page import show_product_config_page

    # 如果有分析结果，尝试匹配产品
    urs_analysis = st.session_state.get("last_analysis")
    product_name = None
    urs_params = None
    if urs_analysis:
        recommended = urs_analysis.get("recommended_product", {})
        product = recommended.get("product", {})
        product_name = product.get("name")
        urs_params = urs_analysis.get("extracted_params", {})

    config = show_product_config_page(initial_product=product_name, initial_urs_params=urs_params)

    # 如果生成了配置，提供跳转到URS分析的按钮
    if config and "last_analysis" in st.session_state:
        st.markdown("---")
        st.markdown("### 使用此配置生成文档")
        if st.button("📄 回到URS分析页生成全套文档", use_container_width=True):
            # 保存配置并跳转
            st.session_state.page = "URS分析"
            st.rerun()

elif page == "方案管理":
    st.title("📋 方案管理")
    st.info("通过 URS 智能分析生成方案后，方案将出现在这里")

    if "last_proposal_text" in st.session_state:
        proposal = st.session_state["last_proposal_text"]
        st.markdown(f"**最近方案**：{proposal.get('title', '')}")
        st.markdown(f"**客户**：{proposal.get('customer', '')}　**日期**：{proposal.get('date', '')}")
        if st.button("📄 查看完整方案"):
            st.session_state.page = "URS分析"
            st.rerun()
    else:
        st.info("暂无方案，请先使用 URS 智能分析")
