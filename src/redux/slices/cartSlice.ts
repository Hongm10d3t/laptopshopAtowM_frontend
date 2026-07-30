import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CartResponse } from '../../types/cart/cart'

// State giỏ hàng thật (khác compareSlice — cart có API Backend đứng sau).
// cartService là nơi duy nhất dispatch vào slice này (giống authSlice qua
// authService) — component chỉ đọc qua useAppSelector, không tự dispatch
// setCart để tránh Redux lệch với dữ liệu Backend.
interface CartState {
  items: CartResponse['items']
  totalAmount: number
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<CartResponse>) {
      state.items = action.payload.items
      state.totalAmount = action.payload.totalAmount
    },
    clearCartState(state) {
      state.items = []
      state.totalAmount = 0
    },
  },
})

export const { setCart, clearCartState } = cartSlice.actions
export default cartSlice.reducer
