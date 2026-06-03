import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 方案管理
export const getProposals = () => api.get('/proposals')
export const getProposal = (id: string) => api.get(`/proposals/${id}`)
export const saveProposal = (data: any) => api.post('/proposals', data)
export const deleteProposal = (id: string) => api.delete(`/proposals/${id}`)
export const exportProposal = (id: string) => api.get(`/proposals/${id}/export`, { responseType: 'blob' })

// 产品管理
export const getProducts = () => api.get('/products')
export const getProductConfig = (productId: string, options: any) => api.post('/products/config', { productId, options })

// 项目管理
export const getProjects = () => api.get('/projects')
export const saveProject = (data: any) => api.post('/projects', data)

export default api
