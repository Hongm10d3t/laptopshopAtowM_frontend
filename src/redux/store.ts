import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import compareReducer from './slices/compareSlice'
import cartReducer from './slices/cartSlice'

// authSlice là slice nghiệp vụ đầu tiên (Gói 1.3), compareSlice thêm ở Gói
// 2.4, cartSlice thêm ở Gói 3.1.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    compare: compareReducer,
    cart: cartReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
