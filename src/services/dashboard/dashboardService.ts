import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type {
  BestSellingItemResponse,
  CustomerStatsResponse,
  LowStockItemResponse,
  OrderStatusCountResponse,
  RevenueSummaryResponse,
} from '../../types/dashboard/dashboard'

export interface DashboardDateRangeParams {
  from?: string
  to?: string
}

export interface BestSellingParams extends DashboardDateRangeParams {
  limit?: number
}

export interface LowStockParams {
  threshold?: number
  page?: number
  size?: number
}

export async function getDashboardRevenue(
  params: DashboardDateRangeParams = {},
): Promise<RevenueSummaryResponse> {
  const response = await apiClient.get<ApiResponse<RevenueSummaryResponse>>(
    '/admin/dashboard/revenue',
    { params },
  )
  return response.data.data
}

export async function getDashboardOrdersByStatus(
  params: DashboardDateRangeParams = {},
): Promise<OrderStatusCountResponse[]> {
  const response = await apiClient.get<ApiResponse<OrderStatusCountResponse[]>>(
    '/admin/dashboard/orders-by-status',
    { params },
  )
  return response.data.data
}

export async function getDashboardCustomerStats(
  params: DashboardDateRangeParams = {},
): Promise<CustomerStatsResponse> {
  const response = await apiClient.get<ApiResponse<CustomerStatsResponse>>(
    '/admin/dashboard/customers',
    { params },
  )
  return response.data.data
}

export async function getDashboardBestSelling(
  params: BestSellingParams = {},
): Promise<BestSellingItemResponse[]> {
  const response = await apiClient.get<ApiResponse<BestSellingItemResponse[]>>(
    '/admin/dashboard/best-selling-products',
    { params },
  )
  return response.data.data
}

export async function getDashboardLowStock(
  params: LowStockParams = {},
): Promise<PageResponse<LowStockItemResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<LowStockItemResponse>>>(
    '/admin/dashboard/low-stock-products',
    { params },
  )
  return response.data.data
}
