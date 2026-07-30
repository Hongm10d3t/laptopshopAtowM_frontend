import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCart } from '../../services/cart/cartService'
import { listAddresses } from '../../services/user/addressService'
import { checkout } from '../../services/order/orderService'
import { getPaymentUrl } from '../../services/payment/paymentService'
import { validateVoucher } from '../../services/voucher/voucherService'
import { formatCurrency } from '../../utils/currency'
import { formatOrderStatus, formatPaymentMethod } from '../../utils/orderStatus'
import { getApiErrorMessage } from '../../utils/apiError'
import type { CartResponse } from '../../types/cart/cart'
import type { AddressResponse } from '../../types/user/address'
import type { OrderResponse, PaymentMethod } from '../../types/order/order'
import type { VoucherValidateResponse } from '../../types/voucher/voucher'
import styles from './CheckoutPage.module.css'

const PAYMENT_METHODS: PaymentMethod[] = ['COD', 'ONLINE']

// Checkout 1 trang (Gói 3.2) — chọn địa chỉ, áp voucher (xem trước, không
// redeem), chọn phương thức thanh toán, đặt hàng đúng 1 lệnh POST
// /customer/orders. Đơn ONLINE tạo xong đưa thẳng nút "Thanh toán ngay"
// (Gói 5.1) thay vì chỉ ghi chú thụ động — đỡ phải tự tìm đường thanh toán.
function CheckoutPage() {
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')

  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidateResponse | null>(null)
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [completedOrder, setCompletedOrder] = useState<OrderResponse | null>(null)

  const [isPaying, setIsPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getCart(), listAddresses()])
      .then(([cartData, addressList]) => {
        setCart(cartData)
        setAddresses(addressList)
        const defaultAddress = addressList.find((address) => address.isDefault) ?? addressList[0]
        setSelectedAddressId(defaultAddress?.id ?? null)
      })
      .catch((err: unknown) => setLoadError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [])

  function handleVoucherInputChange(value: string) {
    setVoucherCodeInput(value)
    setAppliedVoucher(null)
    setVoucherError(null)
  }

  async function handleApplyVoucher() {
    const trimmed = voucherCodeInput.trim()
    if (!trimmed) return
    setIsValidatingVoucher(true)
    setVoucherError(null)
    try {
      const result = await validateVoucher(trimmed)
      setAppliedVoucher(result)
    } catch (err) {
      setAppliedVoucher(null)
      setVoucherError(getApiErrorMessage(err, 'Mã giảm giá không hợp lệ'))
    } finally {
      setIsValidatingVoucher(false)
    }
  }

  async function handleSubmit() {
    if (!selectedAddressId) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const order = await checkout({
        addressId: selectedAddressId,
        note: note.trim() || undefined,
        voucherCode: appliedVoucher?.code,
        paymentMethod,
      })
      setCompletedOrder(order)
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Không thể đặt hàng, vui lòng thử lại'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Điều hướng CẢ TRANG (không phải điều hướng SPA) — đích là domain VNPay,
  // không phải route nội bộ. Không cần setIsPaying(false) khi thành công vì
  // trang sẽ rời đi ngay sau đó.
  async function handlePayNow(orderId: number) {
    setIsPaying(true)
    setPayError(null)
    try {
      const { paymentUrl } = await getPaymentUrl(orderId)
      window.location.href = paymentUrl
    } catch (err) {
      setPayError(getApiErrorMessage(err, 'Không thể tạo giao dịch thanh toán'))
      setIsPaying(false)
    }
  }

  if (isLoading) {
    return <p>Đang tải...</p>
  }

  if (completedOrder) {
    return (
      <div className={styles.confirmationPage}>
        <div className={styles.confirmationIcon}>✓</div>
        <h1>Đặt hàng thành công!</h1>
        <p className={styles.confirmationSub}>
          Mã đơn hàng <strong>#{completedOrder.id}</strong> — {formatOrderStatus(completedOrder.status)}
        </p>

        <div className={styles.confirmationCard}>
          <div className={styles.confirmationRow}>
            <span>Phương thức thanh toán</span>
            <span>{formatPaymentMethod(completedOrder.paymentMethod)}</span>
          </div>
          <div className={styles.confirmationRow}>
            <span>Giao đến</span>
            <span className={styles.confirmationAddress}>
              {completedOrder.recipientName} — {completedOrder.phone}
              <br />
              {completedOrder.streetAddress}, {completedOrder.ward}, {completedOrder.district},{' '}
              {completedOrder.province}
            </span>
          </div>
          {completedOrder.discountAmount > 0 && (
            <div className={styles.confirmationRow}>
              <span>Giảm giá ({completedOrder.voucherCode})</span>
              <span>-{formatCurrency(completedOrder.discountAmount)}</span>
            </div>
          )}
          <div className={styles.confirmationTotalRow}>
            <span>Tổng thanh toán</span>
            <span className={styles.confirmationTotal}>{formatCurrency(completedOrder.totalAmount)}</span>
          </div>
        </div>

        {completedOrder.paymentMethod === 'ONLINE' && (
          <div className={styles.payNowBlock}>
            <button
              type="button"
              className={styles.payNowButton}
              disabled={isPaying}
              onClick={() => handlePayNow(completedOrder.id)}
            >
              {isPaying ? 'Đang chuyển tới cổng thanh toán...' : 'Thanh toán ngay với VNPay'}
            </button>
            {payError && <p className={styles.error}>{payError}</p>}
            <p className={styles.payNowHint}>
              Bạn sẽ được chuyển sang cổng thanh toán VNPay (sandbox) để hoàn tất — có thể thanh toán lại sau trong
              phần chi tiết đơn hàng nếu chưa hoàn tất ngay bây giờ.
            </p>
          </div>
        )}

        <Link to="/products" className={styles.browseLink}>
          Tiếp tục mua sắm →
        </Link>
      </div>
    )
  }

  if (loadError) {
    return <p className={styles.error}>{loadError}</p>
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Giỏ hàng của bạn đang trống, chưa có gì để thanh toán.</p>
        <Link to="/products" className={styles.browseLink}>
          Tiếp tục mua sắm →
        </Link>
      </div>
    )
  }

  const discountAmount = appliedVoucher?.discountAmount ?? 0
  const finalAmount = appliedVoucher?.finalAmount ?? cart.totalAmount

  return (
    <div className={styles.page}>
      <h1>Thanh toán</h1>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Địa chỉ giao hàng</h2>
              <Link to="/account/addresses/new">+ Thêm địa chỉ mới</Link>
            </div>

            {addresses.length === 0 ? (
              <p className={styles.warningNote}>
                Bạn chưa có địa chỉ nào. Vui lòng <Link to="/account/addresses/new">thêm địa chỉ</Link> trước khi đặt
                hàng.
              </p>
            ) : (
              <ul className={styles.addressList}>
                {addresses.map((address) => (
                  <li key={address.id}>
                    <button
                      type="button"
                      className={selectedAddressId === address.id ? styles.addressCardActive : styles.addressCard}
                      onClick={() => setSelectedAddressId(address.id)}
                    >
                      <div className={styles.addressCardHeader}>
                        <strong>{address.recipientName}</strong>
                        <span>{address.phone}</span>
                        {address.isDefault && <span className={styles.defaultBadge}>Mặc định</span>}
                      </div>
                      <p>
                        {address.streetAddress}, {address.ward}, {address.district}, {address.province}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <h2>Ghi chú</h2>
            <textarea
              className={styles.noteInput}
              placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
              value={note}
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
            />
          </section>

          <section className={styles.section}>
            <h2>Mã giảm giá</h2>
            <div className={styles.voucherRow}>
              <input
                type="text"
                placeholder="Nhập mã giảm giá"
                value={voucherCodeInput}
                onChange={(event) => handleVoucherInputChange(event.target.value)}
              />
              <button
                type="button"
                disabled={!voucherCodeInput.trim() || isValidatingVoucher}
                onClick={handleApplyVoucher}
              >
                {isValidatingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
              </button>
            </div>
            {voucherError && <p className={styles.voucherError}>{voucherError}</p>}
            {appliedVoucher && (
              <p className={styles.voucherSuccess}>
                Đã áp dụng mã "{appliedVoucher.code}" — giảm {formatCurrency(appliedVoucher.discountAmount)}
              </p>
            )}
          </section>

          <section className={styles.section}>
            <h2>Phương thức thanh toán</h2>
            <div className={styles.paymentList}>
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  className={paymentMethod === method ? styles.paymentOptionActive : styles.paymentOption}
                  onClick={() => setPaymentMethod(method)}
                >
                  {formatPaymentMethod(method)}
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.summary}>
          <h2>Đơn hàng ({cart.items.length} sản phẩm)</h2>
          <ul className={styles.summaryItemList}>
            {cart.items.map((item) => (
              <li key={item.id} className={styles.summaryItem}>
                <span className={styles.summaryItemName}>
                  {item.productName} <span className={styles.summaryItemQty}>× {item.quantity}</span>
                </span>
                <span>{formatCurrency(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className={styles.summaryRow}>
            <span>Tạm tính</span>
            <span>{formatCurrency(cart.totalAmount)}</span>
          </div>
          {discountAmount > 0 && (
            <div className={styles.summaryRow}>
              <span>Giảm giá</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className={styles.summaryTotalRow}>
            <span>Tổng cộng</span>
            <span className={styles.summaryTotal}>{formatCurrency(finalAmount)}</span>
          </div>

          {submitError && <p className={styles.error}>{submitError}</p>}

          <button
            type="button"
            className={styles.submitButton}
            disabled={!selectedAddressId || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Đang đặt hàng...' : 'Đặt hàng'}
          </button>
        </aside>
      </div>
    </div>
  )
}

export default CheckoutPage
