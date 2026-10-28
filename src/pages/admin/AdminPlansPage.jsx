import { useCallback, useEffect, useState } from 'react'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import { areaCls, Badge, Field, fieldCls, Modal, PageHeader, useToast } from '../../components/staff/ui'
import { adminApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatVND } from '../../utils/format'

const AUDIENCE = { STUDENT: 'Học sinh', CENTER: 'Trung tâm', SCHOOL: 'Trường học' }
const EMPTY = {
  name: '', description: '', price: 99000, durationDays: 30, maxAiSessions: '', audience: 'STUDENT',
  priceUnit: 'PACKAGE', minSeats: '', features: '', featured: false, sortOrder: 10, active: true,
}

/** Gói học: thêm / sửa giá, thời hạn, quyền lợi; ẩn gói không bán nữa */
export default function AdminPlansPage() {
  const [plans, setPlans] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | plan
  const [toast, showToast] = useToast()

  const load = useCallback(() => {
    adminApi.plans().then(setPlans).catch((e) => setError(getErrorMessage(e)))
  }, [])
  useEffect(() => { load() }, [load])

  const toggle = async (p) => {
    try {
      await adminApi.setPlanActive(p.id, !p.active)
      showToast(p.active ? `Đã ẩn ${p.name}` : `Đã hiện ${p.name}`)
      load()
    } catch (e) {
      showToast(getErrorMessage(e), 'red')
    }
  }

  return (
    <div className="page">
      {toast}
      <PageHeader icon="workspace_premium" title="Gói học"
        subtitle="Gói đang bật hiện ở trang Bảng giá. Gói đã có người mua chỉ ẩn được, không xoá (giữ lịch sử thanh toán)."
        actions={<button type="button" className="btn-primary" onClick={() => setEditing('new')}><Icon name="add" className="text-[18px]" /> Thêm gói</button>} />
      <ErrorBox message={error} onRetry={load} />
      {!plans ? <Loading /> : (
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className={`card flex flex-col gap-space-sm ${p.active ? '' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-center gap-space-xs">
                <Badge tone={p.audience === 'STUDENT' ? 'primary' : 'orange'}>{AUDIENCE[p.audience]}</Badge>
                {Number(p.price) === 0 && <Badge tone="green">Dùng thử</Badge>}
                {p.featured && <Badge tone="orange" icon="star">Nổi bật</Badge>}
                {!p.active && <Badge tone="dark" icon="visibility_off">Đang ẩn</Badge>}
              </div>
              <h3 className="text-headline-sm">{p.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-headline-md font-extrabold text-primary">{formatVND(p.price)}</span>
                <span className="text-body-sm text-outline">
                  {p.priceUnit === 'PER_STUDENT_MONTH' ? '/ học sinh / tháng' : `/ ${p.durationDays} ngày`}
                </span>
              </div>
              {p.description && <p className="line-clamp-2 text-body-sm text-on-surface-variant">{p.description}</p>}
              <div className="grid grid-cols-3 gap-space-xs rounded-xl bg-surface-container-low p-space-sm text-center">
                <Num label="Đang dùng" value={p.activeSubscribers} />
                <Num label="Đã bán" value={p.soldCount} />
                <Num label="Doanh thu" value={formatVND(p.revenue)} />
              </div>
              <div className="mt-auto flex gap-space-sm pt-space-xs">
                <button type="button" className="btn-secondary flex-1" onClick={() => setEditing(p)}><Icon name="edit" className="text-[18px]" /> Sửa</button>
                <button type="button" className="btn-ghost" onClick={() => toggle(p)} title={p.active ? 'Ẩn gói' : 'Hiện gói'}>
                  <Icon name={p.active ? 'visibility_off' : 'visibility'} className="text-[20px]" /> {p.active ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <PlanForm plan={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
          onSaved={(msg) => { setEditing(null); showToast(msg); load() }} />
      )}
    </div>
  )
}

function Num({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-label-lg">{value}</span>
      <span className="text-label-sm text-outline">{label}</span>
    </div>
  )
}

function PlanForm({ plan, onClose, onSaved }) {
  const [f, setF] = useState(() => (plan ? {
    ...EMPTY, ...plan, maxAiSessions: plan.maxAiSessions ?? '', minSeats: plan.minSeats ?? '', features: plan.features || '', description: plan.description || '',
  } : EMPTY))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      name: f.name, description: f.description || null, price: Number(f.price), durationDays: Number(f.durationDays),
      maxAiSessions: f.maxAiSessions === '' ? null : Number(f.maxAiSessions), audience: f.audience,
      priceUnit: f.audience === 'STUDENT' ? 'PACKAGE' : f.priceUnit, minSeats: f.minSeats === '' ? null : Number(f.minSeats),
      features: f.features || null, featured: f.featured, sortOrder: Number(f.sortOrder) || 0, active: f.active,
    }
    try {
      if (plan) await adminApi.updatePlan(plan.id, payload)
      else await adminApi.createPlan(payload)
      onSaved(plan ? 'Đã lưu gói' : 'Đã thêm gói mới')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open wide title={plan ? `Sửa ${plan.name}` : 'Thêm gói học'} onClose={onClose} footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
      <button type="submit" form="plan-form" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
    </>}>
      <form id="plan-form" onSubmit={submit} className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
        <div className="sm:col-span-2"><ErrorBox message={error} /></div>
        <Field label="Tên gói *" className="sm:col-span-2"><input className={fieldCls} value={f.name} onChange={set('name')} required maxLength={100} /></Field>
        <Field label="Dành cho">
          <select className={fieldCls} value={f.audience} onChange={set('audience')}>
            {Object.entries(AUDIENCE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Cách tính giá">
          <select className={fieldCls} value={f.audience === 'STUDENT' ? 'PACKAGE' : f.priceUnit} onChange={set('priceUnit')} disabled={f.audience === 'STUDENT'}>
            <option value="PACKAGE">Trọn gói</option>
            <option value="PER_STUDENT_MONTH">Theo học sinh / tháng</option>
          </select>
        </Field>
        <Field label="Giá (đồng) *" hint={plan && Number(plan.price) === 0 ? 'Gói dùng thử luôn giữ giá 0đ' : formatVND(f.price)}>
          <input type="number" min={0} step={1000} className={fieldCls} value={f.price} onChange={set('price')} required
            disabled={plan && Number(plan.price) === 0} />
        </Field>
        <Field label="Thời hạn (ngày) *"><input type="number" min={1} max={3650} className={fieldCls} value={f.durationDays} onChange={set('durationDays')} required /></Field>
        <Field label="Giới hạn phiên thảo luận AI" hint="Bỏ trống = không giới hạn">
          <input type="number" min={1} className={fieldCls} value={f.maxAiSessions} onChange={set('maxAiSessions')} />
        </Field>
        {f.audience !== 'STUDENT' ? (
          <Field label="Số học sinh tối thiểu"><input type="number" min={1} className={fieldCls} value={f.minSeats} onChange={set('minSeats')} /></Field>
        ) : <div className="hidden sm:block" />}
        <Field label="Mô tả ngắn" className="sm:col-span-2"><textarea className={areaCls} rows={2} value={f.description} onChange={set('description')} maxLength={1000} /></Field>
        <Field label="Quyền lợi (mỗi dòng 1 ý)" className="sm:col-span-2">
          <textarea className={areaCls} rows={4} value={f.features} onChange={set('features')} maxLength={2000} placeholder={'Mở khoá toàn bộ ải\nPhòng học 3 AI không giới hạn'} />
        </Field>
        <Field label="Thứ tự hiển thị"><input type="number" className={fieldCls} value={f.sortOrder} onChange={set('sortOrder')} /></Field>
        <div className="flex flex-col justify-end gap-space-sm">
          <label className="flex items-center gap-space-sm text-label-lg"><input type="checkbox" checked={f.featured} onChange={set('featured')} className="h-4 w-4 accent-primary" /> Gắn nhãn "Nổi bật"</label>
          <label className="flex items-center gap-space-sm text-label-lg"><input type="checkbox" checked={f.active} onChange={set('active')} className="h-4 w-4 accent-primary" /> Đang bán (hiện ở Bảng giá)</label>
        </div>
      </form>
    </Modal>
  )
}
