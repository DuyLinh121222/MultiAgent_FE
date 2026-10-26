import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import Pet from '../components/game/Pet'
import { Castle, Chest, Coin, Decor, Star, Stars, chapterTheme } from '../components/game/GameArt'
import { gameApi, insightApi } from '../api/services'
import { EnergyBar, formatCountdown } from '../components/game/EnergyModal'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
// Lệch ngang của các ải theo đường zigzag (% so với tâm)
const ZIGZAG = [0, 18, 24, 8, -14, -22, -10]
const STEP_Y = 156
const TOP_Y = 100

/**
 * Trang chủ = Bản đồ ải. Chỉ 1 nút chính "Chơi ải tiếp theo", còn lại là bản đồ để học sinh tự khám phá.
 */
export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { patchUser } = useAuth()
  const [map, setMap] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const currentRef = useRef(null)
  const welcome = location.state?.welcome

  const load = useCallback(async () => {
    setError('')
    try {
      const m = await gameApi.map()
      setMap(m)
      patchUser({ coins: m.profile.coins, xp: m.profile.xp, activePetCode: m.profile.activePetCode, energy: m.profile.energy, streakDays: m.profile.streakDays })
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }, [patchUser])

  useEffect(() => { load() }, [load])

  // Cuộn tới ải đang chơi
  useEffect(() => {
    if (map && currentRef.current) {
      setTimeout(() => currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
    }
  }, [map])

  const openStage = (type, id, status) => {
    if (status === 'LOCKED') {
      setToast('Ải này còn khoá. Qua ải phía trước để mở nhé!')
      setTimeout(() => setToast(''), 2500)
      return
    }
    navigate(type === 'BOSS' ? `/boss/${id}` : `/stage/${id}`)
  }

  if (!map && !error) return <Loading text="Đang mở bản đồ ải..." />
  if (!map) return <div className="page"><ErrorBox message={error} onRetry={load} /></div>

  const p = map.profile
  const nextPath = map.nextStageType === 'BOSS' ? `/boss/${map.nextStageId}` : `/stage/${map.nextStageId}`
  const progress = map.totalStages ? Math.round((map.clearedStages * 100) / map.totalStages) : 0

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-space-lg px-margin-mobile py-space-lg md:px-margin">
      {/* Hồ sơ người chơi */}
      <section className="flex flex-col gap-space-md rounded-[28px] bg-surface-container-lowest p-space-md shadow-sm sm:flex-row sm:items-center sm:p-space-lg">
        <div className="flex flex-1 items-center gap-space-md">
          <Link to="/pets" className="relative flex-shrink-0 rounded-3xl bg-gradient-to-b from-primary-fixed to-surface-container-low p-1" title="Đổi bạn đồng hành">
            <Pet code={p.activePetCode} size={76} />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-2 py-0.5 text-label-sm text-on-primary shadow">Cấp {p.level}</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-label-sm uppercase tracking-wider text-on-surface-variant">{map.pathName} • Học kỳ 1</div>
            <h1 className="truncate text-headline-md text-on-surface">Chào {p.fullName}!</h1>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-container">
                <div className="h-full rounded-full bg-gradient-to-r from-[#7ee0c3] to-tertiary-container transition-all" style={{ width: `${(p.xpInLevel * 100) / p.xpPerLevel}%` }} />
              </div>
              <span className="whitespace-nowrap text-label-sm text-on-surface-variant">{p.xpInLevel}/{p.xpPerLevel} XP</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-space-sm">
          <StatPill icon={<Icon name="local_fire_department" filled className={`text-[22px] ${p.streakDays ? 'text-[#ea580c]' : 'text-outline'}`} />} value={p.streakDays} label="ngày" />
          <StatPill icon={<Coin size={22} />} value={p.coins} label="xu" />
          <StatPill icon={<Star size={22} />} value={p.totalStars} label="sao" />
          <StatPill icon={<Icon name="flag" filled className="text-[22px] text-tertiary" />} value={`${progress}%`} label="bản đồ" />
        </div>
      </section>

      {/* Thể lực + chuỗi ngày */}
      <section className="flex flex-wrap items-center gap-space-md rounded-[24px] bg-surface-container-lowest px-space-lg py-space-sm shadow-sm">
        <div className="flex items-center gap-2">
          <EnergyBar energy={p.energy} max={p.maxEnergy} size={24} />
          <span className="text-label-md text-on-surface-variant">
            {p.energy >= p.maxEnergy ? 'Thể lực đầy' : `+1 sau ${formatCountdown(p.nextEnergyInSeconds)}`}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-label-md">
          {p.streakAtRisk && <span className="chip energy-pulse bg-[#ffe3cc] text-[#c2410c]"><Icon name="local_fire_department" filled className="text-[16px]" /> Học hôm nay để giữ chuỗi!</span>}
          {p.playedToday && <span className="chip bg-tertiary-fixed text-on-tertiary-fixed"><Icon name="check_circle" filled className="text-[16px]" /> Hôm nay đã học</span>}
          <span className="chip bg-primary-fixed text-on-primary-fixed" title="Khiên giữ chuỗi"><Icon name="shield" filled className="text-[16px]" /> {p.streakShields}</span>
        </div>
      </section>

      {/* Nút chính duy nhất */}
      {map.nextStageId ? (
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-primary to-primary-container p-space-lg text-on-primary shadow-[0_10px_30px_-10px_rgba(0,74,198,0.6)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative flex flex-col items-start justify-between gap-space-md sm:flex-row sm:items-center">
            <div>
              <div className="text-label-md uppercase tracking-wider text-primary-fixed">
                {welcome ? 'Bắt đầu hành trình' : 'Ải tiếp theo'}
              </div>
              <div className="mt-0.5 text-headline-md font-extrabold">{map.nextStageTitle}</div>
              <div className="mt-0.5 text-body-sm text-primary-fixed">Học lý thuyết 5 phút → thảo luận cùng 3 AI → 3 câu thử thách</div>
            </div>
            <button type="button" onClick={() => navigate(nextPath)}
              className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl bg-secondary-container px-space-xl py-space-md text-headline-sm font-extrabold text-on-secondary-container shadow-[0_5px_0_0_#b86e00] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-[0_2px_0_0_#b86e00]">
              <Icon name="play_arrow" filled className="text-[28px]" /> Chơi ngay
            </button>
          </div>
        </section>
      ) : map.totalStages > 0 ? (
        <section className="rounded-[28px] bg-tertiary-fixed/60 p-space-lg text-center">
          <div className="text-headline-md text-on-tertiary-fixed">🎉 Bạn đã phá đảo toàn bộ bản đồ!</div>
          <p className="text-body-md text-on-tertiary-fixed-variant">Chơi lại các ải chưa đủ 3 sao để kiếm thêm xu nhé.</p>
        </section>
      ) : null}

      <InsightCard petCode={p.activePetCode} onOpen={(f) => {
        if (f.targetType === 'ARENA') navigate(`/arena/${f.targetId}`)
        else if (f.targetType === 'BOSS') navigate(`/boss/${f.targetId}`)
        else navigate(`/stage/${f.targetId}`)
      }} />

      {map.chapters.length === 0 || map.totalStages === 0 ? (
        <div className="card text-center">
          <Pet code={p.activePetCode} size={110} className="mx-auto" />
          <h2 className="mt-space-sm text-headline-sm">Bản đồ ải lớp {map.gradeLevel} đang được xây</h2>
          <p className="text-body-md text-on-surface-variant">Trong lúc chờ, em có thể vào Phòng học AI hoặc Luyện tập nhé.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-space-lg">
          {map.chapters.map((c, idx) => (
            <ChapterLand key={c.topicId} chapter={c} index={idx} petCode={p.activePetCode} onOpen={openStage}
              currentRef={currentRef} welcome={welcome} />
          ))}
        </div>
      )}

      {/* Công cụ phụ, để nhỏ phía dưới cho đỡ rối */}
      <section className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 lg:grid-cols-4">
        <ToolLink to="/arena" icon="sports_esports" title="Đấu trường" desc="Giải siêu tốc, combo" />
        <ToolLink to="/study-room" icon="forum" title="Phòng học 3 AI" desc="Hỏi bài, bắt lỗi bạn AI" />
        <ToolLink to="/photo-solver" icon="photo_camera" title="Giải bằng ảnh" desc="Chụp đề trong vở" />
        <ToolLink to="/quizzes" icon="insights" title="Ôn điểm yếu" desc="Quiz theo phần còn yếu" />
      </section>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-inverse-surface px-space-lg py-space-sm text-label-lg text-inverse-on-surface shadow-lg pop-in">
          <Icon name="lock" className="mr-1 align-middle text-[18px]" /> {toast}
        </div>
      )}
    </div>
  )
}

function ChapterLand({ chapter, index, petCode, onOpen, currentRef, welcome }) {
  const theme = chapterTheme(index)
  const nodes = [
    ...chapter.stages.map((s) => ({ type: 'LESSON', id: s.lessonId, ...s })),
    ...(chapter.boss ? [{ type: 'BOSS', id: chapter.boss.topicId, ...chapter.boss, title: 'Ải trùm' }] : []),
  ]
  const height = TOP_Y + nodes.length * STEP_Y - 20
  const points = nodes.map((_, i) => ({
    x: 50 + (nodes[i].type === 'BOSS' ? 0 : ZIGZAG[(i + index * 2) % ZIGZAG.length]),
    y: TOP_Y + i * STEP_Y,
  }))
  const d = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = points[i - 1]
    return `${acc} C ${prev.x} ${prev.y + STEP_Y * 0.55} ${pt.x} ${pt.y - STEP_Y * 0.55} ${pt.x} ${pt.y}`
  }, '')
  const short = chapter.name.split('. ')
  const title = short.length > 1 ? short.slice(1).join('. ') : chapter.name

  return (
    <section className={`relative overflow-hidden rounded-[32px] bg-gradient-to-b ${theme.bg} shadow-sm`}>
      {/* Băng rôn tên vùng đất */}
      <div className="relative z-10 flex flex-col items-center px-space-md pt-space-lg text-center">
        <div className={`ribbon bg-gradient-to-r ${theme.ribbon} px-space-xl py-2 text-white shadow-md`}>
          <div className="whitespace-nowrap text-label-sm uppercase tracking-[0.18em] opacity-90">
            Chương {ROMAN[chapter.orderIndex - 1] || chapter.orderIndex}<span className="hidden sm:inline"> • {theme.land}</span>
          </div>
        </div>
        <h2 className="mt-space-sm max-w-lg text-headline-sm text-on-surface sm:text-headline-md">{title}</h2>
        <div className="mt-1 flex items-center gap-1 text-label-md" style={{ color: theme.accent }}>
          <Star size={16} /> {chapter.starsEarned}/{chapter.starsTotal} sao
        </div>
      </div>

      <Decor type={theme.deco} side="left" className="pointer-events-none absolute -left-6 top-28 h-40 w-40 opacity-90 sm:left-2 sm:h-52 sm:w-52" />
      <Decor type={theme.deco} side="right" className="pointer-events-none absolute -right-6 bottom-20 h-40 w-40 opacity-90 sm:right-2 sm:h-52 sm:w-52" />

      <div className="relative mx-auto w-full max-w-md" style={{ height }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={d} fill="none" stroke={theme.path} strokeWidth="22" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.55" />
          <path d={d} fill="none" stroke="#ffffff" strokeWidth="5" strokeDasharray="2 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {nodes.map((n, i) => {
          const pt = points[i]
          const isCurrent = n.current
          return (
            <div key={n.id} ref={isCurrent ? currentRef : undefined}
              className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pt.x}%`, top: pt.y }}>
              {n.type === 'BOSS'
                ? <BossNode node={n} onOpen={onOpen} />
                : <LevelNode node={n} onOpen={onOpen} accent={theme.accent} />}
              {isCurrent && (
                // Thú đồng hành đứng cạnh ải hiện tại (phía còn trống của đường zigzag)
                <div className={`pointer-events-none absolute -top-[30px] flex flex-col items-center ${
                  pt.x > 55 ? 'right-[calc(100%-6px)]' : 'left-[calc(100%-6px)]'}`}>
                  <div className="mb-0.5 whitespace-nowrap rounded-xl bg-white px-2.5 py-1 text-label-sm font-bold text-primary shadow-md">
                    {welcome && n.levelNumber === 1 ? 'Bấm vào đây để bắt đầu!' : 'Ải tiếp theo!'}
                  </div>
                  <Pet code={petCode} size={58} bounce />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!chapter.unlocked && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[150px] z-20 flex items-start justify-center bg-gradient-to-b from-white/0 via-white/25 to-white/40 pt-space-md">
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-space-md py-space-sm text-label-lg text-on-surface-variant shadow-md">
            <Icon name="lock" filled className="text-[20px]" /> Qua ải trùm chương trước để mở vùng đất này
          </div>
        </div>
      )}
    </section>
  )
}

function LevelNode({ node, onOpen, accent }) {
  const cleared = node.status === 'CLEARED'
  const locked = node.status === 'LOCKED'
  const color = locked ? 'node-locked' : node.current ? 'node-current' : cleared ? 'node-cleared' : 'node-open'
  return (
    <div className="flex flex-col items-center">
      <button type="button" onClick={() => onOpen('LESSON', node.lessonId, node.status)} title={node.title}
        className={`node-3d ${color} ${node.current ? 'node-pulse' : ''} relative flex h-[76px] w-[76px] items-center justify-center rounded-full text-[28px] font-black`}
        style={cleared || node.current ? undefined : { '--accent': accent }}>
        {locked ? <Icon name="lock" filled className="text-[30px]" /> : node.levelNumber}
        {cleared && node.stars === 3 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-tertiary-container text-white shadow">
            <Icon name="check" className="text-[16px]" />
          </span>
        )}
      </button>
      {!locked && <Stars value={node.stars} size={16} className="mt-1" />}
      <div className={`mt-0.5 line-clamp-2 w-[150px] rounded-lg bg-white/60 px-1.5 py-0.5 text-center text-[11px] font-bold leading-tight ${locked ? 'text-outline' : 'text-on-surface'}`}>
        {node.title}
      </div>
    </div>
  )
}

function BossNode({ node, onOpen }) {
  const cleared = node.status === 'CLEARED'
  const locked = node.status === 'LOCKED'
  return (
    <button type="button" onClick={() => onOpen('BOSS', node.topicId, node.status)}
      className={`group flex flex-col items-center ${node.current ? 'boss-glow' : ''}`} title="Ải trùm cuối chương">
      <div className="relative">
        {cleared ? <Chest size={96} open /> : <Castle size={100} className={locked ? 'opacity-60 grayscale' : ''} />}
        {node.rewardPetCode && (
          <div className="absolute -left-12 top-1 rounded-2xl bg-white/90 p-0.5 shadow-md">
            <Pet code={node.rewardPetCode} size={44} locked={!cleared} />
          </div>
        )}
      </div>
      <div className={`mt-1 rounded-full px-3 py-1 text-label-sm font-extrabold shadow ${locked ? 'bg-surface-container text-outline' : 'bg-error text-white'}`}>
        Ải trùm {cleared && <Stars value={node.stars} size={12} className="ml-1 inline-flex" />}
      </div>
      <div className="mt-1 max-w-[180px] text-center text-[11px] font-bold leading-tight text-on-surface-variant">
        {cleared ? `Đã nhận ${node.rewardPetName}` : `Rương báu: ${node.rewardPetName || 'thú hiếm'} + ${node.rewardCoins} xu`}
      </div>
    </button>
  )
}

/** Thầy Trí nhận xét: phân tích cá nhân hoá (AI hoặc theo luật), ít chữ, bấm thẳng tới ải nên chơi */
function InsightCard({ petCode, onOpen }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const load = (refresh) => {
    setLoading(true)
    insightApi.me(refresh).then(setData).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load(false) }, [])
  if (!data && loading) return <div className="h-28 animate-pulse rounded-[28px] bg-surface-container-low" />
  if (!data) return null
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f0ecff] to-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex flex-col gap-space-md md:flex-row md:items-start">
        <div className="flex items-center gap-space-sm md:w-64 md:flex-col md:items-start">
          <div className="relative">
            <Pet code={petCode} size={64} bounce={data.mood === 'HAPPY'} />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-[#5b3fd0] px-1.5 text-[10px] font-bold text-white">{data.generatedBy === 'AI' ? 'AI' : 'Thầy'}</span>
          </div>
          <div>
            <div className="text-label-sm uppercase tracking-wider text-[#5b3fd0]">Thầy Trí nhận xét</div>
            <div className="text-headline-sm leading-snug text-on-surface">{data.headline}</div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-space-sm">
          {/* Mức thành thạo từng chương */}
          <div className="grid grid-cols-5 gap-1.5">
            {data.chapters.map((c, i) => (
              <div key={c.topicId} title={`${c.name}: ${c.percent}%`} className="flex flex-col items-center gap-1">
                <div className="relative h-14 w-full overflow-hidden rounded-xl bg-white">
                  <div className="absolute inset-x-0 bottom-0 rounded-xl bg-gradient-to-t from-[#8b6cf6] to-[#c4b5fd] transition-all" style={{ height: `${Math.max(c.percent, 4)}%` }} />
                  <span className="absolute inset-x-0 top-1 text-center text-label-sm font-black text-on-surface">{c.percent}%</span>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant">C{i + 1}</span>
              </div>
            ))}
          </div>
          {data.strengths.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.strengths.map((s) => (
                <span key={s} className="chip bg-tertiary-fixed/70 py-0.5 text-on-tertiary-fixed"><Icon name="thumb_up" filled className="text-[14px]" /> {s}</span>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {data.focus.map((f) => (
              <button key={f.title + f.targetId} type="button" onClick={() => onOpen(f)}
                className="flex items-center gap-space-sm rounded-2xl bg-white px-space-md py-space-sm text-left shadow-sm transition-colors hover:bg-primary-fixed/40">
                <Icon name={f.targetType === 'ARENA' ? 'sports_esports' : 'flag'} filled className="text-[22px] text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label-lg text-on-surface">{f.title}</span>
                  <span className="block truncate text-body-sm text-on-surface-variant">{f.reason}</span>
                </span>
                <Icon name="play_circle" filled className="text-[26px] text-secondary-container" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-space-sm flex items-center justify-between gap-space-sm">
        <span className="text-body-sm text-on-surface-variant"><Icon name="tips_and_updates" filled className="align-middle text-[18px] text-secondary" /> {data.tip}</span>
        <button type="button" onClick={() => load(true)} disabled={loading} title="Phân tích lại" className="btn-ghost px-2 py-1">
          <Icon name="refresh" className={`text-[20px] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </section>
  )
}

function StatPill({ icon, value, label }) {
  return (
    <div className="flex min-w-[64px] flex-col items-center rounded-2xl bg-surface-container-low px-space-sm py-space-xs">
      <div className="flex items-center gap-1 text-headline-sm font-extrabold text-on-surface">{icon}{value}</div>
      <span className="text-label-sm text-on-surface-variant">{label}</span>
    </div>
  )
}

function ToolLink({ to, icon, title, desc }) {
  return (
    <Link to={to} className="flex items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm transition-colors hover:bg-surface-container-low">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-primary">
        <Icon name={icon} className="text-[22px]" />
      </span>
      <div className="min-w-0">
        <div className="text-label-lg text-on-surface">{title}</div>
        <div className="truncate text-body-sm text-on-surface-variant">{desc}</div>
      </div>
    </Link>
  )
}
