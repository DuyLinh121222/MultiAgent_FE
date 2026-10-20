import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import Pet from '../components/game/Pet'
import { Chest } from '../components/game/GameArt'
import { leadApi, paymentApi, planApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatVND } from '../utils/format'

const TABS = [
  { key: 'STUDENT', label: 'Học sinh & Phụ huynh', icon: 'family_restroom' },
  { key: 'CENTER', label: 'Trung tâm', icon: 'school' },
  { key: 'SCHOOL', label: 'Trường học', icon: 'account_balance' },
]

const FAQ = {
  STUDENT: [
    { q: 'Hết 7 ngày dùng thử có tự động trừ tiền không?', a: 'Không. MAEL không lưu thẻ hay tự trừ tiền. Hết hạn dùng thử, bạn chỉ cần thanh toán nếu muốn học tiếp.' },
    { q: 'Thanh toán bằng cách nào?', a: 'Hiện hỗ trợ ví MoMo (quét mã QR hoặc mở app MoMo). Gói được kích hoạt ngay khi MoMo báo thanh toán thành công.' },
    { q: 'Đang còn hạn mà mua thêm thì sao?', a: 'Thời gian gói mới được cộng nối tiếp sau ngày hết hạn hiện tại, không mất ngày nào.' },
    { q: 'Xu, sao và thú cưng có mất khi hết hạn gói không?', a: 'Không. Mọi phần thưởng đã nhận được giữ nguyên, gia hạn là chơi tiếp.' },
  ],
  CENTER: [
    { q: 'Trung tâm cần tối thiểu bao nhiêu học sinh?', a: 'Từ 30 tài khoản học sinh. Trung tâm nhỏ hơn có thể liên hệ để được tư vấn gói phù hợp.' },
    { q: 'Giáo viên trung tâm theo dõi học sinh thế nào?', a: 'Bảng điều khiển giáo viên cho thấy ải đã qua, số sao, điểm yếu từng chủ đề của từng học sinh và cả lớp.' },
    { q: 'Có dùng thử cho trung tâm không?', a: 'Có. MAEL hỗ trợ 1 lớp dùng thử 14 ngày sau buổi demo.' },
  ],
  SCHOOL: [
    { q: 'Triển khai cho cả trường mất bao lâu?', a: 'Khoảng 1 tuần: tạo tài khoản theo danh sách lớp, tập huấn giáo viên bộ môn và chạy thử 1 khối.' },
    { q: 'Nội dung có bám chương trình không?', a: 'Có. Bài giảng và câu hỏi bám SGK theo GDPT 2018, được giảng viên chuyên môn duyệt trước khi đến tay học sinh.' },
    { q: 'Có xuất hoá đơn VAT không?', a: 'Có. Gói Trường học thanh toán theo năm học và xuất hoá đơn VAT.' },
  ],
}

/**
 * Bảng giá 3 nhóm: học sinh (mua MoMo), trung tâm và trường học (giá theo học sinh / tháng, gửi yêu cầu tư vấn).
 * Dùng chung cho /pricing (đã đăng nhập) và /plans (công khai).
 */
export default function PricingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [plans, setPlans] = useState(null)
  const [error, setError] = useState('')
  const [buying, setBuying] = useState('')
  const [openFaq, setOpenFaq] = useState(0)
  const tab = TABS.some((t) => t.key === params.get('for')) ? params.get('for') : 'STUDENT'

  useEffect(() => {
    planApi.plans().then(setPlans).catch((e) => setError(getErrorMessage(e)))
  }, [])

  const setTab = (key) => {
    setParams(key === 'STUDENT' ? {} : { for: key }, { replace: true })
    setOpenFaq(0)
  }

  const buy = async (planId) => {
    if (!user) return navigate('/login')
    if (user.role !== 'STUDENT') return setError('Chỉ tài khoản học sinh mới mua được gói học.')
    setBuying(planId)
    setError('')
    try {
      const payment = await paymentApi.create(planId)
      navigate(`/checkout/${payment.id}`)
    } catch (e) {
      setError(getErrorMessage(e))
      setBuying('')
    }
  }

  if (!plans && !error) return <Loading />
  const list = (plans || []).filter((p) => p.audience === tab)
  const sub = user?.subscription

  return (
    <div className="flex w-full flex-col">
      {/* Hero */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-low to-surface px-margin-mobile pb-space-lg pt-space-xl md:px-margin">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-fixed/50 blur-3xl" />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-space-md text-center">
          <div className="flex items-end gap-1">
            <Pet code="cu-tri" size={64} />
            <Pet code="meo-mun" size={76} bounce />
            <Pet code="cao-lua" size={64} />
          </div>
          <h1 className="max-w-4xl text-headline-lg-mobile tracking-tight text-on-surface md:text-display">
            Chọn gói phù hợp để <span className="text-primary underline decoration-secondary-container decoration-4 underline-offset-8">đi ải Toán</span> cùng 3 AI
          </h1>
          <p className="max-w-2xl text-body-lg text-on-surface-variant">
            Bản đồ ải bám SGK, Thầy AI giảng từng bước, bạn AI phản biện để học sinh tự bắt lỗi. Dùng cho từng em, cả trung tâm hoặc cả trường.
          </p>
          {user?.role === 'STUDENT' && tab === 'STUDENT' && (
            <span className="chip bg-surface-container-lowest text-on-surface shadow-sm">
              <Icon name="hourglass_top" className="text-[18px] text-primary" />
              {!sub && 'Gói học đã hết hạn, kích hoạt để chơi tiếp nhé!'}
              {sub?.trial && <>Đang dùng thử, còn <b>{sub.daysLeft} ngày</b></>}
              {sub && !sub.trial && <>Đang dùng <b>{sub.planName}</b> đến {formatDate(sub.endDate)}</>}
            </span>
          )}

          {/* Chọn nhóm khách hàng */}
          <div className="mt-space-sm grid w-full max-w-2xl grid-cols-3 rounded-2xl bg-surface-container p-1.5">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2.5 text-label-md font-extrabold transition-all sm:flex-row sm:gap-2 sm:text-label-lg ${
                  tab === t.key ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}>
                <Icon name={t.icon} className="text-[20px]" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-space-lg px-margin-mobile py-space-lg md:px-margin">
        <ErrorBox message={error} />

        {tab === 'STUDENT' ? (
          <div className="grid grid-cols-1 items-stretch gap-space-md md:grid-cols-3">
            {list.map((p) => (
              <StudentPlanCard key={p.id} plan={p} onBuy={() => buy(p.id)} buying={buying === p.id} current={sub?.planId === p.id} />
            ))}
          </div>
        ) : (
          <OrgSection plans={list} orgType={tab} />
        )}

        {/* FAQ */}
        <div className="mx-auto mt-space-md flex w-full max-w-4xl flex-col">
          <h3 className="mb-space-md text-center text-headline-md text-on-surface">Câu hỏi thường gặp</h3>
          <div className="space-y-space-sm">
            {FAQ[tab].map((f, i) => (
              <button key={f.q} type="button" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full rounded-2xl bg-surface-container-lowest p-space-md text-left shadow-sm">
                <div className="flex items-center justify-between gap-space-md">
                  <h4 className="flex items-center gap-space-sm text-label-lg text-on-surface">
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

function StudentPlanCard({ plan, onBuy, buying, current }) {
  const perDay = Math.round(plan.price / plan.durationDays / 100) * 100
  return (
    <div className={`relative flex flex-col rounded-[28px] p-space-lg shadow-sm ${
      plan.featured ? 'bg-gradient-to-b from-primary to-primary-container text-on-primary shadow-[0_18px_40px_-18px_rgba(0,74,198,0.7)] md:-translate-y-2' : 'bg-surface-container-lowest'
    }`}>
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-secondary-container px-space-md py-1 text-label-sm font-extrabold text-on-secondary-container shadow">
          🔥 Tiết kiệm nhất
        </span>
      )}
      <div className={`text-label-md uppercase tracking-wider ${plan.featured ? 'text-primary-fixed' : 'text-primary'}`}>{plan.durationDays} ngày</div>
      <h2 className="mt-1 text-headline-md font-extrabold">{plan.name}</h2>
      <div className="mt-space-sm flex items-baseline gap-1">
        <span className="text-display font-black">{plan.trial ? '0đ' : new Intl.NumberFormat('vi-VN').format(plan.price)}</span>
        {!plan.trial && <span className="text-body-md opacity-80">VNĐ</span>}
      </div>
      <div className={`text-body-sm ${plan.featured ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
        {plan.trial ? 'Tự động kích hoạt khi đăng ký' : `≈ ${new Intl.NumberFormat('vi-VN').format(perDay)}đ mỗi ngày`}
      </div>
      <p className={`mt-space-sm text-body-md ${plan.featured ? 'text-on-primary/90' : 'text-on-surface-variant'}`}>{plan.description}</p>
      <ul className="mt-space-md flex flex-1 flex-col gap-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-body-md">
            <Icon name="check_circle" filled className={`mt-0.5 text-[18px] ${plan.featured ? 'text-tertiary-fixed' : 'text-tertiary'}`} /> {f}
          </li>
        ))}
      </ul>
      <div className="mt-space-lg">
        {plan.trial ? (
          <div className={`rounded-2xl py-space-sm text-center text-label-lg ${plan.featured ? 'bg-white/15' : 'bg-surface-container'}`}>Tặng khi tạo tài khoản</div>
        ) : (
          <button type="button" onClick={onBuy} disabled={buying}
            className="flex w-full items-center justify-center gap-space-sm rounded-2xl bg-momo px-space-lg py-space-md text-label-lg font-extrabold text-white shadow-tactile-momo transition-all hover:bg-[#8e0056] active:translate-y-[2px] disabled:opacity-60">
            <Icon name="account_balance_wallet" className="text-[22px]" />
            {buying ? 'Đang tạo đơn...' : `${current ? 'Gia hạn' : 'Mua'} qua MoMo ${formatVND(plan.price)}`}
          </button>
        )}
      </div>
    </div>
  )
}

function OrgSection({ plans, orgType }) {
  const plan = plans[0]
  const [seats, setSeats] = useState(plan?.minSeats || 30)
  const [form, setForm] = useState({ orgName: '', contactName: '', phone: '', email: '', note: '' })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setSeats(plan?.minSeats || 30); setDone(false) }, [plan])

  const monthly = useMemo(() => (plan ? plan.price * Math.max(seats || 0, 0) : 0), [plan, seats])
  if (!plan) return <p className="text-center text-body-md text-on-surface-variant">Gói đang được cập nhật.</p>
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isSchool = orgType === 'SCHOOL'

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await leadApi.create({ ...form, orgType, studentCount: Number(seats) || null, planId: plan.id, email: form.email || null })
      setDone(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
      {/* Thông tin gói */}
      <div className="flex flex-col rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm lg:col-span-7 sm:p-space-xl">
        <div className="flex items-center gap-space-md">
          <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isSchool ? 'bg-tertiary-fixed text-tertiary' : 'bg-secondary-fixed text-secondary'}`}>
            <Icon name={isSchool ? 'account_balance' : 'school'} className="text-[30px]" filled />
          </span>
          <div>
            <h2 className="text-headline-md font-extrabold text-on-surface">{plan.name}</h2>
            <p className="text-body-md text-on-surface-variant">{plan.description}</p>
          </div>
        </div>

        <div className="mt-space-lg flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-display font-black text-primary">{new Intl.NumberFormat('vi-VN').format(plan.price)}đ</span>
          <span className="text-body-lg text-on-surface-variant">/ học sinh / tháng</span>
        </div>
        <div className="text-label-md text-on-surface-variant">
          Tối thiểu {plan.minSeats} học sinh • {isSchool ? 'Thanh toán theo năm học (9 tháng)' : 'Thanh toán theo tháng hoặc khoá học'}
        </div>

        <ul className="mt-space-lg grid grid-cols-1 gap-2 sm:grid-cols-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 rounded-xl bg-surface-container-low p-space-sm text-body-md text-on-surface">
              <Icon name="check_circle" filled className="mt-0.5 text-[18px] text-tertiary" /> {f}
            </li>
          ))}
        </ul>

        {/* Ước tính chi phí */}
        <div className="mt-space-lg rounded-2xl bg-gradient-to-r from-primary-fixed to-surface-container-low p-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <label className="flex items-center gap-2 text-label-lg text-on-surface">
              <Icon name="calculate" className="text-[22px] text-primary" /> Số học sinh
              <input type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)}
                className="h-11 w-24 rounded-xl bg-white px-3 text-center text-headline-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <div className="text-right">
              <div className="text-label-sm text-on-surface-variant">Ước tính mỗi tháng</div>
              <div className="text-headline-md font-extrabold text-primary">{formatVND(monthly)}</div>
            </div>
          </div>
          {Number(seats) < plan.minSeats && (
            <div className="mt-1 text-body-sm text-secondary">Dưới {plan.minSeats} học sinh: để lại thông tin, MAEL tư vấn gói nhỏ hơn.</div>
          )}
        </div>
      </div>

      {/* Form nhận tư vấn */}
      <div className="rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm lg:col-span-5">
        {done ? (
          <div className="pop-in flex h-full flex-col items-center justify-center gap-space-sm py-space-xl text-center">
            <Chest size={110} open />
            <h3 className="text-headline-md text-on-surface">Đã nhận thông tin!</h3>
            <p className="text-body-md text-on-surface-variant">MAEL sẽ gọi lại trong 1 ngày làm việc để hẹn buổi demo cho {form.orgName}.</p>
          </div>
        ) : (
          <form className="flex flex-col gap-space-sm" onSubmit={submit}>
            <h3 className="text-headline-sm text-on-surface">Nhận báo giá & demo miễn phí</h3>
            <p className="text-body-sm text-on-surface-variant">Để lại thông tin, chuyên viên MAEL sẽ liên hệ.</p>
            <input className="input h-12" placeholder={isSchool ? 'Tên trường *' : 'Tên trung tâm *'} value={form.orgName} onChange={set('orgName')} required />
            <input className="input h-12" placeholder="Người liên hệ *" value={form.contactName} onChange={set('contactName')} required />
            <input className="input h-12" placeholder="Số điện thoại *" value={form.phone} onChange={set('phone')} required inputMode="tel" />
            <input className="input h-12" placeholder="Email" type="email" value={form.email} onChange={set('email')} />
            <textarea className="input h-24 py-3" placeholder="Ghi chú (khối lớp, thời gian muốn triển khai...)" value={form.note} onChange={set('note')} />
            <ErrorBox message={error} />
            <button type="submit" disabled={sending} className="btn-primary py-space-md text-label-lg">
              <Icon name="send" className="text-[20px]" /> {sending ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
