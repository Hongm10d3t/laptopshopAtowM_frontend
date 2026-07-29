// Khớp ProfileResponse/UpdateProfileRequest (backend/.../user/dto/).
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION'

export interface ProfileResponse {
  id: number
  email: string
  fullName: string
  phone: string | null
  role: 'ADMIN' | 'CUSTOMER'
  status: UserStatus
  createdAt: string
}

export interface UpdateProfileRequest {
  fullName: string
  phone?: string
}
