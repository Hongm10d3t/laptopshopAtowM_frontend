import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminActionDialog from '../../../components/admin/AdminActionDialog'
import UserStatusBadge from '../../../components/user/UserStatusBadge'
import { useAppSelector } from '../../../hooks/useAppSelector'
import {
  activateAdminUser,
  blockAdminUser,
  getAdminUser,
} from '../../../services/user/adminUserService'
import type { AdminUserResponse } from '../../../types/user/adminUser'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDateTime } from '../../../utils/date'
import styles from './UserDetailPage.module.css'

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts.slice(-2).map((part) => part[0]).join('').toUpperCase()
}

function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const currentUserId = useAppSelector((state) => state.auth.userId)
  const [user, setUser] = useState<AdminUserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadUser = useCallback(async () => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('Mã người dùng không hợp lệ')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      setUser(await getAdminUser(userId))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải thông tin người dùng'))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  async function handleStatusAction() {
    if (!user) return
    setIsUpdating(true)
    setActionError(null)
    try {
      const updated = user.status === 'BLOCKED'
        ? await activateAdminUser(user.id)
        : await blockAdminUser(user.id)
      setUser(updated)
      setDialogOpen(false)
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản'))
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) return <div className={styles.loadingCard}>Đang tải thông tin tài khoản…</div>

  if (error || !user) {
    return (
      <section>
        <p className={styles.breadcrumb}><Link to="/admin/users">Người dùng</Link><span>/</span><span>Chi tiết</span></p>
        <div className={styles.error}>{error ?? 'Không tìm thấy người dùng'}</div>
        <button type="button" className={styles.actionButton} onClick={() => void loadUser()}>Thử lại</button>
      </section>
    )
  }

  const isCurrentUser = user.id === currentUserId
  const canChangeStatus = !isCurrentUser && user.status !== 'PENDING_VERIFICATION'

  return (
    <section>
      <p className={styles.breadcrumb}>
        <Link to="/admin/users">Người dùng</Link>
        <span>/</span>
        <span>#{user.id}</span>
      </p>

      <div className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.avatar}>{initials(user.fullName)}</span>
          <div>
            <p className={styles.eyebrow}>{user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</p>
            <h1>{user.fullName}</h1>
            <p className={styles.email}>{user.email}</p>
          </div>
        </div>
        {canChangeStatus && (
          <button
            type="button"
            className={user.status === 'BLOCKED' ? styles.actionButton : styles.dangerButton}
            onClick={() => {
              setDialogOpen(true)
              setActionError(null)
            }}
          >
            {user.status === 'BLOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
          </button>
        )}
      </div>

      {isCurrentUser && <div className={styles.notice}>Đây là tài khoản bạn đang sử dụng. Backend không cho phép quản trị viên tự khóa chính mình.</div>}
      {user.status === 'PENDING_VERIFICATION' && (
        <div className={styles.notice}>Tài khoản này phải xác thực email qua luồng người dùng; quản trị viên không thể kích hoạt thủ công.</div>
      )}

      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>Thông tin tài khoản</h2>
          <dl className={styles.definitionList}>
            <div className={styles.definitionRow}><dt>Mã người dùng</dt><dd>#{user.id}</dd></div>
            <div className={styles.definitionRow}><dt>Họ và tên</dt><dd>{user.fullName}</dd></div>
            <div className={styles.definitionRow}><dt>Email</dt><dd>{user.email}</dd></div>
            <div className={styles.definitionRow}><dt>Số điện thoại</dt><dd>{user.phone || 'Chưa cập nhật'}</dd></div>
          </dl>
        </article>

        <article className={styles.card}>
          <h2>Quyền và trạng thái</h2>
          <dl className={styles.definitionList}>
            <div className={styles.definitionRow}>
              <dt>Vai trò</dt>
              <dd><span className={styles.roleBadge}>{user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</span></dd>
            </div>
            <div className={styles.definitionRow}><dt>Trạng thái</dt><dd><UserStatusBadge status={user.status} /></dd></div>
            <div className={styles.definitionRow}><dt>Ngày tạo</dt><dd>{formatDateTime(user.createdAt)}</dd></div>
            <div className={styles.definitionRow}><dt>Cập nhật lần cuối</dt><dd>{formatDateTime(user.updatedAt)}</dd></div>
          </dl>
        </article>
      </div>

      <AdminActionDialog
        open={dialogOpen}
        title={user.status === 'BLOCKED' ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
        description={
          user.status === 'BLOCKED'
            ? 'Người dùng sẽ có thể đăng nhập và sử dụng lại hệ thống.'
            : 'Người dùng sẽ bị chặn ở các request tiếp theo, kể cả khi access token cũ chưa hết hạn.'
        }
        confirmLabel={user.status === 'BLOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
        tone={user.status === 'BLOCKED' ? 'primary' : 'danger'}
        isSubmitting={isUpdating}
        error={actionError}
        onClose={() => {
          if (!isUpdating) {
            setDialogOpen(false)
            setActionError(null)
          }
        }}
        onConfirm={handleStatusAction}
      >
        <div className={styles.dialogSummary}>
          <span>Người dùng: <strong>{user.fullName}</strong></span>
          <span>Email: <strong>{user.email}</strong></span>
        </div>
      </AdminActionDialog>
    </section>
  )
}

export default UserDetailPage
