import axios from 'axios'

export const TOKEN_KEY = 'mael_token'

/**
 * Axios dùng chung. Dev: baseURL rỗng, Vite proxy /api sang BE.
 * Tự gắn JWT vào header và đá về trang đăng nhập khi token hết hạn (401).
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const isAuthCall = error.config?.url?.includes('/api/auth/')
    if (status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY)
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    // Hết thể lực: báo cho EnergyModal hiện màn nghỉ ngơi
    if (status === 429 && /thể lực/i.test(error.response?.data?.message || '')) {
      window.dispatchEvent(new CustomEvent('mael:no-energy', { detail: error.response.data.message }))
    }
    return Promise.reject(error)
  },
)

/** Lấy câu thông báo lỗi tiếng Việt từ response của BE */
export function getErrorMessage(error, fallback = 'Có lỗi xảy ra, vui lòng thử lại') {
  const data = error?.response?.data
  if (data?.fieldErrors) return Object.values(data.fieldErrors)[0]
  if (data?.message) return data.message
  if (error?.code === 'ERR_NETWORK') return 'Không kết nối được máy chủ. Kiểm tra BE đã chạy chưa (cổng 8089).'
  return fallback
}

/** URL đầy đủ cho ảnh upload (/uploads/...) */
export function fileUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return (import.meta.env.VITE_API_URL || '') + path
}

export default client
