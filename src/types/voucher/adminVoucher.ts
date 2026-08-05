export type VoucherDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export interface AdminVoucherResponse {
  id: number
  code: string
  description: string | null
  discountType: VoucherDiscountType
  discountValue: number
  maxDiscountAmount: number | null
  minOrderAmount: number
  usageLimit: number | null
  usageLimitPerUser: number | null
  usedCount: number
  startAt: string
  endAt: string
  active: boolean
  createdAt: string
}

export interface VoucherCreateRequest {
  code: string
  description?: string
  discountType: VoucherDiscountType
  discountValue: number
  maxDiscountAmount?: number
  minOrderAmount: number
  usageLimit?: number
  usageLimitPerUser?: number
  startAt: string
  endAt: string
}

export interface VoucherUpdateRequest {
  description?: string
  discountType: VoucherDiscountType
  discountValue: number
  maxDiscountAmount?: number
  minOrderAmount: number
  usageLimit?: number
  usageLimitPerUser?: number
  startAt: string
  endAt: string
  active: boolean
}

export type VoucherLifecycleStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED' | 'EXHAUSTED'
