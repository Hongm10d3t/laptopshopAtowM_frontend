import styles from './QuantityStepper.module.css'

interface QuantityStepperProps {
  value: number
  min?: number
  disabled?: boolean
  onChange: (nextValue: number) => void
}

// Dùng chung cho ô chọn số lượng ở ProductDetailPage (trước khi thêm vào
// giỏ) và CartPage (sửa số lượng dòng đã có trong giỏ) — component thuần
// hiển thị, không tự gọi API, caller quyết định khi nào áp dụng onChange.
function QuantityStepper({ value, min = 1, disabled = false, onChange }: QuantityStepperProps) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        aria-label="Giảm số lượng"
      >
        −
      </button>
      <span className={styles.value}>{value}</span>
      <button type="button" disabled={disabled} onClick={() => onChange(value + 1)} aria-label="Tăng số lượng">
        +
      </button>
    </div>
  )
}

export default QuantityStepper
