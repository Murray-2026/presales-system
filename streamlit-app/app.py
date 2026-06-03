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

# 侧边栏导航
pages = {
    "📊 工作台": "Dashboard",
    "📝 URS智能分析": "URS分析",
    "📦 产品配置": "产品配置",
    "📋 方案管理": "方案管理",
    "📁 项目管理": "项目管理",
}

# 初始化 session state
if "page" not in st.session_state:
    st.session_state.page = "工作台"

for label, key in pages.items():
    if st.sidebar.button(label, use_container_width=True, type="secondary" if st.session_state.page != key else "primary"):
        st.session_state.page = key
        st.rerun()

st.sidebar.markdown("---")
st.sidebar.markdown(f"<div style='color:#999; font-size:12px; text-align:center'>v1.0 Streamlit版<br>{datetime.now().strftime('%Y-%m-%d')}</div>", unsafe_allow_html=True)

# ==================== 页面路由 ====================

page = st.session_state.get("page", "工作台")

if page == "工作台":
    # 首页：Dashboard
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
    # 用 exec 导入页面模块
    from pages.urs_page import show_urs_page
    show_urs_page()

elif page == "产品配置":
    st.title("📦 产品配置")
    st.info("产品配置功能开发中，请先使用 URS 智能分析")
    
    # 简单产品展示
    products = [
        {"名称": "无菌检测隔离器", "型号": "ISO-1500", "参考价": "$150,000 USD"},
        {"名称": "VHP灭菌隔离器", "型号": "VHP-1200", "参考价": "$65,000 USD"},
        {"名称": "集成式隔离器", "型号": "INT-2000", "参考价": "$580,000 USD"},
        {"名称": "负压隔离器", "型号": "NEG-1000", "参考价": "$200,000 USD"},
        {"名称": "百级层流传递窗", "型号": "PB-LF-500", "参考价": "$25,000 USD"},
        {"名称": "VHP灭菌传递箱", "型号": "PB-VHP-500", "参考价": "$40,000 USD"},
    ]
    st.dataframe(pd.DataFrame(products), use_container_width=True, hide_index=True)

elif page == "方案管理":
    st.title("📋 方案管理")
    st.info("方案管理功能开发中，请先使用 URS 智能分析生成方案")

elif page == "项目管理":
    st.title("📁 项目管理")
    st.info("项目管理功能开发中")
