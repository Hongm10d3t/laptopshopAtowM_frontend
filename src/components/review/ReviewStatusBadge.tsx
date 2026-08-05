import type { AdminReviewStatus } from '../../types/review/adminReview'
import styles from './ReviewStatusBadge.module.css'

interface ReviewStatusBadgeProps {
  status: AdminReviewStatus
}

function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${status === 'VISIBLE' ? styles.visible : styles.hidden}`}>
      {status === 'VISIBLE' ? 'Đang hiển thị' : 'Đã ẩn'}
    </span>
  )
}

export default ReviewStatusBadge
