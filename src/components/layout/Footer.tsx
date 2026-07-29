import { Link } from 'react-router-dom'
import { env } from '../../config/env'
import styles from './Footer.module.css'

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div>
          <p className={styles.brand}>{env.appName}</p>
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
            <li>Hotline: 1800 1025</li>
            <li>8:00 - 21:00 hằng ngày</li>
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
