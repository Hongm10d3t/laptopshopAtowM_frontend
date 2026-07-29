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
}

const initialState: AuthState = {
  accessToken: null,
  userId: null,
  email: null,
  role: null,
  expiresAt: null,
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
    },
    clearCredentials() {
      return initialState
    },
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer
