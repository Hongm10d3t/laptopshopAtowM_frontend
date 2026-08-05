export type AdminUserRole = 'ADMIN' | 'CUSTOMER'
export type AdminUserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION'

export interface AdminUserResponse {
  id: number
  email: string
  fullName: string
  phone: string | null
  role: AdminUserRole
  status: AdminUserStatus
  createdAt: string
  updatedAt: string
}
