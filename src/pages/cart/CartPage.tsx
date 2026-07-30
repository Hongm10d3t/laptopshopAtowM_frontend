import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import QuantityStepper from '../../components/cart/QuantityStepper'
import { clearCart, getCart, removeCartItem, updateCartItemQuantity } from '../../services/cart/cartService'
import { formatCurrency } from '../../utils/currency'
import { getApiErrorMessage } from '../../utils/apiError'
import type { CartResponse } from '../../types/cart/cart'
import styles from './CartPage.module.css'

const PRODUCT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M1.5 19.5h21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// Giỏ hàng thật (Gói 3.1) — CartItemResponse trả kèm productName/thumbnailUrl
// (Backend batch fetch từ Product/ProductImage theo productId). thumbnailUrl
// có thể null nếu sản phẩm chưa có ảnh -> dùng icon trung tính thay thế.
function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)

  function loadCart() {
    setIsLoading(true)
    getCart()
      .then(setCart)
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadCart()
  }, [])

  async function handleQuantityChange(itemId: number, nextQuantity: number) {
    if (nextQuantity < 1) return
    setError(null)
    setUpdatingItemId(itemId)
    try {
      const updated = await updateCartItemQuantity(itemId, nextQuantity)
      setCart(updated)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setUpdatingItemId(null)
    }
  }

  async function handleRemove(itemId: number, label: string) {
    if (!window.confirm(`Xóa "${label}" khỏi giỏ hàng?`)) return
    setError(null)
    setUpdatingItemId(itemId)
    try {
      const updated = await removeCartItem(itemId)
      setCart(updated)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setUpdatingItemId(null)
    }
  }

  async function handleClear() {
    if (!window.confirm('Xóa toàn bộ giỏ hàng?')) return
    setError(null)
    try {
      await clearCart()
      setCart({ items: [], totalAmount: 0 })
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  if (isLoading) {
    return <p>Đang tải...</p>
  }

  const isEmpty = !cart || cart.items.length === 0

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <span className={styles.breadcrumbCurrent}>Giỏ hàng</span>
      </nav>

      <div className={styles.titleRow}>
        <h1>Giỏ hàng của bạn</h1>
        {!isEmpty && <span className={styles.itemCountBadge}>{cart.items.length} sản phẩm</span>}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {isEmpty ? (
        <div className={styles.emptyState}>
          <p>Giỏ hàng của bạn đang trống.</p>
          <Link to="/products" className={styles.browseLink}>
            Tiếp tục mua sắm →
          </Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.tableHeader}>
              <span>Sản phẩm</span>
              <span className={styles.colCenter}>Đơn giá</span>
              <span className={styles.colCenter}>Số lượng</span>
              <span className={styles.colRight}>Thành tiền</span>
              <span />
            </div>

            <ul className={styles.itemList}>
              {cart.items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.productCell}>
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.productName} className={styles.productImage} />
                    ) : (
                      <span className={styles.productIcon}>{PRODUCT_ICON}</span>
                    )}
                    <div className={styles.itemInfo}>
                      <p className={styles.productName}>{item.productName}</p>
                      <p className={styles.variantMeta}>
                        {item.variantName} · SKU: {item.sku}
                      </p>
                    </div>
                  </div>
                  <p className={styles.unitPrice}>{formatCurrency(item.unitPrice)}</p>
                  <div className={styles.stepperCell}>
                    <QuantityStepper
                      value={item.quantity}
                      disabled={updatingItemId === item.id}
                      onChange={(next) => handleQuantityChange(item.id, next)}
                    />
                  </div>
                  <p className={styles.lineTotal}>{formatCurrency(item.lineTotal)}</p>
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={`Xóa ${item.productName} khỏi giỏ hàng`}
                    disabled={updatingItemId === item.id}
                    onClick={() => handleRemove(item.id, `${item.productName} (${item.variantName})`)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.actionsRow}>
              <Link to="/products" className={styles.continueLink}>
                ← Tiếp tục mua hàng
              </Link>
              <button type="button" className={styles.clearButton} onClick={handleClear}>
                Xóa tất cả
              </button>
            </div>
          </div>

          <aside className={styles.summary}>
            <h2>Thông tin đơn hàng</h2>
            <div className={styles.summaryRow}>
              <span>Tạm tính</span>
              <span>{formatCurrency(cart.totalAmount)}</span>
            </div>
            <p className={styles.summaryNote}>Phí vận chuyển và mã giảm giá sẽ được áp dụng ở bước thanh toán.</p>
            <div className={styles.summaryTotalRow}>
              <span>Tổng cộng</span>
              <span className={styles.totalAmount}>{formatCurrency(cart.totalAmount)}</span>
            </div>
            <button type="button" className={styles.checkoutButton} onClick={() => navigate('/checkout')}>
              Tiến hành thanh toán
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}

export default CartPage
