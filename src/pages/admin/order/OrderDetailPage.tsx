import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminActionDialog, {
  type AdminActionDialogTone,
} from '../../../components/admin/AdminActionDialog'
import OrderStatusBadge from '../../../components/order/OrderStatusBadge'
import {
  cancelAdminOrder,
  confirmAdminOrder,
  deliverAdminOrder,
  getAdminOrder,
  prepareAdminOrder,
  shipAdminOrder,
} from '../../../services/order/adminOrderService'
import type {
  OrderResponse,
  OrderStatus,
  PaymentStatus,
} from '../../../types/order/order'
import {
  getApiErrorCode,
  getApiErrorMessage,
} from '../../../utils/apiError'
import { formatCurrency } from '../../../utils/currency'
import { formatDateTime } from '../../../utils/date'
import {
  formatOrderStatus,
  formatPaymentMethod,
  formatPaymentStatus,
} from '../../../utils/orderStatus'
import styles from './OrderDetailPage.module.css'

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  PENDING: styles.paymentPending,
  PAID: styles.paymentPaid,
  FAILED: styles.paymentFailed,
  CANCELLED: styles.paymentCancelled,
}

type OrderActionKey = 'confirm' | 'prepare' | 'ship' | 'deliver' | 'cancel'

interface OrderActionDefinition {
  key: OrderActionKey
  label: string
  dialogTitle: string
  description: string
  confirmLabel: string
  tone: AdminActionDialogTone
  nextStatus: OrderStatus
}

const ACTION_DEFINITIONS: Record<OrderActionKey, OrderActionDefinition> = {
  confirm: {
    key: 'confirm',
    label: 'Xác nhận đơn',
    dialogTitle: 'Xác nhận đơn hàng',
    description:
      'Đơn sẽ được chuyển sang trạng thái Đã xác nhận và sẵn sàng cho bộ phận kho xử lý.',
    confirmLabel: 'Xác nhận đơn',
    tone: 'primary',
    nextStatus: 'CONFIRMED',
  },
  prepare: {
    key: 'prepare',
    label: 'Bắt đầu chuẩn bị hàng',
    dialogTitle: 'Bắt đầu chuẩn bị hàng',
    description:
      'Đơn sẽ được chuyển sang trạng thái Đang chuẩn bị hàng. Tồn kho vẫn tiếp tục được giữ cho đơn này.',
    confirmLabel: 'Bắt đầu chuẩn bị',
    tone: 'primary',
    nextStatus: 'PREPARING',
  },
  ship: {
    key: 'ship',
    label: 'Bàn giao vận chuyển',
    dialogTitle: 'Bàn giao đơn cho vận chuyển',
    description:
      'Đơn sẽ chuyển sang Đang giao hàng. Backend sẽ xuất kho theo đúng số lượng trong đơn.',
    confirmLabel: 'Xác nhận bàn giao',
    tone: 'primary',
    nextStatus: 'SHIPPING',
  },
  deliver: {
    key: 'deliver',
    label: 'Xác nhận đã giao',
    dialogTitle: 'Xác nhận giao hàng thành công',
    description:
      'Đơn sẽ được đánh dấu Đã giao hàng. Sau bước này khách hàng có thể đánh giá sản phẩm hoặc yêu cầu trả hàng.',
    confirmLabel: 'Xác nhận đã giao',
    tone: 'primary',
    nextStatus: 'DELIVERED',
  },
  cancel: {
    key: 'cancel',
    label: 'Hủy đơn hàng',
    dialogTitle: 'Hủy đơn hàng',
    description:
      'Đơn sẽ chuyển sang Đã hủy và không thể tiếp tục xử lý trong luồng giao hàng hiện tại.',
    confirmLabel: 'Hủy đơn hàng',
    tone: 'danger',
    nextStatus: 'CANCELLED',
  },
}

function getPrimaryAction(status: OrderStatus): OrderActionDefinition | null {
  switch (status) {
    case 'PENDING':
      return ACTION_DEFINITIONS.confirm
    case 'CONFIRMED':
      return ACTION_DEFINITIONS.prepare
    case 'PREPARING':
      return ACTION_DEFINITIONS.ship
    case 'SHIPPING':
      return ACTION_DEFINITIONS.deliver
    default:
      return null
  }
}

function canAdminCancel(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED' || status === 'PREPARING'
}

function getActionSummary(order: OrderResponse): string {
  switch (order.status) {
    case 'PENDING':
      if (order.paymentMethod === 'ONLINE' && order.paymentStatus !== 'PAID') {
        return 'Đơn online đang chờ thanh toán được backend xác nhận. Admin chưa thể xác nhận đơn.'
      }
      return 'Đơn đã sẵn sàng để xác nhận và chuyển sang bước chuẩn bị hàng.'
    case 'CONFIRMED':
      return 'Đơn đã được xác nhận. Bước tiếp theo là bắt đầu chuẩn bị hàng.'
    case 'PREPARING':
      return 'Hàng đang được chuẩn bị. Chỉ bàn giao vận chuyển khi đã kiểm tra đủ sản phẩm.'
    case 'SHIPPING':
      return 'Đơn đang được vận chuyển. Xác nhận đã giao khi nhận được kết quả giao hàng thành công.'
    case 'DELIVERED':
      return 'Đơn đã hoàn tất giao hàng và không còn action vận hành trực tiếp.'
    case 'RETURN_REQUESTED':
      return 'Khách đã yêu cầu trả hàng. Yêu cầu này sẽ được xử lý ở màn hình Trả hàng của Phase 7.2.'
    case 'RETURNED':
      return 'Đơn đã hoàn tất quy trình trả hàng.'
    case 'CANCELLED':
      return 'Đơn đã bị hủy và không thể tiếp tục chuyển trạng thái.'
  }
}

function getActionImpacts(
  action: OrderActionDefinition,
  order: OrderResponse,
): string[] {
  switch (action.key) {
    case 'confirm':
      return [
        `Trạng thái: ${formatOrderStatus(order.status)} → ${formatOrderStatus(action.nextStatus)}`,
        'Không thay đổi tồn kho ở bước xác nhận.',
      ]
    case 'prepare':
      return [
        `Trạng thái: ${formatOrderStatus(order.status)} → ${formatOrderStatus(action.nextStatus)}`,
        'Sản phẩm vẫn đang được giữ trong tồn kho cho đơn này.',
      ]
    case 'ship':
      return [
        `Trạng thái: ${formatOrderStatus(order.status)} → ${formatOrderStatus(action.nextStatus)}`,
        'Tồn thực tế và lượng đang giữ sẽ cùng giảm theo số lượng của đơn.',
        'Sau khi bàn giao vận chuyển, backend không cho phép hủy đơn.',
      ]
    case 'deliver':
      return [
        `Trạng thái: ${formatOrderStatus(order.status)} → ${formatOrderStatus(action.nextStatus)}`,
        'Khách hàng có thể viết đánh giá và tạo yêu cầu trả hàng.',
      ]
    case 'cancel': {
      const impacts = [
        `Trạng thái: ${formatOrderStatus(order.status)} → ${formatOrderStatus(action.nextStatus)}`,
        'Backend sẽ hoàn lại lượng tồn kho đang được giữ cho đơn.',
      ]

      if (order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PENDING') {
        impacts.push('Payment đang chờ sẽ được chuyển sang trạng thái hủy.')
      }

      if (order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PAID') {
        impacts.push(
          'CẢNH BÁO: Đơn đã thanh toán online. Backend không có chức năng hoàn tiền tự động.',
        )
      }

      return impacts
    }
  }
}

async function executeOrderAction(
  action: OrderActionKey,
  orderId: number,
): Promise<OrderResponse> {
  switch (action) {
    case 'confirm':
      return confirmAdminOrder(orderId)
    case 'prepare':
      return prepareAdminOrder(orderId)
    case 'ship':
      return shipAdminOrder(orderId)
    case 'deliver':
      return deliverAdminOrder(orderId)
    case 'cancel':
      return cancelAdminOrder(orderId)
  }
}

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const orderId = Number(id)
  const isValidOrderId = Number.isInteger(orderId) && orderId > 0

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] =
    useState<OrderActionDefinition | null>(null)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidOrderId) {
      setError('Mã đơn hàng không hợp lệ')
      setIsLoading(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)
    setError(null)

    getAdminOrder(orderId)
      .then((result) => {
        if (!isCancelled) setOrder(result)
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(getApiErrorMessage(err, 'Không thể tải chi tiết đơn hàng'))
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [isValidOrderId, orderId])

  const primaryAction = useMemo(
    () => (order ? getPrimaryAction(order.status) : null),
    [order],
  )

  const confirmBlockedByPayment =
    order?.status === 'PENDING' &&
    order.paymentMethod === 'ONLINE' &&
    order.paymentStatus !== 'PAID'

  async function reloadLatestOrder() {
    if (!order) return
    const latestOrder = await getAdminOrder(order.id)
    setOrder(latestOrder)
  }

  function openActionDialog(action: OrderActionDefinition) {
    setSuccessMessage(null)
    setActionError(null)
    setDialogError(null)
    setSelectedAction(action)
  }

  function closeActionDialog() {
    if (isSubmittingAction) return
    setSelectedAction(null)
    setDialogError(null)
  }

  async function handleConfirmAction() {
    if (!order || !selectedAction) return

    setIsSubmittingAction(true)
    setDialogError(null)
    setActionError(null)
    setSuccessMessage(null)

    try {
      const updatedOrder = await executeOrderAction(selectedAction.key, order.id)
      setOrder(updatedOrder)
      setSelectedAction(null)
      setSuccessMessage(
        `Đã cập nhật đơn #${updatedOrder.id} sang “${formatOrderStatus(updatedOrder.status)}”.`,
      )
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        'Không thể cập nhật trạng thái đơn hàng',
      )
      const errorCode = getApiErrorCode(err)

      // Nếu trạng thái/payment vừa bị thay đổi ở tab khác hoặc bởi IPN,
      // đóng dialog và đọc lại order thật thay vì giữ UI cũ.
      if (
        errorCode === 'INVALID_ORDER_STATUS' ||
        errorCode === 'INVALID_PAYMENT_STATUS'
      ) {
        try {
          await reloadLatestOrder()
        } catch {
          // Giữ nguyên lỗi mutation chính; người dùng vẫn có thể reload trang.
        }
        setSelectedAction(null)
        setActionError(message)
      } else {
        setDialogError(message)
      }
    } finally {
      setIsSubmittingAction(false)
    }
  }

  if (isLoading) {
    return (
      <section>
        <div className={styles.loadingHeader} />
        <div className={styles.loadingGrid}>
          <div />
          <div />
        </div>
      </section>
    )
  }

  if (!order) {
    return (
      <section>
        <Link to="/admin/orders" className={styles.backLink}>
          ← Quay lại danh sách đơn
        </Link>
        <div className={styles.errorState} role="alert">
          <strong>Không thể hiển thị đơn hàng</strong>
          <span>{error ?? 'Không tìm thấy đơn hàng'}</span>
        </div>
      </section>
    )
  }

  const itemSubtotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  )
  const actionImpacts = selectedAction
    ? getActionImpacts(selectedAction, order)
    : []
  const hasAvailableAction = primaryAction || canAdminCancel(order.status)

  return (
    <section>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/admin/orders">Đơn hàng</Link>
        <span>/</span>
        <span>#{order.id}</span>
      </nav>

      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1>Đơn hàng #{order.id}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p>Đặt lúc {formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      {successMessage && (
        <div className={styles.successBanner} role="status">
          <strong>Cập nhật thành công</strong>
          <span>{successMessage}</span>
        </div>
      )}

      {actionError && (
        <div className={styles.actionErrorBanner} role="alert">
          <strong>Không thể thực hiện thao tác</strong>
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => {
              setActionError(null)
              void reloadLatestOrder().catch((err: unknown) => {
                setActionError(
                  getApiErrorMessage(err, 'Không thể tải lại đơn hàng'),
                )
              })
            }}
          >
            Tải lại trạng thái
          </button>
        </div>
      )}

      {error && <p className={styles.inlineError}>{error}</p>}

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Sản phẩm</h2>
              <span>{order.items.length} dòng hàng</span>
            </div>

            <div className={styles.itemTableWrapper}>
              <table className={styles.itemTable}>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Đơn giá</th>
                    <th>Số lượng</th>
                    <th>Giảm giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.productCell}>
                          <strong>{item.productName}</strong>
                          <span>{item.variantName || item.sku}</span>
                          <small>SKU: {item.sku}</small>
                        </div>
                      </td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.discountAmount)}</td>
                      <td className={styles.lineTotal}>
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className={styles.card}>
            <h2>Thông tin giao hàng</h2>
            <div className={styles.infoGrid}>
              <div>
                <span>Người nhận</span>
                <strong>{order.recipientName}</strong>
              </div>
              <div>
                <span>Số điện thoại</span>
                <strong>{order.phone}</strong>
              </div>
              <div className={styles.fullWidth}>
                <span>Địa chỉ</span>
                <strong>
                  {order.streetAddress}, {order.ward}, {order.district},{' '}
                  {order.province}
                </strong>
              </div>
              <div className={styles.fullWidth}>
                <span>Ghi chú của khách</span>
                <strong>{order.note || 'Không có ghi chú'}</strong>
              </div>
            </div>
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={`${styles.card} ${styles.actionCard}`}>
            <div className={styles.actionCardHeader}>
              <div>
                <p className={styles.actionEyebrow}>Vận hành đơn</p>
                <h2>Xử lý đơn hàng</h2>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <p className={styles.actionSummary}>{getActionSummary(order)}</p>

            {confirmBlockedByPayment && (
              <div className={styles.paymentGateNotice} role="note">
                <strong>Chưa thể xác nhận</strong>
                <span>
                  Payment hiện là{' '}
                  {order.paymentStatus
                    ? formatPaymentStatus(order.paymentStatus)
                    : 'không xác định'}
                  . Backend chỉ cho xác nhận đơn online khi payment đã PAID.
                </span>
              </div>
            )}

            {hasAvailableAction ? (
              <div className={styles.actionButtons}>
                {primaryAction && (
                  <button
                    type="button"
                    className={styles.primaryActionButton}
                    disabled={
                      primaryAction.key === 'confirm' && confirmBlockedByPayment
                    }
                    title={
                      primaryAction.key === 'confirm' && confirmBlockedByPayment
                        ? 'Đơn online chưa được thanh toán thành công'
                        : undefined
                    }
                    onClick={() => openActionDialog(primaryAction)}
                  >
                    {primaryAction.label}
                  </button>
                )}

                {canAdminCancel(order.status) && (
                  <button
                    type="button"
                    className={styles.cancelActionButton}
                    onClick={() => openActionDialog(ACTION_DEFINITIONS.cancel)}
                  >
                    Hủy đơn hàng
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.noActionState}>
                Không có thao tác trực tiếp cho trạng thái này.
              </div>
            )}

            <small className={styles.lastUpdated}>
              Cập nhật gần nhất: {formatDateTime(order.updatedAt)}
            </small>
          </article>

          <article className={styles.card}>
            <h2>Thanh toán</h2>
            <dl className={styles.summaryList}>
              <div>
                <dt>Phương thức</dt>
                <dd>{formatPaymentMethod(order.paymentMethod)}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  {order.paymentStatus ? (
                    <span
                      className={PAYMENT_STATUS_CLASS[order.paymentStatus]}
                    >
                      {formatPaymentStatus(order.paymentStatus)}
                    </span>
                  ) : (
                    <span className={styles.paymentCod}>Thu khi giao hàng</span>
                  )}
                </dd>
              </div>
            </dl>
          </article>

          <article className={styles.card}>
            <h2>Tổng kết đơn hàng</h2>
            <dl className={styles.summaryList}>
              <div>
                <dt>Tạm tính</dt>
                <dd>{formatCurrency(itemSubtotal)}</dd>
              </div>
              <div>
                <dt>Giảm giá</dt>
                <dd>-{formatCurrency(order.discountAmount)}</dd>
              </div>
              {order.voucherCode && (
                <div>
                  <dt>Mã giảm giá</dt>
                  <dd>{order.voucherCode}</dd>
                </div>
              )}
              <div className={styles.grandTotal}>
                <dt>Khách cần trả</dt>
                <dd>{formatCurrency(order.totalAmount)}</dd>
              </div>
            </dl>
          </article>

          <Link to="/admin/orders" className={styles.backButton}>
            ← Quay lại danh sách
          </Link>
        </aside>
      </div>

      <AdminActionDialog
        open={selectedAction !== null}
        title={`${selectedAction?.dialogTitle ?? ''} #${order.id}?`}
        description={selectedAction?.description ?? ''}
        confirmLabel={selectedAction?.confirmLabel ?? 'Xác nhận'}
        tone={selectedAction?.tone}
        isSubmitting={isSubmittingAction}
        error={dialogError}
        onClose={closeActionDialog}
        onConfirm={handleConfirmAction}
      >
        <ul className={styles.impactList}>
          {actionImpacts.map((impact) => (
            <li
              key={impact}
              className={impact.startsWith('CẢNH BÁO') ? styles.criticalImpact : undefined}
            >
              {impact}
            </li>
          ))}
        </ul>
      </AdminActionDialog>
    </section>
  )
}

export default OrderDetailPage
