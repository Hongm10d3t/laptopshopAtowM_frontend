import type { OrderStatus, PaymentMethod, PaymentStatus } from '../types/order/order'

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

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  CANCELLED: 'Đã hủy thanh toán',
}

export function formatPaymentStatus(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status]
}

// Khớp OrderService.cancelByCustomer — Customer chỉ tự hủy được khi đơn chưa
// bắt đầu chuẩn bị (PENDING/CONFIRMED), hẹp hơn năng lực Admin
// (Order.isCancellable cho phép cả PREPARING). Dùng chung ở OrderListPage
// (nút hủy nhanh) và OrderDetailPage.
export function isOrderCancellableByCustomer(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED'
}

// Dựa thẳng vào paymentStatus thật (OrderResponse/OrderSummaryResponse.paymentStatus,
// Backend đọc từ Payment.status) — KHÔNG suy đoán qua Order.status nữa: Order
// chỉ chuyển PENDING -> CONFIRMED khi Admin xác nhận thủ công, tách biệt hoàn
// toàn với việc Payment đã PAID hay chưa, nên "Order còn PENDING" không đồng
// nghĩa "chưa thanh toán" (xem isPaidAwaitingConfirmation bên dưới).
export function isOrderPayableOnline(paymentMethod: PaymentMethod, paymentStatus: PaymentStatus | null): boolean {
  return paymentMethod === 'ONLINE' && (paymentStatus === 'PENDING' || paymentStatus === 'FAILED')
}

// Đơn ONLINE đã thanh toán xong (Payment PAID) nhưng Order vẫn "Chờ xác
// nhận" vì chưa được Admin duyệt thủ công — cần hiện rõ dấu hiệu này, tránh
// để khách hiểu nhầm là chưa thanh toán và mời thanh toán lại.
export function isPaidAwaitingConfirmation(
  orderStatus: OrderStatus,
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus | null,
): boolean {
  return orderStatus === 'PENDING' && paymentMethod === 'ONLINE' && paymentStatus === 'PAID'
}
