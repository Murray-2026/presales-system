import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  ProjectOutlined,
  RobotOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/urs', icon: <RobotOutlined />, label: 'URS分析' },
  { key: '/proposals', icon: <FileTextOutlined />, label: '方案管理' },
  { key: '/products', icon: <AppstoreOutlined />, label: '产品配置' },
  { key: '/projects', icon: <ProjectOutlined />, label: '项目管理' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

  const selectedKey = '/' + location.pathname.split('/').filter(Boolean)[0] || '/'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: collapsed ? 16 : 18, fontWeight: 600, color: '#1677ff', whiteSpace: 'nowrap' }}>
            {collapsed ? 'PS' : '售前系统'}
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
        <div style={{ position: 'absolute', bottom: 16, width: '100%', textAlign: 'center' }}>
          <Menu
            mode="inline"
            selectedKeys={[]}
            items={[{ key: '/settings', icon: <SettingOutlined />, label: '设置' }]}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0 }}
          />
        </div>
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <span onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 18, cursor: 'pointer', marginRight: 16 }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <span style={{ fontSize: 14, color: '#666' }}>售前项目管理系统 v1.0</span>
        </Header>
        <Content style={{ margin: 0, background: '#f5f5f5', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
