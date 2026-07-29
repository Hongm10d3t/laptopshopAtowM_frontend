import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { AddressCreateRequest, AddressResponse, AddressUpdateRequest } from '../../types/user/address'

// /customer/addresses/** — yêu cầu role CUSTOMER (SecurityConfig).
export async function listAddresses(): Promise<AddressResponse[]> {
  const response = await apiClient.get<ApiResponse<AddressResponse[]>>('/customer/addresses')
  return response.data.data
}

export async function getAddress(id: number): Promise<AddressResponse> {
  const response = await apiClient.get<ApiResponse<AddressResponse>>(`/customer/addresses/${id}`)
  return response.data.data
}

export async function createAddress(payload: AddressCreateRequest): Promise<AddressResponse> {
  const response = await apiClient.post<ApiResponse<AddressResponse>>('/customer/addresses', payload)
  return response.data.data
}

export async function updateAddress(id: number, payload: AddressUpdateRequest): Promise<AddressResponse> {
  const response = await apiClient.put<ApiResponse<AddressResponse>>(`/customer/addresses/${id}`, payload)
  return response.data.data
}

export async function deleteAddress(id: number): Promise<void> {
  await apiClient.delete(`/customer/addresses/${id}`)
}

export async function setDefaultAddress(id: number): Promise<AddressResponse> {
  const response = await apiClient.post<ApiResponse<AddressResponse>>(`/customer/addresses/${id}/default`)
  return response.data.data
}
