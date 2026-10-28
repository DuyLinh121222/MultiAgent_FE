import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import { areaCls, Badge, PageHeader, Segmented, useToast } from '../../components/staff/ui'
import { adminApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDateTime } from '../../utils/format'

const STATUS = {
  NEW: { label: 'Mới', tone: 'orange', icon: 'fiber_new' },
  CONTACTED: { label: 'Đã liên hệ', tone: 'primary', icon: 'call' },
  CLOSED: { label: 'Đã chốt / đóng', tone: 'green', icon: 'task_alt' },
}
const ORG = { CENTER: 'Trung tâm', SCHOOL: 'Trường học' }

/** Yêu cầu tư vấn gói Trung tâm / Trường học gửi từ trang Bảng giá */
export default function AdminLeadsPage() {
  const [leads, setLeads] = useState(null)
  const [filter, setFilter] = useState('NEW')
  const [error, setError] = useState('')
  const [toast, showToast] = useToast()

  const load = useCallback(() => {
    adminApi.leads().then(setLeads).catch((e) => setError(getErrorMessage(e)))
  }, [])
  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const c = { '': leads?.length || 0 }
    Object.keys(STATUS).forEach((k) => { c[k] = leads?.filter((l) => l.status === k).length || 0 })
    return c
  }, [leads])
  const shown = (leads || []).filter((l) => !filter || l.status === filter)

  const update = async (lead, patch, msg) => {
    try {
      const saved = await adminApi.updateLead(lead.id, patch)
      setLeads((ls) => ls.map((x) => (x.id === saved.id ? saved : x)))
      showToast(msg)
    } catch (e) {
      showToast(getErrorMessage(e), 'red')
    }
  }

  return (
    <div className="page">
      {toast}
      <PageHeader icon="handshake" title="Tư vấn trường học / trung tâm"
        subtitle="Yêu cầu gửi từ trang Bảng giá. Gọi lại trong 24 giờ, ghi chú kết quả để cả nhóm cùng theo dõi." />
      <Segmented value={filter} onChange={setFilter} options={[
        { value: 'NEW', label: 'Mới', count: counts.NEW }, { value: 'CONTACTED', label: 'Đã liên hệ', count: counts.CONTACTED },
        { value: 'CLOSED', label: 'Đã đóng', count: counts.CLOSED }, { value: '', label: 'Tất cả', count: counts[''] },
      ]} />
      <ErrorBox message={error} onRetry={load} />
      {!leads ? <Loading /> : shown.length === 0 ? (
        <EmptyState icon="handshake" title="Không có yêu cầu nào" description="Yêu cầu tư vấn từ trung tâm, trường học sẽ hiện ở đây." />
      ) : (
        <div className="grid grid-cols-1 gap-space-md lg:grid-cols-2">
          {shown.map((l) => <LeadCard key={l.id} lead={l} onUpdate={update} />)}
        </div>
      )}
    </div>
  )
}

function LeadCard({ lead, onUpdate }) {
  const [note, setNote] = useState(lead.adminNote || '')
  const dirty = note !== (lead.adminNote || '')
  const st = STATUS[lead.status]
  return (
    <div className="card flex flex-col gap-space-sm">
      <div className="flex flex-wrap items-center gap-space-xs">
        <Badge tone={st.tone} icon={st.icon}>{st.label}</Badge>
        <Badge tone="gray">{ORG[lead.orgType]}</Badge>
        {lead.planName && <Badge tone="primary">{lead.planName}</Badge>}
        <span className="ml-auto text-body-sm text-outline">{formatDateTime(lead.createdAt)}</span>
      </div>
      <h3 className="text-headline-sm">{lead.orgName}</h3>
      <div className="flex flex-wrap gap-x-space-lg gap-y-1 text-body-md">
        <span className="flex items-center gap-1"><Icon name="person" className="text-[18px] text-outline" /> {lead.contactName}</span>
        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-primary hover:underline"><Icon name="call" className="text-[18px]" /> {lead.phone}</a>
        {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-primary hover:underline"><Icon name="mail" className="text-[18px]" /> {lead.email}</a>}
        {lead.studentCount && <span className="flex items-center gap-1"><Icon name="groups" className="text-[18px] text-outline" /> {lead.studentCount} học sinh</span>}
      </div>
      {lead.note && <p className="rounded-xl bg-surface-container-low px-space-md py-space-sm text-body-md text-on-surface-variant">“{lead.note}”</p>}
      <textarea className={areaCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú nội bộ: đã gọi lúc nào, hẹn demo ngày nào..." />
      <div className="flex flex-wrap gap-space-sm">
        {dirty && <button type="button" className="btn-primary" onClick={() => onUpdate(lead, { adminNote: note }, 'Đã lưu ghi chú')}>Lưu ghi chú</button>}
        {lead.status !== 'CONTACTED' && (
          <button type="button" className="btn-secondary" onClick={() => onUpdate(lead, { status: 'CONTACTED', adminNote: dirty ? note : undefined }, 'Đã chuyển sang "Đã liên hệ"')}>
            <Icon name="call" className="text-[18px]" /> Đã liên hệ
          </button>
        )}
        {lead.status !== 'CLOSED' && (
          <button type="button" className="btn-secondary" onClick={() => onUpdate(lead, { status: 'CLOSED', adminNote: dirty ? note : undefined }, 'Đã đóng yêu cầu')}>
            <Icon name="task_alt" className="text-[18px]" /> Đóng
          </button>
        )}
        {lead.status !== 'NEW' && (
          <button type="button" className="btn-ghost" onClick={() => onUpdate(lead, { status: 'NEW' }, 'Đã mở lại')}>Mở lại</button>
        )}
      </div>
    </div>
  )
}
