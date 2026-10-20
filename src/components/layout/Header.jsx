import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Icon from '../common/Icon'
import Logo from '../common/Logo'
import { useAuth } from '../../context/AuthContext'
import studentAvatar from '../../assets/avatar-kiet.jpg'
import Pet from '../game/Pet'
import { Coin } from '../game/GameArt'

const STUDENT_NAV = [
  { to: '/', label: 'Bản đồ ải', icon: 'map', end: true },
  { to: '/study-room', label: 'Phòng học AI', icon: 'forum' },
  { to: '/quizzes', label: 'Ôn điểm yếu', icon: 'insights' },
  { to: '/photo-solver', label: 'Giải bằng ảnh', icon: 'photo_camera' },
  { to: '/pets', label: 'Thú cưng', icon: 'pets' },
  { to: '/pricing', label: 'Gói học', icon: 'workspace_premium' },
]
const LECTURER_NAV = [{ to: '/lecturer', label: 'Duyệt nội dung', icon: 'fact_check', end: true }]

const navClass = ({ isActive }) =>
  `flex items-center gap-space-xs rounded-xl px-space-md py-space-sm text-label-lg transition-colors ${
    isActive ? 'bg-surface-container font-bold text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
  }`

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const isStudent = user?.role === 'STUDENT'
  const nav = isStudent ? STUDENT_NAV : LECTURER_NAV
  const sub = user?.subscription

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 z-50 w-full bg-surface-container-lowest/95 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="flex h-20 w-full items-center justify-between gap-space-md px-margin-mobile md:px-margin">
        <div className="flex flex-shrink-0 items-center gap-space-lg">
          <button type="button" className="btn-ghost px-2 xl:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            <Icon name={mobileOpen ? 'close' : 'menu'} />
          </button>
          <Logo to={isStudent ? '/' : '/lecturer'} />
          <nav className="hidden items-center gap-space-xs xl:flex">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
                <Icon name={n.icon} className="text-[20px]" /> {n.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-shrink-0 items-center gap-space-md">
          {isStudent && sub?.trial && (
            <div className="hidden items-center gap-space-xs rounded-full bg-secondary-fixed px-space-md py-space-xs text-on-secondary-fixed 2xl:flex">
              <Icon name="schedule" className="text-[18px]" />
              <span className="text-label-md">Dùng thử miễn phí: Còn {sub.daysLeft} ngày</span>
            </div>
          )}
          {isStudent && !sub && (
            <div className="hidden items-center gap-space-xs rounded-full bg-error-container px-space-md py-space-xs text-on-error-container 2xl:flex">
              <Icon name="error" className="text-[18px]" />
              <span className="text-label-md">Gói học đã hết hạn</span>
            </div>
          )}
          {isStudent && (
            <Link to="/pets" className="flex items-center gap-1.5 rounded-full bg-secondary-fixed px-space-md py-space-xs text-label-lg font-extrabold text-on-secondary-fixed" title="Xu đổi thú cưng">
              <Coin size={20} /> {user?.coins ?? 0}
            </Link>
          )}
          {isStudent && (!sub || sub.trial) && (
            <Link to="/pricing" className="btn-primary hidden lg:inline-flex">
              <Icon name="bolt" className="text-[18px]" />
              <span>Kích hoạt gói</span>
            </Link>
          )}
          {isStudent && sub && !sub.trial && (
            <span className="chip hidden bg-tertiary-fixed text-on-tertiary-fixed md:inline-flex">
              <Icon name="workspace_premium" className="text-[16px]" /> {sub.planName} • còn {sub.daysLeft} ngày
            </span>
          )}

          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-space-sm rounded-xl p-1 pr-2 hover:bg-surface-container-low">
              {isStudent && !user?.avatarUrl
                ? <span className="rounded-full bg-primary-fixed/60"><Pet code={user?.activePetCode} size={36} /></span>
                : <img src={user?.avatarUrl || studentAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />}
              <div className="hidden flex-col text-left md:flex">
                <span className="text-label-lg leading-tight text-on-surface">{user?.fullName}</span>
                <span className="text-label-sm leading-none text-on-surface-variant">
                  {isStudent ? `Lớp ${user?.gradeLevel} • Cấp ${Math.floor((user?.xp || 0) / 100) + 1}` : user?.role === 'LECTURER' ? 'Giảng viên' : 'Quản trị viên'}
                </span>
              </div>
              <Icon name="expand_more" className="text-[18px] text-on-surface-variant" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-surface-container-lowest py-1 shadow-[0_12px_24px_-4px_rgba(15,23,42,0.12)]">
                {isStudent && (
                  <>
                    <Link to="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-space-sm px-space-md py-space-sm text-label-lg hover:bg-surface-container-low">
                      <Icon name="notifications" className="text-[20px] text-primary" /> Thông báo
                    </Link>
                    <Link to="/achievements" onClick={() => setMenuOpen(false)} className="flex items-center gap-space-sm px-space-md py-space-sm text-label-lg hover:bg-surface-container-low">
                      <Icon name="military_tech" className="text-[20px] text-secondary" /> Thành tích
                    </Link>
                  </>
                )}
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-space-sm px-space-md py-space-sm text-label-lg text-error hover:bg-error-container/50">
                  <Icon name="logout" className="text-[20px]" /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-surface-container bg-surface-container-lowest px-margin-mobile py-space-sm xl:hidden">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navClass} onClick={() => setMobileOpen(false)}>
              <Icon name={n.icon} className="text-[20px]" /> {n.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
