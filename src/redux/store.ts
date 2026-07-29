import { configureStore } from '@reduxjs/toolkit'

// Chưa có slice nghiệp vụ nào (authSlice/cartSlice/... sẽ thêm khi implement
// từng feature) — reducer rỗng chỉ để chứng minh store wiring hoạt động.
export const store = configureStore({
  reducer: {},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
