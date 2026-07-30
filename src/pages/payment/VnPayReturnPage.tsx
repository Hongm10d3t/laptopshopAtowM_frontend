import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getVnPayReturnResult } from '../../services/payment/paymentService'
import { getApiErrorMessage } from '../../utils/apiError'
import type { VnPayReturnResponse } from '../../types/payment/payment'
import styles from './VnPayReturnPage.module.css'

// VNPay redirect trình duyệt về đây (return-url cấu hình ở Backend trỏ vào
// route này, không phải thẳng API) kèm theo các query param vnp_* — trang tự
// gọi lại GET /public/payments/vnpay/return với đúng các param đó để lấy kết
// quả đã verify chữ ký rồi hiển thị. Đây CHỈ là hiển thị cho khách, không
// phải nguồn xác nhận thanh toán thật (đó là /ipn, server-to-server) — vì
// vậy dù trang này có bị đóng/lỗi giữa chừng, trạng thái đơn hàng thật vẫn
// đã được /ipn xử lý độc lập.
//
// Route này KHÔNG bọc AuthGuard — /public/payments/vnpay/return không cần
// đăng nhập, và trình duyệt vừa quay lại từ domain VNPay nên phiên đăng
// nhập (access token lưu ở Redux, không phải localStorage) đã mất, phải chờ
// restoreSession() ở App.tsx tự khôi phục lại từ cookie.
function VnPayReturnPage() {
  const [searchParams] = useSearchParams()

  const [result, setResult] = useState<VnPayReturnResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    const params = Object.fromEntries(searchParams.entries())
    if (Object.keys(params).length === 0) {
      setError('Không tìm thấy thông tin giao dịch trong đường dẫn.')
      setIsLoading(false)
      return
    }

    getVnPayReturnResult(params)
      .then(setResult)
      .catch((err: unknown) => setError(getApiErrorMessage(err, 'Không thể xác nhận kết quả thanh toán')))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return <p className={styles.loadingText}>Đang xác nhận kết quả thanh toán...</p>
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.iconError}>✕</div>
        <h1>Không thể xác nhận thanh toán</h1>
        <p className={styles.message}>{error}</p>
        <Link to="/account/orders" className={styles.primaryLink}>
          Xem đơn hàng của tôi
        </Link>
      </div>
    )
  }

  const isSuccess = result?.success ?? false

  return (
    <div className={styles.page}>
      <div className={isSuccess ? styles.iconSuccess : styles.iconError}>{isSuccess ? '✓' : '✕'}</div>
      <h1>{isSuccess ? 'Thanh toán thành công!' : 'Thanh toán không thành công'}</h1>
      <p className={styles.message}>{result?.message}</p>

      {result?.orderId != null ? (
        <Link to={`/account/orders/${result.orderId}`} className={styles.primaryLink}>
          Xem đơn hàng #{result.orderId}
        </Link>
      ) : (
        <Link to="/account/orders" className={styles.primaryLink}>
          Xem đơn hàng của tôi
        </Link>
      )}
      <Link to="/products" className={styles.secondaryLink}>
        Tiếp tục mua sắm →
      </Link>
    </div>
  )
}

export default VnPayReturnPage
