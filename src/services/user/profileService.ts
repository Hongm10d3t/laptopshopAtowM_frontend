import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { ProfileResponse, UpdateProfileRequest } from '../../types/user/profile'

// GET/PUT /customer/profile — yêu cầu role CUSTOMER (SecurityConfig).
export async function getProfile(): Promise<ProfileResponse> {
  const response = await apiClient.get<ApiResponse<ProfileResponse>>('/customer/profile')
  return response.data.data
}

export async function updateProfile(payload: UpdateProfileRequest): Promise<ProfileResponse> {
  const response = await apiClient.put<ApiResponse<ProfileResponse>>('/customer/profile', payload)
  return response.data.data
}
