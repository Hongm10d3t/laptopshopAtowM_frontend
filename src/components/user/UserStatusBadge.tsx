import type { AdminUserStatus } from '../../types/user/adminUser'
import styles from './UserStatusBadge.module.css'

const LABELS: Record<AdminUserStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  BLOCKED: 'Đã khóa',
  PENDING_VERIFICATION: 'Chờ xác thực',
}

interface UserStatusBadgeProps {
  status: AdminUserStatus
}

function UserStatusBadge({ status }: UserStatusBadgeProps) {
  return <span className={`${styles.badge} ${styles[status.toLowerCase()]}`}>{LABELS[status]}</span>
}

export default UserStatusBadge
