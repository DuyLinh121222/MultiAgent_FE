import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import { BarChart, Badge, PageHeader, StatCard } from '../../components/staff/ui'
import { adminApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatVND, timeAgo } from '../../utils/format'
import { AUDIT_ACTION } from './AdminAuditPage'

export const PAYMENT_STATUS = {
  SUCCESS: { label: 'Thành công', tone: 'green' },
  PENDING: { label: 'Chờ thanh toán', tone: 'orange' },
  FAILED: { label: 'Thất bại', tone: 'red' },
  REFUNDED: { label: 'Hoàn tiền', tone: 'gray' },
}

const shortVND = (v) => {
  const n = Number(v || 0)
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace('.0', '')} tỷ`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace('.0', '')}tr`
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`
  return String(n)
}

/** Tổng quan quản trị: người dùng, doanh thu, việc cần xử lý */
export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    adminApi.overview().then(setData).catch((e) => setError(getErrorMessage(e)))
  }, [])
  useEffect(() => { load() }, [load])

  if (!data && !error) return <Loading />
  if (!data) return <div className="page"><ErrorBox message={error} onRetry={load} /></div>

  const s = data.stats
  const growth = Number(s.revenueLastMonth) > 0
    ? Math.round(((Number(s.revenueThisMonth) - Number(s.revenueLastMonth)) / Number(s.revenueLastMonth)) * 100)
    : null
  const todo = [
    { to: '/lecturer/review', icon: 'menu_book', label: 'Bài giảng chờ duyệt', value: s.pendingLessons },
    { to: '/lecturer/review?tab=questions', icon: 'quiz', label: 'Câu hỏi chờ duyệt', value: s.pendingQuestions },
    { to: '/lecturer/review?tab=reports', icon: 'flag', label: 'Báo lỗi từ học sinh', value: s.openReports },
    { to: '/admin/leads', icon: 'handshake', label: 'Trường / trung tâm chờ tư vấn', value: s.newLeads },
  ]
  const maxPlan = Math.max(1, ...data.activeByPlan.map((x) => x.count))
  const maxGrade = Math.max(1, ...data.studentsByGrade.map((x) => x.count))

  return (
    <div className="page">
      <PageHeader icon="space_dashboard" title="Tổng quan hệ thống"
        subtitle="Số liệu cập nhật theo thời gian thực từ cơ sở dữ liệu."
        actions={<button type="button" className="btn-secondary" onClick={load}><Icon name="refresh" className="text-[18px]" /> Tải lại</button>} />
      <ErrorBox message={error} onRetry={load} />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="school" label="Học sinh" value={s.totalStudents} hint={`+${s.newStudents7d} trong 7 ngày • ${s.activeToday} học hôm nay`} to="/admin/users?role=STUDENT" />
        <StatCard icon="workspace_premium" tone="green" label="Đang dùng gói trả phí" value={s.paidSubscribers}
          hint={`${s.trialSubscribers} đang dùng thử`} to="/admin/users?role=STUDENT&plan=PAID" />
        <StatCard icon="payments" tone="orange" label="Doanh thu tháng này" value={formatVND(s.revenueThisMonth)}
          hint={growth == null ? `Tổng: ${formatVND(s.revenueTotal)}` : `${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth)}% so với tháng trước`} to="/admin/payments" />
        <StatCard icon="badge" tone="dark" label="Giảng viên" value={s.totalLecturers}
          hint={s.lockedAccounts ? `${s.lockedAccounts} tài khoản đang bị khoá` : 'Không có tài khoản bị khoá'} to="/admin/users?role=LECTURER" />
      </div>

      <div className="grid grid-cols-1 gap-space-md lg:grid-cols-3">
        <section className="card flex flex-col gap-space-md lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm">Doanh thu 6 tháng</h2>
            <span className="text-body-sm text-outline">Chỉ tính giao dịch thành công</span>
          </div>
          <BarChart height={190} format={shortVND}
            data={data.revenueByMonth.map((m) => ({ label: `T${Number(m.month.slice(5))}`, value: Number(m.revenue), hint: `${formatVND(m.revenue)} • ${m.orders} đơn` }))}
            emptyText="Chưa có giao dịch thành công trong 6 tháng" />
        </section>
        <section className="card flex flex-col gap-space-sm">
          <h2 className="text-headline-sm">Việc cần xử lý</h2>
          {todo.map((t) => (
            <Link key={t.label} to={t.to} className="flex items-center gap-space-sm rounded-xl px-space-sm py-2 hover:bg-surface-container-low">
              <Icon name={t.icon} className="text-[20px] text-primary" />
              <span className="flex-1 text-body-md">{t.label}</span>
              <span className={`min-w-[28px] rounded-full px-2 text-center text-label-lg ${t.value ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-outline'}`}>{t.value}</span>
            </Link>
          ))}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-space-md lg:grid-cols-3">
        <section className="card flex flex-col gap-space-md lg:col-span-2">
          <h2 className="text-headline-sm">Học sinh đăng ký mới (14 ngày)</h2>
          <BarChart height={150} color="bg-tertiary-container"
            data={data.signupsByDay.map((d) => ({ label: d.date.slice(8, 10), value: d.count, hint: `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}: ${d.count} học sinh` }))}
            emptyText="Chưa có học sinh đăng ký trong 14 ngày" />
        </section>
        <section className="card flex flex-col gap-space-md">
          <h2 className="text-headline-sm">Học sinh theo khối</h2>
          <div className="flex flex-col gap-space-sm">
            {data.studentsByGrade.map((g) => (
              <HBar key={g.name} label={g.name} value={g.count} max={maxGrade} color="bg-primary-container" />
            ))}
          </div>
          <h2 className="pt-space-sm text-headline-sm">Gói đang hoạt động</h2>
          <div className="flex flex-col gap-space-sm">
            {data.activeByPlan.length === 0 && <span className="text-body-sm text-outline">Chưa có gói nào đang hoạt động</span>}
            {data.activeByPlan.map((p) => (
              <HBar key={p.name} label={p.name} value={p.count} max={maxPlan} color="bg-secondary-container" />
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-space-md lg:grid-cols-2">
        <section className="card flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm">Giao dịch gần đây</h2>
            <Link to="/admin/payments" className="text-label-lg text-primary hover:underline">Xem tất cả</Link>
          </div>
          {data.recentPayments.length === 0 && <span className="py-space-md text-body-sm text-outline">Chưa có giao dịch</span>}
          {data.recentPayments.map((p) => (
            <div key={p.id} className="flex items-center gap-space-sm border-b border-surface-container py-2 last:border-0">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-label-lg">{p.studentName}</span>
                <span className="text-body-sm text-outline">{p.planName} • {timeAgo(p.createdAt)}</span>
              </div>
              <span className="text-label-lg">{formatVND(p.amount)}</span>
              <Badge tone={PAYMENT_STATUS[p.status]?.tone}>{PAYMENT_STATUS[p.status]?.label}</Badge>
            </div>
          ))}
        </section>
        <section className="card flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm">Thao tác quản trị gần đây</h2>
            <Link to="/admin/audit" className="text-label-lg text-primary hover:underline">Nhật ký</Link>
          </div>
          {data.recentActivity.length === 0 && <span className="py-space-md text-body-sm text-outline">Chưa có thao tác nào</span>}
          {data.recentActivity.map((a) => (
            <div key={a.id} className="flex items-start gap-space-sm border-b border-surface-container py-2 last:border-0">
              <Icon name={AUDIT_ACTION[a.action]?.icon || 'edit_note'} className="mt-0.5 text-[20px] text-primary" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="break-words text-body-md">{a.detail}</span>
                <span className="text-body-sm text-outline">{a.actorName} • {timeAgo(a.createdAt)}</span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

function HBar({ label, value, max, color }) {
  return (
    <div className="flex items-center gap-space-sm">
      <span className="w-24 flex-shrink-0 truncate text-body-sm text-on-surface-variant" title={label}>{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-container">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="w-8 text-right text-label-lg">{value}</span>
    </div>
  )
}
