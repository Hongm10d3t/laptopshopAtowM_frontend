import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import OrderStatusBadge from '../../../components/order/OrderStatusBadge'
import {
  getDashboardBestSelling,
  getDashboardCustomerStats,
  getDashboardLowStock,
  getDashboardOrdersByStatus,
  getDashboardRevenue,
} from '../../../services/dashboard/dashboardService'
import type { PageResponse } from '../../../types/common/pageResponse'
import type {
  BestSellingItemResponse,
  CustomerStatsResponse,
  LowStockItemResponse,
  OrderStatusCountResponse,
  RevenueByDayItem,
  RevenueSummaryResponse,
} from '../../../types/dashboard/dashboard'
import type { OrderStatus } from '../../../types/order/order'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatCurrency } from '../../../utils/currency'
import styles from './DashboardPage.module.css'

type RangePreset = '7d' | '30d' | 'month' | 'all' | 'custom'
type OverviewSection = 'revenue' | 'orders' | 'customers' | 'bestSelling'

interface DateRange {
  from?: string
  to?: string
}

const LOW_STOCK_PAGE_SIZE = 6
const BEST_SELLING_LIMIT = 8

const RANGE_OPTIONS: Array<{ value: RangePreset; label: string }> = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'month', label: 'Tháng này' },
  { value: 'all', label: 'Toàn thời gian' },
]

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'SHIPPING',
  'DELIVERED',
  'RETURN_REQUESTED',
  'RETURNED',
  'CANCELLED',
]

const STATUS_BAR_CLASS: Record<OrderStatus, string> = {
  PENDING: styles.statusPending,
  CONFIRMED: styles.statusConfirmed,
  PREPARING: styles.statusPreparing,
  SHIPPING: styles.statusShipping,
  DELIVERED: styles.statusDelivered,
  RETURN_REQUESTED: styles.statusReturnRequested,
  RETURNED: styles.statusReturned,
  CANCELLED: styles.statusCancelled,
}

const integerFormatter = new Intl.NumberFormat('vi-VN')
const compactNumberFormatter = new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function getPresetRange(preset: RangePreset, customFrom?: string, customTo?: string): DateRange {
  const today = new Date()
  const to = toDateInputValue(today)

  if (preset === '7d') return { from: toDateInputValue(addDays(today, -6)), to }
  if (preset === '30d') return { from: toDateInputValue(addDays(today, -29)), to }
  if (preset === 'month') {
    return { from: toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)), to }
  }
  if (preset === 'custom') return { from: customFrom, to: customTo }
  return {}
}

function isRangePreset(value: string | null): value is RangePreset {
  return value === '7d' || value === '30d' || value === 'month' || value === 'all' || value === 'custom'
}

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function formatShortDate(date: string): string {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

function formatRangeLabel(preset: RangePreset, range: DateRange): string {
  if (preset === 'all') return 'Toàn bộ dữ liệu'
  if (!range.from || !range.to) return 'Khoảng thời gian đã chọn'
  return `${formatDateLabel(range.from)} – ${formatDateLabel(range.to)}`
}

function enumerateDates(from: string, to: string): string[] {
  const start = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  const result: string[] = []

  while (start <= end && result.length <= 93) {
    result.push(start.toISOString().slice(0, 10))
    start.setUTCDate(start.getUTCDate() + 1)
  }

  return result
}

function normalizeRevenueSeries(items: RevenueByDayItem[], range: DateRange): RevenueByDayItem[] {
  const sorted = [...items].sort((left, right) => left.date.localeCompare(right.date))
  if (!range.from || !range.to) return sorted

  const dates = enumerateDates(range.from, range.to)
  if (dates.length === 0 || dates.length > 92) return sorted

  const itemByDate = new Map(sorted.map((item) => [item.date, item]))
  return dates.map((date) => itemByDate.get(date) ?? { date, revenue: 0, orderCount: 0 })
}

function RevenueChart({ items, range }: { items: RevenueByDayItem[]; range: DateRange }) {
  const series = useMemo(() => normalizeRevenueSeries(items, range), [items, range.from, range.to])

  if (series.length === 0 || series.every((item) => item.revenue === 0)) {
    return (
      <div className={styles.chartEmpty}>
        <span className={styles.chartEmptyIcon}>↗</span>
        <strong>Chưa có doanh thu đã ghi nhận</strong>
        <p>Doanh thu chỉ được tính từ những đơn đang ở trạng thái Đã giao hàng.</p>
      </div>
    )
  }

  const width = 860
  const height = 270
  const padding = { top: 20, right: 18, bottom: 44, left: 74 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxRevenue = Math.max(...series.map((item) => item.revenue), 1)
  const xFor = (index: number) =>
    series.length === 1 ? padding.left + plotWidth / 2 : padding.left + (index / (series.length - 1)) * plotWidth
  const yFor = (value: number) => padding.top + plotHeight - (value / maxRevenue) * plotHeight
  const points = series.map((item, index) => ({ ...item, x: xFor(index), y: yFor(item.revenue) }))
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath = `${linePath} L ${points.at(-1)?.x ?? padding.left} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`
  const tickIndexes = Array.from(
    new Set([0, Math.round((series.length - 1) * 0.25), Math.round((series.length - 1) * 0.5), Math.round((series.length - 1) * 0.75), series.length - 1]),
  )

  return (
    <div className={styles.chartScroller}>
      <svg
        className={styles.revenueChart}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Biểu đồ doanh thu theo ngày"
      >
        <title>Doanh thu theo ngày</title>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + plotHeight - ratio * plotHeight
          return (
            <g key={ratio}>
              <line className={styles.chartGridLine} x1={padding.left} y1={y} x2={width - padding.right} y2={y} />
              <text className={styles.chartAxisText} x={padding.left - 10} y={y + 4} textAnchor="end">
                {compactNumberFormatter.format(maxRevenue * ratio)}
              </text>
            </g>
          )
        })}

        <path className={styles.chartArea} d={areaPath} />
        <path className={styles.chartLine} d={linePath} />

        {points.map((point) => (
          <circle key={point.date} className={styles.chartPoint} cx={point.x} cy={point.y} r="4">
            <title>
              {formatDateLabel(point.date)}: {formatCurrency(point.revenue)} · {point.orderCount} đơn đã giao
            </title>
          </circle>
        ))}

        {tickIndexes.map((index) => (
          <text
            key={series[index].date}
            className={styles.chartAxisText}
            x={xFor(index)}
            y={height - 15}
            textAnchor={index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}
          >
            {formatShortDate(series[index].date)}
          </text>
        ))}
      </svg>
    </div>
  )
}

function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawPreset = searchParams.get('range')
  const activePreset: RangePreset = isRangePreset(rawPreset) ? rawPreset : '30d'
  const fromParam = searchParams.get('from') ?? undefined
  const toParam = searchParams.get('to') ?? undefined
  const range = getPresetRange(activePreset, fromParam, toParam)

  const [customFrom, setCustomFrom] = useState(range.from ?? '')
  const [customTo, setCustomTo] = useState(range.to ?? '')
  const [rangeError, setRangeError] = useState<string | null>(null)

  const [revenue, setRevenue] = useState<RevenueSummaryResponse | null>(null)
  const [ordersByStatus, setOrdersByStatus] = useState<OrderStatusCountResponse[]>([])
  const [customerStats, setCustomerStats] = useState<CustomerStatsResponse | null>(null)
  const [bestSelling, setBestSelling] = useState<BestSellingItemResponse[]>([])
  const [overviewErrors, setOverviewErrors] = useState<Partial<Record<OverviewSection, string>>>({})
  const [isOverviewLoading, setIsOverviewLoading] = useState(true)
  const [overviewReloadKey, setOverviewReloadKey] = useState(0)

  const [lowStock, setLowStock] = useState<LowStockItemResponse[]>([])
  const [lowStockPageInfo, setLowStockPageInfo] = useState<Omit<PageResponse<LowStockItemResponse>, 'content'> | null>(null)
  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const [lowStockPage, setLowStockPage] = useState(1)
  const [lowStockError, setLowStockError] = useState<string | null>(null)
  const [isLowStockLoading, setIsLowStockLoading] = useState(true)
  const [lowStockReloadKey, setLowStockReloadKey] = useState(0)

  useEffect(() => {
    setCustomFrom(range.from ?? '')
    setCustomTo(range.to ?? '')
  }, [activePreset, range.from, range.to])

  useEffect(() => {
    let cancelled = false
    const dateParams = { from: range.from, to: range.to }

    setIsOverviewLoading(true)
    setOverviewErrors({})
    setRevenue(null)
    setOrdersByStatus([])
    setCustomerStats(null)
    setBestSelling([])

    Promise.allSettled([
      getDashboardRevenue(dateParams),
      getDashboardOrdersByStatus(dateParams),
      getDashboardCustomerStats(dateParams),
      getDashboardBestSelling({ ...dateParams, limit: BEST_SELLING_LIMIT }),
    ]).then((results) => {
      if (cancelled) return

      const [revenueResult, ordersResult, customersResult, bestSellingResult] = results
      const errors: Partial<Record<OverviewSection, string>> = {}

      if (revenueResult.status === 'fulfilled') setRevenue(revenueResult.value)
      else errors.revenue = getApiErrorMessage(revenueResult.reason, 'Không thể tải dữ liệu doanh thu')

      if (ordersResult.status === 'fulfilled') setOrdersByStatus(ordersResult.value)
      else errors.orders = getApiErrorMessage(ordersResult.reason, 'Không thể tải thống kê đơn hàng')

      if (customersResult.status === 'fulfilled') setCustomerStats(customersResult.value)
      else errors.customers = getApiErrorMessage(customersResult.reason, 'Không thể tải thống kê khách hàng')

      if (bestSellingResult.status === 'fulfilled') setBestSelling(bestSellingResult.value)
      else errors.bestSelling = getApiErrorMessage(bestSellingResult.reason, 'Không thể tải sản phẩm bán chạy')

      setOverviewErrors(errors)
      setIsOverviewLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [range.from, range.to, overviewReloadKey])

  useEffect(() => {
    let cancelled = false
    setIsLowStockLoading(true)
    setLowStockError(null)

    getDashboardLowStock({
      threshold: lowStockThreshold,
      page: lowStockPage - 1,
      size: LOW_STOCK_PAGE_SIZE,
    })
      .then((result) => {
        if (cancelled) return
        setLowStock(result.content)
        setLowStockPageInfo(result)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLowStock([])
          setLowStockPageInfo(null)
          setLowStockError(getApiErrorMessage(error, 'Không thể tải danh sách tồn kho thấp'))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLowStockLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lowStockPage, lowStockReloadKey, lowStockThreshold])

  const statusCountMap = useMemo(
    () => new Map(ordersByStatus.map((item) => [item.status, item.count])),
    [ordersByStatus],
  )
  const completedStatusRows = ORDER_STATUSES.map((status) => ({ status, count: statusCountMap.get(status) ?? 0 }))
  const totalOrders = completedStatusRows.reduce((total, item) => total + item.count, 0)
  const maxStatusCount = Math.max(...completedStatusRows.map((item) => item.count), 1)
  const averageOrderValue = revenue && revenue.orderCount > 0 ? revenue.totalRevenue / revenue.orderCount : 0
  const pendingVerificationCustomers = customerStats
    ? Math.max(customerStats.totalCustomers - customerStats.activeCustomers - customerStats.blockedCustomers, 0)
    : 0

  function applyPreset(preset: RangePreset) {
    const params = new URLSearchParams()
    if (preset !== '30d') params.set('range', preset)
    setRangeError(null)
    setSearchParams(params)
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) {
      setRangeError('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc')
      return
    }
    if (customFrom > customTo) {
      setRangeError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc')
      return
    }

    const params = new URLSearchParams()
    params.set('range', 'custom')
    params.set('from', customFrom)
    params.set('to', customTo)
    setRangeError(null)
    setSearchParams(params)
  }

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Báo cáo vận hành</p>
          <h1>Tổng quan</h1>
          <p className={styles.description}>
            Theo dõi doanh thu, đơn hàng, khách hàng và tồn kho từ dữ liệu nghiệp vụ thực tế.
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          disabled={isOverviewLoading}
          onClick={() => {
            setOverviewReloadKey((value) => value + 1)
            setLowStockReloadKey((value) => value + 1)
          }}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15.6 7.2A6 6 0 1 0 16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12.8 4.5h3.1v3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isOverviewLoading ? 'Đang cập nhật' : 'Làm mới dữ liệu'}
        </button>
      </header>

      <div className={styles.rangePanel}>
        <div className={styles.rangeSummary}>
          <span>Khoảng báo cáo</span>
          <strong>{formatRangeLabel(activePreset, range)}</strong>
        </div>
        <div className={styles.presetButtons} aria-label="Chọn nhanh khoảng báo cáo">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={activePreset === option.value ? styles.presetButtonActive : styles.presetButton}
              aria-pressed={activePreset === option.value}
              onClick={() => applyPreset(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className={styles.customRange}>
          <label>
            <span>Từ ngày</span>
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(event) => setCustomFrom(event.target.value)}
            />
          </label>
          <span className={styles.rangeSeparator}>→</span>
          <label>
            <span>Đến ngày</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(event) => setCustomTo(event.target.value)}
            />
          </label>
          <button type="button" className={styles.applyRangeButton} onClick={applyCustomRange}>
            Áp dụng
          </button>
        </div>
        {rangeError && <p className={styles.rangeError}>{rangeError}</p>}
      </div>

      <div className={styles.metricGrid} aria-busy={isOverviewLoading}>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconRevenue}`}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3.2 14.8 7.1 11l2.7 2.4 6.8-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.8 6.4h3.8v3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <span className={styles.metricLabel}>Doanh thu đã giao</span>
            {isOverviewLoading ? <span className={styles.metricSkeleton} /> : <strong>{formatCurrency(revenue?.totalRevenue ?? 0)}</strong>}
            <small>{revenue?.orderCount ?? 0} đơn đã giao trong kỳ</small>
          </div>
        </article>

        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconOrders}`}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6.2 7h7.6M6.2 10h7.6M6.2 13h4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <span className={styles.metricLabel}>Tổng đơn phát sinh</span>
            {isOverviewLoading ? <span className={styles.metricSkeleton} /> : <strong>{integerFormatter.format(totalOrders)}</strong>}
            <small>Tính đủ mọi trạng thái đơn trong kỳ</small>
          </div>
        </article>

        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconCustomers}`}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="6.4" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4.2 16.2c.5-3 2.5-4.7 5.8-4.7s5.3 1.7 5.8 4.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <span className={styles.metricLabel}>Khách hàng mới</span>
            {isOverviewLoading ? <span className={styles.metricSkeleton} /> : <strong>{integerFormatter.format(customerStats?.newCustomers ?? 0)}</strong>}
            <small>{integerFormatter.format(customerStats?.totalCustomers ?? 0)} khách hàng toàn hệ thống</small>
          </div>
        </article>

        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconAverage}`}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7.2 10h5.6M10 6.8v6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <span className={styles.metricLabel}>Giá trị đơn đã giao TB</span>
            {isOverviewLoading ? <span className={styles.metricSkeleton} /> : <strong>{formatCurrency(averageOrderValue)}</strong>}
            <small>Doanh thu đã giao / số đơn đã giao</small>
          </div>
        </article>
      </div>

      <div className={styles.primaryGrid}>
        <article className={`${styles.panel} ${styles.revenuePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Doanh thu</p>
              <h2>Xu hướng theo ngày</h2>
              <span>Chỉ tính đơn đã giao hàng; rê chuột vào điểm dữ liệu để xem chi tiết.</span>
            </div>
            {revenue && revenue.orderCount > 0 && (
              <div className={styles.panelSummary}>
                <span>{revenue.orderCount} đơn đã giao</span>
                <strong>{formatCurrency(revenue.totalRevenue)}</strong>
              </div>
            )}
          </div>
          {overviewErrors.revenue ? (
            <div className={styles.sectionError} role="alert">
              <span>{overviewErrors.revenue}</span>
              <button type="button" onClick={() => setOverviewReloadKey((value) => value + 1)}>Thử lại</button>
            </div>
          ) : isOverviewLoading ? (
            <div className={styles.chartSkeleton}><span /><span /><span /><span /><span /></div>
          ) : (
            <RevenueChart items={revenue?.byDay ?? []} range={range} />
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Khách hàng</p>
              <h2>Sức khỏe tài khoản</h2>
              <span>Khách mới theo kỳ; tổng, hoạt động và bị khóa là số liệu toàn hệ thống.</span>
            </div>
            <Link to="/admin/users" className={styles.panelLink}>Quản lý →</Link>
          </div>
          {overviewErrors.customers ? (
            <div className={styles.sectionError} role="alert">
              <span>{overviewErrors.customers}</span>
              <button type="button" onClick={() => setOverviewReloadKey((value) => value + 1)}>Thử lại</button>
            </div>
          ) : isOverviewLoading ? (
            <div className={styles.customerSkeleton}><span /><span /><span /><span /></div>
          ) : (
            <div className={styles.customerStats}>
              <div className={styles.customerPrimary}>
                <span>Tổng khách hàng</span>
                <strong>{integerFormatter.format(customerStats?.totalCustomers ?? 0)}</strong>
              </div>
              <div className={styles.customerStatRow}>
                <span><i className={styles.dotSuccess} /> Đang hoạt động</span>
                <strong>{integerFormatter.format(customerStats?.activeCustomers ?? 0)}</strong>
              </div>
              <div className={styles.customerStatRow}>
                <span><i className={styles.dotPrimary} /> Khách mới trong kỳ</span>
                <strong>{integerFormatter.format(customerStats?.newCustomers ?? 0)}</strong>
              </div>
              <div className={styles.customerStatRow}>
                <span><i className={styles.dotWarning} /> Chờ xác thực email</span>
                <strong>{integerFormatter.format(pendingVerificationCustomers)}</strong>
              </div>
              <div className={styles.customerStatRow}>
                <span><i className={styles.dotDanger} /> Đang bị khóa</span>
                <strong>{integerFormatter.format(customerStats?.blockedCustomers ?? 0)}</strong>
              </div>
            </div>
          )}
        </article>
      </div>

      <div className={styles.secondaryGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Đơn hàng</p>
              <h2>Phân bổ trạng thái</h2>
              <span>Hiển thị đủ 8 trạng thái trong state machine hiện tại.</span>
            </div>
            <Link to="/admin/orders" className={styles.panelLink}>Xem đơn hàng →</Link>
          </div>
          {overviewErrors.orders ? (
            <div className={styles.sectionError} role="alert">
              <span>{overviewErrors.orders}</span>
              <button type="button" onClick={() => setOverviewReloadKey((value) => value + 1)}>Thử lại</button>
            </div>
          ) : isOverviewLoading ? (
            <div className={styles.statusSkeleton}>{ORDER_STATUSES.map((status) => <span key={status} />)}</div>
          ) : (
            <div className={styles.statusList}>
              {completedStatusRows.map(({ status, count }) => (
                <Link key={status} to={`/admin/orders?status=${status}`} className={styles.statusRow}>
                  <div className={styles.statusTopLine}>
                    <OrderStatusBadge status={status} />
                    <strong>{integerFormatter.format(count)}</strong>
                  </div>
                  <div className={styles.statusTrack} aria-hidden="true">
                    <span
                      className={STATUS_BAR_CLASS[status]}
                      style={{ width: `${count === 0 ? 0 : Math.max((count / maxStatusCount) * 100, 4)}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Hiệu quả SKU</p>
              <h2>Sản phẩm bán chạy</h2>
              <span>Xếp hạng theo số lượng variant đã bán từ các đơn hợp lệ.</span>
            </div>
          </div>
          {overviewErrors.bestSelling ? (
            <div className={styles.sectionError} role="alert">
              <span>{overviewErrors.bestSelling}</span>
              <button type="button" onClick={() => setOverviewReloadKey((value) => value + 1)}>Thử lại</button>
            </div>
          ) : isOverviewLoading ? (
            <div className={styles.rankingSkeleton}>{Array.from({ length: 5 }, (_, index) => <span key={index} />)}</div>
          ) : bestSelling.length === 0 ? (
            <div className={styles.simpleEmpty}>
              <strong>Chưa có SKU bán ra trong kỳ</strong>
              <span>Thử mở rộng khoảng báo cáo để xem thêm dữ liệu.</span>
            </div>
          ) : (
            <ol className={styles.rankingList}>
              {bestSelling.map((item, index) => (
                <li key={item.variantId}>
                  <span className={index < 3 ? styles.rankTop : styles.rank}>{index + 1}</span>
                  <div className={styles.rankingIdentity}>
                    {item.productId ? (
                      <Link to={`/admin/products/${item.productId}`}>{item.productName ?? `Sản phẩm #${item.productId}`}</Link>
                    ) : (
                      <strong>{item.productName ?? 'Sản phẩm không còn khả dụng'}</strong>
                    )}
                    <span>{item.variantName ?? 'Cấu hình không xác định'} · {item.sku ?? `Variant #${item.variantId}`}</span>
                  </div>
                  <div className={styles.rankingValue}>
                    <strong>{integerFormatter.format(item.quantitySold)} máy</strong>
                    <span>{formatCurrency(item.revenue)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </article>
      </div>

      <article className={`${styles.panel} ${styles.lowStockPanel}`}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Kho hàng</p>
            <h2>Sản phẩm sắp hết hàng</h2>
            <span>Danh sách được sắp theo số lượng có thể bán tăng dần từ backend.</span>
          </div>
          <div className={styles.lowStockActions}>
            <label>
              <span>Ngưỡng cảnh báo</span>
              <select
                value={lowStockThreshold}
                onChange={(event) => {
                  setLowStockThreshold(Number(event.target.value))
                  setLowStockPage(1)
                }}
              >
                <option value={0}>Hết hàng (≤ 0)</option>
                <option value={5}>Có thể bán ≤ 5</option>
                <option value={10}>Có thể bán ≤ 10</option>
                <option value={20}>Có thể bán ≤ 20</option>
              </select>
            </label>
            <Link to="/admin/inventory" className={styles.panelLink}>Mở kho hàng →</Link>
          </div>
        </div>

        {lowStockError && (
          <div className={styles.sectionError} role="alert">
            <span>{lowStockError}</span>
            <button type="button" onClick={() => setLowStockReloadKey((value) => value + 1)}>Thử lại</button>
          </div>
        )}

        <div className={styles.tableWrapper} aria-busy={isLowStockLoading}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sản phẩm / SKU</th>
                <th>Trạng thái</th>
                <th className={styles.numberCell}>Tồn thực tế</th>
                <th className={styles.numberCell}>Đang giữ</th>
                <th className={styles.numberCell}>Có thể bán</th>
                <th className={styles.actionHeader}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLowStockLoading ? (
                Array.from({ length: LOW_STOCK_PAGE_SIZE }, (_, index) => (
                  <tr key={index} className={styles.tableSkeletonRow}>
                    {Array.from({ length: 6 }, (_, cell) => <td key={cell}><span /></td>)}
                  </tr>
                ))
              ) : lowStock.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.simpleEmpty}>
                      <strong>Không có SKU dưới ngưỡng đã chọn</strong>
                      <span>Tồn kho khả dụng hiện đang cao hơn mức cảnh báo.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                lowStock.map((item) => (
                  <tr key={item.variantId}>
                    <td>
                      <div className={styles.productCell}>
                        {item.productId ? (
                          <Link to={`/admin/products/${item.productId}`}>{item.productName ?? `Sản phẩm #${item.productId}`}</Link>
                        ) : (
                          <strong>{item.productName ?? 'Sản phẩm không xác định'}</strong>
                        )}
                        <span>{item.variantName ?? 'Cấu hình không xác định'} · {item.sku ?? `Variant #${item.variantId}`}</span>
                      </div>
                    </td>
                    <td>
                      <span className={item.status === 'INACTIVE' ? styles.variantInactive : styles.variantActive}>
                        {item.status === 'INACTIVE' ? 'Ngừng bán' : 'Đang bán'}
                      </span>
                    </td>
                    <td className={styles.numberCell}>{integerFormatter.format(item.onHandQuantity)}</td>
                    <td className={styles.numberCell}>{integerFormatter.format(item.reservedQuantity)}</td>
                    <td className={`${styles.numberCell} ${item.availableQuantity === 0 ? styles.stockOut : styles.stockLow}`}>
                      {integerFormatter.format(item.availableQuantity)}
                    </td>
                    <td className={styles.actionCell}>
                      <Link to={`/admin/inventory/variants/${item.variantId}`}>Xem tồn kho</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLowStockLoading && lowStockPageInfo && lowStockPageInfo.totalPages > 1 && (
          <div className={styles.pagination}>
            <span>{integerFormatter.format(lowStockPageInfo.totalElements)} SKU dưới ngưỡng</span>
            <div>
              <button type="button" disabled={lowStockPage <= 1} onClick={() => setLowStockPage((page) => page - 1)}>← Trước</button>
              <span>Trang <strong>{lowStockPage}</strong> / {lowStockPageInfo.totalPages}</span>
              <button type="button" disabled={lowStockPageInfo.last} onClick={() => setLowStockPage((page) => page + 1)}>Sau →</button>
            </div>
          </div>
        )}
      </article>

      <p className={styles.dashboardNote}>
        Số liệu doanh thu và bán chạy đang bám đúng định nghĩa backend hiện tại; dashboard không tự suy diễn trạng thái thanh toán hoặc thời điểm giao hàng.
      </p>
    </section>
  )
}

export default DashboardPage
