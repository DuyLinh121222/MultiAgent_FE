import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import Pet from '../components/game/Pet'
import { Castle, Chest, Coin, Decor, Star, Stars, chapterTheme } from '../components/game/GameArt'
import { gameApi } from '../api/services'
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
      patchUser({ coins: m.profile.coins, xp: m.profile.xp, activePetCode: m.profile.activePetCode })
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
        <div className="flex items-center gap-space-sm">
          <StatPill icon={<Coin size={22} />} value={p.coins} label="xu" />
          <StatPill icon={<Star size={22} />} value={p.totalStars} label="sao" />
          <StatPill icon={<Icon name="flag" filled className="text-[22px] text-tertiary" />} value={`${progress}%`} label="bản đồ" />
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
      <section className="grid grid-cols-1 gap-space-sm sm:grid-cols-3">
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

function StatPill({ icon, value, label }) {
  return (
    <div className="flex min-w-[74px] flex-col items-center rounded-2xl bg-surface-container-low px-space-sm py-space-xs">
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
