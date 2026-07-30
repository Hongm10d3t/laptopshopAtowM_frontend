import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { ComparisonResult } from '../../types/catalog/comparison'

// GET /public/products/compare?variantIds=1,2,3 — public, không cần đăng
// nhập (PublicProductComparisonController). Backend tự dedupe + validate số
// lượng (2-3) và cùng danh mục, trả lỗi tiếng Việt sẵn nếu vi phạm.
export async function compareProducts(variantIds: number[]): Promise<ComparisonResult> {
  const response = await apiClient.get<ApiResponse<ComparisonResult>>('/public/products/compare', {
    params: { variantIds: variantIds.join(',') },
  })
  return response.data.data
}
