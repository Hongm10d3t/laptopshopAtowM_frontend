import styles from './TopBar.module.css'

const COMMITMENTS = ['Cam kết hàng chính hãng 100%', 'Bảo hành đầy đủ', 'Miễn phí giao hàng toàn quốc']

const CHECK_ICON = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8.5L6.2 11.7L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PHONE_ICON = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.5 2.5h2l1 2.7-1.4 1.2a8 8 0 0 0 4.5 4.5l1.2-1.4 2.7 1v2a1 1 0 0 1-1 1C7.6 13.5 2.5 8.4 2.5 3.5a1 1 0 0 1 1-1Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
)

function TopBar() {
  return (
    <div className={styles.topBar}>
      <ul className={styles.list}>
        {COMMITMENTS.map((item) => (
          <li key={item}>
            <span className={styles.checkIcon}>{CHECK_ICON}</span>
            {item}
          </li>
        ))}
      </ul>
      <span className={styles.hotline}>
        <span className={styles.phoneIcon}>{PHONE_ICON}</span>
        Hotline: 1800 1025 (8:00 - 21:00)
      </span>
    </div>
  )
}

export default TopBar
