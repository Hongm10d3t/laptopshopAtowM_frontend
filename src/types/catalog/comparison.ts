// Khớp ComparisonItem (backend/.../catalog/dto/) — cột header bảng so sánh,
// mỗi phần tử ứng với 1 ProductVariant.
export interface ComparisonItem {
  variantId: number
  productId: number
  productName: string
  variantName: string
  sku: string
  price: number
  thumbnailUrl: string | null
  categoryName: string
  brandName: string
}

// Khớp ComparisonSpecRow — values keyed theo variantId (dạng string vì JSON
// object key luôn là string, kể cả khi Backend dùng Map<Long, String>).
// Thiếu key hoặc value null -> hiển thị "N/A".
export interface ComparisonSpecRow {
  code: string
  label: string
  unit: string | null
  groupLabel: string
  values: Record<string, string | null>
}

// Khớp ComparisonResult.
export interface ComparisonResult {
  items: ComparisonItem[]
  specifications: ComparisonSpecRow[]
}
