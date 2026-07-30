import { useState } from 'react'
import styles from './StarRatingInput.module.css'

interface StarRatingInputProps {
  value: number
  onChange: (nextValue: number) => void
  disabled?: boolean
}

const STAR_PATH = 'M8 1.2l2 4 4.4.6-3.2 3.1.8 4.4L8 11.2l-4 2.1.8-4.4-3.2-3.1 4.4-.6L8 1.2Z'

// Sao chọn được (khác StarRating chỉ đọc) — dùng cho form viết đánh giá
// (Gói 4.4). Hover xem trước số sao sẽ chọn, click để chốt giá trị.
function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const displayValue = hoverValue ?? value

  return (
    <div className={styles.stars} onMouseLeave={() => setHoverValue(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={star <= displayValue ? styles.starFilled : styles.starEmpty}
          onMouseEnter={() => setHoverValue(star)}
          onClick={() => onChange(star)}
          aria-label={`${star} sao`}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d={STAR_PATH} fill={star <= displayValue ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default StarRatingInput
