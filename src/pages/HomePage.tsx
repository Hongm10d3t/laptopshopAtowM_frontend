import { env } from '../config/env'

// Placeholder tối thiểu — sẽ thay bằng nội dung trang chủ thật (banner, sản
// phẩm nổi bật, brand nổi bật) ở Gói 2.1. MainLayout đã tự bọc <main>, nên ở
// đây chỉ render nội dung con, không lặp lại thẻ <main>.
function HomePage() {
  return (
    <section>
      <h1>{env.appName} Frontend Ready</h1>
      <p>Trang chủ thật sẽ được xây ở Gói 2.1 (Catalog).</p>
    </section>
  )
}

export default HomePage
