// Backend trả giá dạng số thuần (BigDecimal -> JSON number, đơn vị VNĐ,
// không có cột "currency" nào khác trong hệ thống) — format hiển thị tập
// trung tại đây, dùng chung cho Catalog/Cart/Checkout/Order sau này.
const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

// Sản phẩm có nhiều variant giá khác nhau -> hiển thị khoảng giá "Từ x" khi
// priceFrom == priceTo (chỉ 1 mức giá, hoặc chỉ 1 variant).
export function formatPriceRange(priceFrom: number, priceTo: number): string {
  if (priceFrom === priceTo) {
    return formatCurrency(priceFrom)
  }
  return `${formatCurrency(priceFrom)} - ${formatCurrency(priceTo)}`
}
