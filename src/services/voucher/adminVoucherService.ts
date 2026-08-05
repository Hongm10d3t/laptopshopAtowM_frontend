import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type {
  AdminVoucherResponse,
  VoucherCreateRequest,
  VoucherUpdateRequest,
} from '../../types/voucher/adminVoucher'

export interface ListAdminVouchersParams {
  code?: string
  active?: boolean
  page?: number
  size?: number
}

export async function listAdminVouchers(
  params: ListAdminVouchersParams = {},
): Promise<PageResponse<AdminVoucherResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminVoucherResponse>>>('/admin/vouchers', {
    params,
  })
  return response.data.data
}

export async function getAdminVoucher(id: number): Promise<AdminVoucherResponse> {
  const response = await apiClient.get<ApiResponse<AdminVoucherResponse>>(`/admin/vouchers/${id}`)
  return response.data.data
}

export async function createAdminVoucher(payload: VoucherCreateRequest): Promise<AdminVoucherResponse> {
  const response = await apiClient.post<ApiResponse<AdminVoucherResponse>>('/admin/vouchers', payload)
  return response.data.data
}

export async function updateAdminVoucher(
  id: number,
  payload: VoucherUpdateRequest,
): Promise<AdminVoucherResponse> {
  const response = await apiClient.put<ApiResponse<AdminVoucherResponse>>(`/admin/vouchers/${id}`, payload)
  return response.data.data
}
