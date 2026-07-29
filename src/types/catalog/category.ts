// Khớp đúng CategoryPublicResponse (backend/.../catalog/dto/CategoryPublicResponse.java)
// — GET /public/categories chỉ trả 3 field này (danh mục đang ACTIVE).
export interface CategoryPublicResponse {
  id: number
  name: string
  slug: string
}
