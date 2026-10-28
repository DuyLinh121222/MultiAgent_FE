import { useCallback, useEffect, useState } from 'react'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import { Badge, PageHeader, Pagination, SearchBox, Segmented, StatCard } from '../../components/staff/ui'
import { adminApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDateTime, formatVND } from '../../utils/format'
import { PAYMENT_STATUS } from './AdminDashboardPage'

const SIZE = 20
const METHOD = { MOMO_WALLET: 'Ví MoMo', MOCK: 'Giả lập' }

/** Lịch sử giao dịch thanh toán (MoMo) để đối soát */
export default function AdminPaymentsPage() {
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    adminApi.payments({ status: status || undefined, q: q || undefined, page, size: SIZE })
      .then(setData).catch((e) => setError(getErrorMessage(e)))
  }, [status, q, page])
  useEffect(() => { load() }, [load])

  return (
    <div className="page">
      <PageHeader icon="receipt_long" title="Giao dịch"
        subtitle="Mọi đơn thanh toán gói học. Gói chỉ được kích hoạt khi MoMo báo thành công (IPN có chữ ký hợp lệ)." />
      {data && (
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-3">
          <StatCard icon="payments" tone="green" label="Thành công" value={formatVND(data.successAmount)} hint={`${data.successCount} giao dịch`} />
          <StatCard icon="hourglass_top" tone="orange" label="Chờ thanh toán" value={data.pendingCount} hint="Học sinh tạo đơn nhưng chưa trả" />
          <StatCard icon="error" tone="red" label="Thất bại" value={data.failedCount} hint="MoMo báo lỗi / huỷ" />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-space-sm">
        <Segmented value={status} onChange={(v) => { setStatus(v); setPage(0) }} options={[
          { value: '', label: 'Tất cả' }, { value: 'SUCCESS', label: 'Thành công' },
          { value: 'PENDING', label: 'Chờ' }, { value: 'FAILED', label: 'Thất bại' },
        ]} />
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0) }} placeholder="Tìm tên học sinh, email, mã giao dịch MoMo..." />
      </div>
      <ErrorBox message={error} onRetry={load} />
      {!data ? <Loading /> : data.page.items.length === 0 ? (
        <EmptyState icon="receipt_long" title="Chưa có giao dịch" description="Khi học sinh mua gói, giao dịch sẽ hiện ở đây." />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-body-md">
              <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
                <tr>
                  <th className="px-space-md py-3">Thời gian</th>
                  <th className="px-space-md py-3">Học sinh</th>
                  <th className="px-space-md py-3">Gói</th>
                  <th className="px-space-md py-3 text-right">Số tiền</th>
                  <th className="px-space-md py-3">Phương thức</th>
                  <th className="px-space-md py-3">Mã MoMo</th>
                  <th className="px-space-md py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.page.items.map((p) => (
                  <tr key={p.id} className="border-t border-surface-container">
                    <td className="px-space-md py-3 text-body-sm text-on-surface-variant">{formatDateTime(p.createdAt)}</td>
                    <td className="px-space-md py-3">
                      <div className="flex flex-col"><span className="text-label-lg">{p.studentName}</span><span className="text-body-sm text-outline">{p.email}</span></div>
                    </td>
                    <td className="px-space-md py-3">{p.planName}</td>
                    <td className="px-space-md py-3 text-right text-label-lg">{formatVND(p.amount)}</td>
                    <td className="px-space-md py-3 text-body-sm">{METHOD[p.method] || p.method}</td>
                    <td className="px-space-md py-3 font-mono text-body-sm text-on-surface-variant">{p.transactionCode || '—'}</td>
                    <td className="px-space-md py-3"><Badge tone={PAYMENT_STATUS[p.status]?.tone}>{PAYMENT_STATUS[p.status]?.label || p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-surface-container px-space-md py-space-sm">
            <Pagination page={page} size={SIZE} total={data.page.total} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
