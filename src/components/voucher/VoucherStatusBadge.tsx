import type { AdminVoucherResponse, VoucherLifecycleStatus } from '../../types/voucher/adminVoucher'
import styles from './VoucherStatusBadge.module.css'

const LABELS: Record<VoucherLifecycleStatus, string> = {
  ACTIVE: 'Đang áp dụng',
  SCHEDULED: 'Sắp diễn ra',
  EXPIRED: 'Đã hết hạn',
  DISABLED: 'Đã tắt',
  EXHAUSTED: 'Hết lượt',
}

export function getVoucherLifecycleStatus(
  voucher: Pick<AdminVoucherResponse, 'active' | 'startAt' | 'endAt' | 'usageLimit' | 'usedCount'>,
  now = new Date(),
): VoucherLifecycleStatus {
  if (!voucher.active) return 'DISABLED'

  const startAt = new Date(voucher.startAt)
  const endAt = new Date(voucher.endAt)

  if (now < startAt) return 'SCHEDULED'
  if (now > endAt) return 'EXPIRED'
  if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) return 'EXHAUSTED'
  return 'ACTIVE'
}

interface VoucherStatusBadgeProps {
  voucher: Pick<AdminVoucherResponse, 'active' | 'startAt' | 'endAt' | 'usageLimit' | 'usedCount'>
}

function VoucherStatusBadge({ voucher }: VoucherStatusBadgeProps) {
  const status = getVoucherLifecycleStatus(voucher)
  return <span className={`${styles.badge} ${styles[status.toLowerCase()]}`}>{LABELS[status]}</span>
}

export default VoucherStatusBadge
