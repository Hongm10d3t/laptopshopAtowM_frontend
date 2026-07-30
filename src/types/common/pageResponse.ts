// Khớp com.laptophub.common.dto.PageResponse<T> — envelope phân trang chuẩn
// dùng cho mọi API list có phân trang thật (API_CONVENTION.md §5). Endpoint
// dạng "top N"/breakdown (dashboard...) trả List<T> thẳng, KHÔNG dùng type
// này.
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
