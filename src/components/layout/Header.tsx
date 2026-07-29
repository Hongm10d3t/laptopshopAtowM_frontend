import { Link } from 'react-router-dom'
import TopBar from './TopBar'
import CategoryNav from './CategoryNav'
import styles from './Header.module.css'

// Trạng thái đăng nhập/giỏ hàng CHƯA nối vào authSlice/cartSlice thật —
// đó là việc của Gói 1.3 (Auth) và Gói 3.1 (Cart). Ở đây chỉ dựng khung tĩnh.
function Header() {
  return (
    <header className={styles.header}>
      <TopBar />
      <div className={styles.mainRow}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>H</span>
          <span className={styles.logoText}>
            Laptop<span className={styles.logoAccent}>Hub</span>
          </span>
        </Link>

        <form className={styles.searchForm} role="search">
          <input
            type="search"
            name="q"
            placeholder="Bạn cần tìm laptop gì hôm nay?"
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            Tìm kiếm
          </button>
        </form>

        <div className={styles.actions}>
          <Link to="/account/orders" className={styles.actionItem}>
            <span className={styles.actionLabel}>Đơn hàng</span>
            <span className={styles.actionSub}>Theo dõi đơn</span>
          </Link>
          <Link to="/login" className={styles.actionItem}>
            <span className={styles.actionLabel}>Tài khoản</span>
            <span className={styles.actionSub}>Đăng nhập</span>
          </Link>
          <Link to="/cart" className={styles.cartItem}>
            <span className={styles.cartBadge}>0</span>
            <span className={styles.actionLabel}>Giỏ hàng</span>
            <span className={styles.actionSub}>Xem giỏ</span>
          </Link>
        </div>
      </div>
      <CategoryNav />
    </header>
  )
}

export default Header
