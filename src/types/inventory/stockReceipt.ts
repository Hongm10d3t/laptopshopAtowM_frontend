// Khớp module backend/.../inventory — toàn bộ Admin (Phase 6.3,
// AdminStockReceiptController). Không có API public/customer nào tương ứng.
export type StockReceiptStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

// Khớp StockReceiptItemRequest.
export interface StockReceiptItemRequest {
  productVariantId: number
  quantity: number
}

// Khớp StockReceiptCreateRequest.
export interface StockReceiptCreateRequest {
  code: string
  note?: string
  items: StockReceiptItemRequest[]
}

// Khớp StockReceiptItemsReplaceRequest.
export interface StockReceiptItemsReplaceRequest {
  items: StockReceiptItemRequest[]
}

// Khớp StockReceiptItemResponse.
export interface StockReceiptItemResponse {
  id: number
  productVariantId: number
  sku: string
  quantity: number
}

// Khớp StockReceiptSummaryResponse (danh sách).
export interface StockReceiptSummaryResponse {
  id: number
  code: string
  status: StockReceiptStatus
  note: string | null
  createdAt: string
  confirmedAt: string | null
}

// Khớp StockReceiptDetailResponse.
export interface StockReceiptDetailResponse {
  id: number
  code: string
  status: StockReceiptStatus
  note: string | null
  items: StockReceiptItemResponse[]
  createdByUserId: number
  createdAt: string
  confirmedByUserId: number | null
  confirmedAt: string | null
  cancelledByUserId: number | null
  cancelledAt: string | null
}
