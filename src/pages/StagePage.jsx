import { useCallback, useEffect, useState } from 'react'
import AchievementToast from '../components/game/AchievementToast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import Pet from '../components/game/Pet'
import { Castle, Chest, Coin, Star, Stars } from '../components/game/GameArt'
import { discussionApi, gameApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

/**
 * Một ải: Học lý thuyết → (tuỳ chọn) thảo luận cùng 3 AI → Thử thách → Nhận thưởng.
 * boss = true: ải trùm cuối chương, 5 câu ngẫu nhiên, thắng được mở rương báu.
 */
export default function StagePage({ boss = false }) {
  const { lessonId, topicId } = useParams()
  const id = boss ? topicId : lessonId
  const navigate = useNavigate()
  const { user, patchUser } = useAuth()
  const [stage, setStage] = useState(null)
  const [phase, setPhase] = useState('learn')
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setStage(null)
    setResult(null)
    setAnswers({})
    setQIndex(0)
    setPhase(boss ? 'intro' : 'learn')
    try {
      setStage(boss ? await gameApi.boss(id) : await gameApi.stage(id))
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }, [boss, id])

  useEffect(() => { load() }, [load])

  const startQuiz = async () => {
    if (!stage.questions.length) return submit({})
    // Kiểm tra thể lực trước khi làm bài (nộp bài tốn 1 thể lực)
    try {
      const p = await gameApi.profile()
      patchUser({ energy: p.energy, streakDays: p.streakDays })
      if (p.energy <= 0) {
        window.dispatchEvent(new CustomEvent('mael:no-energy'))
        return
      }
    } catch { /* vẫn cho làm, BE sẽ kiểm tra lại */ }
    setPhase('quiz')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (ans = answers) => {
    setBusy(true)
    setError('')
    try {
      const r = boss ? await gameApi.submitBoss(id, ans) : await gameApi.submitStage(id, ans)
      setResult(r)
      patchUser({ coins: r.profile.coins, xp: r.profile.xp, energy: r.profile.energy, streakDays: r.profile.streakDays })
      setPhase('result')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const discuss = async () => {
    setBusy(true)
    try {
      const s = await discussionApi.start(id)
      navigate(`/study-room/${s.id}`)
    } catch (e) {
      setError(getErrorMessage(e))
      setBusy(false)
    }
  }

  const goNext = () => {
    if (!result?.nextStageId) return navigate('/')
    navigate(result.nextStageType === 'BOSS' ? `/boss/${result.nextStageId}` : `/stage/${result.nextStageId}`)
  }

  if (!stage && !error) return <Loading text="Đang vào ải..." />
  if (!stage) {
    return (
      <div className="page">
        <ErrorBox message={error} />
        <Link to="/" className="btn-primary w-fit"><Icon name="map" /> Về bản đồ</Link>
      </div>
    )
  }

  const q = stage.questions[qIndex]
  const total = stage.questions.length
  const shownOptions = shuffledOptions(q)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-space-md px-margin-mobile py-space-lg md:px-margin">
      {/* Thanh trên */}
      <div className="flex items-center justify-between gap-space-sm">
        <Link to="/" className="flex items-center gap-1 rounded-xl px-2 py-1 text-label-lg text-on-surface-variant hover:bg-surface-container-low">
          <Icon name="map" className="text-[20px]" /> Bản đồ
        </Link>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-label-md font-extrabold text-white ${boss ? 'bg-error' : 'bg-primary'}`}>
            {boss ? 'Ải trùm' : `Ải ${stage.levelNumber}`}
          </span>
          {stage.bestStars > 0 && <Stars value={stage.bestStars} size={16} />}
        </div>
      </div>

      <ErrorBox message={error} />

      {phase === 'learn' && (
        <LearnPhase stage={stage} petCode={user?.activePetCode} onQuiz={startQuiz} onDiscuss={discuss} busy={busy} />
      )}

      {phase === 'intro' && (
        <div className="pop-in flex flex-col items-center gap-space-md rounded-[28px] bg-gradient-to-b from-[#ffe1e4] to-surface-container-lowest p-space-xl text-center shadow-sm">
          <Castle size={130} />
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{stage.title}</h1>
          <p className="max-w-md text-body-lg text-on-surface-variant">
            {total} câu bốc ngẫu nhiên trong cả chương. Đúng từ {Math.ceil(total / 3)} câu trở lên là hạ được trùm và mở rương báu!
          </p>
          {stage.rewardPetCode && (
            <div className="flex items-center gap-space-md rounded-2xl bg-white/90 px-space-lg py-space-sm shadow-sm">
              <Chest size={64} />
              <span className="text-headline-sm text-on-surface">+</span>
              <Pet code={stage.rewardPetCode} size={64} locked={stage.bestStars === 0} />
              <div className="text-left">
                <div className="text-label-lg font-extrabold text-on-surface">{stage.bestStars > 0 ? stage.rewardPetName : 'Thú bí ẩn'}</div>
                <div className="flex items-center gap-1 text-body-sm text-on-surface-variant"><Coin size={16} /> + 50 xu</div>
              </div>
            </div>
          )}
          <button type="button" onClick={startQuiz} className="btn-primary bg-error px-space-xl py-space-md text-headline-sm shadow-[0_5px_0_0_#7d0f12] hover:bg-error">
            <Icon name="swords" className="text-[24px]" /> Vào đánh trùm
          </button>
        </div>
      )}

      {phase === 'quiz' && q && (
        <div className="pop-in flex flex-col gap-space-md" key={q.id}>
          {/* Tiến độ câu hỏi */}
          <div className="flex items-center gap-space-sm">
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-gradient-to-r from-[#7ee0c3] to-tertiary-container transition-all duration-500"
                style={{ width: `${((qIndex + (answers[q.id] ? 1 : 0)) * 100) / total}%` }} />
            </div>
            <span className="text-label-lg font-extrabold text-on-surface-variant">{qIndex + 1}/{total}</span>
          </div>

          <div className="flex items-start gap-space-sm">
            <Pet code={user?.activePetCode} size={64} className="hidden flex-shrink-0 sm:block" />
            <div className="relative flex-1 rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="text-label-sm uppercase tracking-wider text-primary">Câu {qIndex + 1}</div>
              <h2 className="mt-1 text-headline-sm leading-snug text-on-surface md:text-headline-md">{q.content}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
            {shownOptions.map(({ letter, text }, i) => {
              const selected = answers[q.id] === letter
              return (
                <button key={letter} type="button" onClick={() => setAnswers((a) => ({ ...a, [q.id]: letter }))}
                  className={`flex items-center gap-space-sm rounded-2xl border-[3px] p-space-md text-left text-body-lg transition-all active:scale-[0.98] ${
                    selected ? 'border-primary bg-primary-fixed/60 shadow-tactile' : 'border-surface-container bg-surface-container-lowest hover:border-primary-fixed-dim'
                  }`}>
                  <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-label-lg font-extrabold ${
                    selected ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}>{String.fromCharCode(65 + i)}</span>
                  <span className="text-on-surface">{text}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between">
            <button type="button" className="btn-ghost" disabled={qIndex === 0} onClick={() => setQIndex(qIndex - 1)}>
              <Icon name="arrow_back" className="text-[20px]" /> Câu trước
            </button>
            {qIndex < total - 1 ? (
              <button type="button" className="btn-primary px-space-xl py-space-md" disabled={!answers[q.id]} onClick={() => setQIndex(qIndex + 1)}>
                Câu tiếp <Icon name="arrow_forward" className="text-[20px]" />
              </button>
            ) : (
              <button type="button" className="btn-primary px-space-xl py-space-md" disabled={!answers[q.id] || busy} onClick={() => submit()}>
                {busy ? 'Đang chấm...' : 'Nộp bài'} <Icon name="done_all" className="text-[20px]" />
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <ResultPhase result={result} boss={boss} onNext={goNext} onRetry={load} petCode={user?.activePetCode} questions={stage.questions} />
      )}
    </div>
  )
}

function LearnPhase({ stage, petCode, onQuiz, onDiscuss, busy }) {
  return (
    <div className="pop-in flex flex-col gap-space-md">
      <div className="rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm sm:p-space-xl">
        <div className="text-label-sm uppercase tracking-wider text-on-surface-variant">{stage.chapterName}</div>
        <h1 className="mt-1 text-headline-lg-mobile text-on-surface md:text-headline-lg">{stage.title}</h1>
        <div className="mt-space-sm flex flex-wrap gap-2">
          <span className="chip bg-primary-fixed text-on-primary-fixed"><Icon name="menu_book" className="text-[16px]" /> Bước 1: Học lý thuyết</span>
          {stage.durationMinutes && <span className="chip bg-surface-container text-on-surface-variant"><Icon name="schedule" className="text-[16px]" /> ~{stage.durationMinutes} phút</span>}
        </div>
        <LessonContent content={stage.content} />
      </div>

      {stage.traps?.length > 0 && (
        <details className="group rounded-[24px] bg-secondary-fixed/50 p-space-lg">
          <summary className="flex cursor-pointer list-none items-center justify-between text-headline-sm text-on-secondary-fixed">
            <span className="flex items-center gap-2"><Icon name="warning" filled className="text-[22px] text-secondary" /> Mẹo tránh bẫy ({stage.traps.length})</span>
            <Icon name="expand_more" className="transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-space-md flex flex-col gap-space-sm">
            {stage.traps.map((t, i) => (
              <li key={i} className="rounded-2xl bg-white/80 p-space-md">
                <div className="text-body-sm text-on-surface-variant">Hay nhầm vì: {t.why}</div>
                <div className="mt-1 flex gap-2 text-body-md font-semibold text-on-surface">
                  <Icon name="check_circle" filled className="mt-0.5 text-[18px] text-tertiary" /> {t.fix}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex flex-col flex-wrap items-stretch gap-space-sm rounded-[28px] bg-gradient-to-r from-primary-fixed to-surface-container-low p-space-lg sm:flex-row sm:items-center">
        <Pet code={petCode} size={70} bounce className="mx-auto flex-shrink-0 sm:mx-0" />
        <div className="min-w-[180px] flex-1 text-center sm:text-left">
          <div className="text-headline-sm text-on-surface">Hiểu bài rồi chứ?</div>
          <div className="text-body-sm text-on-surface-variant">Muốn chắc hơn thì vào thảo luận và bắt lỗi bạn AI trước nhé.</div>
        </div>
        <button type="button" onClick={onDiscuss} disabled={busy} className="btn-secondary bg-white py-space-md">
          <Icon name="forum" className="text-[20px] text-primary" /> Thảo luận cùng 3 AI
        </button>
        <button type="button" onClick={onQuiz} className="btn-primary px-space-lg py-space-md text-headline-sm">
          <Icon name="bolt" filled className="text-[22px]" /> {stage.questions.length ? `Thử thách (${stage.questions.length} câu)` : 'Hoàn thành ải'}
          {stage.questions.length > 0 && <span className="ml-1 flex items-center rounded-full bg-white/20 px-1.5 text-label-md"><Icon name="bolt" filled className="text-[16px] text-secondary-container" />1</span>}
        </button>
      </div>
    </div>
  )
}

/** Hiển thị nội dung bài: tách đoạn, dòng "•" thành gạch đầu dòng, dòng "Ví dụ" nổi bật */
function LessonContent({ content }) {
  if (!content) return null
  const blocks = content.split(/\n\s*\n/)
  return (
    <div className="mt-space-lg flex flex-col gap-space-md text-[19px] leading-8 text-on-surface">
      {blocks.map((b, i) => {
        const lines = b.split('\n')
        const isExample = /^Ví dụ/.test(lines[0].trim())
        return (
          <div key={i} className={isExample ? 'rounded-2xl border-l-4 border-tertiary-container bg-tertiary-fixed/25 p-space-md' : ''}>
            {lines.map((line, j) => {
              const t = line.trim()
              if (t.startsWith('•')) {
                return (
                  <div key={j} className="flex gap-2 pl-1">
                    <span className="mt-[13px] h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    <span>{t.slice(1).trim()}</span>
                  </div>
                )
              }
              return <p key={j} className={/:$/.test(t) ? 'font-bold' : ''}>{t}</p>
            })}
          </div>
        )
      })}
    </div>
  )
}

function ResultPhase({ result, boss, onNext, onRetry, petCode, questions = [] }) {
  const textOf = (qid, letter) => {
    const opt = questions.find((x) => x.id === qid)?.options.find((o) => letter && o.trim().startsWith(letter))
    return opt ? opt.replace(/^[A-D]\.\s*/, '') : letter
  }
  const [chestOpen, setChestOpen] = useState(!boss || !result.rewardPet)
  const passed = result.passed
  const headline = !passed ? 'Chưa qua ải rồi!' : result.stars === 3 ? 'Xuất sắc! 3 sao!' : 'Qua ải rồi!'
  return (
    <div className="flex flex-col gap-space-md">
      <AchievementToast items={result.newAchievements} />
      <div className="pop-in relative flex flex-col items-center overflow-hidden rounded-[28px] bg-gradient-to-b from-primary-fixed to-surface-container-lowest p-space-xl text-center shadow-sm">
        {passed && chestOpen && <Confetti />}
        {result.streakIncreased && (
          <span className="chip pop-in mb-space-sm bg-[#ffe3cc] text-[#c2410c]"><Icon name="local_fire_department" filled className="text-[18px]" /> Chuỗi {result.streakDays} ngày!</span>
        )}
        <Pet code={petCode} size={96} bounce={passed} className={passed ? '' : 'opacity-80 grayscale-[0.4]'} />
        <h1 className="mt-space-sm text-headline-lg text-on-surface">{headline}</h1>
        <p className="text-body-md text-on-surface-variant">Đúng {result.correct}/{result.total} câu</p>

        <div className="mt-space-md flex items-end gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="star-pop" style={{ animationDelay: `${0.15 + i * 0.25}s` }}>
              <Star filled={i < result.stars} size={i === 1 ? 64 : 50} className={i === 1 ? '-translate-y-3' : ''} />
            </span>
          ))}
        </div>

        {passed && (
          <div className="mt-space-md flex flex-wrap justify-center gap-space-sm">
            <RewardPill><Coin size={22} /> +{result.coinsEarned} xu</RewardPill>
            <RewardPill><Icon name="bolt" filled className="text-[22px] text-tertiary" /> +{result.xpEarned} XP</RewardPill>
            {result.levelUp && <RewardPill highlight><Icon name="trending_up" className="text-[22px]" /> Lên cấp {result.profile.level}!</RewardPill>}
          </div>
        )}
        {!passed && (
          <p className="mt-space-md max-w-md text-body-md text-on-surface-variant">
            Cần đúng ít nhất 1/3 số câu. Xem lại lời giải bên dưới rồi thử lại nhé, {boss ? 'ải trùm sẽ đổi câu mới!' : 'em làm được mà!'}
          </p>
        )}
        {passed && result.stars > 0 && result.stars <= result.previousBestStars && (
          <p className="mt-space-sm text-body-sm text-on-surface-variant">Kỷ lục cũ {result.previousBestStars} sao, xu chỉ cộng khi phá kỷ lục.</p>
        )}
      </div>

      {/* Rương báu ải trùm */}
      {boss && result.rewardPet && (
        <div className="pop-in flex flex-col items-center gap-space-sm rounded-[28px] bg-gradient-to-b from-[#fff4cf] to-surface-container-lowest p-space-lg text-center shadow-sm">
          {!chestOpen ? (
            <>
              <button type="button" onClick={() => setChestOpen(true)} className="chest-wiggle">
                <Chest size={140} />
              </button>
              <div className="text-headline-sm text-on-surface">Bấm vào rương để mở!</div>
            </>
          ) : (
            <>
              <div className="relative">
                <Chest size={120} open className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-60" />
                <Pet code={result.rewardPet.code} size={140} bounce className="pop-in relative" />
              </div>
              <div className="text-label-md uppercase tracking-wider text-secondary">Thú mới • {rarityLabel(result.rewardPet.rarity)}</div>
              <div className="text-headline-md text-on-surface">{result.rewardPet.name}</div>
              <p className="max-w-sm text-body-md text-on-surface-variant">{result.rewardPet.description}</p>
              <Link to="/pets" className="btn-secondary bg-white"><Icon name="pets" className="text-[20px]" /> Chọn làm bạn đồng hành</Link>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-space-sm sm:flex-row">
        <button type="button" onClick={onRetry} className="btn-secondary flex-1 py-space-md">
          <Icon name="replay" className="text-[20px]" /> Chơi lại
        </button>
        {passed ? (
          <button type="button" onClick={onNext} className="btn-primary flex-[2] py-space-md text-headline-sm">
            {result.nextStageId ? <>Ải tiếp theo: {result.nextStageTitle}</> : 'Về bản đồ'} <Icon name="arrow_forward" className="text-[22px]" />
          </button>
        ) : (
          <Link to="/" className="btn-primary flex-[2] py-space-md text-headline-sm"><Icon name="map" /> Về bản đồ</Link>
        )}
      </div>

      {/* Xem lại lời giải */}
      <div className="rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm">
        <h2 className="mb-space-md text-headline-sm text-on-surface">Xem lại lời giải</h2>
        <div className="flex flex-col gap-space-sm">
          {result.results.map((r, i) => (
            <div key={r.questionId} className={`rounded-2xl p-space-md ${r.correct ? 'bg-tertiary-fixed/30' : 'bg-error-container/50'}`}>
              <div className="flex items-start gap-2">
                <Icon name={r.correct ? 'check_circle' : 'cancel'} filled className={`mt-0.5 text-[20px] ${r.correct ? 'text-tertiary' : 'text-error'}`} />
                <div className="flex-1">
                  <div className="text-label-lg text-on-surface">Câu {i + 1}. {r.content}</div>
                  <div className="mt-1 text-body-sm text-on-surface-variant">
                    Em chọn: <b>{textOf(r.questionId, r.selectedAnswer) || '—'}</b> • Đáp án đúng: <b className="text-tertiary">{textOf(r.questionId, r.correctAnswer)}</b>
                  </div>
                  {r.explanation && <div className="mt-1 text-body-md text-on-surface">{r.explanation}</div>}
                </div>
              </div>
            </div>
          ))}
          {result.results.length === 0 && <p className="text-body-md text-on-surface-variant">Ải này chưa có câu thử thách, em đã hoàn thành phần lý thuyết.</p>}
        </div>
      </div>
    </div>
  )
}

function RewardPill({ children, highlight }) {
  return (
    <span className={`pop-in flex items-center gap-1.5 rounded-2xl px-space-md py-space-sm text-headline-sm font-extrabold shadow-sm ${
      highlight ? 'bg-secondary-container text-on-secondary-container' : 'bg-white text-on-surface'
    }`}>{children}</span>
  )
}

function Confetti() {
  const colors = ['#ffc93c', '#ff6b7a', '#4edea3', '#5b8cff', '#b48cff']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 28 }).map((_, i) => (
        <span key={i} className="confetti-piece" style={{
          left: `${(i * 37) % 100}%`,
          background: colors[i % colors.length],
          animationDelay: `${(i % 7) * 0.12}s`,
          transform: `rotate(${i * 25}deg)`,
        }} />
      ))}
    </div>
  )
}

/** Xáo thứ tự đáp án mỗi câu (nhớ theo id câu để không đổi khi bấm chọn), chữ A/B/C/D đánh lại theo vị trí mới */
const shuffleCache = new Map()
function shuffledOptions(q) {
  if (!q) return []
  if (!shuffleCache.has(q.id)) {
    const list = q.options.map((o) => ({ letter: o.trim().charAt(0), text: o.replace(/^[A-D]\.\s*/, '') }))
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]]
    }
    shuffleCache.set(q.id, list)
  }
  return shuffleCache.get(q.id)
}

export function rarityLabel(r) {
  return { COMMON: 'Phổ biến', RARE: 'Hiếm', EPIC: 'Sử thi', LEGENDARY: 'Huyền thoại' }[r] || r
}
