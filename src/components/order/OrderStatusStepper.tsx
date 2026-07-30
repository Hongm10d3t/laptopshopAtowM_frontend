import type { OrderStatus } from '../../types/order/order'
import styles from './OrderStatusStepper.module.css'

const HAPPY_PATH: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Đã đặt hàng' },
  { status: 'CONFIRMED', label: 'Đã xác nhận' },
  { status: 'PREPARING', label: 'Đang chuẩn bị' },
  { status: 'SHIPPING', label: 'Đang giao hàng' },
  { status: 'DELIVERED', label: 'Đã giao hàng' },
]

const RETURN_PATH: { status: OrderStatus; label: string }[] = [
  { status: 'RETURN_REQUESTED', label: 'Yêu cầu trả hàng' },
  { status: 'RETURNED', label: 'Đã trả hàng' },
]

type StepState = 'completed' | 'current' | 'upcoming'

interface Step {
  label: string
  state: StepState
}

const CANCEL_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

interface OrderStatusStepperProps {
  status: OrderStatus
}

// Stepper tiến độ đơn hàng — Backend không có endpoint trả lịch sử chuyển
// trạng thái cho Customer (OrderStatusHistory chỉ dùng nội bộ Admin), nên
// đây là stepper theo trạng thái HIỆN TẠI (so với 5 bước cố định + nhánh trả
// hàng), không phải nhật ký có mốc thời gian từng bước — không bịa timestamp
// không có thật. CANCELLED không rõ đã dừng ở bước nào nên hiện banner riêng
// thay vì stepper gây hiểu nhầm là đã đi qua các bước trước đó.
function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  if (status === 'CANCELLED') {
    return (
      <div className={styles.cancelledBanner}>
        <span className={styles.cancelledIcon}>{CANCEL_ICON}</span>
        Đơn hàng đã bị hủy
      </div>
    )
  }

  const isReturnBranch = status === 'RETURN_REQUESTED' || status === 'RETURNED'

  const happySteps: Step[] = HAPPY_PATH.map((step, index) => {
    if (isReturnBranch) return { label: step.label, state: 'completed' }
    const currentIndex = HAPPY_PATH.findIndex((s) => s.status === status)
    return { label: step.label, state: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'upcoming' }
  })

  const returnSteps: Step[] = isReturnBranch
    ? RETURN_PATH.map((step, index) => {
        const currentIndex = RETURN_PATH.findIndex((s) => s.status === status)
        return { label: step.label, state: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'upcoming' }
      })
    : []

  const steps = [...happySteps, ...returnSteps]

  return (
    <div className={styles.stepper}>
      {steps.map((step, index) => (
        <div
          key={step.label}
          className={
            step.state === 'completed'
              ? styles.stepCompleted
              : step.state === 'current'
                ? styles.stepCurrent
                : styles.stepUpcoming
          }
        >
          <span className={styles.circle}>{step.state === 'completed' ? '✓' : index + 1}</span>
          <span className={styles.label}>{step.label}</span>
        </div>
      ))}
    </div>
  )
}

export default OrderStatusStepper
