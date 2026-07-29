// Nơi DUY NHẤT đọc import.meta.env.VITE_* — phần còn lại của app import từ
// đây thay vì đọc thẳng import.meta.env, tiện kiểm soát khi cần đổi cách nạp
// config sau này (vd multi-env, runtime config).
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL chưa được cấu hình trong .env')
}

export const env = {
  apiBaseUrl,
  appName: import.meta.env.VITE_APP_NAME || 'LaptopHub',
} as const
