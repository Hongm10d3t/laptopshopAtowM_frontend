import { env } from '../config/env'

// Placeholder tối thiểu để chứng minh Router hoạt động — sẽ thay bằng trang
// chủ thật khi bắt đầu implement nghiệp vụ Catalog.
function HomePage() {
  return (
    <main>
      <h1>{env.appName} Frontend Ready</h1>
    </main>
  )
}

export default HomePage
