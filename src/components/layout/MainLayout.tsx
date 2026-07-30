import { Outlet } from 'react-router-dom'
import CompareBar from '../compare/CompareBar'
import CompareSelectorModal from '../compare/CompareSelectorModal'
import { useAppSelector } from '../../hooks/useAppSelector'
import Header from './Header'
import Footer from './Footer'
import styles from './MainLayout.module.css'

// Khung dùng chung cho toàn bộ trang Storefront (Guest/Customer) — Admin sẽ
// có layout riêng (sidebar tối, khác hẳn phong cách) ở Phase 6-9, không dùng
// MainLayout này.
function MainLayout() {
  const hasCompareItems = useAppSelector((state) => state.compare.items.length > 0)

  return (
    <div className={styles.layout}>
      <Header />
      <main className={hasCompareItems ? styles.mainWithCompareBar : styles.main}>
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
      <CompareSelectorModal />
    </div>
  )
}

export default MainLayout
