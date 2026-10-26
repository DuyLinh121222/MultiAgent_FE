import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import ErrorBox from '../components/common/ErrorBox'
import Monster from '../components/game/Monster'
import Pet from '../components/game/Pet'
import { Coin } from '../components/game/GameArt'
import { EnergyBar } from '../components/game/EnergyModal'
import AchievementToast from '../components/game/AchievementToast'
import { gameApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { sfx } from '../utils/sfx'

const BALLOONS = [
  { bg: 'from-[#ff8fa3] to-[#e5384f]', shadow: '#a5172a' },
  { bg: 'from-[#7fb7ff] to-[#2563eb]', shadow: '#123f9e' },
  { bg: 'from-[#ffd36b] to-[#f59e0b]', shadow: '#a46300' },
  { bg: 'from-[#7ee0b5] to-[#0f9f6e]', shadow: '#05613f' },
]

/** Xáo đáp án (giữ chữ cái gốc để gửi BE chấm) */
function shuffled(options) {
  const list = options.map((o) => ({ letter: o.trim().charAt(0), text: o.replace(/^[A-D]\.\s*/, '') }))
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

/**
 * Mini game Đấu trường: mỗi câu là 4 quả bóng đáp án. Đúng thì thú cưng tung chiêu, quái vật mất máu, lên combo.
 * Sai thì mất 1 tim. Hết tim / hết giờ / hết câu là kết thúc. Chữ tối thiểu, hình và hiệu ứng là chính.
 */
export default function ArenaPlayPage() {
  const { topicId } = useParams()
  const location = useLocation()
  const index = location.state?.index ?? 0
  const { user, patchUser } = useAuth()
  const [phase, setPhase] = useState('ready')
  const [run, setRun] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [timeLeft, setTimeLeft] = useState(120)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [hp, setHp] = useState(10)
  const [picked, setPicked] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [fx, setFx] = useState(0)
  const [hurtKey, setHurtKey] = useState(0)
  const [shake, setShake] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const finishing = useRef(false)

  const q = run?.questions[qIndex]
  const options = useMemo(() => (q ? shuffled(q.options) : []), [q])

  const start = async () => {
    setBusy(true)
    setError('')
    try {
      const r = await gameApi.startArena(topicId)
      patchUser({ energy: r.profile.energy })
      setRun(r)
      setQIndex(0)
      setHearts(r.hearts)
      setTimeLeft(r.timeLimitSeconds)
      setScore(0)
      setCombo(0)
      setHp(r.questions.length)
      setPicked(null)
      setFeedback(null)
      setResult(null)
      finishing.current = false
      setPhase('play')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const finish = useCallback(async (left) => {
    if (finishing.current || !run) return
    finishing.current = true
    setPhase('ending')
    try {
      const r = await gameApi.finishArena(run.runId, left)
      setResult(r)
      patchUser({ coins: r.profile.coins, xp: r.profile.xp, energy: r.profile.energy, streakDays: r.profile.streakDays })
      if (r.correct >= Math.ceil(r.total / 2) && r.correct > 0) sfx.win()
      else sfx.lose()
      setPhase('result')
    } catch (e) {
      setError(getErrorMessage(e))
      setPhase('result')
    }
  }, [run, patchUser])

  // Đồng hồ
  useEffect(() => {
    if (phase !== 'play') return undefined
    if (timeLeft <= 0) {
      finish(0)
      return undefined
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft, finish])

  const choose = async (opt) => {
    if (picked || phase !== 'play') return
    setPicked(opt.letter)
    sfx.pop()
    try {
      const r = await gameApi.answerArena(run.runId, q.id, opt.letter)
      setFeedback(r)
      let nextHearts = hearts
      if (r.correct) {
        const c = combo + 1
        setCombo(c)
        setScore((s) => s + 100 + (c > 1 ? c * 30 : 0))
        setFx((k) => k + 1)
        setTimeout(() => { setHp((h) => Math.max(0, h - 1)); setHurtKey((k) => k + 1); sfx.hit() }, 380)
        sfx.correct()
        if (c > 1) setTimeout(() => sfx.combo(c), 200)
      } else {
        setCombo(0)
        nextHearts = hearts - 1
        setHearts(nextHearts)
        setShake(true)
        setTimeout(() => setShake(false), 450)
        sfx.wrong()
      }
      setTimeout(() => {
        const last = qIndex >= run.questions.length - 1
        if (nextHearts <= 0 || last) {
          finish(timeLeft)
        } else {
          setQIndex((i) => i + 1)
          setPicked(null)
          setFeedback(null)
        }
      }, r.correct ? 900 : 1500)
    } catch (e) {
      setError(getErrorMessage(e))
      setPicked(null)
    }
  }

  if (phase === 'ready') {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-space-md px-margin-mobile py-space-xl text-center md:px-margin">
        <div className="flex items-end gap-space-md">
          <Pet code={user?.activePetCode} size={120} bounce />
          <span className="mb-10 text-headline-lg font-black text-secondary">VS</span>
          <Monster index={index} size={130} className="monster-idle" />
        </div>
        <h1 className="text-headline-lg text-on-surface">{location.state?.name || 'Đấu trường'}</h1>
        <div className="grid w-full grid-cols-3 gap-space-sm">
          <Rule icon="timer" text="2 phút" />
          <Rule icon="favorite" text="3 tim" color="text-error" />
          <Rule icon="bolt" text="Combo" color="text-secondary" />
        </div>
        <ErrorBox message={error} />
        <button type="button" onClick={start} disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-primary py-space-md text-headline-md font-black text-white shadow-[0_6px_0_0_#00318a] transition-all active:translate-y-[3px] disabled:opacity-60">
          <Icon name="swords" className="text-[28px]" /> {busy ? 'Đang vào...' : 'Vào trận'}
          <span className="ml-1 flex items-center rounded-full bg-white/20 px-2 text-label-lg"><Icon name="bolt" filled className="text-[18px] text-secondary-container" />1</span>
        </button>
        <Link to="/arena" className="btn-ghost"><Icon name="arrow_back" className="text-[20px]" /> Đấu trường</Link>
      </div>
    )
  }

  if (phase === 'result' || phase === 'ending') {
    return <ArenaResult result={result} error={error} onReplay={start} busy={busy} index={index} petCode={user?.activePetCode} questions={run?.questions || []} />
  }

  const timePct = (timeLeft * 100) / (run?.timeLimitSeconds || 120)
  return (
    <div className={`mx-auto flex w-full max-w-3xl flex-col gap-space-md px-margin-mobile py-space-md md:px-margin ${shake ? 'shake' : ''}`}>
      {/* Thanh trên: tim, giờ, điểm */}
      <div className="flex items-center gap-space-sm">
        <div className="flex gap-0.5">
          {Array.from({ length: run.hearts }).map((_, i) => (
            <Icon key={i} name="favorite" filled className={`text-[28px] ${i < hearts ? 'text-error' : 'heart-lose text-outline'}`} />
          ))}
        </div>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-container">
          <div className={`h-full rounded-full transition-all duration-1000 ${timePct > 30 ? 'bg-gradient-to-r from-[#7ee0c3] to-tertiary-container' : 'bg-gradient-to-r from-[#ffb36b] to-error'}`}
            style={{ width: `${timePct}%` }} />
        </div>
        <span className="w-12 text-right text-label-lg font-extrabold tabular-nums text-on-surface-variant">{timeLeft}s</span>
        <span className="flex items-center gap-1 rounded-full bg-secondary-fixed px-3 py-1 text-label-lg font-black text-on-secondary-fixed">
          <Icon name="emoji_events" filled className="text-[18px]" /> {score}
        </span>
      </div>

      {/* Sàn đấu */}
      <div className="relative flex h-52 items-end justify-between overflow-hidden rounded-[32px] bg-gradient-to-b from-[#c9dcff] via-[#e7efff] to-[#bfe8a8] px-space-lg pb-space-sm sm:h-60">
        <div className="absolute inset-x-0 bottom-0 h-10 bg-[#9fdc84]" />
        <div className="relative z-10">
          <Pet code={user?.activePetCode} size={110} bounce />
          {fx > 0 && <span key={fx} className="fireball absolute left-20 top-6 h-10 w-10 rounded-full bg-[radial-gradient(circle,#fff6b0,#ffb703_45%,#ff5a1f)] shadow-[0_0_20px_#ffb703]"
            style={{ '--fx': 'min(420px, 52vw)', '--fy': '-10px' }} />}
        </div>
        {combo > 1 && (
          <div key={combo} className="combo-pop absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-2xl bg-secondary-container px-space-md py-1 text-headline-md font-black text-on-secondary-container shadow-lg">
            Combo x{combo}
          </div>
        )}
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-1 h-3 w-28 overflow-hidden rounded-full bg-white/80 ring-2 ring-white">
            <div className="h-full rounded-full bg-gradient-to-r from-[#ff8fa3] to-error transition-all duration-300" style={{ width: `${(hp * 100) / run.questions.length}%` }} />
          </div>
          <div key={hurtKey} className={hurtKey ? 'monster-hit' : ''}>
            <Monster index={index} size={130} hurt={feedback?.correct} className="monster-idle" />
          </div>
          {feedback?.correct && <span key={`d${hurtKey}`} className="float-up absolute -top-2 right-0 text-headline-md font-black text-error">-1</span>}
        </div>
      </div>

      {/* Câu hỏi */}
      <div className="pop-in rounded-[28px] bg-surface-container-lowest p-space-lg text-center shadow-sm" key={q.id}>
        <div className="text-label-sm uppercase tracking-wider text-primary">Câu {qIndex + 1}/{run.questions.length}</div>
        <h2 className="mt-1 text-headline-md leading-snug text-on-surface sm:text-[24px] sm:leading-8">{q.content}</h2>
      </div>

      {/* Bóng đáp án */}
      <div className="grid grid-cols-2 gap-space-md sm:grid-cols-4">
        {options.map((opt, i) => {
          const b = BALLOONS[i % BALLOONS.length]
          const isPicked = picked === opt.letter
          const isRight = feedback && feedback.correctAnswer?.startsWith(opt.letter)
          const state = !feedback ? '' : isRight ? 'ring-4 ring-tertiary-fixed-dim scale-105' : isPicked ? 'grayscale opacity-60' : 'opacity-40'
          return (
            <button key={`${q.id}-${opt.letter}`} type="button" disabled={!!picked} onClick={() => choose(opt)}
              className={`group flex flex-col items-center ${!picked ? 'balloon-bob' : ''}`} style={{ animationDelay: `${i * 0.35}s` }}>
              <span className={`relative flex min-h-[92px] w-full items-center justify-center rounded-[50%_50%_46%_46%] bg-gradient-to-b ${b.bg} px-3 py-4 text-center text-headline-sm font-extrabold text-white transition-all ${state} ${isPicked && feedback?.correct ? 'balloon-pop' : ''} group-hover:scale-105 group-active:scale-95`}
                style={{ boxShadow: `inset -8px -10px 0 ${b.shadow}40, 0 6px 0 ${b.shadow}` }}>
                <span className="absolute left-4 top-3 h-4 w-3 rotate-[25deg] rounded-full bg-white/50" />
                <span className="relative break-words leading-tight drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">{opt.text}</span>
                {isRight && <Icon name="check_circle" filled className="absolute -right-1 -top-1 text-[28px] text-tertiary drop-shadow" />}
              </span>
              <svg width="12" height="28" viewBox="0 0 12 28" aria-hidden="true"><path d="M6 0 C2 8 10 14 6 28" stroke="#9aa3b8" strokeWidth="2" fill="none" /></svg>
            </button>
          )
        })}
      </div>
      {feedback && !feedback.correct && feedback.explanation && (
        <div className="pop-in rounded-2xl bg-error-container/60 px-space-md py-space-sm text-center text-body-md text-on-error-container">
          {feedback.explanation}
        </div>
      )}
      <ErrorBox message={error} />
    </div>
  )
}

function Rule({ icon, text, color = 'text-primary' }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
      <Icon name={icon} filled className={`text-[30px] ${color}`} />
      <span className="text-label-lg text-on-surface">{text}</span>
    </div>
  )
}

function ArenaResult({ result, error, onReplay, busy, index, petCode, questions }) {
  const [showReview, setShowReview] = useState(false)
  if (!result) {
    return (
      <div className="flex flex-col items-center gap-space-md py-space-xl">
        {error ? <ErrorBox message={error} /> : <span className="text-headline-sm text-on-surface-variant">Đang tính điểm...</span>}
        {error && <Link to="/arena" className="btn-primary">Về Đấu trường</Link>}
      </div>
    )
  }
  const win = result.correct > 0 && result.correct >= Math.ceil(result.total / 2)
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-space-md px-margin-mobile py-space-lg md:px-margin">
      <AchievementToast items={result.newAchievements} />
      <div className="pop-in flex flex-col items-center rounded-[32px] bg-gradient-to-b from-primary-fixed to-surface-container-lowest p-space-xl text-center shadow-sm">
        <div className="flex items-end gap-space-md">
          <Pet code={petCode} size={100} bounce={win} className={win ? '' : 'grayscale-[0.4]'} />
          <Monster index={index} size={90} defeated={win} />
        </div>
        <h1 className="mt-space-sm text-headline-lg text-on-surface">{win ? 'Chiến thắng!' : 'Thử lại nhé!'}</h1>
        <div className="mt-space-sm flex items-center gap-2 text-display font-black text-primary">
          <Icon name="emoji_events" filled className="text-[40px] text-secondary-container" /> {result.score}
        </div>
        {result.newRecord && <span className="chip bg-secondary-container text-on-secondary-container">Kỷ lục mới!</span>}
        <div className="mt-space-md grid w-full grid-cols-3 gap-space-sm">
          <Box icon={<Icon name="check_circle" filled className="text-[26px] text-tertiary" />} value={`${result.correct}/${result.total}`} />
          <Box icon={<Icon name="bolt" filled className="text-[26px] text-secondary" />} value={`x${result.bestCombo}`} />
          <Box icon={<Icon name="local_fire_department" filled className="text-[26px] text-[#ea580c]" />} value={result.streakDays} />
        </div>
        <div className="mt-space-sm flex flex-wrap justify-center gap-space-sm">
          <span className="flex items-center gap-1 rounded-2xl bg-white px-space-md py-space-sm text-headline-sm font-extrabold shadow-sm"><Coin size={22} /> +{result.coinsEarned}</span>
          <span className="flex items-center gap-1 rounded-2xl bg-white px-space-md py-space-sm text-headline-sm font-extrabold shadow-sm"><Icon name="star" filled className="text-[22px] text-tertiary" /> +{result.xpEarned} XP</span>
        </div>
        {result.coinCapReached && <p className="mt-space-xs text-body-sm text-on-surface-variant">Hôm nay đã nhận đủ xu từ Đấu trường, mai chơi tiếp nhé!</p>}
        <EnergyBar energy={result.profile.energy} max={result.profile.maxEnergy} size={20} className="mt-space-sm" />
      </div>
      <div className="flex gap-space-sm">
        <Link to="/arena" className="btn-secondary flex-1 py-space-md"><Icon name="grid_view" className="text-[20px]" /> Đấu trường</Link>
        <button type="button" onClick={onReplay} disabled={busy || result.profile.energy <= 0} className="btn-primary flex-[2] py-space-md text-headline-sm">
          <Icon name="replay" className="text-[22px]" /> Chơi lại <span className="flex items-center text-label-lg"><Icon name="bolt" filled className="text-[18px] text-secondary-container" />1</span>
        </button>
      </div>
      <ErrorBox message={error} />
      <button type="button" onClick={() => setShowReview((v) => !v)} className="btn-ghost">
        <Icon name={showReview ? 'expand_less' : 'expand_more'} className="text-[20px]" /> Xem lời giải
      </button>
      {showReview && (
        <div className="flex flex-col gap-space-sm">
          {result.results.map((r) => (
            <div key={r.questionId} className={`rounded-2xl p-space-md ${r.correct ? 'bg-tertiary-fixed/30' : 'bg-error-container/50'}`}>
              <div className="flex items-start gap-2">
                <Icon name={r.correct ? 'check_circle' : 'cancel'} filled className={`mt-0.5 text-[20px] ${r.correct ? 'text-tertiary' : 'text-error'}`} />
                <div className="flex-1">
                  <div className="text-label-lg text-on-surface">{r.content}</div>
                  <div className="text-body-sm text-on-surface-variant">Đáp án: <b className="text-tertiary">{optionText(questions, r.questionId, r.correctAnswer)}</b></div>
                  {r.explanation && <div className="text-body-sm text-on-surface">{r.explanation}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function optionText(questions, id, letter) {
  const q = questions.find((x) => x.id === id)
  const opt = q?.options.find((o) => o.trim().startsWith(letter))
  return opt ? opt.replace(/^[A-D]\.\s*/, '') : letter
}

function Box({ icon, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-space-sm shadow-sm">
      {icon}
      <span className="text-headline-sm font-black text-on-surface">{value}</span>
    </div>
  )
}
