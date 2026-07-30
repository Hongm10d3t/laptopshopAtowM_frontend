// Khớp CartItemResponse (backend/.../cart/dto/) — unitPrice/lineTotal đọc
// live từ ProductVariant.price tại thời điểm gọi API, CartItem không tự lưu
// giá. productName/thumbnailUrl được Backend batch fetch từ Product/
// ProductImage theo productId (không tự lưu trên CartItem) — thumbnailUrl
// null nếu sản phẩm chưa có ảnh nào.
export interface CartItemResponse {
  id: number
  productVariantId: number
  productId: number
  productName: string
  thumbnailUrl: string | null
  sku: string
  variantName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

// Khớp CartResponse.
export interface CartResponse {
  items: CartItemResponse[]
  totalAmount: number
}
