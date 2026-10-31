import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import { paymentApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDateTime, formatVND } from '../utils/format'
import { CONTACT, PAYMENT_QR } from '../constants/site'
import qrDefault from '../assets/momo-qr.jpg'
import qr99k from '../assets/qr-99k.jpg'
import qr399k from '../assets/qr-399k.jpg'

/** QR MoMo có sẵn số tiền: quét là app tự điền đúng số tiền của gói. Gói khác giá thì dùng QR chung (tự nhập tiền) */
const QR_BY_AMOUNT = { 99000: qr99k, 399000: qr399k }
const qrFor = (amount) => QR_BY_AMOUNT[Math.round(Number(amount))] || qrDefault

/** 30 ngày = tháng, 150 ngày = học kỳ, 365 ngày = năm, còn lại ghi số ngày */
const periodLabel = (days) => {
  if (!days) return 'gói'
  if (days >= 28 && days <= 31) return 'tháng'
  if (days >= 120 && days <= 160) return `học kỳ (${Math.round(days / 30)} tháng)`
  if (days >= 360 && days <= 366) return 'năm'
  return `${days} ngày`
}

/** Giá mỗi ngày làm tròn: 99.000đ/30 ngày = 3,3k; 399.000đ/150 ngày = 2,7k */
const perDay = (amount, days) => {
  if (!days) return ''
  const k = Number(amount) / days / 1000
  return `${k.toFixed(1).replace('.0', '').replace('.', ',')}k`
}

/**
 * Thanh toán bằng QR quỹ MoMo "Mael":
 * 1. Học sinh quét QR, chuyển đúng số tiền, ghi nội dung = mã đơn (VD MAEL7K3Q)
 * 2. Bấm "Tôi đã chuyển khoản" → đơn vào mục "Chờ xác nhận" của admin
 * 3. Admin đối chiếu app MoMo rồi bấm Xác nhận → gói tự kích hoạt, trang này tự chuyển sang "thành công"
 */
export default function CheckoutPage() {
  const { paymentId } = useParams()
  const { refreshUser } = useAuth()
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [marking, setMarking] = useState(false)
  const [copied, setCopied] = useState('')

  const load = useCallback(() => paymentApi.get(paymentId).then(setPayment).catch((e) => setError(getErrorMessage(e))), [paymentId])
  useEffect(() => { load() }, [load])

  // Đã báo chuyển khoản: hỏi trạng thái mỗi 15 giây để tự hiện "thành công" khi admin xác nhận
  useEffect(() => {
    if (payment?.status !== 'PENDING' || !payment?.customerPaidAt) return undefined
    const poll = setInterval(load, 15000)
    return () => clearInterval(poll)
  }, [payment?.status, payment?.customerPaidAt, load])

  useEffect(() => {
    if (payment?.status === 'SUCCESS') refreshUser()
  }, [payment?.status, refreshUser])

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  const markPaid = async () => {
    setMarking(true)
    setError('')
    try {
      setPayment(await paymentApi.markPaid(paymentId))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setMarking(false)
    }
  }

  if (!payment && !error) return <Loading />
  if (!payment) return <div className="page"><ErrorBox message={error} /></div>

  if (payment.status === 'SUCCESS') {
    return (
      <div className="page max-w-2xl items-center text-center">
        <div className="card flex w-full flex-col items-center gap-space-md p-space-xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
            <Icon name="check_circle" filled className="text-[48px]" />
          </div>
          <h1 className="text-headline-lg text-on-surface">Thanh toán thành công!</h1>
          <p className="text-body-lg text-on-surface-variant">
            {payment.planName} đã được kích hoạt. Cùng vào học với Thầy AI và 2 bạn ngay nhé!
          </p>
          <div className="w-full rounded-2xl bg-surface-container-low p-space-md text-left text-body-md">
            <Row k="Số tiền" v={formatVND(payment.amount)} />
            <Row k="Phương thức" v="QR MoMo" />
            <Row k="Mã đơn" v={payment.transferCode || payment.id.slice(0, 8).toUpperCase()} />
          </div>
          <Link to="/" className="btn-primary w-full py-space-md">
            <Icon name="map" className="text-[20px]" /> Vào bản đồ ải
          </Link>
        </div>
      </div>
    )
  }

  if (payment.status === 'FAILED') {
    return (
      <div className="page max-w-2xl items-center text-center">
        <div className="card flex w-full flex-col items-center gap-space-md p-space-xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error-container text-error">
            <Icon name="error" filled className="text-[48px]" />
          </div>
          <h1 className="text-headline-lg text-on-surface">Chưa xác nhận được thanh toán</h1>
          {payment.adminNote && <p className="rounded-xl bg-surface-container-low px-space-md py-space-sm text-body-md">Lý do: {payment.adminNote}</p>}
          <p className="text-body-md text-on-surface-variant">
            Nếu bạn đã chuyển tiền, gửi ảnh chụp giao dịch tới <a className="font-bold text-primary" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> kèm mã <b>{payment.transferCode}</b>, MAEL sẽ kiểm tra lại.
          </p>
          <Link to="/pricing" className="btn-primary w-full py-space-md">Tạo đơn mới</Link>
        </div>
      </div>
    )
  }

  const waiting = !!payment.customerPaidAt
  const qrImg = qrFor(payment.amount)
  const qrHasAmount = qrImg !== qrDefault
  const code = payment.transferCode || payment.id.slice(0, 8).toUpperCase()

  return (
    <div className="mx-auto w-full max-w-[1360px] px-margin-mobile py-space-lg md:px-margin">
      <div className="mb-space-lg flex flex-col items-center space-y-space-xs text-center">
        <span className="chip bg-secondary-fixed font-bold uppercase tracking-wide text-on-secondary-fixed">
          <Icon name="bolt" className="text-[18px] text-secondary" /> {formatVND(payment.amount)} / {periodLabel(payment.durationDays)} • Chỉ {perDay(payment.amount, payment.durationDays)}/ngày
        </span>
        <h1 className="text-headline-lg tracking-tight text-primary md:text-display">Nâng cấp {payment.planName}</h1>
        <p className="max-w-xl text-body-md text-on-surface-variant">Mở khoá phòng học nhóm 3 AI, camera giải đề và quiz củng cố không giới hạn.</p>
      </div>

      {waiting && (
        <div className="mx-auto mb-space-lg flex max-w-3xl flex-col items-center gap-space-sm rounded-3xl bg-primary-fixed/60 p-space-lg text-center">
          <Icon name="hourglass_top" className="animate-pulse text-[40px] text-primary" />
          <h2 className="text-headline-md text-on-primary-fixed">MAEL đang xác nhận thanh toán của bạn</h2>
          <p className="text-body-md text-on-surface-variant">
            Bạn đã báo chuyển khoản lúc {formatDateTime(payment.customerPaidAt)}. Gói sẽ được kích hoạt ngay khi MAEL đối chiếu xong,
            thường trong vài giờ (8h–22h). Trang này tự cập nhật, bạn có thể rời đi và quay lại sau.
          </p>
          <p className="text-body-sm text-outline">Cần hỗ trợ? Email <a className="font-bold text-primary" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> kèm mã <b>{code}</b></p>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
        <div className="order-2 flex flex-col space-y-space-md lg:order-1 lg:col-span-5">
          <div className="space-y-space-md rounded-3xl bg-surface-container-lowest p-space-lg shadow-md">
            <div className="flex items-center justify-between pb-space-xs">
              <span className="text-headline-sm font-extrabold text-on-surface">Quyền lợi của gói</span>
              <span className="rounded-full bg-primary-fixed px-space-sm py-1 text-label-sm font-bold text-on-primary-fixed">{payment.planName}</span>
            </div>
            {[
              { e: '🤖', t: '3 bạn AI học cùng 24/7', d: 'Thầy giảng bài & 2 bạn tranh luận siêu vui', c: 'bg-primary text-on-primary' },
              { e: '📸', t: 'Quét ảnh bài tập không giới hạn', d: 'Chụp ảnh có ngay lời giải từng bước', c: 'bg-secondary-container text-on-secondary-container' },
              { e: '🎯', t: 'Quiz theo điểm yếu', d: 'Ôn đúng phần còn yếu, tiến bộ rõ ràng', c: 'bg-tertiary-container text-on-tertiary' },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-space-md rounded-2xl bg-surface-container-low p-space-sm">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm ${f.c}`}>
                  <span className="text-3xl">{f.e}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-headline-sm font-bold leading-tight text-on-surface">{f.t}</span>
                  <span className="text-body-sm text-on-surface-variant">{f.d}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-space-sm rounded-2xl bg-surface-container p-space-md shadow-sm">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container-lowest">
              <Icon name="verified_user" className="text-[24px] text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-label-lg font-extrabold text-on-surface">Không tự động trừ tiền</span>
              <span className="text-body-sm text-on-surface-variant">Chỉ thanh toán khi bạn muốn gia hạn</span>
            </div>
          </div>
        </div>

        <div className="order-1 flex flex-col space-y-space-md lg:order-2 lg:col-span-7">
          <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest p-space-md shadow-lg md:p-space-lg">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-secondary-fixed/40 blur-3xl" />

            <div className="relative grid grid-cols-1 gap-space-lg md:grid-cols-2">
              {/* QR quỹ MoMo */}
              <div className="flex flex-col items-center gap-space-sm">
                <img src={qrImg} alt={`QR MoMo quỹ ${PAYMENT_QR.fundName} - ${PAYMENT_QR.owner}`}
                  className="w-full max-w-[300px] rounded-2xl border border-surface-container shadow-md" />
                <a href={qrImg} download="MAEL-QR-MoMo.jpg" className="btn-ghost text-label-md">
                  <Icon name="download" className="text-[18px]" /> Lưu ảnh QR (để quét từ thư viện ảnh)
                </a>
              </div>

              {/* Thông tin chuyển khoản */}
              <div className="flex flex-col gap-space-sm">
                <div className="rounded-2xl bg-surface-container-low p-space-md">
                  <span className="block text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Số tiền cần chuyển</span>
                  <div className="flex items-center justify-between gap-space-sm">
                    <span className="text-headline-lg font-black text-primary">{new Intl.NumberFormat('vi-VN').format(payment.amount)}đ</span>
                    <CopyBtn active={copied === 'amount'} onClick={() => copy(String(Math.round(Number(payment.amount))), 'amount')} />
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-dashed border-momo/50 bg-momo/5 p-space-md">
                  <span className="block text-label-sm font-bold uppercase tracking-wider text-momo">Nội dung chuyển khoản (bắt buộc)</span>
                  <div className="flex items-center justify-between gap-space-sm">
                    <span className="font-mono text-headline-md font-black tracking-wider text-on-surface">{code}</span>
                    <CopyBtn active={copied === 'code'} onClick={() => copy(code, 'code')} />
                  </div>
                  <span className="text-body-sm text-on-surface-variant">Ghi đúng mã này để MAEL biết là đơn của bạn.</span>
                </div>
                <div className="rounded-2xl bg-surface-container-low px-space-md py-space-sm text-body-sm">
                  <Row k="Người nhận" v={PAYMENT_QR.owner} />
                  <Row k="Ngân hàng" v={PAYMENT_QR.bank} />
                  <Row k="Số tài khoản" v={PAYMENT_QR.account} />
                </div>
              </div>
            </div>

            <ol className="relative mt-space-md grid grid-cols-1 gap-space-xs sm:grid-cols-3">
              {[
                'Mở MoMo hoặc app ngân hàng, quét QR',
                qrHasAmount ? `Số tiền đã điền sẵn, ghi nội dung ${code}` : `Nhập ${formatVND(payment.amount)} và nội dung ${code}`,
                'Chuyển xong bấm nút bên dưới',
              ].map((t, i) => (
                <li key={t} className="flex items-center gap-2 rounded-xl bg-surface-container-low p-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-black text-on-primary">{i + 1}</span>
                  <span className="text-label-md text-on-surface">{t}</span>
                </li>
              ))}
            </ol>

            <div className="relative mt-space-md flex flex-col space-y-space-xs">
              {waiting ? (
                <div className="flex w-full items-center justify-center gap-space-sm rounded-2xl bg-surface-container px-space-lg py-space-md text-headline-sm font-bold text-on-surface-variant">
                  <Icon name="hourglass_top" className="text-[24px]" /> Đã báo chuyển khoản, đang chờ xác nhận
                </div>
              ) : (
                <button type="button" onClick={markPaid} disabled={marking}
                  className="flex w-full items-center justify-center gap-space-sm rounded-2xl bg-momo px-space-lg py-space-md text-center text-headline-sm font-extrabold text-white shadow-tactile-momo transition-all hover:bg-[#8e0056] active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50">
                  <Icon name="task_alt" className="text-[24px]" /> {marking ? 'Đang gửi...' : 'Tôi đã chuyển khoản'}
                </button>
              )}
              <span className="text-center text-label-sm font-medium text-on-surface-variant">
                💡 Gói học được kích hoạt sau khi MAEL đối chiếu giao dịch trên MoMo. Chuyển sai số tiền hoặc thiếu nội dung có thể bị chậm xác nhận.
              </span>
              <ErrorBox message={error} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CopyBtn({ active, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1 rounded-lg bg-surface-container-lowest px-2 py-1 text-label-md text-primary shadow-sm hover:bg-surface-container">
      <Icon name={active ? 'check' : 'content_copy'} className="text-[16px]" /> {active ? 'Đã chép' : 'Sao chép'}
    </button>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-space-sm py-1">
      <span className="text-on-surface-variant">{k}</span>
      <span className="text-right font-bold text-on-surface">{v}</span>
    </div>
  )
}
