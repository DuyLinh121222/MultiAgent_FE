import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import { paymentApi, planApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatVND } from '../utils/format'

const PERKS = [
  { title: 'Phòng học nhóm không giới hạn với 3 AI', desc: 'Thầy AI giảng từng bước, Bạn Soát Lỗi phản biện để tránh bẫy, Bạn Sáng Tạo gợi ý nhiều cách giải.' },
  { title: 'Giải bài tập từ ảnh chụp', desc: 'Chụp đề trong sách hoặc vở, nhận lời giải từng bước chứ không chỉ đáp án.' },
  { title: 'Bám sát chương trình GDPT 2018 (Lớp 6-9)', desc: 'Bài giảng và câu hỏi được giảng viên chuyên môn duyệt trước khi đến tay học sinh.' },
  { title: 'Quiz củng cố theo điểm yếu', desc: 'Hệ thống tính mức nắm vững từng chủ đề và gợi ý phần cần ôn.' },
]

const COMPARE = [
  ['Chi phí', '0đ', '99.000đ / tháng'],
  ['Thời hạn', '7 ngày', '30 ngày, gia hạn khi bạn muốn'],
  ['Phòng học 3 AI', 'Đầy đủ', 'Không giới hạn'],
  ['Giải toán từ ảnh', 'Đầy đủ', 'Không giới hạn'],
  ['Quiz điểm yếu', 'Có', 'Có'],
]

const FAQ = [
  { q: 'Hết 7 ngày dùng thử có tự động trừ tiền không?', a: 'Không. MAEL không lưu thẻ hay tự trừ tiền. Hết hạn dùng thử, bạn chỉ cần thanh toán gói tháng nếu muốn học tiếp.' },
  { q: 'Thanh toán bằng cách nào?', a: 'Hiện hỗ trợ ví MoMo (quét mã QR hoặc mở app MoMo). Gói được kích hoạt ngay khi MoMo báo thanh toán thành công.' },
  { q: 'Đang còn hạn mà mua thêm thì sao?', a: 'Thời gian gói mới được cộng nối tiếp sau ngày hết hạn hiện tại, không bị mất ngày nào.' },
  { q: 'MAEL dùng được trên điện thoại không?', a: 'Có. Bạn có thể chụp ảnh bài tập bằng điện thoại và học trên máy tính hoặc máy tính bảng.' },
]

export default function PricingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState(null)
  const [error, setError] = useState('')
  const [buying, setBuying] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    planApi.plans().then(setPlans).catch((e) => setError(getErrorMessage(e)))
  }, [])

  const buy = async (planId) => {
    setBuying(true)
    setError('')
    try {
      const payment = await paymentApi.create(planId)
      navigate(`/checkout/${payment.id}`)
    } catch (e) {
      setError(getErrorMessage(e))
      setBuying(false)
    }
  }

  if (!plans && !error) return <Loading />
  const sub = user?.subscription
  const monthly = plans?.find((p) => !p.trial)
  const trialDay = sub?.trial ? Math.min(7, Math.max(1, 7 - sub.daysLeft + 1)) : 0

  return (
    <div className="flex w-full flex-col">
      {/* Hero */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-low to-surface px-margin-mobile py-space-xl md:px-margin">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-fixed/50 blur-3xl" />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-space-md text-center">
          <span className="chip bg-tertiary-fixed text-on-tertiary-fixed">
            <Icon name="verified_user" filled className="text-[18px]" /> Minh bạch • Không tự trừ tiền • Kích hoạt ngay
          </span>
          <h1 className="max-w-4xl text-headline-lg-mobile tracking-tight text-on-surface md:text-display">
            Trải nghiệm trọn vẹn <span className="text-primary underline decoration-secondary-container decoration-4 underline-offset-8">7 ngày dùng thử 0 đồng</span>
          </h1>
          <p className="max-w-2xl text-body-lg text-on-surface-variant">
            Đồng hành cùng 3 trí tuệ nhân tạo (Thầy giáo chuẩn mực, Bạn Soát Lỗi phản biện & Bạn Sáng Tạo) giúp học sinh cấp 2 tự tin làm chủ môn Toán.
          </p>

          <div className="mt-space-md flex w-full max-w-2xl flex-col items-center justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm sm:flex-row">
            <div className="flex items-center gap-space-md text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                <Icon name="hourglass_top" className="text-[26px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-label-lg font-bold text-primary">Tài khoản: {user?.fullName} (Lớp {user?.gradeLevel})</span>
                <span className="text-body-sm text-on-surface-variant">
                  {!sub && 'Gói học đã hết hạn. Kích hoạt gói tháng để học tiếp nhé!'}
                  {sub?.trial && <>Bạn đang ở ngày <b>{trialDay}/7 dùng thử</b> (còn {sub.daysLeft} ngày)</>}
                  {sub && !sub.trial && <>Đang dùng <b>{sub.planName}</b> đến {formatDate(sub.endDate)}</>}
                </span>
              </div>
            </div>
            {sub?.trial && (
              <div className="flex items-center gap-space-xs rounded-xl bg-surface-container px-space-sm py-space-xs">
                <div className="flex gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span key={i} className={`h-6 w-2.5 rounded-full ${i < trialDay ? 'bg-primary' : 'bg-surface-container-highest'}`} />
                  ))}
                </div>
                <span className="ml-space-xs text-label-sm font-bold text-on-surface">Ngày {trialDay}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-margin-mobile py-space-xl md:px-margin">
        <ErrorBox message={error} />
        {monthly && (
          <div className="relative mt-space-md w-full max-w-3xl overflow-hidden rounded-3xl bg-surface-container-lowest p-space-lg shadow-xl sm:p-space-xl">
            <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-2xl bg-secondary-container px-space-md py-space-xs text-label-sm font-bold text-on-secondary-container">
              <Icon name="local_fire_department" className="text-[16px]" /> GÓI HỌC TOÁN THCS
            </div>
            <span className="text-label-sm uppercase tracking-wider text-primary">Đăng ký một lần - mở khóa toàn diện</span>
            <h2 className="mt-1 text-headline-md text-on-surface md:text-headline-lg">{monthly.name} - MAEL Full Access</h2>

            <div className="mt-space-md flex flex-col justify-between gap-space-sm rounded-2xl bg-surface-container-low p-space-md sm:flex-row sm:items-center">
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="text-display font-black text-primary">{new Intl.NumberFormat('vi-VN').format(monthly.price)}</span>
                  <span className="text-headline-sm text-on-surface">VNĐ</span>
                  <span className="text-body-md text-on-surface-variant">/ {monthly.durationDays} ngày</span>
                </div>
                <div className="mt-1 flex items-center gap-space-xs text-label-md text-tertiary">
                  <Icon name="coffee" className="text-[16px]" /> Chỉ khoảng 3.300đ/ngày cho gia sư AI 24/7
                </div>
              </div>
            </div>

            <div className="mt-space-lg">
              <span className="text-label-lg font-bold text-on-surface">Đặc quyền học tập:</span>
              <div className="mt-space-md space-y-space-sm">
                {PERKS.map((p) => (
                  <div key={p.title} className="flex items-start gap-space-md rounded-xl p-space-sm hover:bg-surface-container-low">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-tertiary-container/15">
                      <Icon name="check_circle" className="text-[20px] text-tertiary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-label-lg font-bold text-on-surface">{p.title}</span>
                      <span className="text-body-md text-on-surface-variant">{p.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-space-xl flex flex-col items-center gap-space-sm">
              <button type="button" onClick={() => buy(monthly.id)} disabled={buying}
                className="flex w-full items-center justify-center gap-space-sm rounded-2xl bg-momo px-space-xl py-space-md text-headline-sm font-extrabold text-white shadow-tactile-momo transition-all hover:bg-[#8e0056] active:translate-y-[2px] disabled:opacity-60 sm:py-space-lg">
                <Icon name="account_balance_wallet" className="text-[24px]" />
                {buying ? 'Đang tạo đơn...' : `Thanh toán MoMo ${formatVND(monthly.price)}`}
              </button>
              <span className="text-center text-label-md text-on-surface-variant">
                {sub?.trial ? 'Bạn vẫn đang dùng thử miễn phí. Mua bây giờ thì thời gian gói tháng được cộng nối tiếp sau ngày dùng thử.' : 'Kích hoạt ngay sau khi thanh toán thành công.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* So sánh */}
      <div className="w-full bg-surface-container-low px-margin-mobile py-space-xl md:px-margin">
        <div className="mx-auto flex max-w-4xl flex-col items-center">
          <span className="text-label-md font-bold uppercase text-primary">So sánh minh bạch</span>
          <h3 className="mb-space-lg mt-1 text-headline-lg-mobile text-on-surface md:text-headline-lg">Dùng thử và Gói tháng</h3>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[520px] overflow-hidden rounded-3xl bg-surface-container-lowest p-space-sm shadow-sm">
              <div className="grid grid-cols-3 gap-space-sm rounded-2xl bg-surface-container-low p-space-md text-label-lg font-bold">
                <div>Tiêu chí</div>
                <div className="text-center text-on-surface-variant">Dùng thử (7 ngày)</div>
                <div className="rounded-xl bg-primary py-space-xs text-center text-on-primary">Gói MAEL (99k/tháng)</div>
              </div>
              {COMPARE.map(([k, a, b]) => (
                <div key={k} className="grid grid-cols-3 items-center gap-space-sm border-b border-surface-container-low p-space-md text-body-md last:border-0">
                  <div className="font-bold text-on-surface">{k}</div>
                  <div className="text-center text-on-surface-variant">{a}</div>
                  <div className="text-center font-semibold text-primary">{b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Phương thức thanh toán */}
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-margin-mobile py-space-xl md:px-margin">
        <span className="text-label-md font-bold uppercase text-secondary">Hỗ trợ thanh toán</span>
        <h3 className="mb-space-lg mt-1 text-headline-lg-mobile text-on-surface md:text-headline-lg">Phương thức thanh toán</h3>
        <div className="grid w-full grid-cols-2 gap-space-md sm:grid-cols-4">
          {[
            { icon: 'account_balance_wallet', name: 'Ví MoMo', desc: 'Xác nhận tức thì', color: 'text-momo bg-momo/10', soon: false },
            { icon: 'qr_code_2', name: 'VietQR', desc: 'Sắp hỗ trợ', color: 'text-[#0068FF] bg-[#0068FF]/10', soon: true },
            { icon: 'credit_card', name: 'Thẻ ATM nội địa', desc: 'Sắp hỗ trợ', color: 'text-tertiary bg-tertiary/10', soon: true },
            { icon: 'phone_iphone', name: 'ZaloPay', desc: 'Sắp hỗ trợ', color: 'text-secondary bg-secondary-container/20', soon: true },
          ].map((m) => (
            <div key={m.name} className={`flex flex-col items-center rounded-2xl bg-surface-container-lowest p-space-md text-center shadow-sm ${m.soon ? 'opacity-60' : ''}`}>
              <div className={`mb-space-sm flex h-14 w-14 items-center justify-center rounded-2xl ${m.color}`}>
                <Icon name={m.icon} className="text-[32px]" />
              </div>
              <span className="text-label-lg font-bold text-on-surface">{m.name}</span>
              <span className="mt-0.5 text-body-sm text-on-surface-variant">{m.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="w-full bg-surface-container-low px-margin-mobile py-space-xl md:px-margin">
        <div className="mx-auto flex max-w-4xl flex-col">
          <h3 className="mb-space-lg text-center text-headline-lg-mobile text-on-surface md:text-headline-lg">Câu hỏi thường gặp</h3>
          <div className="space-y-space-md">
            {FAQ.map((f, i) => (
              <button key={f.q} type="button" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full rounded-2xl bg-surface-container-lowest p-space-md text-left shadow-sm sm:p-space-lg">
                <div className="flex items-center justify-between gap-space-md">
                  <h4 className="flex items-center gap-space-sm text-headline-sm text-on-surface">
                    <Icon name="help" className="text-[22px] text-primary" /> {f.q}
                  </h4>
                  <Icon name="expand_more" className={`text-on-surface-variant transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </div>
                {openFaq === i && <p className="mt-space-sm text-body-md text-on-surface-variant">{f.a}</p>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
