import type { ProductVariantStatus } from '../catalog/product'
import type { OrderStatus } from '../order/order'

// Khớp RevenueByDayItem / RevenueSummaryResponse trong dashboard module.
// Backend trả BigDecimal dưới dạng JSON number và LocalDate dạng YYYY-MM-DD.
export interface RevenueByDayItem {
  date: string
  revenue: number
  orderCount: number
}

export interface RevenueSummaryResponse {
  totalRevenue: number
  orderCount: number
  byDay: RevenueByDayItem[]
}

// Backend chỉ trả các status thực sự có dữ liệu trong khoảng ngày. Page sẽ
// tự bù count=0 cho các trạng thái còn lại để dashboard luôn đủ 8 trạng thái.
export interface OrderStatusCountResponse {
  status: OrderStatus
  count: number
}

export interface CustomerStatsResponse {
  totalCustomers: number
  newCustomers: number
  activeCustomers: number
  blockedCustomers: number
}

// Xếp hạng theo ProductVariant (SKU), không roll-up theo Product — đúng với
// định nghĩa backend vì giá, tồn kho và order item đều gắn với variant.
export interface BestSellingItemResponse {
  variantId: number
  productId: number | null
  productName: string | null
  variantName: string | null
  sku: string | null
  quantitySold: number
  revenue: number
}

export interface LowStockItemResponse {
  variantId: number
  productId: number | null
  productName: string | null
  variantName: string | null
  sku: string | null
  onHandQuantity: number
  reservedQuantity: number
  availableQuantity: number
  status: ProductVariantStatus | null
}
