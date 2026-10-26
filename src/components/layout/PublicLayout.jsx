import { Link, NavLink, Outlet } from 'react-router-dom'
import Logo from '../common/Logo'
import Footer from './Footer'
import Icon from '../common/Icon'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/#tinh-nang', label: 'Tính năng' },
  { to: '/plans', label: 'Bảng giá' },
  { to: '/#tin-tuc', label: 'Tin tức' },
  { to: '/#lien-he', label: 'Liên hệ' },
]

/** Khung cho trang công khai (trang chủ khách, bảng giá, bài viết): không cần đăng nhập */
export default function PublicLayout({ children }) {
  const { user } = useAuth()
  const home = user ? (user.role === 'STUDENT' ? '/' : '/lecturer') : '/'
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full bg-surface-container-lowest/95 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-space-md px-margin-mobile md:px-margin">
          <Logo to="/" />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink key={n.label} to={n.to} end={n.end}
                className="rounded-xl px-space-md py-space-sm text-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface">
                {n.label}
              </NavLink>
            ))}
          </nav>
          {user ? (
            <Link to={home} className="btn-primary"><Icon name="map" className="text-[18px]" /> Vào học</Link>
          ) : (
            <div className="flex items-center gap-space-sm">
              <Link to="/login" className="btn-ghost px-2 sm:px-space-md" title="Đăng nhập">
                <Icon name="login" className="text-[20px] sm:hidden" /><span className="hidden sm:inline">Đăng nhập</span>
              </Link>
              <Link to="/login?mode=register" className="btn-primary"><Icon name="rocket_launch" className="text-[18px]" /> Học thử 0đ</Link>
            </div>
          )}
        </div>
      </header>
      <main className="w-full flex-1 bg-surface">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  )
}
