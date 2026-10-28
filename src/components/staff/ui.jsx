import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../common/Icon'

/** Bộ component dùng chung cho cổng giảng viên / quản trị */

export function PageHeader({ title, subtitle, icon, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-space-md">
      <div className="flex items-start gap-space-md">
        {icon && (
          <span className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
            <Icon name={icon} className="text-[24px]" />
          </span>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{title}</h1>
          {subtitle && <p className="text-body-md text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-space-sm">{actions}</div>}
    </div>
  )
}

const TONES = {
  primary: 'bg-primary-fixed text-primary',
  green: 'bg-tertiary-fixed/70 text-tertiary',
  orange: 'bg-secondary-fixed text-secondary',
  red: 'bg-error-container text-error',
  gray: 'bg-surface-container text-on-surface-variant',
  dark: 'bg-inverse-surface text-inverse-on-surface',
}

export function StatCard({ icon, label, value, hint, tone = 'primary', to }) {
  const body = (
    <>
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon name={icon} className="text-[22px]" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <span className="truncate text-headline-md font-extrabold text-on-surface">{value}</span>
        {hint && <span className="text-body-sm text-outline">{hint}</span>}
      </div>
    </>
  )
  const cls = 'card flex items-start gap-space-md text-left'
  return to
    ? <Link to={to} className={`${cls} transition-shadow hover:shadow-md`}>{body}</Link>
    : <div className={cls}>{body}</div>
}

export function Badge({ tone = 'gray', children, icon }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-label-md ${TONES[tone]}`}>
      {icon && <Icon name={icon} className="text-[14px]" />}
      {children}
    </span>
  )
}

/** Trạng thái duyệt của bài / câu hỏi */
export const REVIEW_STATUS = {
  DRAFT: { label: 'Nháp', tone: 'gray' },
  PENDING_REVIEW: { label: 'Chờ duyệt', tone: 'orange' },
  APPROVED: { label: 'Đã duyệt', tone: 'green' },
  PUBLISHED: { label: 'Đang dùng', tone: 'green' },
  REJECTED: { label: 'Bị từ chối', tone: 'red' },
  ARCHIVED: { label: 'Đã gỡ', tone: 'dark' },
}
export function ReviewBadge({ status }) {
  const s = REVIEW_STATUS[status] || { label: status, tone: 'gray' }
  return <Badge tone={s.tone}>{s.label}</Badge>
}

export const DIFFICULTY = { EASY: 'Dễ', MEDIUM: 'Vừa', HARD: 'Khó' }

/** Hộp thoại giữa màn hình. Đóng bằng Esc hoặc bấm nền */
export function Modal({ open, title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-space-md">
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-inverse-surface/50" onClick={onClose} />
      <div role="dialog" aria-modal="true"
        className={`pop-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface-container-lowest shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between gap-space-md border-b border-surface-container px-space-lg py-space-md">
          <h2 className="text-headline-sm text-on-surface">{title}</h2>
          <button type="button" className="btn-ghost px-2" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-space-lg py-space-md">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-space-sm border-t border-surface-container px-space-lg py-space-md">{footer}</div>}
      </div>
    </div>
  )
}

/** Ô nhập có nhãn. Dùng class "field" nhỏ gọn hơn .input của trang học sinh */
export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="text-label-md text-on-surface-variant">{label}</span>}
      {children}
      {hint && !error && <span className="text-body-sm text-outline">{hint}</span>}
      {error && <span className="text-body-sm text-error">{error}</span>}
    </label>
  )
}

export const fieldCls =
  'h-11 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
export const areaCls =
  'w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

/** Thông báo nhỏ góc dưới, tự ẩn sau 3 giây */
export function useToast() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const show = useCallback((message, tone = 'green') => {
    clearTimeout(timer.current)
    setToast({ message, tone })
    timer.current = setTimeout(() => setToast(null), 3200)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  const node = toast && (
    <div className="pop-in fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-space-sm rounded-xl bg-inverse-surface px-space-md py-space-sm text-label-lg text-inverse-on-surface shadow-xl">
      <Icon name={toast.tone === 'red' ? 'error' : 'check_circle'} filled className={`text-[20px] ${toast.tone === 'red' ? 'text-[#ffb4ab]' : 'text-tertiary-fixed'}`} />
      {toast.message}
    </div>
  )
  return [node, show]
}

export function Pagination({ page, size, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / size))
  if (total <= size) return <div className="text-body-sm text-outline">{total} kết quả</div>
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm">
      <span className="text-body-sm text-outline">
        {page * size + 1}–{Math.min(total, (page + 1) * size)} / {total} kết quả
      </span>
      <div className="flex items-center gap-1">
        <button type="button" className="btn-ghost px-2" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Trang trước">
          <Icon name="chevron_left" />
        </button>
        <span className="px-2 text-label-lg">{page + 1} / {pages}</span>
        <button type="button" className="btn-ghost px-2" disabled={page >= pages - 1} onClick={() => onChange(page + 1)} aria-label="Trang sau">
          <Icon name="chevron_right" />
        </button>
      </div>
    </div>
  )
}

/** Nhóm nút chọn 1 (lọc nhanh) */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex flex-wrap gap-1 self-start rounded-xl bg-surface-container-low p-1">
      {options.map((o) => (
        <button key={String(o.value)} type="button" onClick={() => onChange(o.value)}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-label-lg transition-colors ${
            value === o.value ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          }`}>
          {o.label}
          {o.count != null && <span className="rounded-full bg-surface-container px-1.5 text-label-sm">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

/**
 * Biểu đồ cột đơn giản bằng CSS (không cần thư viện).
 * data: [{ label, value, hint }]
 */
export function BarChart({ data, height = 160, format = (v) => v, color = 'bg-primary-container', emptyText = 'Chưa có dữ liệu' }) {
  const max = Math.max(0, ...data.map((d) => Number(d.value) || 0))
  if (max === 0) {
    return <div className="flex items-center justify-center rounded-xl bg-surface-container-low text-body-sm text-outline" style={{ height }}>{emptyText}</div>
  }
  return (
    <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
      {data.map((d) => {
        const pct = ((Number(d.value) || 0) / max) * 100
        return (
          <div key={d.label} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-md bg-inverse-surface px-2 py-0.5 text-label-sm text-inverse-on-surface opacity-0 transition-opacity group-hover:opacity-100">
              {d.hint || format(d.value)}
            </span>
            <div className={`w-full max-w-[44px] rounded-t-md ${color} transition-all group-hover:opacity-80`}
              style={{ height: `${Math.max(pct, d.value ? 3 : 0)}%` }} />
            <span className="w-full truncate text-center text-[10px] text-outline sm:text-label-sm">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Thanh ngang thể hiện tỉ lệ 0..1 (tỉ lệ đúng, độ thành thạo...) */
/** invert = true: số càng cao càng xấu (tỉ lệ sai) */
export function RateBar({ value, goodAt = 0.8, badAt = 0.5, invert = false }) {
  if (value == null) return <span className="text-body-sm text-outline">—</span>
  const pct = Math.round(value * 100)
  const v = invert ? 1 - value : value
  const color = v >= goodAt ? 'bg-tertiary-container' : v >= badAt ? 'bg-secondary-container' : 'bg-error'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-surface-container">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-label-md text-on-surface">{pct}%</span>
    </div>
  )
}

/** Ô tìm kiếm có độ trễ (debounce) để không gọi API mỗi lần gõ */
export function SearchBox({ value, onChange, placeholder = 'Tìm kiếm...', delay = 350 }) {
  const [text, setText] = useState(value || '')
  useEffect(() => setText(value || ''), [value])
  useEffect(() => {
    if (text === (value || '')) return undefined
    const t = setTimeout(() => onChange(text), delay)
    return () => clearTimeout(t)
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="relative min-w-[200px] flex-1">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className={`${fieldCls} pl-10`} />
    </div>
  )
}

/** Sao chép nhanh (mật khẩu tạm...) */
export function CopyText({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 font-mono text-label-lg text-on-surface hover:bg-surface-container-high"
      onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
      {text}
      <Icon name={copied ? 'check' : 'content_copy'} className="text-[16px] text-primary" />
    </button>
  )
}
