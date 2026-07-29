import axios from 'axios'
import { env } from './env'

// Axios instance dùng chung DUY NHẤT cho toàn app — mọi service sau này phải
// import instance này, không tự tạo axios.create() riêng.
//
// withCredentials: true bắt buộc từ foundation vì Backend set refresh token
// qua HttpOnly Cookie (xem AUTH_SECURITY_USER_CONTRACT.md) — nếu thiếu cờ này
// ngay từ đầu, cookie sẽ không được trình duyệt gửi kèm khi bắt đầu implement
// Authentication.
//
// CHƯA có ở đây (để dành Authentication phase): interceptor gắn access token,
// tự động refresh khi 401, logout khi refresh thất bại, xử lý error nghiệp vụ
// theo ApiResponse của Backend.
const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default apiClient
