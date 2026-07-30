import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Backend không lưu comparison ở entity nào (ProductComparisonService: "read
// model, không bảng lưu comparison ở MVP") — danh sách đang so sánh chỉ tồn
// tại phía client trong phiên làm việc hiện tại (mất khi tải lại trang, đủ
// dùng cho MVP, không cần localStorage/backend).
export interface CompareItem {
  variantId: number
  productId: number
  productSlug: string
  productName: string
  variantName: string
  categoryName: string
  thumbnailUrl: string | null
}

interface CompareState {
  items: CompareItem[]
  // Modal "Chọn sản phẩm so sánh" (CompareSelectorModal) được mount 1 lần ở
  // MainLayout, mọi trang (ProductDetailPage/ComparePage/CompareBar) chỉ cần
  // dispatch open/close — tránh phải tự quản 1 state mở/đóng riêng ở từng nơi.
  isSelectorOpen: boolean
}

const MAX_ITEMS = 3

const initialState: CompareState = {
  items: [],
  isSelectorOpen: false,
}

const compareSlice = createSlice({
  name: 'compare',
  initialState,
  reducers: {
    addCompareItem(state, action: PayloadAction<CompareItem>) {
      const alreadyAdded = state.items.some((item) => item.variantId === action.payload.variantId)
      if (alreadyAdded || state.items.length >= MAX_ITEMS) return
      state.items.push(action.payload)
    },
    removeCompareItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter((item) => item.variantId !== action.payload)
    },
    clearCompareItems(state) {
      state.items = []
    },
    openCompareSelector(state) {
      state.isSelectorOpen = true
    },
    closeCompareSelector(state) {
      state.isSelectorOpen = false
    },
  },
})

export const {
  addCompareItem,
  removeCompareItem,
  clearCompareItems,
  openCompareSelector,
  closeCompareSelector,
} = compareSlice.actions
export default compareSlice.reducer
