import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { SpecificationDefinitionResponse } from '../../types/catalog/product'

// GET /admin/specifications (AdminSpecificationController) — chỉ đọc, dữ liệu
// tham chiếu ít thay đổi (seed sẵn qua migration), CHƯA có Admin CRUD.
// categoryId=null trả về áp dụng toàn cục + riêng của danh mục đó (xem
// SpecificationDefinitionService.listForCategory).
export async function listSpecificationDefinitions(
  categoryId?: number,
): Promise<SpecificationDefinitionResponse[]> {
  const response = await apiClient.get<ApiResponse<SpecificationDefinitionResponse[]>>('/admin/specifications', {
    params: categoryId ? { categoryId } : undefined,
  })
  return response.data.data
}
