import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'

// authSlice là slice nghiệp vụ đầu tiên (Gói 1.3) — cartSlice/productSlice/...
// sẽ thêm khi implement từng feature tương ứng.
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
