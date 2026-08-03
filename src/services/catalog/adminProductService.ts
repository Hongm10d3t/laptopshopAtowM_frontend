import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type {
  ProductFormRequest,
  ProductImageCreateRequest,
  ProductImageReorderRequest,
  ProductImageResponse,
  ProductResponse,
  ProductSpecValueResponse,
  ProductSpecValuesUpsertRequest,
  ProductStatus,
  ProductSummaryResponse,
  ProductVariantCreateRequest,
  ProductVariantResponse,
  ProductVariantUpdateRequest,
} from '../../types/catalog/product'

// Toàn bộ hàm dưới đây gọi /admin/products (AdminProductController) — yêu cầu
// đã đăng nhập ADMIN, khác hẳn searchProducts/getProductBySlug (public,
// productService.ts) vốn chỉ đọc và chỉ trả dữ liệu ACTIVE.

export interface ListProductsParams {
  categoryId?: number
  brandId?: number
  status?: ProductStatus
  keyword?: string
  page?: number
  size?: number
}

export async function listProducts(
  params: ListProductsParams = {},
): Promise<PageResponse<ProductSummaryResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<ProductSummaryResponse>>>('/admin/products', {
    params,
  })
  return response.data.data
}

export async function getProduct(id: number): Promise<ProductResponse> {
  const response = await apiClient.get<ApiResponse<ProductResponse>>(`/admin/products/${id}`)
  return response.data.data
}

export async function createProduct(payload: ProductFormRequest): Promise<ProductResponse> {
  const response = await apiClient.post<ApiResponse<ProductResponse>>('/admin/products', payload)
  return response.data.data
}

export async function updateProduct(id: number, payload: ProductFormRequest): Promise<ProductResponse> {
  const response = await apiClient.put<ApiResponse<ProductResponse>>(`/admin/products/${id}`, payload)
  return response.data.data
}

export async function activateProduct(id: number): Promise<ProductResponse> {
  const response = await apiClient.post<ApiResponse<ProductResponse>>(`/admin/products/${id}/activate`)
  return response.data.data
}

export async function deactivateProduct(id: number): Promise<ProductResponse> {
  const response = await apiClient.post<ApiResponse<ProductResponse>>(`/admin/products/${id}/deactivate`)
  return response.data.data
}

export async function listVariants(productId: number): Promise<ProductVariantResponse[]> {
  const response = await apiClient.get<ApiResponse<ProductVariantResponse[]>>(`/admin/products/${productId}/variants`)
  return response.data.data
}

export async function addVariant(
  productId: number,
  payload: ProductVariantCreateRequest,
): Promise<ProductVariantResponse> {
  const response = await apiClient.post<ApiResponse<ProductVariantResponse>>(
    `/admin/products/${productId}/variants`,
    payload,
  )
  return response.data.data
}

export async function updateVariant(
  productId: number,
  variantId: number,
  payload: ProductVariantUpdateRequest,
): Promise<ProductVariantResponse> {
  const response = await apiClient.put<ApiResponse<ProductVariantResponse>>(
    `/admin/products/${productId}/variants/${variantId}`,
    payload,
  )
  return response.data.data
}

export async function activateVariant(productId: number, variantId: number): Promise<ProductVariantResponse> {
  const response = await apiClient.post<ApiResponse<ProductVariantResponse>>(
    `/admin/products/${productId}/variants/${variantId}/activate`,
  )
  return response.data.data
}

export async function deactivateVariant(productId: number, variantId: number): Promise<ProductVariantResponse> {
  const response = await apiClient.post<ApiResponse<ProductVariantResponse>>(
    `/admin/products/${productId}/variants/${variantId}/deactivate`,
  )
  return response.data.data
}

export async function listImages(productId: number): Promise<ProductImageResponse[]> {
  const response = await apiClient.get<ApiResponse<ProductImageResponse[]>>(`/admin/products/${productId}/images`)
  return response.data.data
}

export async function addImage(
  productId: number,
  payload: ProductImageCreateRequest,
): Promise<ProductImageResponse> {
  const response = await apiClient.post<ApiResponse<ProductImageResponse>>(
    `/admin/products/${productId}/images`,
    payload,
  )
  return response.data.data
}

export async function removeImage(productId: number, imageId: number): Promise<void> {
  await apiClient.delete(`/admin/products/${productId}/images/${imageId}`)
}

export async function reorderImages(
  productId: number,
  payload: ProductImageReorderRequest,
): Promise<ProductImageResponse[]> {
  const response = await apiClient.put<ApiResponse<ProductImageResponse[]>>(
    `/admin/products/${productId}/images/reorder`,
    payload,
  )
  return response.data.data
}

export async function listSpecificationValues(productId: number): Promise<ProductSpecValueResponse[]> {
  const response = await apiClient.get<ApiResponse<ProductSpecValueResponse[]>>(
    `/admin/products/${productId}/specifications`,
  )
  return response.data.data
}

export async function upsertSpecifications(
  productId: number,
  payload: ProductSpecValuesUpsertRequest,
): Promise<ProductSpecValueResponse[]> {
  const response = await apiClient.put<ApiResponse<ProductSpecValueResponse[]>>(
    `/admin/products/${productId}/specifications`,
    payload,
  )
  return response.data.data
}
