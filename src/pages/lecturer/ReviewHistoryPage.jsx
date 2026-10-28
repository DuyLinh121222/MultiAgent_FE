import { useEffect, useState } from 'react'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import { Badge, PageHeader, Segmented } from '../../components/staff/ui'
import { lecturerInsightApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDateTime } from '../../utils/format'

/** Lịch sử duyệt nội dung: của tôi hoặc của cả nhóm giảng viên */
export default function ReviewHistoryPage() {
  const [mine, setMine] = useState(true)
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setItems(null)
    lecturerInsightApi.reviews(mine, 200).then(setItems).catch((e) => setError(getErrorMessage(e)))
  }, [mine])

  return (
    <div className="page">
      <PageHeader icon="manage_history" title="Lịch sử duyệt"
        subtitle="Mỗi lần duyệt / từ chối đều được lưu lại kèm góp ý."
        actions={<Segmented value={mine} onChange={setMine} options={[{ value: true, label: 'Của tôi' }, { value: false, label: 'Cả nhóm' }]} />} />
      <ErrorBox message={error} />
      {!items ? <Loading /> : items.length === 0 ? (
        <EmptyState icon="manage_history" title="Chưa có lượt duyệt nào" />
      ) : (
        <div className="card flex flex-col p-0">
          {items.map((r) => (
            <div key={r.id} className="flex items-start gap-space-md border-b border-surface-container px-space-lg py-space-md last:border-0">
              <Icon name={r.decision === 'APPROVED' ? 'check_circle' : 'cancel'} filled
                className={`mt-0.5 text-[22px] ${r.decision === 'APPROVED' ? 'text-tertiary' : 'text-error'}`} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-space-xs">
                  <Badge tone={r.decision === 'APPROVED' ? 'green' : 'red'}>{r.decision === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}</Badge>
                  <Badge tone="gray">{r.type === 'LESSON' ? 'Bài giảng' : 'Câu hỏi'}</Badge>
                  {r.topicName && <span className="truncate text-body-sm text-outline">{r.topicName}</span>}
                </div>
                <span className="text-body-md text-on-surface">{r.targetTitle}</span>
                {r.comment && <span className="text-body-sm text-on-surface-variant">“{r.comment}”</span>}
                <span className="text-body-sm text-outline">{mine ? '' : `${r.lecturerName} • `}{formatDateTime(r.reviewedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
