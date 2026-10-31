import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Pet from '../components/game/Pet'
import { Castle, Chest, Coin, Star, Stars } from '../components/game/GameArt'
import { planApi, publicApi } from '../api/services'
import { CONTACT } from '../constants/site'
import { formatDate } from '../utils/format'
import teacherImg from '../assets/avatar-teacher.jpg'
import kietImg from '../assets/avatar-kiet.jpg'
import anImg from '../assets/avatar-an.jpg'

/** Màu banner theo theme của bài viết */
export const POST_THEMES = {
  BLUE: { bg: 'from-[#2563eb] to-[#004ac6]', chip: 'bg-white/20 text-white', pet: 'cu-tri' },
  ORANGE: { bg: 'from-[#ff9f43] to-[#e8730c]', chip: 'bg-white/25 text-white', pet: 'cao-lua' },
  GREEN: { bg: 'from-[#1fae8c] to-[#0d7c63]', chip: 'bg-white/20 text-white', pet: 'rua-xanh' },
  PURPLE: { bg: 'from-[#8b6cf6] to-[#5b3fd0]', chip: 'bg-white/20 text-white', pet: 'rong-con' },
  PINK: { bg: 'from-[#ff6b9a] to-[#c2185b]', chip: 'bg-white/20 text-white', pet: 'ky-lan' },
}

const FEATURES = [
  { icon: 'map', title: 'Bản đồ ải', desc: 'Học như chơi game', color: 'from-[#e3f9d9] to-[#c9efb8] text-[#2e8b3a]' },
  { icon: 'diversity_3', title: '3 bạn AI', desc: 'Giảng, phản biện, mẹo hay', color: 'from-primary-fixed to-[#c7d4ff] text-primary' },
  { icon: 'sports_esports', title: 'Đấu trường', desc: 'Giải siêu tốc, combo', color: 'from-[#fff2d6] to-[#ffdca3] text-[#c75f00]' },
  { icon: 'photo_camera', title: 'Giải bằng ảnh', desc: 'Chụp đề là có lời giải', color: 'from-[#ffe1ef] to-[#ffc2dc] text-[#a50064]' },
  { icon: 'insights', title: 'AI phân tích', desc: 'Biết ngay chỗ yếu', color: 'from-[#e6e0ff] to-[#d6ccff] text-[#5b3fd0]' },
  { icon: 'verified', title: 'Giảng viên duyệt', desc: 'Đúng SGK, không sai', color: 'from-[#dcf5ef] to-[#b6e6d8] text-[#0d7c63]' },
]

const AGENTS = [
  { img: teacherImg, name: 'Thầy Minh Trí', role: 'Giảng từng bước', icon: 'school', chip: 'bg-primary-fixed text-on-primary-fixed' },
  { img: kietImg, name: 'Tuấn Kiệt', role: 'Hay phản biện', icon: 'manage_search', chip: 'bg-secondary-fixed text-on-secondary-fixed' },
  { img: anImg, name: 'Bảo An', role: 'Mẹo tính nhanh', icon: 'lightbulb', chip: 'bg-tertiary-fixed text-on-tertiary-fixed' },
]

/**
 * Trang chủ cho khách: banner tin tức, tính năng, 3 AI, bảng giá, liên hệ.
 */
export default function LandingPage() {
  const location = useLocation()
  const [posts, setPosts] = useState([])
  const [plans, setPlans] = useState([])
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    publicApi.blog().then(setPosts).catch(() => {})
    planApi.plans().then(setPlans).catch(() => {})
  }, [])

  // Link dạng /#lien-he: cuộn tới đúng mục
  useEffect(() => {
    if (!location.hash) return
    const t = setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 120)
    return () => clearTimeout(t)
  }, [location.hash, posts.length])

  const slides = [{ intro: true, id: 'intro' }, ...posts.slice(0, 4)]
  // Banner tự chuyển chậm (12 giây) để kịp đọc hết; rê chuột / chạm vào banner thì dừng lại
  const pausedRef = useRef(false)
  useEffect(() => {
    const t = setInterval(() => {
      if (!pausedRef.current && !document.hidden) setSlide((s) => (s + 1) % slides.length)
    }, 12000)
    return () => clearInterval(t)
  }, [slides.length, slide])

  const studentPlans = plans.filter((p) => p.audience === 'STUDENT' && !p.trial)
  const current = slides[slide % slides.length]

  return (
    <div className="flex w-full flex-col">
      {/* ================= Banner ================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#e8eeff] to-surface px-margin-mobile pb-space-xl pt-space-lg md:px-margin">
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative min-h-[420px] overflow-hidden rounded-[36px] shadow-[0_24px_60px_-28px_rgba(0,74,198,0.55)]"
            onMouseEnter={() => { pausedRef.current = true }} onMouseLeave={() => { pausedRef.current = false }}
            onTouchStart={() => { pausedRef.current = true }}>
            {current.intro ? <IntroSlide key="intro" /> : <PostSlide key={current.id} post={current} />}
            {slides.length > 1 && (
              <>
                <button type="button" aria-label="Banner trước" onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
                  className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-primary shadow md:flex">
                  <Icon name="chevron_left" className="text-[28px]" />
                </button>
                <button type="button" aria-label="Banner sau" onClick={() => setSlide((s) => (s + 1) % slides.length)}
                  className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-primary shadow md:flex">
                  <Icon name="chevron_right" className="text-[28px]" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {slides.map((s, i) => (
                    <button key={s.id} type="button" aria-label={`Banner ${i + 1}`} onClick={() => setSlide(i)}
                      className={`h-2.5 rounded-full transition-all ${i === slide % slides.length ? 'w-8 bg-white' : 'w-2.5 bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Số liệu nhanh */}
          <div className="mt-space-md grid grid-cols-2 gap-space-sm md:grid-cols-4">
            <Stat icon={<Icon name="flag" filled className="text-[26px] text-tertiary" />} value="17 ải" label="Toán 9 HK1" />
            <Stat icon={<Castle size={34} />} value="5 trùm" label="Cuối mỗi chương" />
            <Stat icon={<Pet code="tho-bong" size={36} />} value="10 thú" label="Để sưu tầm" />
            <Stat icon={<Icon name="smart_toy" filled className="text-[26px] text-primary" />} value="3 AI" label="Học cùng em" />
          </div>
        </div>
      </section>

      {/* ================= Tính năng ================= */}
      <section id="tinh-nang" className="mx-auto w-full max-w-7xl scroll-mt-20 px-margin-mobile py-space-xl md:px-margin">
        <SectionTitle kicker="Học ít chữ, chơi nhiều" title="Có gì trong MAEL.EDU?" />
        <div className="grid grid-cols-2 gap-space-md md:grid-cols-3 lg:grid-cols-6">
          {FEATURES.map((f) => (
            <div key={f.title} className={`group flex flex-col items-center gap-space-sm rounded-[28px] bg-gradient-to-b ${f.color} p-space-lg text-center shadow-sm transition-transform hover:-translate-y-1`}>
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 shadow-sm transition-transform group-hover:rotate-6">
                <Icon name={f.icon} filled className="text-[34px]" />
              </span>
              <div className="text-headline-sm font-extrabold text-on-surface">{f.title}</div>
              <div className="text-body-sm text-on-surface-variant">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 3 AI + cách học ================= */}
      <section className="w-full bg-surface-container-low py-space-xl">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-space-lg px-margin-mobile md:px-margin lg:grid-cols-2">
          <div>
            <SectionTitle kicker="Lớp học 3 AI" title="Một thầy, hai bạn, cùng em giải toán" left />
            <div className="grid grid-cols-3 gap-space-sm">
              {AGENTS.map((a) => (
                <div key={a.name} className="flex flex-col items-center gap-space-xs rounded-[24px] bg-surface-container-lowest p-space-md text-center shadow-sm">
                  <img src={a.img} alt={a.name} className="h-20 w-20 rounded-full object-cover ring-4 ring-primary-fixed" />
                  <div className="text-label-lg font-extrabold text-on-surface">{a.name}</div>
                  <span className={`chip px-2 py-0.5 text-[11px] ${a.chip}`}><Icon name={a.icon} className="text-[14px]" /> {a.role}</span>
                </div>
              ))}
            </div>
            <p className="mt-space-md rounded-2xl bg-surface-container-lowest p-space-md text-body-md text-on-surface-variant shadow-sm">
              <Icon name="tips_and_updates" filled className="mr-1 align-middle text-[20px] text-secondary" />
              Kiệt lúc đúng lúc sai, An nêu mẹo, em chỉ việc <b>bấm chọn</b> ai đúng ai sai. Không cần gõ nhiều chữ.
            </p>
          </div>
          <div>
            <SectionTitle kicker="Mỗi ải chỉ 10 phút" title="Học thế nào?" left />
            <div className="flex flex-col gap-space-sm">
              {[
                { n: 1, icon: 'menu_book', t: 'Xem lý thuyết ngắn', c: 'bg-primary text-white' },
                { n: 2, icon: 'forum', t: 'Bắt lỗi cùng 3 AI', c: 'bg-secondary-container text-on-secondary-container' },
                { n: 3, icon: 'bolt', t: 'Vượt 3 câu thử thách', c: 'bg-tertiary-container text-white' },
                { n: 4, icon: 'redeem', t: 'Nhận sao, xu, thú cưng', c: 'bg-[#8b6cf6] text-white' },
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-space-md rounded-2xl bg-surface-container-lowest p-space-sm shadow-sm">
                  <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-headline-sm font-black ${s.c}`}>{s.n}</span>
                  <Icon name={s.icon} className="text-[26px] text-primary" />
                  <span className="text-headline-sm text-on-surface">{s.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= Bảng giá ================= */}
      <section className="mx-auto w-full max-w-7xl px-margin-mobile py-space-xl md:px-margin">
        <SectionTitle kicker="Bảng giá" title="Dùng thử 7 ngày 0đ, sau đó chỉ từ 99.000đ" />
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-4">
          <PlanTile icon="redeem" title="Dùng thử" price="0đ" note="7 ngày, đủ tính năng" to="/login?mode=register" cta="Học thử ngay" highlight />
          {studentPlans.map((p) => (
            <PlanTile key={p.id} icon={p.featured ? 'workspace_premium' : 'calendar_month'} title={p.name}
              price={`${new Intl.NumberFormat('vi-VN').format(p.price)}đ`} note={`${p.durationDays} ngày`} to="/plans" cta="Xem chi tiết" />
          ))}
          <PlanTile icon="apartment" title="Trung tâm / Trường" price="Từ 29.000đ" note="mỗi học sinh / tháng" to="/plans?for=CENTER" cta="Nhận báo giá" />
        </div>
      </section>

      {/* ================= Tin tức ================= */}
      <section id="tin-tuc" className="mx-auto w-full max-w-7xl scroll-mt-20 px-margin-mobile pb-space-xl md:px-margin">
        <SectionTitle kicker="Tin tức & góc học tập" title="Bài viết mới" />
        {posts.length === 0 ? (
          <p className="text-center text-body-md text-on-surface-variant">Chưa có bài viết.</p>
        ) : (
          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((p) => {
              const th = POST_THEMES[p.theme] || POST_THEMES.BLUE
              return (
                <Link key={p.id} to={`/blog/${p.id}`} className="group flex flex-col overflow-hidden rounded-[24px] bg-surface-container-lowest shadow-sm transition-transform hover:-translate-y-1">
                  <div className={`relative flex h-32 items-end justify-between bg-gradient-to-br ${th.bg} p-space-md`}>
                    {p.coverUrl ? <img src={p.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : (
                      <Pet code={th.pet} size={84} className="absolute -bottom-2 right-2 transition-transform group-hover:scale-110" />
                    )}
                    {p.tag && <span className={`chip relative ${th.chip}`}>{p.tag}</span>}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-space-md">
                    <h3 className="line-clamp-2 text-headline-sm text-on-surface">{p.title}</h3>
                    <p className="line-clamp-2 text-body-sm text-on-surface-variant">{p.summary}</p>
                    <span className="mt-auto pt-space-xs text-label-sm text-outline">{formatDate(p.createdAt)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ================= Liên hệ ================= */}
      <section id="lien-he" className="w-full scroll-mt-20 bg-gradient-to-r from-primary to-primary-container py-space-xl text-on-primary">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-space-lg px-margin-mobile md:px-margin lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="text-label-md uppercase tracking-[0.2em] text-primary-fixed">Liên hệ</div>
            <h2 className="mt-1 text-headline-lg font-extrabold">Phụ huynh, trung tâm, nhà trường cần tư vấn?</h2>
            <p className="mt-space-sm text-body-lg text-primary-fixed">Gửi email cho MAEL.EDU, chúng mình phản hồi trong 1 ngày làm việc.</p>
          </div>
          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:col-span-7">
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-space-md rounded-[24px] bg-white p-space-lg text-on-surface shadow-lg transition-transform hover:-translate-y-1 sm:col-span-2">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary-fixed text-secondary">
                <Icon name="mail" filled className="text-[30px]" />
              </span>
              <div className="min-w-0">
                <div className="text-label-md text-on-surface-variant">Email</div>
                <div className="truncate text-headline-sm font-black text-primary">{CONTACT.email}</div>
              </div>
            </a>
            <Link to="/plans?for=CENTER" className="flex items-center justify-center gap-2 rounded-2xl bg-secondary-container px-space-lg py-space-md text-label-lg font-extrabold text-on-secondary-container shadow-[0_4px_0_0_#b86e00] sm:col-span-2">
              <Icon name="apartment" className="text-[22px]" /> Gửi yêu cầu tư vấn cho trung tâm / trường học
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function IntroSlide() {
  return (
    <div className="banner-slide absolute inset-0 grid grid-cols-1 items-center gap-space-md bg-gradient-to-br from-[#2563eb] via-[#1d4fd8] to-[#004ac6] p-space-lg pb-space-xl text-white sm:p-space-xl md:px-20 lg:grid-cols-2">
      <div className="relative z-10 flex flex-col items-start gap-space-md">
        <span className="chip bg-white/20 text-white"><Icon name="celebration" className="text-[16px]" /> Tặng 7 ngày học thử 0đ</span>
        <h1 className="text-[32px] font-black leading-[1.15] tracking-tight sm:text-[44px]">
          Học Toán THCS <span className="text-secondary-container">như chơi game</span>
        </h1>
        <p className="max-w-md text-body-lg text-primary-fixed">Đi ải, bắt lỗi bạn AI, hạ trùm cuối chương. Bám sát SGK, giảng viên duyệt.</p>
        <div className="flex flex-wrap gap-space-sm">
          <Link to="/login?mode=register" className="flex items-center gap-2 rounded-2xl bg-secondary-container px-space-lg py-space-md text-headline-sm font-extrabold text-on-secondary-container shadow-[0_5px_0_0_#b86e00] transition-all active:translate-y-[3px]">
            <Icon name="play_arrow" filled className="text-[26px]" /> Chơi thử miễn phí
          </Link>
          <Link to="/plans" className="flex items-center gap-2 rounded-2xl bg-white/15 px-space-lg py-space-md text-label-lg font-bold text-white hover:bg-white/25">
            <Icon name="sell" className="text-[20px]" /> Xem bảng giá
          </Link>
        </div>
      </div>
      <div className="relative hidden h-full min-h-[300px] lg:block">
        <MiniMap />
      </div>
    </div>
  )
}

/** Bản đồ ải thu nhỏ trên banner */
function MiniMap() {
  const nodes = [
    { x: 12, y: 78, s: 3 }, { x: 30, y: 52, s: 3 }, { x: 52, y: 66, s: 2 }, { x: 70, y: 38, current: true },
  ]
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M12 78 C20 60 24 56 30 52 C40 46 46 72 52 66 C60 58 62 44 70 38 C78 32 84 24 88 18" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d="M12 78 C20 60 24 56 30 52 C40 46 46 72 52 66 C60 58 62 44 70 38 C78 32 84 24 88 18" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {nodes.map((n, i) => (
        <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <div className={`node-3d ${n.current ? 'node-current node-pulse' : 'node-cleared'} flex h-14 w-14 items-center justify-center rounded-full text-[22px] font-black`}>{i + 1}</div>
          {!n.current && <Stars value={n.s} size={12} className="mt-1 justify-center" />}
          {n.current && <Pet code="meo-mun" size={60} bounce className="absolute -top-14 left-10" />}
        </div>
      ))}
      <div className="decor-float absolute" style={{ left: '82%', top: '6%' }}><Castle size={86} /></div>
      <div className="decor-float absolute" style={{ left: '6%', top: '8%', animationDelay: '1s' }}><Chest size={64} /></div>
      <span className="decor-spin absolute" style={{ left: '44%', top: '18%' }}><Coin size={34} /></span>
      <span className="decor-twinkle absolute" style={{ left: '60%', top: '84%' }}><Star size={26} /></span>
    </div>
  )
}

function PostSlide({ post }) {
  const th = POST_THEMES[post.theme] || POST_THEMES.BLUE
  return (
    <div className={`banner-slide absolute inset-0 grid grid-cols-1 items-center gap-space-md bg-gradient-to-br ${th.bg} p-space-lg pb-space-xl text-white sm:p-space-xl md:px-20 lg:grid-cols-2`}>
      {post.coverUrl && <img src={post.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
      <div className="relative z-10 flex flex-col items-start gap-space-md">
        {post.tag && <span className={`chip ${th.chip}`}><Icon name="campaign" className="text-[16px]" /> {post.tag}</span>}
        <h2 className="text-[28px] font-black leading-tight sm:text-[38px]">{post.title}</h2>
        {post.summary && <p className="max-w-lg text-body-lg text-white/90">{post.summary}</p>}
        <Link to={`/blog/${post.id}`} className="flex items-center gap-2 rounded-2xl bg-white px-space-lg py-space-md text-label-lg font-extrabold text-primary shadow-lg">
          Đọc tiếp <Icon name="arrow_forward" className="text-[20px]" />
        </Link>
      </div>
      <div className="relative hidden items-center justify-center lg:flex">
        <div className="absolute h-64 w-64 rounded-full bg-white/15" />
        <Pet code={th.pet} size={200} bounce className="relative" />
      </div>
    </div>
  )
}

function Stat({ icon, value, label }) {
  return (
    <div className="flex items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container-low">{icon}</span>
      <div>
        <div className="text-headline-sm font-black text-on-surface">{value}</div>
        <div className="text-label-sm text-on-surface-variant">{label}</div>
      </div>
    </div>
  )
}

function SectionTitle({ kicker, title, left = false }) {
  return (
    <div className={`mb-space-lg flex flex-col gap-1 ${left ? '' : 'items-center text-center'}`}>
      <span className="text-label-md uppercase tracking-[0.2em] text-primary">{kicker}</span>
      <h2 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{title}</h2>
    </div>
  )
}

function PlanTile({ icon, title, price, note, to, cta, highlight }) {
  return (
    <div className={`flex flex-col gap-space-sm rounded-[24px] p-space-lg shadow-sm ${highlight ? 'bg-gradient-to-b from-secondary-fixed to-[#ffe9cf]' : 'bg-surface-container-lowest'}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm"><Icon name={icon} filled className="text-[26px]" /></span>
      <div className="text-label-lg text-on-surface-variant">{title}</div>
      <div className="text-headline-lg font-black text-on-surface">{price}</div>
      <div className="text-body-sm text-on-surface-variant">{note}</div>
      <Link to={to} className={`mt-auto ${highlight ? 'btn-primary' : 'btn-secondary'} py-space-sm`}>{cta}</Link>
    </div>
  )
}
