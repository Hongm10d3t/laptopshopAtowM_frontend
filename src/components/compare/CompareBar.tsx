import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { clearCompareItems, openCompareSelector, removeCompareItem } from '../../redux/slices/compareSlice'
import styles from './CompareBar.module.css'

const MIN_COMPARE_ITEMS = 2
const MAX_COMPARE_ITEMS = 3

// Thanh nổi cố định dưới màn hình, hiện khi có >=1 sản phẩm đang chờ so
// sánh — cho xem nhanh/gỡ bớt mà không cần vào hẳn trang /compare. Luôn hiện
// đủ 3 ô: ô trống bấm vào mở CompareSelectorModal để thêm ngay (tham khảo
// FPT Shop), không bắt quay lại trang chi tiết sản phẩm khác. Chỉ render khi
// có ít nhất 1 item, đặt trong MainLayout để dùng chung mọi trang storefront.
function CompareBar() {
  const items = useAppSelector((state) => state.compare.items)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  if (items.length === 0) return null

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.itemList}>
          {Array.from({ length: MAX_COMPARE_ITEMS }, (_, index) => items[index]).map((item, index) =>
            item ? (
              <div key={item.variantId} className={styles.item}>
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.productName} />
                ) : (
                  <span className={styles.itemPlaceholder}>{item.productName.charAt(0)}</span>
                )}
                <span className={styles.itemName}>{item.productName}</span>
                <button
                  type="button"
                  className={styles.removeButton}
                  aria-label={`Bỏ ${item.productName} khỏi so sánh`}
                  onClick={() => dispatch(removeCompareItem(item.variantId))}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                key={`empty-${index}`}
                type="button"
                className={styles.itemEmpty}
                onClick={() => dispatch(openCompareSelector())}
              >
                + Thêm sản phẩm
              </button>
            ),
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.clearButton} onClick={() => dispatch(clearCompareItems())}>
            Xóa hết
          </button>
          <button
            type="button"
            className={styles.compareNowButton}
            disabled={items.length < MIN_COMPARE_ITEMS}
            onClick={() => navigate('/compare')}
          >
            So sánh ngay ({items.length}/{MAX_COMPARE_ITEMS})
          </button>
        </div>
      </div>
    </div>
  )
}

export default CompareBar
