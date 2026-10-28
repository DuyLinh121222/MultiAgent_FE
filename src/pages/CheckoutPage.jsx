import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import { paymentApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatVND } from '../utils/format'
import momoImg from '../assets/momo.jpg'

const PAYMENT_WINDOW_SECONDS = 10 * 60

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
 * Trang thanh toán MoMo.
 * Hiện chưa tích hợp MoMo thật: payUrl = null, có nút "Giả lập thanh toán thành công" để test luồng.
 * Khi tích hợp: BE trả payUrl / qrCodeUrl, trang tự hỏi trạng thái mỗi 3 giây cho tới khi SUCCESS.
 */
export default function CheckoutPage() {
  const { paymentId } = useParams()
  const { refreshUser } = useAuth()
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_WINDOW_SECONDS)

  const load = useCallback(() => paymentApi.get(paymentId).then(setPayment).catch((e) => setError(getErrorMessage(e))), [paymentId])

  useEffect(() => { load() }, [load])

  // Hỏi trạng thái định kỳ khi đang chờ thanh toán
  useEffect(() => {
    if (payment?.status !== 'PENDING') return undefined
    const poll = setInterval(load, 3000)
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => { clearInterval(poll); clearInterval(tick) }
  }, [payment?.status, load])

  useEffect(() => {
    if (payment?.status === 'SUCCESS') refreshUser()
  }, [payment?.status, refreshUser])

  const mockConfirm = async () => {
    setConfirming(true)
    try {
      setPayment(await paymentApi.mockConfirm(paymentId))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setConfirming(false)
    }
  }

  if (!payment && !error) return <Loading />
  if (!payment) return <div className="page"><ErrorBox message={error} /></div>

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

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
            <Row k="Phương thức" v="Ví MoMo" />
            <Row k="Mã giao dịch" v={payment.id.slice(0, 8).toUpperCase()} />
          </div>
          <Link to="/study-room" className="btn-primary w-full py-space-md">
            <Icon name="forum" className="text-[20px]" /> Vào phòng học nhóm AI
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1360px] px-margin-mobile py-space-lg md:px-margin">
      <div className="mb-space-lg flex flex-col items-center space-y-space-xs text-center">
        <span className="chip bg-secondary-fixed font-bold uppercase tracking-wide text-on-secondary-fixed">
          <Icon name="bolt" className="text-[18px] text-secondary" /> {formatVND(payment.amount)} / {periodLabel(payment.durationDays)} • Chỉ {perDay(payment.amount, payment.durationDays)}/ngày
        </span>
        <h1 className="text-headline-lg tracking-tight text-primary md:text-display">Nâng cấp {payment.planName}</h1>
        <p className="max-w-xl text-body-md text-on-surface-variant">Mở khoá phòng học nhóm 3 AI, camera giải đề và quiz củng cố không giới hạn.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
        <div className="flex flex-col space-y-space-md lg:col-span-5">
          <div className="space-y-space-md rounded-3xl bg-surface-container-lowest p-space-lg shadow-md">
            <div className="flex items-center justify-between pb-space-xs">
              <span className="text-headline-sm font-extrabold text-on-surface">Quyền lợi của gói</span>
              <span className="rounded-full bg-primary-fixed px-space-sm py-1 text-label-sm font-bold text-on-primary-fixed">Gói tháng</span>
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

        <div className="flex flex-col space-y-space-md lg:col-span-7">
          <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest p-space-md shadow-lg md:p-space-lg">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-secondary-fixed/40 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-space-xs pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
                <span className="text-label-md font-bold text-on-surface">Đang chờ thanh toán</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-space-sm py-1">
                <Icon name="timer" className="text-[16px] text-on-surface-variant" />
                <span className="text-label-sm font-bold text-on-surface-variant">Hiệu lực: <span className="font-extrabold text-error">{mm}:{ss}</span></span>
              </div>
            </div>

            <div className="relative mb-space-md flex items-center justify-between rounded-2xl bg-surface-container-low p-space-md">
              <div>
                <span className="block text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Tổng tiền thanh toán</span>
                <span className="text-display font-black leading-tight text-primary">
                  {new Intl.NumberFormat('vi-VN').format(payment.amount)} <span className="text-headline-md font-bold text-on-surface-variant">VNĐ</span>
                </span>
              </div>
            </div>

            <div className="relative grid grid-cols-1 items-center gap-space-md md:grid-cols-12">
              <div className="flex flex-col items-center text-center md:col-span-5">
                <div className="aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl bg-surface-container-low shadow-md">
                  <img src={momoImg} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-low p-space-md md:col-span-7">
                <div className="flex flex-col items-center rounded-2xl bg-white p-space-sm shadow-sm">
                  {payment.qrCodeUrl ? (
                    <img src={payment.qrCodeUrl} alt="Mã QR MoMo" className="h-52 w-52" />
                  ) : (
                    <div className="flex h-52 w-52 flex-col items-center justify-center gap-space-xs rounded-xl border-2 border-dashed border-momo/40 text-center text-momo">
                      <Icon name="qr_code_2" className="text-[72px]" />
                      <span className="px-space-sm text-label-sm font-bold">Mã QR MoMo sẽ hiển thị ở đây khi tích hợp cổng thanh toán</span>
                    </div>
                  )}
                  <div className="mt-2 rounded-full bg-momo/10 px-3 py-1">
                    <span className="text-label-sm font-extrabold text-momo">MÃ ĐƠN: {payment.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
                <div className="mt-space-sm grid w-full grid-cols-2 gap-space-xs text-center">
                  <div className="flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-lowest p-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-black text-on-primary">1</span>
                    <span className="text-label-sm font-bold text-on-surface">Mở app MoMo</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-lowest p-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-black text-on-primary">2</span>
                    <span className="text-label-sm font-bold text-on-surface">Quét mã QR</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-space-md flex flex-col space-y-space-xs">
              <button type="button" disabled={!payment.payUrl} onClick={() => { window.location.href = payment.payUrl }}
                className="flex w-full items-center justify-center gap-space-sm rounded-2xl bg-momo px-space-lg py-space-md text-center text-headline-sm font-extrabold text-white shadow-tactile-momo transition-all hover:bg-[#8e0056] active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50">
                <Icon name="smartphone" className="text-[24px]" /> Mở ví MoMo để thanh toán
              </button>
              <span className="text-center text-label-sm font-medium text-on-surface-variant">
                💡 Gói học được kích hoạt tự động khi MoMo báo thanh toán thành công.
              </span>
              <ErrorBox message={error} />
            </div>
          </div>

          {/* Chỉ dùng khi dev, chưa tích hợp MoMo */}
          {!payment.payUrl && (
            <div className="flex flex-col items-center justify-between gap-space-sm rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-space-md sm:flex-row">
              <div className="flex flex-col">
                <span className="text-label-lg font-extrabold text-on-surface">Chế độ thử nghiệm</span>
                <span className="text-body-sm text-on-surface-variant">Chưa tích hợp MoMo. Bấm để giả lập MoMo báo thanh toán thành công.</span>
              </div>
              <button type="button" className="btn-secondary whitespace-nowrap" onClick={mockConfirm} disabled={confirming}>
                <Icon name="science" className="text-[18px] text-tertiary" /> {confirming ? 'Đang xử lý...' : 'Giả lập thanh toán thành công'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-on-surface-variant">{k}</span>
      <span className="font-bold text-on-surface">{v}</span>
    </div>
  )
}
