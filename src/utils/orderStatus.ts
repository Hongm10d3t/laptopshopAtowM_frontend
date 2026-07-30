import type { OrderStatus, PaymentMethod } from '../types/order/order'

// Nhãn tiếng Việt cho OrderStatus — dùng chung từ Gói 3.2 (xác nhận đặt hàng)
// tới Phase 4 (danh sách/chi tiết đơn), tránh định nghĩa lại nhiều nơi.
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị hàng',
  SHIPPING: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  CANCELLED: 'Đã hủy',
  RETURN_REQUESTED: 'Yêu cầu trả hàng',
  RETURNED: 'Đã trả hàng',
}

export function formatOrderStatus(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status]
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  ONLINE: 'Thanh toán online',
}

export function formatPaymentMethod(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method]
}

// Khớp OrderService.cancelByCustomer — Customer chỉ tự hủy được khi đơn chưa
// bắt đầu chuẩn bị (PENDING/CONFIRMED), hẹp hơn năng lực Admin
// (Order.isCancellable cho phép cả PREPARING). Dùng chung ở OrderListPage
// (nút hủy nhanh) và OrderDetailPage.
export function isOrderCancellableByCustomer(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED'
}
