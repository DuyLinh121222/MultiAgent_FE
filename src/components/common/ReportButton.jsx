import { useState } from 'react'
import Icon from './Icon'
import { studentApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'

const REASONS = [
  { value: 'WRONG_ANSWER', label: 'Đáp án sai' },
  { value: 'WRONG_EXPLANATION', label: 'Giải thích sai' },
  { value: 'TYPO', label: 'Lỗi chính tả' },
  { value: 'OTHER', label: 'Khác' },
]

/**
 * Nút "Báo sai" - gửi báo cáo cho giảng viên. targetType: LESSON | QUESTION | MESSAGE | SOLUTION
 */
export default function ReportButton({ targetType, targetId, compact = false }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('WRONG_EXPLANATION')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')

  const submit = async () => {
    try {
      await studentApi.report({ targetType, targetId, reason, description })
      setStatus('Đã gửi! Giảng viên sẽ kiểm tra sớm.')
      setTimeout(() => { setOpen(false); setStatus(''); setDescription('') }, 1500)
    } catch (e) {
      setStatus(getErrorMessage(e))
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-lg text-on-surface-variant hover:text-error ${compact ? 'text-label-sm' : 'px-space-sm py-1 text-label-md'}`}>
        <Icon name="flag" className={compact ? 'text-[14px]' : 'text-[18px]'} /> Báo sai
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-space-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-headline-sm text-on-surface">Báo nội dung sai</h3>
            <p className="mb-space-md text-body-sm text-on-surface-variant">Giảng viên chuyên môn sẽ xem lại và sửa nếu đúng là sai.</p>
            <div className="mb-space-md grid grid-cols-2 gap-space-xs">
              {REASONS.map((r) => (
                <button key={r.value} type="button" onClick={() => setReason(r.value)}
                  className={`rounded-xl px-space-sm py-space-sm text-label-md ${reason === r.value ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Mô tả thêm (không bắt buộc)" className="w-full rounded-xl bg-surface-container-low p-space-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary" />
            {status && <p className="mt-space-xs text-label-md text-primary">{status}</p>}
            <div className="mt-space-md flex justify-end gap-space-sm">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Huỷ</button>
              <button type="button" className="btn-primary" onClick={submit}>Gửi báo cáo</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
