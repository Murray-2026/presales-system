import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import Proposals from './pages/Proposals'
import ProposalEditor from './pages/ProposalEditor'
import Products from './pages/Products'
import ProductConfig from './pages/ProductConfig'
import Projects from './pages/Projects'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="proposals" element={<Proposals />} />
        <Route path="proposals/new" element={<ProposalEditor />} />
        <Route path="proposals/:id" element={<ProposalEditor />} />
        <Route path="products" element={<Products />} />
        <Route path="products/config" element={<ProductConfig />} />
        <Route path="projects" element={<Projects />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
