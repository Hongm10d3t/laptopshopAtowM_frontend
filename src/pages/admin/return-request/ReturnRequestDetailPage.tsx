import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminActionDialog, {
  type AdminActionDialogTone,
} from '../../../components/admin/AdminActionDialog'
import OrderStatusBadge from '../../../components/order/OrderStatusBadge'
import ReturnRequestStatusBadge from '../../../components/order/ReturnRequestStatusBadge'
import { getAdminOrder } from '../../../services/order/adminOrderService'
import {
  approveAdminReturnRequest,
  getAdminReturnRequest,
  rejectAdminReturnRequest,
} from '../../../services/order/adminReturnRequestService'
import type { OrderResponse, PaymentStatus } from '../../../types/order/order'
import type { ReturnRequestResponse } from '../../../types/order/returnRequest'
import {
  getApiErrorCode,
  getApiErrorMessage,
} from '../../../utils/apiError'
import { formatCurrency } from '../../../utils/currency'
import { formatDateTime } from '../../../utils/date'
import {
  formatOrderStatus,
  formatPaymentStatus,
} from '../../../utils/orderStatus'
import styles from './ReturnRequestDetailPage.module.css'

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  PENDING: styles.paymentPending,
  PAID: styles.paymentPaid,
  FAILED: styles.paymentFailed,
  CANCELLED: styles.paymentCancelled,
}

type ReturnRequestActionKey = 'approve' | 'reject'

interface ReturnRequestActionDefinition {
  key: ReturnRequestActionKey
  dialogTitle: string
  description: string
  confirmLabel: string
  tone: AdminActionDialogTone
}

const ACTION_DEFINITIONS: Record<
  ReturnRequestActionKey,
  ReturnRequestActionDefinition
> = {
  approve: {
    key: 'approve',
    dialogTitle: 'Duyệt yêu cầu trả hàng',
    description:
      'Backend sẽ hoàn tất quy trình trả hàng cho toàn bộ đơn và nhập lại tồn kho theo số lượng trong đơn.',
    confirmLabel: 'Duyệt yêu cầu',
    tone: 'primary',
  },
  reject: {
    key: 'reject',
    dialogTitle: 'Từ chối yêu cầu trả hàng',
    description:
      'Yêu cầu sẽ bị từ chối và đơn hàng được đưa trở lại trạng thái Đã giao hàng.',
    confirmLabel: 'Từ chối yêu cầu',
    tone: 'danger',
  },
}

function parsePositiveId(value: string | undefined): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

async function loadReturnRequestData(requestId: number): Promise<{
  request: ReturnRequestResponse
  order: OrderResponse
}> {
  const request = await getAdminReturnRequest(requestId)
  const order = await getAdminOrder(request.orderId)
  return { request, order }
}

function getActionImpacts(
  action: ReturnRequestActionKey,
  order: OrderResponse,
): string[] {
  if (action === 'approve') {
    return [
      'Yêu cầu trả hàng: Chờ xử lý → Đã duyệt',
      `Đơn hàng: ${formatOrderStatus(order.status)} → Đã trả hàng`,
      'Backend nhập lại tồn kho cho toàn bộ sản phẩm và số lượng trong đơn.',
      'Thao tác này không thể hoàn tác trên giao diện hiện tại.',
    ]
  }

  return [
    'Yêu cầu trả hàng: Chờ xử lý → Đã từ chối',
    `Đơn hàng: ${formatOrderStatus(order.status)} → Đã giao hàng`,
    'Không nhập lại tồn kho vì hàng chưa được chấp nhận trả về.',
    'Ghi chú từ chối sẽ được lưu cùng quyết định nếu được nhập.',
  ]
}

function ReturnRequestDetailPage() {
  const { id } = useParams()
  const requestId = parsePositiveId(id)

  const [request, setRequest] = useState<ReturnRequestResponse | null>(null)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(requestId !== null)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState<string | null>(
    requestId === null ? 'Mã yêu cầu trả hàng không hợp lệ' : null,
  )

  const [selectedAction, setSelectedAction] =
    useState<ReturnRequestActionKey | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (requestId === null) return

    let isCancelled = false
    setIsLoading(true)
    setError(null)

    loadReturnRequestData(requestId)
      .then((result) => {
        if (isCancelled) return
        setRequest(result.request)
        setOrder(result.order)
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(
            getApiErrorMessage(err, 'Không thể tải chi tiết yêu cầu trả hàng'),
          )
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [reloadKey, requestId])

  function openActionDialog(action: ReturnRequestActionKey) {
    setSelectedAction(action)
    setRejectNote('')
    setDialogError(null)
    setActionSuccess(null)
    setActionError(null)
  }

  function closeActionDialog() {
    if (isSubmitting) return
    setSelectedAction(null)
    setRejectNote('')
    setDialogError(null)
  }

  async function refreshAfterConflict(message: string) {
    if (requestId === null) return

    setSelectedAction(null)
    setRejectNote('')
    setDialogError(null)
    setActionSuccess(null)
    setActionError(message)

    try {
      const latest = await loadReturnRequestData(requestId)
      setRequest(latest.request)
      setOrder(latest.order)
    } catch (refreshError) {
      setActionError(
        `${message} ${getApiErrorMessage(
          refreshError,
          'Không thể tải lại dữ liệu mới nhất. Hãy tải lại trang.',
        )}`,
      )
    }
  }

  async function handleDecision() {
    if (!selectedAction || !request || !order) return

    setIsSubmitting(true)
    setDialogError(null)
    setActionError(null)

    try {
      const updatedRequest =
        selectedAction === 'approve'
          ? await approveAdminReturnRequest(request.id)
          : await rejectAdminReturnRequest(request.id, rejectNote)

      setRequest(updatedRequest)
      setSelectedAction(null)
      setRejectNote('')

      setActionSuccess(
        selectedAction === 'approve'
          ? `Đã duyệt yêu cầu #${updatedRequest.id}. Đơn #${updatedRequest.orderId} đã chuyển sang trạng thái Đã trả hàng và tồn kho đã được nhập lại.`
          : `Đã từ chối yêu cầu #${updatedRequest.id}. Đơn #${updatedRequest.orderId} đã trở lại trạng thái Đã giao hàng.`,
      )

      try {
        const updatedOrder = await getAdminOrder(updatedRequest.orderId)
        setOrder(updatedOrder)
      } catch (refreshError) {
        setActionError(
          getApiErrorMessage(
            refreshError,
            'Quyết định đã được lưu nhưng chưa thể tải lại trạng thái đơn hàng. Hãy tải lại trang.',
          ),
        )
      }
    } catch (err) {
      const errorCode = getApiErrorCode(err)
      const message = getApiErrorMessage(
        err,
        'Không thể xử lý yêu cầu trả hàng',
      )

      if (
        errorCode === 'INVALID_RETURN_REQUEST_STATUS' ||
        errorCode === 'INVALID_ORDER_STATUS'
      ) {
        await refreshAfterConflict(
          `${message}. Dữ liệu có thể vừa được một quản trị viên khác cập nhật.`,
        )
      } else {
        setDialogError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section aria-busy="true">
        <div className={styles.breadcrumb}>Trả hàng / Đang tải…</div>
        <div className={styles.loadingCard}>
          <span />
          <span />
          <span />
        </div>
      </section>
    )
  }

  if (error || !request || !order) {
    return (
      <section>
        <div className={styles.breadcrumb}>
          <Link to="/admin/return-requests">Trả hàng</Link>
          <span>/</span>
          <span>Chi tiết</span>
        </div>
        <div className={styles.errorState} role="alert">
          <strong>Không thể hiển thị yêu cầu trả hàng</strong>
          <span>{error ?? 'Không tìm thấy dữ liệu yêu cầu'}</span>
          {requestId !== null && (
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              Thử lại
            </button>
          )}
        </div>
      </section>
    )
  }

  const itemSubtotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  )

  const canDecide =
    request.status === 'REQUESTED' && order.status === 'RETURN_REQUESTED'
  const selectedDefinition = selectedAction
    ? ACTION_DEFINITIONS[selectedAction]
    : null
  const actionImpacts = selectedAction
    ? getActionImpacts(selectedAction, order)
    : []

  return (
    <section>
      <div className={styles.breadcrumb}>
        <Link to="/admin/return-requests">Trả hàng</Link>
        <span>/</span>
        <span>Yêu cầu #{request.id}</span>
      </div>

      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1>Yêu cầu trả hàng #{request.id}</h1>
            <ReturnRequestStatusBadge status={request.status} />
          </div>
          <p>Được gửi lúc {formatDateTime(request.createdAt)}</p>
        </div>
        <Link to={`/admin/orders/${order.id}`} className={styles.orderButton}>
          Mở đơn hàng #{order.id} →
        </Link>
      </header>

      {actionSuccess && (
        <div className={styles.successBanner} role="status">
          <strong>Cập nhật thành công</strong>
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className={styles.actionErrorBanner} role="alert">
          <strong>Cần kiểm tra lại</strong>
          <span>{actionError}</span>
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <article className={`${styles.card} ${styles.reasonCard}`}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardEyebrow}>Thông tin từ khách hàng</p>
                <h2>Lý do yêu cầu trả hàng</h2>
              </div>
            </div>
            <p className={styles.reasonText}>{request.reason}</p>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Sản phẩm trong đơn</h2>
              <span>{order.items.length} dòng sản phẩm</span>
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
                          <span>{item.variantName || 'Cấu hình mặc định'}</span>
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

          {request.status !== 'REQUESTED' && (
            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Kết quả xử lý</h2>
              </div>
              <div className={styles.decisionGrid}>
                <div>
                  <span>Người xử lý</span>
                  <strong>
                    {request.decidedByUserId
                      ? `Admin #${request.decidedByUserId}`
                      : 'Không có dữ liệu'}
                  </strong>
                </div>
                <div>
                  <span>Thời điểm xử lý</span>
                  <strong>
                    {request.decidedAt
                      ? formatDateTime(request.decidedAt)
                      : 'Không có dữ liệu'}
                  </strong>
                </div>
                <div className={styles.fullWidth}>
                  <span>Ghi chú quyết định</span>
                  <strong>
                    {request.decisionNote?.trim() || 'Không có ghi chú'}
                  </strong>
                </div>
              </div>
            </article>
          )}
        </div>

        <aside className={styles.sideColumn}>
          <article
            className={`${styles.card} ${
              request.status === 'REQUESTED'
                ? styles.statusCardRequested
                : request.status === 'APPROVED'
                  ? styles.statusCardApproved
                  : styles.statusCardRejected
            }`}
          >
            <p className={styles.cardEyebrow}>Trạng thái xử lý</p>
            <h2>
              {request.status === 'REQUESTED'
                ? 'Đang chờ xem xét'
                : request.status === 'APPROVED'
                  ? 'Yêu cầu đã được duyệt'
                  : 'Yêu cầu đã bị từ chối'}
            </h2>
            <p className={styles.statusDescription}>
              {request.status === 'REQUESTED'
                ? 'Hãy đối chiếu lý do với sản phẩm và trạng thái đơn trước khi đưa ra quyết định.'
                : request.status === 'APPROVED'
                  ? 'Backend đã chuyển đơn sang trạng thái đã trả hàng và nhập lại tồn kho.'
                  : 'Đơn hàng được đưa trở lại trạng thái đã giao.'}
            </p>
          </article>

          {request.status === 'REQUESTED' && (
            <article className={`${styles.card} ${styles.actionCard}`}>
              <p className={styles.cardEyebrow}>Quyết định xử lý</p>
              <h2>Duyệt hoặc từ chối</h2>
              <p className={styles.actionDescription}>
                Chỉ xử lý sau khi đã kiểm tra lý do, sản phẩm và trạng thái đơn
                hàng liên quan.
              </p>

              {canDecide ? (
                <div className={styles.actionButtons}>
                  <button
                    type="button"
                    className={styles.approveButton}
                    onClick={() => openActionDialog('approve')}
                  >
                    Duyệt yêu cầu
                  </button>
                  <button
                    type="button"
                    className={styles.rejectButton}
                    onClick={() => openActionDialog('reject')}
                  >
                    Từ chối yêu cầu
                  </button>
                </div>
              ) : (
                <div className={styles.blockedAction} role="alert">
                  <strong>Không thể xử lý ở trạng thái hiện tại</strong>
                  <span>
                    Đơn đang ở trạng thái {formatOrderStatus(order.status)}.
                    Backend chỉ cho phép quyết định khi đơn là Yêu cầu trả hàng.
                  </span>
                </div>
              )}
            </article>
          )}

          <article className={styles.card}>
            <h2>Thông tin yêu cầu</h2>
            <dl className={styles.summaryList}>
              <div>
                <dt>Mã yêu cầu</dt>
                <dd>#{request.id}</dd>
              </div>
              <div>
                <dt>Mã đơn hàng</dt>
                <dd>
                  <Link to={`/admin/orders/${request.orderId}`}>
                    #{request.orderId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Khách hàng</dt>
                <dd>User #{request.userId}</dd>
              </div>
              <div>
                <dt>Ngày gửi</dt>
                <dd>{formatDateTime(request.createdAt)}</dd>
              </div>
              <div>
                <dt>Cập nhật gần nhất</dt>
                <dd>{formatDateTime(request.updatedAt)}</dd>
              </div>
            </dl>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Đơn hàng liên quan</h2>
              <OrderStatusBadge status={order.status} />
            </div>
            <dl className={styles.summaryList}>
              <div>
                <dt>Thanh toán</dt>
                <dd>
                  {order.paymentStatus ? (
                    <span className={PAYMENT_STATUS_CLASS[order.paymentStatus]}>
                      {formatPaymentStatus(order.paymentStatus)}
                    </span>
                  ) : (
                    <span className={styles.paymentCod}>Thu khi giao hàng</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Tạm tính</dt>
                <dd>{formatCurrency(itemSubtotal)}</dd>
              </div>
              <div>
                <dt>Giảm giá</dt>
                <dd>-{formatCurrency(order.discountAmount)}</dd>
              </div>
              <div className={styles.grandTotal}>
                <dt>Tổng đơn</dt>
                <dd>{formatCurrency(order.totalAmount)}</dd>
              </div>
            </dl>
          </article>
        </aside>
      </div>

      <AdminActionDialog
        open={selectedDefinition !== null}
        title={selectedDefinition?.dialogTitle ?? ''}
        description={selectedDefinition?.description ?? ''}
        confirmLabel={selectedDefinition?.confirmLabel ?? ''}
        tone={selectedDefinition?.tone}
        isSubmitting={isSubmitting}
        error={dialogError}
        onClose={closeActionDialog}
        onConfirm={handleDecision}
      >
        <ul className={styles.impactList}>
          {actionImpacts.map((impact) => (
            <li key={impact}>{impact}</li>
          ))}
        </ul>

        {selectedAction === 'approve' && order.paymentStatus === 'PAID' && (
          <div className={styles.refundWarning} role="note">
            <strong>Chú ý về hoàn tiền</strong>
            <span>
              Đơn này đã thanh toán. Backend chỉ duyệt trả hàng và nhập lại tồn
              kho, không thực hiện hoàn tiền tự động. Admin cần xử lý hoàn tiền
              ngoài hệ thống nếu nghiệp vụ yêu cầu.
            </span>
          </div>
        )}

        {selectedAction === 'reject' && (
          <div className={styles.noteField}>
            <div className={styles.noteHeader}>
              <label htmlFor="return-reject-note">
                Ghi chú từ chối <span>Không bắt buộc</span>
              </label>
              <span>{rejectNote.length}/500</span>
            </div>
            <textarea
              id="return-reject-note"
              value={rejectNote}
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
              placeholder="Ví dụ: Sản phẩm không đáp ứng điều kiện trả hàng…"
              onChange={(event) => setRejectNote(event.target.value)}
            />
            <p>
              Nội dung này được lưu trong trường decisionNote của yêu cầu trả
              hàng.
            </p>
          </div>
        )}
      </AdminActionDialog>
    </section>
  )
}

export default ReturnRequestDetailPage
