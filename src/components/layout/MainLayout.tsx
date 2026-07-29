import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import styles from './MainLayout.module.css'

// Khung dùng chung cho toàn bộ trang Storefront (Guest/Customer) — Admin sẽ
// có layout riêng (sidebar tối, khác hẳn phong cách) ở Phase 6-9, không dùng
// MainLayout này.
function MainLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
