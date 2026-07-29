import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from './env'
import { store } from '../redux/store'
import { clearCredentials, setCredentials } from '../redux/slices/authSlice'
import { deriveCredentials } from '../utils/session'
import type { ApiResponse } from '../types/common/apiResponse'
import type { LoginResponse } from '../types/auth/login'

// Axios instance dùng chung DUY NHẤT cho toàn app — mọi service phải import
// instance này, không tự tạo axios.create() riêng.
//
// withCredentials: true bắt buộc vì Backend set refresh token qua HttpOnly
// Cookie (AUTH_SECURITY_USER_CONTRACT.md §4).
const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Gắn Authorization từ accessToken hiện có trong Redux — mọi request (kể cả
// public) đều có thể có header này nếu đã đăng nhập, Backend chỉ đọc khi cần.
apiClient.interceptors.request.use((config) => {
  const { accessToken } = store.getState().auth
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// Chỉ 1 request refresh chạy tại 1 thời điểm — nhiều request cùng 401 gần
// nhau (vd load trang gọi song song nhiều API) sẽ dùng chung 1 promise thay
// vì mỗi request tự gọi /auth/refresh riêng (mỗi lần refresh thật sự xoay
// vòng refresh token — gọi thừa dễ dính reuse-detection, xem RefreshService.java).
let refreshPromise: Promise<string> | null = null

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<ApiResponse<LoginResponse>>('/auth/refresh')
      .then((response) => {
        const credentials = deriveCredentials(response.data.data)
        store.dispatch(setCredentials(credentials))
        return credentials.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// 401 (trừ chính /auth/login, /auth/refresh — tránh vòng lặp vô hạn) -> thử
// refresh đúng 1 lần rồi retry lại request gốc. Refresh cũng thất bại (cookie
// hết hạn/đã bị revoke) -> clear phiên, ném lỗi 401 gốc ra cho nơi gọi tự xử
// lý (Gói 1.4 — AuthGuard sẽ điều hướng /login).
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh')

    if (error.response?.status === 401 && originalRequest && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const newAccessToken = await refreshAccessToken()
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
        return apiClient(originalRequest)
      } catch (refreshError) {
        store.dispatch(clearCredentials())
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
