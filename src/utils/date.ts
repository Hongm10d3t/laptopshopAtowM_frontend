// Dùng chung cho mọi nơi hiển thị Instant từ Backend (review, đơn hàng...)
// — luôn là chuỗi ISO 8601 UTC, format theo giờ địa phương người dùng.
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function formatDate(isoString: string): string {
  return dateFormatter.format(new Date(isoString))
}

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(isoString: string): string {
  return dateTimeFormatter.format(new Date(isoString))
}
