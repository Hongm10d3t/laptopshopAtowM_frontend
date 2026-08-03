import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type {
  InventoryAdjustRequest,
  InventoryBalanceResponse,
  InventoryMovementResponse,
  InventoryMovementType,
} from '../../types/inventory/inventory'

// Toàn bộ hàm dưới đây gọi /admin/inventory (AdminInventoryController) —
// LUÔN thao tác theo 1 variantId cụ thể, không có endpoint "liệt kê toàn bộ
// tồn kho" (xem comment trong types/inventory/inventory.ts).

export async function getBalance(variantId: number): Promise<InventoryBalanceResponse> {
  const response = await apiClient.get<ApiResponse<InventoryBalanceResponse>>(`/admin/inventory/${variantId}/balance`)
  return response.data.data
}

export interface ListMovementsParams {
  type?: InventoryMovementType
  page?: number
  size?: number
}

export async function listMovements(
  variantId: number,
  params: ListMovementsParams = {},
): Promise<PageResponse<InventoryMovementResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<InventoryMovementResponse>>>(
    `/admin/inventory/${variantId}/movements`,
    { params },
  )
  return response.data.data
}

export async function adjustInventory(
  variantId: number,
  payload: InventoryAdjustRequest,
): Promise<InventoryBalanceResponse> {
  const response = await apiClient.post<ApiResponse<InventoryBalanceResponse>>(
    `/admin/inventory/${variantId}/adjustments`,
    payload,
  )
  return response.data.data
}
