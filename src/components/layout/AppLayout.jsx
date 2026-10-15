import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

/** Khung chung: header cố định trên cùng, nội dung, footer */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="w-full flex-1 bg-surface pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
