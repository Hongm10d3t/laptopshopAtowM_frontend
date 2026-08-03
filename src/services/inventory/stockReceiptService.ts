import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type {
  StockReceiptCreateRequest,
  StockReceiptDetailResponse,
  StockReceiptItemsReplaceRequest,
  StockReceiptStatus,
  StockReceiptSummaryResponse,
} from '../../types/inventory/stockReceipt'

// Toàn bộ hàm dưới đây gọi /admin/stock-receipts (AdminStockReceiptController)
// — module Kho hoàn toàn thuộc Admin, không có API public/customer.

export interface ListStockReceiptsParams {
  status?: StockReceiptStatus
  page?: number
  size?: number
}

export async function listStockReceipts(
  params: ListStockReceiptsParams = {},
): Promise<PageResponse<StockReceiptSummaryResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<StockReceiptSummaryResponse>>>(
    '/admin/stock-receipts',
    { params },
  )
  return response.data.data
}

export async function getStockReceipt(id: number): Promise<StockReceiptDetailResponse> {
  const response = await apiClient.get<ApiResponse<StockReceiptDetailResponse>>(`/admin/stock-receipts/${id}`)
  return response.data.data
}

export async function createStockReceipt(payload: StockReceiptCreateRequest): Promise<StockReceiptDetailResponse> {
  const response = await apiClient.post<ApiResponse<StockReceiptDetailResponse>>('/admin/stock-receipts', payload)
  return response.data.data
}

export async function replaceStockReceiptItems(
  id: number,
  payload: StockReceiptItemsReplaceRequest,
): Promise<StockReceiptDetailResponse> {
  const response = await apiClient.put<ApiResponse<StockReceiptDetailResponse>>(
    `/admin/stock-receipts/${id}/items`,
    payload,
  )
  return response.data.data
}

export async function confirmStockReceipt(id: number): Promise<StockReceiptDetailResponse> {
  const response = await apiClient.post<ApiResponse<StockReceiptDetailResponse>>(`/admin/stock-receipts/${id}/confirm`)
  return response.data.data
}

export async function cancelStockReceipt(id: number): Promise<StockReceiptDetailResponse> {
  const response = await apiClient.post<ApiResponse<StockReceiptDetailResponse>>(`/admin/stock-receipts/${id}/cancel`)
  return response.data.data
}
