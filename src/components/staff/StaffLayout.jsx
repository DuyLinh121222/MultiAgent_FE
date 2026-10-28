import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../common/Icon'
import Logo from '../common/Logo'
import { useAuth } from '../../context/AuthContext'
import { adminApi, lecturerInsightApi, profileApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { Field, fieldCls, Modal, useToast } from './ui'
import { homeOf, ROLE_LABEL } from '../../utils/roles'

/**
 * Menu bên trái cho cổng giảng viên / quản trị.
 * Admin thấy thêm nhóm "Quản trị"; cả 2 role đều dùng nhóm "Nội dung & học tập".
 */
const ADMIN_GROUP = (waiting) => ({
  title: 'Quản trị',
  items: [
    { to: '/admin', label: 'Tổng quan', icon: 'space_dashboard', end: true },
    { to: '/admin/users', label: 'Người dùng', icon: 'group' },
    { to: '/admin/plans', label: 'Gói học', icon: 'workspace_premium' },
    { to: '/admin/payments', label: 'Giao dịch', icon: 'receipt_long', badgeKey: 'payments' },
    { to: '/admin/leads', label: 'Tư vấn trường / TT', icon: 'handshake' },
    { to: '/admin/audit', label: 'Nhật ký thao tác', icon: 'history' },
  ].map((n) => (n.badgeKey === 'payments' ? { ...n, badge: waiting } : n)),
})

const CONTENT_GROUP = (isAdmin, pending) => ({
  title: isAdmin ? 'Nội dung & học tập' : 'Giảng dạy',
  items: [
    ...(isAdmin ? [] : [{ to: '/lecturer', label: 'Tổng quan', icon: 'space_dashboard', end: true }]),
    { to: '/lecturer/review', label: 'Duyệt nội dung', icon: 'fact_check', badge: pending },
    { to: '/lecturer/content', label: 'Kho bài & câu hỏi', icon: 'library_books' },
    { to: '/lecturer/documents', label: 'Tài liệu PDF', icon: 'picture_as_pdf' },
    { to: '/lecturer/analytics', label: 'Phân tích học tập', icon: 'monitoring' },
    { to: '/lecturer/history', label: 'Lịch sử duyệt', icon: 'manage_history' },
    { to: '/lecturer/blog', label: 'Bài viết trang chủ', icon: 'campaign' },
  ],
})

const linkClass = ({ isActive }) =>
  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-lg transition-colors ${
    isActive
      ? 'bg-primary text-on-primary shadow-tactile'
      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
  }`

export default function StaffLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [toast, showToast] = useToast()
  const [pending, setPending] = useState(0)
  const [waitingPayments, setWaitingPayments] = useState(0)
  const menuRef = useRef(null)
  const isAdmin = user?.role === 'ADMIN'

  // Số việc chờ duyệt hiện cạnh menu "Duyệt nội dung", tải lại khi chuyển trang
  useEffect(() => {
    lecturerInsightApi.dashboard()
      .then((d) => setPending(d.pendingLessons + d.pendingQuestions + d.openReports))
      .catch(() => {})
    // Admin: số thanh toán QR MoMo học sinh đã báo chuyển, chờ xác nhận
    if (user?.role === 'ADMIN') {
      adminApi.payments({ status: 'WAITING', size: 1 }).then((r) => setWaitingPayments(r.waitingCount)).catch(() => {})
    }
  }, [pathname, user?.role])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const groups = isAdmin ? [ADMIN_GROUP(waitingPayments), CONTENT_GROUP(true, pending)] : [CONTENT_GROUP(false, pending)]

  const sidebar = (
    <nav className="flex flex-col gap-space-lg">
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-1">
          <div className="px-3 pb-1 text-label-sm uppercase tracking-wider text-outline">{g.title}</div>
          {g.items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
              <Icon name={n.icon} className="text-[20px]" />
              <span className="flex-1">{n.label}</span>
              {n.badge > 0 && (
                <span className="min-w-[22px] rounded-full bg-secondary-container px-1.5 text-center text-label-sm text-on-secondary-container">
                  {n.badge > 99 ? '99+' : n.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-surface">
      {/* Thanh trên */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-space-md border-b border-surface-container bg-surface-container-lowest/95 px-margin-mobile backdrop-blur md:px-space-lg">
        <div className="flex items-center gap-space-sm">
          <button type="button" className="btn-ghost px-2 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Mở menu">
            <Icon name={open ? 'close' : 'menu'} />
          </button>
          <Logo to={homeOf(user?.role)} />
          <span className={`chip hidden sm:inline-flex ${isAdmin ? 'bg-inverse-surface text-inverse-on-surface' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
            <Icon name={isAdmin ? 'admin_panel_settings' : 'school'} className="text-[16px]" />
            {isAdmin ? 'Cổng quản trị' : 'Cổng giảng viên'}
          </span>
        </div>
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenu((v) => !v)} className="flex items-center gap-space-sm rounded-xl p-1 pr-2 hover:bg-surface-container-low">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-label-lg font-extrabold ${isAdmin ? 'bg-inverse-surface text-inverse-on-surface' : 'bg-primary-fixed text-on-primary-fixed'}`}>
              {(user?.fullName || '?').trim().split(/\s+/).pop()[0].toUpperCase()}
            </span>
            <span className="hidden flex-col text-left md:flex">
              <span className="text-label-lg leading-tight text-on-surface">{user?.fullName}</span>
              <span className="text-label-sm leading-none text-on-surface-variant">{ROLE_LABEL[user?.role]}</span>
            </span>
            <Icon name="expand_more" className="text-[18px] text-on-surface-variant" />
          </button>
          {menu && (
            <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl bg-surface-container-lowest py-1 shadow-[0_12px_24px_-4px_rgba(15,23,42,0.16)]">
              <div className="border-b border-surface-container px-space-md py-space-sm text-body-sm text-on-surface-variant">{user?.email}</div>
              <Link to="/" onClick={() => setMenu(false)} className="flex items-center gap-space-sm px-space-md py-space-sm text-label-lg hover:bg-surface-container-low">
                <Icon name="public" className="text-[20px] text-primary" /> Xem trang chủ
              </Link>
              <button type="button" onClick={() => { setMenu(false); setPwOpen(true) }}
                className="flex w-full items-center gap-space-sm px-space-md py-space-sm text-label-lg hover:bg-surface-container-low">
                <Icon name="key" className="text-[20px] text-primary" /> Đổi mật khẩu
              </button>
              <button type="button" onClick={() => { logout(); navigate('/') }}
                className="flex w-full items-center gap-space-sm px-space-md py-space-sm text-label-lg text-error hover:bg-error-container/50">
                <Icon name="logout" className="text-[20px]" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Menu trái: cố định trên desktop, trượt ra trên mobile */}
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-64 overflow-y-auto border-r border-surface-container bg-surface-container-lowest p-space-md lg:block">
        {sidebar}
      </aside>
      {open && (
        <div className="fixed inset-0 top-16 z-30 lg:hidden">
          <button type="button" className="absolute inset-0 bg-inverse-surface/40" onClick={() => setOpen(false)} aria-label="Đóng menu" />
          <aside className="relative h-full w-72 max-w-[85vw] overflow-y-auto bg-surface-container-lowest p-space-md shadow-xl">{sidebar}</aside>
        </div>
      )}

      {/* Mỗi trang tự bọc nội dung bằng class "page" (giống các trang học sinh) */}
      <main className="overflow-x-hidden pt-16 lg:pl-64">
        <Outlet />
      </main>
      {toast}
      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} onDone={() => { setPwOpen(false); showToast('Đã đổi mật khẩu') }} />}
    </div>
  )
}

/** Đổi mật khẩu của chính mình (admin / giảng viên) */
function ChangePasswordModal({ onClose, onDone }) {
  const [f, setF] = useState({ current: '', next: '', again: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault()
    if (f.next.length < 8) return setError('Mật khẩu mới tối thiểu 8 ký tự')
    if (f.next !== f.again) return setError('Nhập lại mật khẩu mới chưa khớp')
    setBusy(true)
    setError('')
    try {
      await profileApi.changePassword(f.current, f.next)
      onDone()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open title="Đổi mật khẩu" onClose={onClose} footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
      <button type="submit" form="change-pw" className="btn-primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Đổi mật khẩu'}</button>
    </>}>
      <form id="change-pw" onSubmit={submit} className="flex flex-col gap-space-md">
        {error && <p className="rounded-xl bg-error-container px-space-md py-space-sm text-label-lg text-on-error-container">{error}</p>}
        <Field label="Mật khẩu hiện tại"><input type="password" className={fieldCls} value={f.current} onChange={set('current')} required autoComplete="current-password" /></Field>
        <Field label="Mật khẩu mới" hint="Tối thiểu 8 ký tự, không dùng chung với tài khoản khác">
          <input type="password" className={fieldCls} value={f.next} onChange={set('next')} required autoComplete="new-password" />
        </Field>
        <Field label="Nhập lại mật khẩu mới"><input type="password" className={fieldCls} value={f.again} onChange={set('again')} required autoComplete="new-password" /></Field>
      </form>
    </Modal>
  )
}
