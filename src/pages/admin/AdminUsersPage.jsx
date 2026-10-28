import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import {
  areaCls, Badge, CopyText, Field, fieldCls, Modal, PageHeader, Pagination, SearchBox, Segmented, useToast,
} from '../../components/staff/ui'
import { adminApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDate, formatDateTime, formatVND, timeAgo } from '../../utils/format'
import { ROLE_LABEL } from '../../utils/roles'
import { useAuth } from '../../context/AuthContext'
import { PAYMENT_STATUS } from './AdminDashboardPage'

const SIZE = 15
const ROLE_TONE = { STUDENT: 'primary', LECTURER: 'green', ADMIN: 'dark' }
const GOAL = { EXAM_10: 'Ôn thi vào 10', FOLLOW_CLASS: 'Học theo trên lớp', REBUILD_BASICS: 'Lấy lại gốc' }

/** Quản lý người dùng: tìm kiếm, xem chi tiết, khoá / mở khoá, tạo giảng viên, kích hoạt gói */
export default function AdminUsersPage() {
  const [params, setParams] = useSearchParams()
  const role = params.get('role') || ''
  const plan = params.get('plan') || ''
  const [status, setStatus] = useState('')
  const [grade, setGrade] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [detailId, setDetailId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [toast, showToast] = useToast()

  const load = useCallback(() => {
    setError('')
    adminApi.users({
      role: role || undefined, plan: plan || undefined, status: status || undefined,
      grade: grade || undefined, q: q || undefined, page, size: SIZE,
    }).then(setData).catch((e) => setError(getErrorMessage(e)))
  }, [role, plan, status, grade, q, page])
  useEffect(() => { load() }, [load])

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    if (key === 'role' && value !== 'STUDENT') next.delete('plan')
    setParams(next, { replace: true })
    setPage(0)
  }

  return (
    <div className="page">
      {toast}
      <PageHeader icon="group" title="Người dùng"
        subtitle="Học sinh tự đăng ký trên trang chủ. Giảng viên và quản trị viên do admin tạo tại đây."
        actions={<button type="button" className="btn-primary" onClick={() => setCreating(true)}><Icon name="person_add" className="text-[18px]" /> Thêm giảng viên / admin</button>} />

      <div className="flex flex-col gap-space-sm">
        <Segmented value={role} onChange={(v) => setFilter('role', v)} options={[
          { value: '', label: 'Tất cả' }, { value: 'STUDENT', label: 'Học sinh' },
          { value: 'LECTURER', label: 'Giảng viên' }, { value: 'ADMIN', label: 'Quản trị viên' },
        ]} />
        <div className="flex flex-wrap gap-space-sm">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0) }} placeholder="Tìm theo tên, email, số điện thoại..." />
          <select className={`${fieldCls} !w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }}>
            <option value="">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khoá</option>
          </select>
          {(role === 'STUDENT' || role === '') && (
            <select className={`${fieldCls} !w-auto`} value={grade} onChange={(e) => { setGrade(e.target.value); setPage(0) }}>
              <option value="">Mọi khối</option>
              {[6, 7, 8, 9].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
            </select>
          )}
          {role === 'STUDENT' && (
            <select className={`${fieldCls} !w-auto`} value={plan} onChange={(e) => setFilter('plan', e.target.value)}>
              <option value="">Mọi gói</option>
              <option value="PAID">Đang dùng gói trả phí</option>
              <option value="TRIAL">Đang dùng thử</option>
              <option value="NONE">Hết hạn / chưa có gói</option>
            </select>
          )}
        </div>
      </div>

      <ErrorBox message={error} onRetry={load} />
      {!data ? <Loading /> : data.items.length === 0 ? (
        <EmptyState icon="person_search" title="Không tìm thấy tài khoản" description="Thử bỏ bớt bộ lọc hoặc tìm bằng từ khoá khác." />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-body-md">
              <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
                <tr>
                  <th className="px-space-md py-3">Người dùng</th>
                  <th className="px-space-md py-3">Vai trò</th>
                  <th className="px-space-md py-3">Thông tin</th>
                  <th className="px-space-md py-3">Gói học</th>
                  <th className="px-space-md py-3">Đăng nhập gần nhất</th>
                  <th className="px-space-md py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.userId} onClick={() => setDetailId(u.userId)}
                    className="cursor-pointer border-t border-surface-container transition-colors hover:bg-surface-container-low">
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-space-sm">
                        <Avatar name={u.fullName} role={u.role} />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-label-lg text-on-surface">{u.fullName}</span>
                          <span className="truncate text-body-sm text-outline">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-3"><Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                    <td className="px-space-md py-3 text-body-sm text-on-surface-variant">
                      {u.role === 'STUDENT' ? `Lớp ${u.gradeLevel} • Cấp ${Math.floor((u.xp || 0) / 100) + 1}${u.streakDays ? ` • 🔥${u.streakDays}` : ''}` : u.specialization || '—'}
                    </td>
                    <td className="px-space-md py-3">
                      {u.role !== 'STUDENT' ? <span className="text-outline">—</span>
                        : u.planName ? (
                          <div className="flex flex-col">
                            <span className={`text-label-lg ${u.trial ? 'text-secondary' : 'text-tertiary'}`}>{u.planName}</span>
                            <span className="text-body-sm text-outline">đến {formatDate(u.planEndDate)}</span>
                          </div>
                        ) : <Badge tone="red">Hết hạn</Badge>}
                    </td>
                    <td className="px-space-md py-3 text-body-sm text-on-surface-variant">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Chưa đăng nhập'}</td>
                    <td className="px-space-md py-3">
                      {u.status === 'ACTIVE' ? <Badge tone="green">Hoạt động</Badge> : <Badge tone="red" icon="lock">Đã khoá</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-surface-container px-space-md py-space-sm">
            <Pagination page={page} size={SIZE} total={data.total} onChange={setPage} />
          </div>
        </div>
      )}

      {detailId && (
        <UserDetailModal userId={detailId} onClose={() => setDetailId(null)}
          onChanged={(msg) => { showToast(msg); load() }} onError={(msg) => showToast(msg, 'red')} />
      )}
      {creating && <CreateStaffModal onClose={() => setCreating(false)} onCreated={() => load()} />}
    </div>
  )
}

function Avatar({ name, role }) {
  const letter = (name || '?').trim().split(/\s+/).pop()[0].toUpperCase()
  const cls = role === 'ADMIN' ? 'bg-inverse-surface text-inverse-on-surface' : role === 'LECTURER' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-fixed text-on-primary-fixed'
  return <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-label-lg font-extrabold ${cls}`}>{letter}</span>
}

/* ------------------------------------------------------------------ */

function CreateStaffModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ role: 'LECTURER', email: '', fullName: '', password: '', specialization: '', academicDegree: '', workplace: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await adminApi.createStaff({ ...form, password: form.password || null })
      setResult(res)
      onCreated()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (result) {
    return (
      <Modal open title="Đã tạo tài khoản" onClose={onClose} footer={<button type="button" className="btn-primary" onClick={onClose}>Xong</button>}>
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center gap-space-sm rounded-xl bg-tertiary-fixed/60 px-space-md py-space-sm text-on-tertiary-fixed">
            <Icon name="check_circle" filled className="text-[22px]" />
            Gửi thông tin đăng nhập dưới đây cho {form.role === 'LECTURER' ? 'giảng viên' : 'quản trị viên'} mới.
          </div>
          <div className="grid grid-cols-[120px_1fr] items-center gap-y-space-sm">
            <span className="text-label-md text-on-surface-variant">Email</span><CopyText text={result.email} />
            <span className="text-label-md text-on-surface-variant">Mật khẩu</span><CopyText text={result.tempPassword} />
          </div>
          <p className="text-body-sm text-outline">Mật khẩu chỉ hiện 1 lần. Người dùng nên đổi mật khẩu sau lần đăng nhập đầu tiên.</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open title="Thêm giảng viên / quản trị viên" onClose={onClose}
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
        <button type="submit" form="create-staff" className="btn-primary" disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
      </>}>
      <form id="create-staff" onSubmit={submit} className="flex flex-col gap-space-md">
        <ErrorBox message={error} />
        <Segmented value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))}
          options={[{ value: 'LECTURER', label: 'Giảng viên' }, { value: 'ADMIN', label: 'Quản trị viên' }]} />
        <Field label="Họ và tên *"><input className={fieldCls} value={form.fullName} onChange={set('fullName')} required maxLength={150} /></Field>
        <Field label="Email đăng nhập *"><input type="email" className={fieldCls} value={form.email} onChange={set('email')} required /></Field>
        <Field label="Mật khẩu" hint="Bỏ trống để hệ thống tự tạo mật khẩu tạm">
          <input className={fieldCls} value={form.password} onChange={set('password')} minLength={6} maxLength={64} placeholder="Tự tạo" />
        </Field>
        {form.role === 'LECTURER' && (
          <>
            <Field label="Chuyên môn"><input className={fieldCls} value={form.specialization} onChange={set('specialization')} placeholder="Đại số, Hình học THCS" /></Field>
            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              <Field label="Học vị"><input className={fieldCls} value={form.academicDegree} onChange={set('academicDegree')} placeholder="Thạc sĩ" /></Field>
              <Field label="Nơi công tác"><input className={fieldCls} value={form.workplace} onChange={set('workplace')} placeholder="Trường THCS ..." /></Field>
            </div>
          </>
        )}
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */

function UserDetailModal({ userId, onClose, onChanged, onError }) {
  const { user: me } = useAuth()
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  const [mode, setMode] = useState(null) // edit | lock | grant | password
  const [busy, setBusy] = useState(false)
  const [credential, setCredential] = useState(null)

  const load = useCallback(() => {
    adminApi.user(userId).then(setD).catch((e) => setError(getErrorMessage(e)))
  }, [userId])
  useEffect(() => { load() }, [load])

  const run = async (fn, msg) => {
    setBusy(true)
    try {
      const res = await fn()
      onChanged(msg)
      setMode(null)
      load()
      return res
    } catch (e) {
      onError(getErrorMessage(e))
      return null
    } finally {
      setBusy(false)
    }
  }

  const u = d?.user
  const s = d?.student
  const l = d?.lecturer
  const isMe = me?.userId === userId

  return (
    <Modal open wide title="Chi tiết tài khoản" onClose={onClose}>
      {error ? <ErrorBox message={error} /> : !d ? <Loading /> : (
        <div className="flex flex-col gap-space-lg">
          <div className="flex flex-wrap items-center gap-space-md">
            <Avatar name={u.fullName} role={u.role} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-headline-sm">{u.fullName} {isMe && <span className="text-body-sm text-outline">(bạn)</span>}</span>
              <span className="text-body-sm text-on-surface-variant">{u.email}{u.phone ? ` • ${u.phone}` : ''}</span>
            </div>
            <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
            {u.status === 'ACTIVE' ? <Badge tone="green">Hoạt động</Badge> : <Badge tone="red" icon="lock">Đã khoá</Badge>}
          </div>

          <div className="flex flex-wrap gap-space-sm">
            <button type="button" className="btn-secondary" onClick={() => setMode('edit')}><Icon name="edit" className="text-[18px]" /> Sửa hồ sơ</button>
            {u.role === 'STUDENT' && (
              <button type="button" className="btn-secondary" onClick={() => setMode('grant')}><Icon name="card_giftcard" className="text-[18px]" /> Kích hoạt gói</button>
            )}
            <button type="button" className="btn-secondary" disabled={busy} onClick={async () => {
              if (!window.confirm(`Cấp mật khẩu mới cho ${u.email}? Mật khẩu cũ sẽ không dùng được nữa.`)) return
              const res = await run(() => adminApi.resetPassword(userId), 'Đã cấp lại mật khẩu')
              if (res) setCredential(res)
            }}><Icon name="key" className="text-[18px]" /> Cấp lại mật khẩu</button>
            {!isMe && (u.status === 'ACTIVE' ? (
              <button type="button" className="btn-secondary text-error" onClick={() => setMode('lock')}><Icon name="lock" className="text-[18px]" /> Khoá tài khoản</button>
            ) : (
              <button type="button" className="btn-secondary text-tertiary" disabled={busy}
                onClick={() => run(() => adminApi.setStatus(userId, 'ACTIVE'), 'Đã mở khoá tài khoản')}>
                <Icon name="lock_open" className="text-[18px]" /> Mở khoá
              </button>
            ))}
          </div>

          {credential && (
            <div className="flex flex-wrap items-center gap-space-sm rounded-xl bg-secondary-fixed/60 px-space-md py-space-sm">
              <Icon name="key" className="text-[20px] text-secondary" />
              <span className="text-label-lg">Mật khẩu mới:</span>
              <CopyText text={credential.tempPassword} />
              <span className="text-body-sm text-on-surface-variant">Chỉ hiện 1 lần, hãy gửi cho người dùng.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-space-sm text-body-sm sm:grid-cols-3">
            <Info label="Ngày tạo" value={formatDate(u.createdAt)} />
            <Info label="Đăng nhập gần nhất" value={u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Chưa đăng nhập'} />
            {s && <Info label="Lớp" value={`Lớp ${u.gradeLevel}`} />}
            {s && <Info label="Mục tiêu" value={GOAL[s.learningGoal] || (s.onboarded ? '—' : 'Chưa qua màn chào mừng')} />}
            {s?.dateOfBirth && <Info label="Ngày sinh" value={formatDate(s.dateOfBirth)} />}
            {l && <Info label="Chuyên môn" value={l.specialization || '—'} />}
            {l && <Info label="Học vị" value={l.academicDegree || '—'} />}
            {l && <Info label="Nơi công tác" value={l.workplace || '—'} />}
          </div>

          {s && (
            <>
              <div className="grid grid-cols-2 gap-space-sm sm:grid-cols-4">
                <Mini icon="military_tech" label="Cấp độ" value={`Cấp ${s.level}`} sub={`${s.xp} XP`} />
                <Mini icon="local_fire_department" label="Chuỗi ngày" value={s.streakDays} sub={`Kỷ lục ${s.bestStreak}`} />
                <Mini icon="flag" label="Ải đã qua" value={s.stagesCleared} sub={`${s.totalStars} ⭐`} />
                <Mini icon="sports_esports" label="Đấu trường / phiên AI" value={`${s.arenaPlays} / ${s.discussionSessions}`} sub={`${s.coins} xu`} />
              </div>

              <Section title="Lịch sử gói học">
                {s.subscriptions.length === 0 ? <Muted>Chưa có gói</Muted> : s.subscriptions.map((x) => (
                  <Row key={x.id} left={x.planName} sub={`${formatDate(x.startDate)} → ${formatDate(x.endDate)}`}
                    right={x.daysLeft > 0 ? <Badge tone="green">Còn {x.daysLeft} ngày</Badge> : <Badge tone="gray">Hết hạn</Badge>} />
                ))}
              </Section>
              <Section title="Thanh toán">
                {s.payments.length === 0 ? <Muted>Chưa có giao dịch</Muted> : s.payments.map((p) => (
                  <Row key={p.id} left={`${p.planName} • ${formatVND(p.amount)}`} sub={formatDateTime(p.createdAt)}
                    right={<Badge tone={PAYMENT_STATUS[p.status]?.tone}>{PAYMENT_STATUS[p.status]?.label}</Badge>} />
                ))}
              </Section>
              <Section title="Điểm yếu đang theo dõi">
                {s.weaknesses.length === 0 ? <Muted>Chưa phát hiện điểm yếu</Muted> : s.weaknesses.map((w) => (
                  <Row key={w.id} left={w.topicName} sub={`Thành thạo ${Math.round(w.masteryScore)}%`}
                    right={<Badge tone={w.status === 'RESOLVED' ? 'green' : w.severity === 'HIGH' ? 'red' : 'orange'}>
                      {w.status === 'RESOLVED' ? 'Đã vững' : w.status === 'IMPROVING' ? 'Đang tiến bộ' : 'Cần ôn'}
                    </Badge>} />
                ))}
              </Section>
            </>
          )}

          {l && (
            <div className="grid grid-cols-2 gap-space-sm sm:grid-cols-4">
              <Mini icon="fact_check" label="Lượt duyệt" value={l.reviewsTotal} sub={`${l.approved} duyệt • ${l.rejected} từ chối`} />
              <Mini icon="picture_as_pdf" label="Tài liệu PDF" value={l.documents} />
              <Mini icon="flag" label="Báo lỗi đã xử lý" value={l.reportsHandled} />
              <Mini icon="schedule" label="Duyệt gần nhất" value={l.lastReviewAt ? timeAgo(l.lastReviewAt) : '—'} />
            </div>
          )}
        </div>
      )}

      {mode === 'edit' && d && <EditUserModal d={d} busy={busy} onClose={() => setMode(null)}
        onSave={(payload) => run(() => adminApi.updateUser(userId, payload), 'Đã lưu hồ sơ')} />}
      {mode === 'lock' && d && <LockModal email={u.email} busy={busy} onClose={() => setMode(null)}
        onSave={(reason) => run(() => adminApi.setStatus(userId, 'LOCKED', reason), 'Đã khoá tài khoản')} />}
      {mode === 'grant' && d && <GrantModal name={u.fullName} busy={busy} onClose={() => setMode(null)}
        onSave={(planId, note) => run(() => adminApi.grantPlan(userId, planId, note), 'Đã kích hoạt gói')} />}
    </Modal>
  )
}

function EditUserModal({ d, busy, onClose, onSave }) {
  const u = d.user
  const [f, setF] = useState({
    fullName: u.fullName || '', phone: u.phone || '', gradeLevel: u.gradeLevel || 9,
    specialization: d.lecturer?.specialization || '', academicDegree: d.lecturer?.academicDegree || '', workplace: d.lecturer?.workplace || '',
  })
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    const payload = { fullName: f.fullName }
    if (u.role === 'STUDENT') Object.assign(payload, { phone: f.phone, gradeLevel: Number(f.gradeLevel) })
    if (u.role === 'LECTURER') Object.assign(payload, { specialization: f.specialization, academicDegree: f.academicDegree, workplace: f.workplace })
    onSave(payload)
  }
  return (
    <Modal open title="Sửa hồ sơ" onClose={onClose} footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
      <button type="submit" form="edit-user" className="btn-primary" disabled={busy}>Lưu</button>
    </>}>
      <form id="edit-user" onSubmit={submit} className="flex flex-col gap-space-md">
        <Field label="Họ và tên"><input className={fieldCls} value={f.fullName} onChange={set('fullName')} required maxLength={150} /></Field>
        {u.role === 'STUDENT' && (
          <div className="grid grid-cols-2 gap-space-md">
            <Field label="Số điện thoại"><input className={fieldCls} value={f.phone} onChange={set('phone')} maxLength={20} /></Field>
            <Field label="Lớp">
              <select className={fieldCls} value={f.gradeLevel} onChange={set('gradeLevel')}>{[6, 7, 8, 9].map((g) => <option key={g} value={g}>Lớp {g}</option>)}</select>
            </Field>
          </div>
        )}
        {u.role === 'LECTURER' && (
          <>
            <Field label="Chuyên môn"><input className={fieldCls} value={f.specialization} onChange={set('specialization')} /></Field>
            <div className="grid grid-cols-2 gap-space-md">
              <Field label="Học vị"><input className={fieldCls} value={f.academicDegree} onChange={set('academicDegree')} /></Field>
              <Field label="Nơi công tác"><input className={fieldCls} value={f.workplace} onChange={set('workplace')} /></Field>
            </div>
          </>
        )}
      </form>
    </Modal>
  )
}

function LockModal({ email, busy, onClose, onSave }) {
  const [reason, setReason] = useState('')
  return (
    <Modal open title="Khoá tài khoản" onClose={onClose} footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
      <button type="button" className="btn-primary bg-error shadow-none hover:bg-error/90" disabled={busy} onClick={() => onSave(reason)}>
        <Icon name="lock" className="text-[18px]" /> Khoá
      </button>
    </>}>
      <div className="flex flex-col gap-space-md">
        <p className="text-body-md">Tài khoản <b>{email}</b> sẽ bị đăng xuất ngay và không đăng nhập được cho tới khi mở khoá.</p>
        <Field label="Lý do (ghi vào nhật ký)">
          <textarea className={areaCls} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Ví dụ: tài khoản spam, phụ huynh yêu cầu..." />
        </Field>
      </div>
    </Modal>
  )
}

function GrantModal({ name, busy, onClose, onSave }) {
  const [plans, setPlans] = useState([])
  const [planId, setPlanId] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => {
    adminApi.plans().then((ps) => {
      const list = ps.filter((p) => p.active && Number(p.price) > 0)
      setPlans(list)
      setPlanId(list.find((p) => p.audience === 'STUDENT')?.id || list[0]?.id || '')
    }).catch(() => {})
  }, [])
  return (
    <Modal open title="Kích hoạt gói thủ công" onClose={onClose} footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
      <button type="button" className="btn-primary" disabled={busy || !planId} onClick={() => onSave(planId, note)}>Kích hoạt</button>
    </>}>
      <div className="flex flex-col gap-space-md">
        <p className="text-body-md text-on-surface-variant">
          Dùng cho học sinh của trung tâm / trường đã ký hợp đồng, quà tặng, hoặc bù khi thanh toán MoMo lỗi.
          Nếu <b>{name}</b> đang còn hạn, thời gian được cộng nối tiếp.
        </p>
        <Field label="Gói">
          <select className={fieldCls} value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name} • {p.durationDays} ngày ({formatVND(p.price)})</option>)}
          </select>
        </Field>
        <Field label="Ghi chú (ghi vào nhật ký)">
          <input className={fieldCls} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Ví dụ: Học sinh Trung tâm Ánh Dương, HĐ số 12" />
        </Field>
      </div>
    </Modal>
  )
}

function Info({ label, value }) {
  return (
    <div className="flex flex-col rounded-xl bg-surface-container-low px-space-md py-space-sm">
      <span className="text-label-sm text-outline">{label}</span>
      <span className="text-label-lg text-on-surface">{value}</span>
    </div>
  )
}
function Mini({ icon, label, value, sub }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-surface-container px-space-md py-space-sm">
      <span className="flex items-center gap-1 text-label-sm text-outline"><Icon name={icon} className="text-[16px] text-primary" /> {label}</span>
      <span className="text-headline-sm font-extrabold">{value}</span>
      {sub != null && <span className="text-body-sm text-on-surface-variant">{sub}</span>}
    </div>
  )
}
function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-label-lg text-on-surface-variant">{title}</h3>
      <div className="flex flex-col rounded-xl border border-surface-container px-space-md">{children}</div>
    </div>
  )
}
function Row({ left, sub, right }) {
  return (
    <div className="flex items-center gap-space-sm border-b border-surface-container py-2 last:border-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-label-lg">{left}</span>
        {sub && <span className="text-body-sm text-outline">{sub}</span>}
      </div>
      {right}
    </div>
  )
}
const Muted = ({ children }) => <span className="py-2 text-body-sm text-outline">{children}</span>
