import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import SideDecor from '../game/SideDecor'
import EnergyModal from '../game/EnergyModal'
import { useAuth } from '../../context/AuthContext'

// Trang có nội dung hẹp ở giữa: trám 2 bên bằng hình trang trí. Trang rộng (phòng thảo luận...) thì không cần
const WIDE_PAGES = [/^\/study-room\/.+/, /^\/lecturer/, /^\/pricing/, /^\/photo-solver/]

/** Khung chung: header cố định trên cùng, nội dung, footer */
export default function AppLayout({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const decorate = !WIDE_PAGES.some((r) => r.test(pathname))
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {decorate && <SideDecor petLeft={user?.activePetCode || 'meo-mun'} />}
      <main className="relative z-10 w-full flex-1 pt-20">
        {children ?? <Outlet />}
      </main>
      <Footer />
      {user?.role === 'STUDENT' && <EnergyModal />}
    </div>
  )
}
