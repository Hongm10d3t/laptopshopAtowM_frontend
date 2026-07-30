import styles from './StarRating.module.css'

interface StarRatingProps {
  rating: number
  outOf?: number
}

const STAR_PATH = 'M8 1.2l2 4 4.4.6-3.2 3.1.8 4.4L8 11.2l-4 2.1.8-4.4-3.2-3.1 4.4-.6L8 1.2Z'

// Hiển thị rating dạng sao (chỉ đọc) — dùng chung cho rating trung bình
// (ReviewSummaryResponse.averageRating, có thể lẻ như 4.5) và rating từng
// review (ReviewResponse.rating, luôn là số nguyên) nên làm tròn tới sao gần
// nhất thay vì vẽ nửa sao.
function StarRating({ rating, outOf = 5 }: StarRatingProps) {
  const rounded = Math.round(rating)
  return (
    <span className={styles.stars} aria-label={`${rating}/${outOf} sao`}>
      {Array.from({ length: outOf }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 16 16"
          className={index < rounded ? styles.starFilled : styles.starEmpty}
          aria-hidden="true"
        >
          <path d={STAR_PATH} fill={index < rounded ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" />
        </svg>
      ))}
    </span>
  )
}

export default StarRating
