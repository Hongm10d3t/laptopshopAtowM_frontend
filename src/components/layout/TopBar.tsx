import styles from './TopBar.module.css'

const COMMITMENTS = ['Cam kết hàng chính hãng 100%', 'Bảo hành đầy đủ', 'Miễn phí giao hàng toàn quốc']

function TopBar() {
  return (
    <div className={styles.topBar}>
      <ul className={styles.list}>
        {COMMITMENTS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <span className={styles.hotline}>Hotline: 1800 1025 (8:00 - 21:00)</span>
    </div>
  )
}

export default TopBar
