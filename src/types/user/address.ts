// Khớp AddressResponse/AddressCreateRequest/AddressUpdateRequest
// (backend/.../user/dto/). isDefault ở Create là gợi ý (địa chỉ đầu tiên của
// user luôn thành mặc định bất kể cờ này — AddressService.create) — không có
// ở Update (đổi mặc định đi qua endpoint riêng POST .../{id}/default).
export interface AddressResponse {
  id: number
  recipientName: string
  phone: string
  province: string
  district: string
  ward: string
  streetAddress: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface AddressCreateRequest {
  recipientName: string
  phone: string
  province: string
  district: string
  ward: string
  streetAddress: string
  isDefault?: boolean
}

export interface AddressUpdateRequest {
  recipientName: string
  phone: string
  province: string
  district: string
  ward: string
  streetAddress: string
}
