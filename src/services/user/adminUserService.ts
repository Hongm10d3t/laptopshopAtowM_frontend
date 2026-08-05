import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type {
  AdminUserResponse,
  AdminUserRole,
  AdminUserStatus,
} from '../../types/user/adminUser'

export interface ListAdminUsersParams {
  role?: AdminUserRole
  status?: AdminUserStatus
  keyword?: string
  page?: number
  size?: number
  sort?: string
}

export async function listAdminUsers(
  params: ListAdminUsersParams = {},
): Promise<PageResponse<AdminUserResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminUserResponse>>>('/admin/users', { params })
  return response.data.data
}

export async function getAdminUser(id: number): Promise<AdminUserResponse> {
  const response = await apiClient.get<ApiResponse<AdminUserResponse>>(`/admin/users/${id}`)
  return response.data.data
}

export async function blockAdminUser(id: number): Promise<AdminUserResponse> {
  const response = await apiClient.post<ApiResponse<AdminUserResponse>>(`/admin/users/${id}/block`)
  return response.data.data
}

export async function activateAdminUser(id: number): Promise<AdminUserResponse> {
  const response = await apiClient.post<ApiResponse<AdminUserResponse>>(`/admin/users/${id}/activate`)
  return response.data.data
}
