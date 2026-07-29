// Khớp RegisterRequest/RegisterResponse
// (backend/.../auth/dto/RegisterRequest.java, RegisterResponse.java).
// Không có role/status — service Backend luôn gán CUSTOMER/PENDING_VERIFICATION,
// không đọc từ client.
export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phone?: string
}

export interface RegisterResponse {
  id: number
  email: string
  fullName: string
  phone: string | null
}
