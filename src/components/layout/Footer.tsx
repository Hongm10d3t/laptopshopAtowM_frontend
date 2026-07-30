import { Link } from 'react-router-dom'
import { env } from '../../config/env'
import styles from './Footer.module.css'

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

const CLOCK_ICON = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark}>H</span>
            <span>
              Laptop<span className={styles.brandAccent}>Hub</span>
            </span>
          </Link>
          <p className={styles.desc}>Laptop chính hãng, bảo hành đầy đủ, giao hàng toàn quốc.</p>
        </div>
        <div>
          <p className={styles.heading}>Liên kết</p>
          <ul>
            <li>
              <Link to="/">Trang chủ</Link>
            </li>
            <li>
              <Link to="/products">Sản phẩm</Link>
            </li>
            <li>
              <Link to="/compare">So sánh</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className={styles.heading}>Hỗ trợ</p>
          <ul>
            <li className={styles.iconRow}>
              <span className={styles.itemIcon}>{PHONE_ICON}</span>
              Hotline: 1800 1025
            </li>
            <li className={styles.iconRow}>
              <span className={styles.itemIcon}>{CLOCK_ICON}</span>
              8:00 - 21:00 hằng ngày
            </li>
          </ul>
        </div>
      </div>
      <p className={styles.copyright}>
        © {new Date().getFullYear()} {env.appName}. Đồ án demo, không phải cửa hàng thật.
      </p>
    </footer>
  )
}

export default Footer
