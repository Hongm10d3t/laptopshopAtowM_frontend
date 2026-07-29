import { NavLink, Outlet } from 'react-router-dom'
import styles from './AccountLayout.module.css'

// Menu chỉ gồm đúng nghiệp vụ Backend đã có ở Phase 1 (Hồ sơ, Sổ địa chỉ, Đổi
// mật khẩu) — KHÔNG copy nguyên menu Template_UI (vốn có thêm "Sản phẩm yêu
// thích", "Phương thức thanh toán", "Hỏi đáp"... không có API tương ứng, đã
// ghi rõ ở lần review Template_UI). "Đơn hàng của tôi"/"Đánh giá của tôi" sẽ
// thêm khi tới Phase 4.
const NAV_ITEMS = [
  { to: '/account/profile', label: 'Thông tin tài khoản' },
  { to: '/account/addresses', label: 'Sổ địa chỉ' },
  { to: '/account/change-password', label: 'Đổi mật khẩu' },
]

function AccountLayout() {
  return (
    <div className={styles.wrapper}>
      <nav className={styles.sidebar}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}

export default AccountLayout
