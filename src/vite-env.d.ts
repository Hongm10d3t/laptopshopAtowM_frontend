/// <reference types="vite/client" />

// Khai báo kiểu cho các biến VITE_* dùng trong project — mọi biến mới thêm
// vào .env phải khai báo lại ở đây để import.meta.env có type đúng.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
