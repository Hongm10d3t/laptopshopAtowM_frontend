import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type { ProductDetailResponse, ProductListItemResponse, ProductSortOption } from '../../types/catalog/product'

// Khớp query param thật của GET /public/products (PublicProductController) —
// axios tự bỏ qua field undefined khi build query string, không cần tự lọc.
export interface SearchProductsParams {
  categoryId?: number
  brandId?: number
  keyword?: string
  minPrice?: number
  maxPrice?: number
  sort?: ProductSortOption
  page?: number
  size?: number
}

export async function searchProducts(
  params: SearchProductsParams = {},
): Promise<PageResponse<ProductListItemResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<ProductListItemResponse>>>('/public/products', {
    params,
  })
  return response.data.data
}

// GET /public/products/{slug} — public, không cần đăng nhập.
export async function getProductBySlug(slug: string): Promise<ProductDetailResponse> {
  const response = await apiClient.get<ApiResponse<ProductDetailResponse>>(`/public/products/${slug}`)
  return response.data.data
}
