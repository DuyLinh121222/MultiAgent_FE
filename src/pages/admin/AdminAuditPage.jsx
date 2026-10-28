import { useCallback, useEffect, useState } from 'react'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import { fieldCls, PageHeader, Pagination } from '../../components/staff/ui'
import { adminApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDateTime } from '../../utils/format'

export const AUDIT_ACTION = {
  CREATE_ACCOUNT: { label: 'Tạo tài khoản', icon: 'person_add' },
  UPDATE_ACCOUNT: { label: 'Sửa hồ sơ', icon: 'manage_accounts' },
  LOCK_ACCOUNT: { label: 'Khoá tài khoản', icon: 'lock' },
  UNLOCK_ACCOUNT: { label: 'Mở khoá', icon: 'lock_open' },
  RESET_PASSWORD: { label: 'Cấp lại mật khẩu', icon: 'key' },
  GRANT_PLAN: { label: 'Kích hoạt gói', icon: 'card_giftcard' },
  CREATE_PLAN: { label: 'Tạo gói', icon: 'add_card' },
  UPDATE_PLAN: { label: 'Sửa gói', icon: 'edit' },
  HIDE_PLAN: { label: 'Ẩn gói', icon: 'visibility_off' },
  SHOW_PLAN: { label: 'Hiện gói', icon: 'visibility' },
}

const SIZE = 30

/** Nhật ký thao tác quản trị: ai đã làm gì, lúc nào */
export default function AdminAuditPage() {
  const [action, setAction] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    adminApi.auditLogs({ action: action || undefined, page, size: SIZE }).then(setData).catch((e) => setError(getErrorMessage(e)))
  }, [action, page])
  useEffect(() => { load() }, [load])

  return (
    <div className="page">
      <PageHeader icon="history" title="Nhật ký thao tác"
        subtitle="Mọi thao tác quan trọng của quản trị viên đều được ghi lại để đối soát khi cần." />
      <div className="flex flex-wrap gap-space-sm">
        <select className={`${fieldCls} max-w-xs`} value={action} onChange={(e) => { setAction(e.target.value); setPage(0) }}>
          <option value="">Tất cả thao tác</option>
          {Object.entries(AUDIT_ACTION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <ErrorBox message={error} onRetry={load} />
      {!data ? <Loading /> : data.items.length === 0 ? (
        <EmptyState icon="history" title="Chưa có thao tác nào" description="Khi khoá tài khoản, tạo giảng viên, sửa gói... sẽ hiện ở đây." />
      ) : (
        <div className="card flex flex-col p-0">
          {data.items.map((a) => (
            <div key={a.id} className="flex items-start gap-space-md border-b border-surface-container px-space-lg py-space-md last:border-0">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                <Icon name={AUDIT_ACTION[a.action]?.icon || 'edit_note'} className="text-[20px]" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-label-md text-primary">{AUDIT_ACTION[a.action]?.label || a.action}</span>
                <span className="text-body-md text-on-surface">{a.detail}</span>
                <span className="text-body-sm text-outline">{a.actorName} • {formatDateTime(a.createdAt)}</span>
              </div>
            </div>
          ))}
          <div className="px-space-lg py-space-md">
            <Pagination page={page} size={SIZE} total={data.total} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
