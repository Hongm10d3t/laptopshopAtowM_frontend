import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '../../hooks/useAppSelector'
import { getOrder } from '../../services/order/orderService'
import { getVnPayReturnResult } from '../../services/payment/paymentService'
import type { PaymentStatus } from '../../types/order/order'
import type { VnPayReturnResponse } from '../../types/payment/payment'
import { getApiErrorMessage } from '../../utils/apiError'
import styles from './VnPayReturnPage.module.css'

const POLL_INTERVAL_MS = 1500
const MAX_POLL_ATTEMPTS = 8

type PageState =
  | 'CHECKING_GATEWAY'
  | 'CONFIRMING_PAYMENT'
  | 'PAID'
  | 'FAILED'
  | 'PENDING'
  | 'LOGIN_REQUIRED'
  | 'ERROR'

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function VnPayReturnPage() {
  const [searchParams] = useSearchParams()
  const { accessToken, role, isRestoring } = useAppSelector((state) => state.auth)

  const [gatewayResult, setGatewayResult] = useState<VnPayReturnResponse | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [pageState, setPageState] = useState<PageState>('CHECKING_GATEWAY')
  const [error, setError] = useState<string | null>(null)

  const hasVerifiedReturnRef = useRef(false)

  // Endpoint /return chỉ xác minh chữ ký và kết quả do VNPay trả về. Không
  // dùng kết quả này để kết luận Payment đã PAID vì chỉ IPN được đổi trạng thái.
  useEffect(() => {
    if (hasVerifiedReturnRef.current) return
    hasVerifiedReturnRef.current = true

    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    if (Object.keys(params).length === 0) {
      setError('Không tìm thấy thông tin giao dịch trong đường dẫn.')
      setPageState('ERROR')
      return
    }

    getVnPayReturnResult(params)
      .then((result) => {
        setGatewayResult(result)
        if (!result.success) {
          setPageState('FAILED')
        }
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, 'Không thể xác minh dữ liệu VNPay trả về'))
        setPageState('ERROR')
      })
  }, [searchParams])

  // Sau khi gateway trả success, đợi App khôi phục phiên rồi đọc Order thật.
  // Poll ngắn vì IPN và return là hai request độc lập, có thể đến lệch nhau.
  useEffect(() => {
    if (!gatewayResult?.success || gatewayResult.orderId == null) return
    if (isRestoring) return

    if (!accessToken || role !== 'CUSTOMER') {
      setPageState('LOGIN_REQUIRED')
      return
    }

    const confirmedOrderId = gatewayResult.orderId
    let isCancelled = false

    async function confirmPaymentStatus() {
      setPageState('CONFIRMING_PAYMENT')
      setError(null)

      try {
        for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
          const order = await getOrder(confirmedOrderId)
          if (isCancelled) return

          setPaymentStatus(order.paymentStatus)

          if (order.paymentStatus === 'PAID') {
            setPageState('PAID')
            return
          }

          if (order.paymentStatus === 'FAILED' || order.paymentStatus === 'CANCELLED') {
            setPageState('FAILED')
            return
          }

          if (attempt < MAX_POLL_ATTEMPTS - 1) {
            await wait(POLL_INTERVAL_MS)
          }
        }

        if (!isCancelled) setPageState('PENDING')
      } catch (err) {
        if (!isCancelled) {
          setError(getApiErrorMessage(err, 'Không thể đọc trạng thái đơn hàng'))
          setPageState('ERROR')
        }
      }
    }

    void confirmPaymentStatus()

    return () => {
      isCancelled = true
    }
  }, [accessToken, gatewayResult, isRestoring, role])

  const orderId = gatewayResult?.orderId ?? null
  const orderLink = orderId == null ? '/account/orders' : `/account/orders/${orderId}`

  if (pageState === 'CHECKING_GATEWAY') {
    return <p className={styles.loadingText}>Đang kiểm tra dữ liệu VNPay...</p>
  }

  if (pageState === 'CONFIRMING_PAYMENT') {
    return (
      <div className={styles.page}>
        <div className={styles.iconPending}>…</div>
        <h1>Đang xác nhận thanh toán</h1>
        <p className={styles.message}>
          VNPay đã trả kết quả thành công. Hệ thống đang chờ IPN xác nhận trạng thái giao dịch.
        </p>
      </div>
    )
  }

  if (pageState === 'LOGIN_REQUIRED') {
    return (
      <div className={styles.page}>
        <div className={styles.iconPending}>!</div>
        <h1>Cần đăng nhập để kiểm tra đơn hàng</h1>
        <p className={styles.message}>
          Dữ liệu VNPay hợp lệ, nhưng phiên đăng nhập chưa được khôi phục. Trạng thái thanh toán chỉ được kết luận từ đơn hàng thật.
        </p>
        <Link
          to="/login"
          state={{ from: { pathname: orderLink } }}
          className={styles.primaryLink}
        >
          Đăng nhập để xem đơn hàng
        </Link>
      </div>
    )
  }

  if (pageState === 'ERROR') {
    return (
      <div className={styles.page}>
        <div className={styles.iconError}>✕</div>
        <h1>Không thể xác nhận thanh toán</h1>
        <p className={styles.message}>{error}</p>
        <Link to={orderLink} className={styles.primaryLink}>
          Xem đơn hàng của tôi
        </Link>
      </div>
    )
  }

  if (pageState === 'PAID') {
    return (
      <div className={styles.page}>
        <div className={styles.iconSuccess}>✓</div>
        <h1>Thanh toán thành công!</h1>
        <p className={styles.message}>Đơn hàng đã được hệ thống xác nhận thanh toán.</p>
        <Link to={orderLink} className={styles.primaryLink}>
          Xem đơn hàng #{orderId}
        </Link>
        <Link to="/products" className={styles.secondaryLink}>
          Tiếp tục mua sắm →
        </Link>
      </div>
    )
  }

  if (pageState === 'PENDING') {
    return (
      <div className={styles.page}>
        <div className={styles.iconPending}>…</div>
        <h1>Giao dịch đang chờ xác nhận</h1>
        <p className={styles.message}>
          VNPay đã trả kết quả thành công nhưng đơn hàng vẫn đang ở trạng thái {paymentStatus ?? 'PENDING'}. Vui lòng kiểm tra lại trong trang chi tiết đơn.
        </p>
        <Link to={orderLink} className={styles.primaryLink}>
          Kiểm tra đơn hàng #{orderId}
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.iconError}>✕</div>
      <h1>Thanh toán không thành công</h1>
      <p className={styles.message}>
        {paymentStatus === 'CANCELLED'
          ? 'Giao dịch hoặc đơn hàng đã bị hủy.'
          : gatewayResult?.message ?? 'VNPay không xác nhận giao dịch thành công.'}
      </p>
      <Link to={orderLink} className={styles.primaryLink}>
        {orderId == null ? 'Xem đơn hàng của tôi' : `Xem đơn hàng #${orderId}`}
      </Link>
      <Link to="/products" className={styles.secondaryLink}>
        Tiếp tục mua sắm →
      </Link>
    </div>
  )
}

export default VnPayReturnPage
