import { Link, Outlet } from 'react-router-dom'
import Logo from '../common/Logo'
import Footer from './Footer'
import { useAuth } from '../../context/AuthContext'

/** Khung cho trang công khai (bảng giá): không cần đăng nhập */
export default function PublicLayout() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full bg-surface-container-lowest/95 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-margin-mobile md:px-margin">
          <Logo to={user ? '/' : '/plans'} />
          <Link to={user ? '/' : '/login'} className="btn-primary">{user ? 'Vào bản đồ ải' : 'Đăng nhập / Dùng thử'}</Link>
        </div>
      </header>
      <main className="w-full flex-1 bg-surface">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
