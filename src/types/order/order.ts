// Khớp OrderStatus (backend/.../order/entity/) — đủ 8 trạng thái, dùng lại ở
// Phase 4 (danh sách/chi tiết đơn) chứ không chỉ checkout.
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'

// Khớp PaymentMethod — chỉ COD thực sự hoàn thiện ở giai đoạn này (VNPay là
// Phase 5), ONLINE vẫn cho chọn vì Backend đã hỗ trợ tạo Payment PENDING.
export type PaymentMethod = 'COD' | 'ONLINE'

// Khớp PaymentStatus (backend/.../payment/entity/) — null trên OrderResponse/
// OrderSummaryResponse nghĩa là đơn COD (không có Payment). Trạng thái thật
// chỉ đổi qua /ipn (server-to-server), tách biệt hoàn toàn với OrderStatus
// (Order chỉ chuyển PENDING -> CONFIRMED khi Admin xác nhận thủ công, dù
// Payment đã PAID hay chưa).
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'

// Khớp CheckoutRequest (backend/.../order/dto/) — voucherCode/paymentMethod
// optional, note tối đa 500 ký tự.
export interface CheckoutRequest {
  addressId: number
  note?: string
  voucherCode?: string
  paymentMethod?: PaymentMethod
}

// Khớp OrderItemResponse. productId/productSlug resolve sống từ
// productVariantId (không phải snapshot) — có thể null nếu không resolve
// được (thực tế không xảy ra, xem comment phía Backend).
export interface OrderItemResponse {
  id: number
  productVariantId: number
  productId: number | null
  productSlug: string | null
  productName: string
  variantName: string
  sku: string
  unitPrice: number
  quantity: number
  discountAmount: number
  lineTotal: number
}

// Khớp OrderResponse.
export interface OrderResponse {
  id: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus | null
  totalAmount: number
  discountAmount: number
  voucherCode: string | null
  note: string | null
  recipientName: string
  phone: string
  province: string
  district: string
  ward: string
  streetAddress: string
  items: OrderItemResponse[]
  createdAt: string
  updatedAt: string
}

// Khớp OrderSummaryResponse — dùng cho GET /customer/orders (danh sách),
// không kèm items để tránh N+1 khi phân trang.
export interface OrderSummaryResponse {
  id: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus | null
  totalAmount: number
  createdAt: string
}
