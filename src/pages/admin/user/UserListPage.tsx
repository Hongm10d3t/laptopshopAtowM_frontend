import { type FormEvent, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminActionDialog from '../../../components/admin/AdminActionDialog'
import UserStatusBadge from '../../../components/user/UserStatusBadge'
import { useAppSelector } from '../../../hooks/useAppSelector'
import {
  activateAdminUser,
  blockAdminUser,
  listAdminUsers,
} from '../../../services/user/adminUserService'
import type { PageResponse } from '../../../types/common/pageResponse'
import type {
  AdminUserResponse,
  AdminUserRole,
  AdminUserStatus,
} from '../../../types/user/adminUser'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDateTime } from '../../../utils/date'
import styles from '../AdminManagementPage.module.css'

const PAGE_SIZE = 20

const ROLE_OPTIONS: Array<{ value: AdminUserRole; label: string }> = [
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'ADMIN', label: 'Quản trị viên' },
]

const STATUS_OPTIONS: Array<{ value: AdminUserStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'BLOCKED', label: 'Đã khóa' },
  { value: 'PENDING_VERIFICATION', label: 'Chờ xác thực email' },
]

function isRole(value: string | null): value is AdminUserRole {
  return ROLE_OPTIONS.some((option) => option.value === value)
}

function isStatus(value: string | null): value is AdminUserStatus {
  return STATUS_OPTIONS.some((option) => option.value === value)
}

function parsePage(value: string | null): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function UserListPage() {
  const currentUserId = useAppSelector((state) => state.auth.userId)
  const [searchParams, setSearchParams] = useSearchParams()
  const roleParam = searchParams.get('role')
  const statusParam = searchParams.get('status')
  const selectedRole = isRole(roleParam) ? roleParam : undefined
  const selectedStatus = isStatus(statusParam) ? statusParam : undefined
  const selectedKeyword = searchParams.get('keyword')?.trim() || undefined
  const page = parsePage(searchParams.get('page'))

  const [keywordInput, setKeywordInput] = useState(selectedKeyword ?? '')
  const [users, setUsers] = useState<AdminUserResponse[]>([])
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<AdminUserResponse>, 'content'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setKeywordInput(selectedKeyword ?? '')
  }, [selectedKeyword])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    listAdminUsers({
      role: selectedRole,
      status: selectedStatus,
      keyword: selectedKeyword,
      page: page - 1,
      size: PAGE_SIZE,
      sort: 'createdAt,desc',
    })
      .then((result) => {
        if (cancelled) return
        setUsers(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách tài khoản'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, reloadKey, selectedKeyword, selectedRole, selectedStatus])

  function setQuery(next: {
    role?: AdminUserRole
    status?: AdminUserStatus
    keyword?: string
    page?: number
  }) {
    const params = new URLSearchParams()
    if (next.role) params.set('role', next.role)
    if (next.status) params.set('status', next.status)
    if (next.keyword) params.set('keyword', next.keyword)
    if ((next.page ?? 1) > 1) params.set('page', String(next.page))
    setSearchParams(params)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const keyword = keywordInput.trim()
    setKeywordInput(keyword)
    setQuery({ role: selectedRole, status: selectedStatus, keyword: keyword || undefined, page: 1 })
  }

  function closeDialog() {
    if (isUpdating) return
    setSelectedUser(null)
    setActionError(null)
  }

  async function handleStatusAction() {
    if (!selectedUser) return
    setIsUpdating(true)
    setActionError(null)

    try {
      const updated = selectedUser.status === 'BLOCKED'
        ? await activateAdminUser(selectedUser.id)
        : await blockAdminUser(selectedUser.id)
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)))
      setSelectedUser(null)
      setReloadKey((value) => value + 1)
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản'))
    } finally {
      setIsUpdating(false)
    }
  }

  const hasFilters = Boolean(selectedRole || selectedStatus || selectedKeyword)

  return (
    <section>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Tài khoản</p>
          <h1>
            Người dùng
            {pageInfo && <span className={styles.countBadge}>{pageInfo.totalElements} kết quả</span>}
          </h1>
          <p className={styles.description}>
            Tra cứu tài khoản và kiểm soát quyền đăng nhập. Thông tin hồ sơ chỉ được xem, không chỉnh sửa thay người dùng.
          </p>
        </div>
      </div>

      <div className={styles.notice}>
        <span className={styles.noticeIcon}>i</span>
        <span>
          Tài khoản chờ xác thực email không thể được kích hoạt thủ công. Người dùng cần hoàn tất luồng xác thực của hệ thống.
        </span>
      </div>

      <form className={styles.toolbar} onSubmit={handleSearch}>
        <label className={styles.filterFieldWide}>
          <span>Tìm theo email hoặc họ tên</span>
          <div className={styles.searchRow}>
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="Nhập email hoặc tên người dùng"
            />
            <button type="submit" className={styles.searchButton}>Tìm</button>
          </div>
        </label>
        <label className={styles.filterField}>
          <span>Vai trò</span>
          <select
            value={selectedRole ?? ''}
            onChange={(event) =>
              setQuery({
                role: isRole(event.target.value) ? event.target.value : undefined,
                status: selectedStatus,
                keyword: selectedKeyword,
                page: 1,
              })
            }
          >
            <option value="">Tất cả vai trò</option>
            {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className={styles.filterField}>
          <span>Trạng thái</span>
          <select
            value={selectedStatus ?? ''}
            onChange={(event) =>
              setQuery({
                role: selectedRole,
                status: isStatus(event.target.value) ? event.target.value : undefined,
                keyword: selectedKeyword,
                page: 1,
              })
            }
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        {hasFilters && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              setKeywordInput('')
              setQuery({ page: 1 })
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </form>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Liên hệ</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th className={styles.actionHeader}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 7 }, (_, index) => (
                <tr key={index} className={styles.skeletonRow}>
                  {Array.from({ length: 6 }, (_, cellIndex) => <td key={cellIndex}><span /></td>)}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <strong>Không tìm thấy tài khoản</strong>
                    <span>Kiểm tra lại từ khóa, vai trò hoặc trạng thái đang lọc.</span>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isCurrentUser = user.id === currentUserId
                const canChangeStatus = !isCurrentUser && user.status !== 'PENDING_VERIFICATION'

                return (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.stackCell}>
                        <Link to={`/admin/users/${user.id}`} className={styles.link}>
                          {user.fullName}
                          {isCurrentUser && <span className={styles.currentBadge}>Bạn</span>}
                        </Link>
                        <span>ID #{user.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.stackCell}>
                        <strong>{user.email}</strong>
                        <span>{user.phone || 'Chưa cập nhật số điện thoại'}</span>
                      </div>
                    </td>
                    <td><span className={styles.roleBadge}>{user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</span></td>
                    <td><UserStatusBadge status={user.status} /></td>
                    <td className={styles.mutedCell}>{formatDateTime(user.createdAt)}</td>
                    <td className={styles.actionCell}>
                      <div className={styles.actions}>
                        <Link to={`/admin/users/${user.id}`} className={styles.linkButton}>Chi tiết</Link>
                        {canChangeStatus ? (
                          <button
                            type="button"
                            className={user.status === 'BLOCKED' ? styles.linkButton : styles.dangerLinkButton}
                            onClick={() => {
                              setSelectedUser(user)
                              setActionError(null)
                            }}
                          >
                            {user.status === 'BLOCKED' ? 'Mở khóa' : 'Khóa'}
                          </button>
                        ) : (
                          <span className={styles.noAction}>
                            {isCurrentUser ? 'Tài khoản hiện tại' : 'Chờ xác thực'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && pageInfo && pageInfo.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setQuery({ role: selectedRole, status: selectedStatus, keyword: selectedKeyword, page: page - 1 })}
          >
            ← Trước
          </button>
          <span>Trang <strong>{page}</strong> / {pageInfo.totalPages}</span>
          <button
            type="button"
            disabled={pageInfo.last}
            onClick={() => setQuery({ role: selectedRole, status: selectedStatus, keyword: selectedKeyword, page: page + 1 })}
          >
            Sau →
          </button>
        </div>
      )}

      <AdminActionDialog
        open={selectedUser !== null}
        title={selectedUser?.status === 'BLOCKED' ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
        description={
          selectedUser?.status === 'BLOCKED'
            ? 'Người dùng sẽ có thể đăng nhập và sử dụng lại các chức năng theo vai trò của họ.'
            : 'Access token hiện tại của người dùng sẽ không còn được chấp nhận ở các request tiếp theo.'
        }
        confirmLabel={selectedUser?.status === 'BLOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
        tone={selectedUser?.status === 'BLOCKED' ? 'primary' : 'danger'}
        isSubmitting={isUpdating}
        error={actionError}
        onClose={closeDialog}
        onConfirm={handleStatusAction}
      >
        {selectedUser && (
          <div className={styles.dialogSummary}>
            <span>Người dùng: <strong>{selectedUser.fullName}</strong></span>
            <span>Email: <strong>{selectedUser.email}</strong></span>
          </div>
        )}
      </AdminActionDialog>
    </section>
  )
}

export default UserListPage
