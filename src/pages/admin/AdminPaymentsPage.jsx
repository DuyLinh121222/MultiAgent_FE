import { useCallback, useEffect, useState } from 'react'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import {
  areaCls, Badge, Field, Modal, PageHeader, Pagination, SearchBox, Segmented, StatCard, useToast,
} from '../../components/staff/ui'
import { adminApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDateTime, formatVND, timeAgo } from '../../utils/format'
import { PAYMENT_STATUS, payStatusKey } from './AdminDashboardPage'

const SIZE = 20
const METHOD = { MOMO_QR: 'QR MoMo', MOMO_WALLET: 'Ví MoMo', MOCK: 'Giả lập' }

/**
 * Giao dịch: học sinh quét QR quỹ MoMo, ghi mã đơn (MAELxxxxxx) và bấm "Tôi đã chuyển khoản".
 * Admin mở app MoMo đối chiếu số tiền + nội dung, rồi bấm Xác nhận (gói tự kích hoạt) hoặc Từ chối.
 */
export default function AdminPaymentsPage() {
  const [status, setStatus] = useState('WAITING')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [deciding, setDeciding] = useState(null) // { payment, action: 'confirm' | 'reject' }
  const [toast, showToast] = useToast()

  const load = useCallback(() => {
    setError('')
    adminApi.payments({ status: status || undefined, q: q || undefined, page, size: SIZE })
      .then(setData).catch((e) => setError(getErrorMessage(e)))
  }, [status, q, page])
  useEffect(() => { load() }, [load])

  const decide = async (note) => {
    const { payment, action } = deciding
    try {
      if (action === 'confirm') await adminApi.confirmPayment(payment.id, note)
      else await adminApi.rejectPayment(payment.id, note)
      showToast(action === 'confirm' ? `Đã xác nhận, kích hoạt ${payment.planName} cho ${payment.studentName}` : 'Đã từ chối, học sinh nhận thông báo kèm lý do')
      setDeciding(null)
      load()
    } catch (e) {
      showToast(getErrorMessage(e), 'red')
    }
  }

  return (
    <div className="page">
      {toast}
      <PageHeader icon="receipt_long" title="Giao dịch"
        subtitle="Học sinh chuyển tiền qua QR quỹ MoMo kèm mã đơn. Mở app MoMo đối chiếu số tiền và nội dung rồi bấm Xác nhận." />
      {data && (
        <div className="grid grid-cols-2 gap-space-md xl:grid-cols-4">
          <StatCard icon="price_check" tone="orange" label="Chờ xác nhận" value={data.waitingCount} hint="Học sinh đã báo chuyển khoản" />
          <StatCard icon="payments" tone="green" label="Thành công" value={formatVND(data.successAmount)} hint={`${data.successCount} giao dịch`} />
          <StatCard icon="hourglass_top" tone="gray" label="Chưa chuyển" value={Math.max(0, data.pendingCount - data.waitingCount)} hint="Tạo đơn nhưng chưa báo chuyển" />
          <StatCard icon="money_off" tone="red" label="Từ chối" value={data.failedCount} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-space-sm">
        <Segmented value={status} onChange={(v) => { setStatus(v); setPage(0) }} options={[
          { value: 'WAITING', label: 'Chờ xác nhận', count: data?.waitingCount },
          { value: 'SUCCESS', label: 'Thành công' }, { value: 'PENDING', label: 'Chưa chuyển' },
          { value: 'FAILED', label: 'Từ chối' }, { value: '', label: 'Tất cả' },
        ]} />
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0) }} placeholder="Tìm mã đơn MAEL..., tên học sinh, email..." />
      </div>
      <ErrorBox message={error} onRetry={load} />

      {!data ? <Loading /> : data.page.items.length === 0 ? (
        <EmptyState icon={status === 'WAITING' ? 'task_alt' : 'receipt_long'}
          title={status === 'WAITING' ? 'Không có thanh toán nào chờ xác nhận' : 'Chưa có giao dịch'}
          description={status === 'WAITING' ? 'Khi học sinh bấm "Tôi đã chuyển khoản", đơn sẽ hiện ở đây.' : undefined} />
      ) : (
        <div className="flex flex-col gap-space-sm">
          {data.page.items.map((p) => {
            const key = payStatusKey(p)
            const st = PAYMENT_STATUS[key] || { label: p.status, tone: 'gray' }
            return (
              <div key={p.id} className={`card flex flex-col gap-space-sm md:flex-row md:items-center ${key === 'WAITING' ? 'ring-2 ring-secondary-container' : ''}`}>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <span className="rounded-md bg-momo/10 px-2 py-0.5 font-mono text-label-lg font-extrabold text-momo">{p.transferCode || '—'}</span>
                    <span className="text-body-sm text-outline">{METHOD[p.method] || p.method}</span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-space-sm">
                    <span className="text-headline-sm">{formatVND(p.amount)}</span>
                    <span className="text-body-md text-on-surface-variant">{p.planName}</span>
                  </div>
                  <span className="text-body-sm text-on-surface-variant">
                    <b className="text-on-surface">{p.studentName}</b> • {p.email}
                  </span>
                  <span className="text-body-sm text-outline">
                    Tạo đơn {formatDateTime(p.createdAt)}
                    {p.customerPaidAt && <> • <b className="text-secondary">Báo đã chuyển {timeAgo(p.customerPaidAt)}</b></>}
                    {p.paidAt && <> • Kích hoạt {formatDateTime(p.paidAt)}</>}
                  </span>
                  {p.adminNote && <span className="text-body-sm text-on-surface-variant">Ghi chú: {p.adminNote}</span>}
                </div>
                {p.status === 'PENDING' && (
                  <div className="flex flex-shrink-0 flex-wrap gap-space-sm">
                    <button type="button" className="btn-primary" onClick={() => setDeciding({ payment: p, action: 'confirm' })}>
                      <Icon name="check" className="text-[18px]" /> Xác nhận
                    </button>
                    <button type="button" className="btn-secondary text-error" onClick={() => setDeciding({ payment: p, action: 'reject' })}>
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          <Pagination page={page} size={SIZE} total={data.page.total} onChange={setPage} />
        </div>
      )}

      {deciding && <DecisionModal {...deciding} onClose={() => setDeciding(null)} onConfirm={decide} />}
    </div>
  )
}

function DecisionModal({ payment, action, onClose, onConfirm }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const confirm = action === 'confirm'
  const quick = confirm
    ? ['Đã nhận đủ tiền', 'Nhận đủ tiền, học sinh ghi sai nội dung']
    : ['Chưa thấy tiền về', 'Sai số tiền', 'Không đúng nội dung chuyển khoản']
  const submit = async () => {
    setBusy(true)
    await onConfirm(note.trim())
    setBusy(false)
  }
  return (
    <Modal open title={confirm ? 'Xác nhận đã nhận tiền' : 'Từ chối thanh toán'} onClose={onClose} footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
      <button type="button" disabled={busy || (!confirm && !note.trim())} onClick={submit}
        className={confirm ? 'btn-primary' : 'btn-primary bg-error shadow-none hover:bg-error/90'}>
        {confirm ? 'Xác nhận & kích hoạt gói' : 'Từ chối'}
      </button>
    </>}>
      <div className="flex flex-col gap-space-md">
        <div className="rounded-xl bg-surface-container-low p-space-md text-body-md">
          <div className="flex justify-between"><span className="text-on-surface-variant">Mã đơn</span><b className="font-mono text-momo">{payment.transferCode}</b></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">Số tiền</span><b>{formatVND(payment.amount)}</b></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">Học sinh</span><b>{payment.studentName}</b></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">Gói</span><b>{payment.planName}</b></div>
        </div>
        {confirm ? (
          <p className="text-body-sm text-on-surface-variant">
            Kiểm tra trong app MoMo (quỹ <b>Mael</b>) đã có khoản <b>{formatVND(payment.amount)}</b> với nội dung <b>{payment.transferCode}</b>.
            Xác nhận xong gói kích hoạt ngay và học sinh nhận thông báo.
          </p>
        ) : (
          <p className="text-body-sm text-on-surface-variant">Học sinh sẽ thấy lý do và hướng dẫn gửi ảnh giao dịch qua email nếu đã chuyển.</p>
        )}
        <div className="flex flex-wrap gap-1">
          {quick.map((t) => (
            <button key={t} type="button" className="rounded-full bg-surface-container px-3 py-1 text-label-md hover:bg-surface-container-high" onClick={() => setNote(t)}>{t}</button>
          ))}
        </div>
        <Field label={confirm ? 'Ghi chú (không bắt buộc)' : 'Lý do (bắt buộc)'}>
          <textarea className={areaCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
        <p className="flex items-center gap-1 text-body-sm text-outline"><Icon name="history" className="text-[16px]" /> Thao tác được ghi vào nhật ký.</p>
      </div>
    </Modal>
  )
}
