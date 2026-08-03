// Khớp module backend/.../inventory (AdminInventoryController) — chỉ xem
// được tồn kho/lịch sử theo TỪNG variant (không có API "liệt kê toàn bộ tồn
// kho"), nên trang Admin phải đi từ 1 variant cụ thể (vd link từ chi tiết
// sản phẩm) chứ không có danh sách tổng ở đây.
export type InventoryMovementType =
  | 'RECEIPT'
  | 'RESERVE'
  | 'RELEASE'
  | 'SHIPMENT'
  | 'RETURN'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'

// Khớp InventoryBalanceResponse.
export interface InventoryBalanceResponse {
  productVariantId: number
  sku: string
  onHandQuantity: number
  reservedQuantity: number
  availableQuantity: number
}

// Khớp InventoryMovementResponse.
export interface InventoryMovementResponse {
  id: number
  productVariantId: number
  type: InventoryMovementType
  quantity: number
  onHandAfter: number
  reservedAfter: number
  referenceType: string | null
  referenceId: number | null
  reason: string | null
  createdByUserId: number
  createdAt: string
}

// Khớp InventoryAdjustRequest.
export interface InventoryAdjustRequest {
  delta: number
  reason: string
}
