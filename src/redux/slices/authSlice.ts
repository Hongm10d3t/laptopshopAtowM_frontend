import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UserRole } from '../../types/auth/session'

export interface AuthCredentials {
  accessToken: string
  userId: number
  email: string
  role: UserRole
  // epoch ms — thời điểm access token hết hạn, tính từ expiresIn (giây) lúc
  // login/refresh thành công. Chưa dùng để tự động refresh sớm ở gói này —
  // việc refresh chỉ xảy ra phản ứng lại lỗi 401 thật từ Backend.
  expiresAt: number
}

interface AuthState {
  accessToken: string | null
  userId: number | null
  email: string | null
  role: UserRole | null
  expiresAt: number | null
  // true từ lúc app mở tới khi restoreSession() (silent refresh, App.tsx) có
  // kết quả — AuthGuard (Gói 1.4) PHẢI đợi cờ này về false trước khi quyết
  // định điều hướng /login, nếu không sẽ đá nhầm người dùng đã đăng nhập
  // (còn cookie hợp lệ) ra ngoài chỉ vì restore chưa kịp chạy xong.
  isRestoring: boolean
}

const initialState: AuthState = {
  accessToken: null,
  userId: null,
  email: null,
  role: null,
  expiresAt: null,
  isRestoring: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthCredentials>) {
      state.accessToken = action.payload.accessToken
      state.userId = action.payload.userId
      state.email = action.payload.email
      state.role = action.payload.role
      state.expiresAt = action.payload.expiresAt
      state.isRestoring = false
    },
    // Dùng cho cả logout thật lẫn "restore thất bại lúc mở app" (không có
    // cookie hợp lệ) — luôn kết thúc với isRestoring=false, không reset về
    // initialState thẳng (initialState.isRestoring=true sẽ làm AuthGuard
    // treo lại "đang tải" sau khi đã biết chắc chắn là chưa đăng nhập).
    clearCredentials(state) {
      state.accessToken = null
      state.userId = null
      state.email = null
      state.role = null
      state.expiresAt = null
      state.isRestoring = false
    },
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer
