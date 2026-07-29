import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../hooks/useAppSelector'
import { logout } from '../../services/auth/authService'
import TopBar from './TopBar'
import CategoryNav from './CategoryNav'
import styles from './Header.module.css'

// Giỏ hàng CHƯA nối vào cartSlice thật — đó là việc của Gói 3.1. Trạng thái
// đăng nhập ở đây đã là thật (authSlice, Gói 1.3).
function Header() {
  const { accessToken, email } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()

  // window.confirm — đủ dùng cho 1 xác nhận đơn giản, chưa cần dựng hệ thống
  // modal riêng chỉ vì 1 chỗ dùng.
  async function handleLogout() {
    if (!window.confirm('Bạn có chắc muốn đăng xuất?')) {
      return
    }
    await logout()
    navigate('/')
  }

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
          {accessToken ? (
            <div className={styles.accountMenu}>
              <Link to="/account/profile" className={styles.actionItem}>
                <span className={styles.actionLabel}>{email}</span>
                <span className={styles.actionSub}>Tài khoản</span>
              </Link>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link to="/login" className={styles.actionItem}>
              <span className={styles.actionLabel}>Tài khoản</span>
              <span className={styles.actionSub}>Đăng nhập</span>
            </Link>
          )}
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
