import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Logo from '../components/common/Logo'
import ErrorBox from '../components/common/ErrorBox'
import Pet from '../components/game/Pet'
import { Coin } from '../components/game/GameArt'
import { gameApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

const GRADES = [
  { grade: 9, desc: 'Bản đồ ải Học kỳ 1 đã sẵn sàng', ready: true },
  { grade: 8, desc: 'Đang xây bản đồ ải', ready: false },
  { grade: 7, desc: 'Đang xây bản đồ ải', ready: false },
  { grade: 6, desc: 'Đang xây bản đồ ải', ready: false },
]

const GOALS = [
  { id: 'EXAM_10', icon: 'emoji_events', title: 'Ôn thi vào lớp 10', desc: 'Luyện chắc từng dạng bài, không bỏ sót bẫy', color: 'bg-secondary-fixed text-secondary' },
  { id: 'FOLLOW_CLASS', icon: 'menu_book', title: 'Học theo bài trên lớp', desc: 'Học bài nào chắc bài đó, đúng SGK', color: 'bg-primary-fixed text-primary' },
  { id: 'REBUILD_BASICS', icon: 'construction', title: 'Lấy lại gốc', desc: 'Đi chậm, ôn kỹ những phần còn hổng', color: 'bg-tertiary-fixed text-tertiary' },
]

/**
 * Màn chào mừng cho học sinh mới: chỉ 3 bước, mỗi bước 1 câu hỏi, bấm chọn là xong.
 */
export default function WelcomePage() {
  const { user, patchUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [grade, setGrade] = useState(user?.gradeLevel || 9)
  const [goal, setGoal] = useState(null)
  const [pet, setPet] = useState(null)
  const [starters, setStarters] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    gameApi.starterPets().then(setStarters).catch((e) => setError(getErrorMessage(e)))
  }, [])

  const finish = async () => {
    setSaving(true)
    setError('')
    try {
      const profile = await gameApi.onboarding({ gradeLevel: grade, goal, petCode: pet })
      patchUser({ onboarded: true, gradeLevel: profile.gradeLevel, coins: profile.coins, xp: profile.xp, activePetCode: profile.activePetCode })
      navigate('/', { replace: true, state: { welcome: true } })
    } catch (e) {
      setError(getErrorMessage(e))
      setSaving(false)
    }
  }

  const canNext = [Boolean(grade), Boolean(goal), Boolean(pet)][step]
  const firstName = user?.fullName?.trim().split(/\s+/).pop()

  return (
    <div className="welcome-bg relative flex min-h-screen flex-col items-center px-margin-mobile pb-space-xl pt-space-lg">
      <div className="mb-space-lg flex w-full max-w-2xl items-center justify-between">
        <Logo to="/welcome" />
        <span className="text-label-md text-on-surface-variant">Bước {step + 1}/3</span>
      </div>

      <div className="w-full max-w-2xl">
        {/* Thanh tiến độ 3 bước */}
        <div className="mb-space-lg flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/70">
              <div className={`h-full rounded-full bg-primary transition-all duration-500 ${i <= step ? 'w-full' : 'w-0'}`} />
            </div>
          ))}
        </div>

        <div className="pop-in rounded-[28px] bg-surface-container-lowest p-space-lg shadow-[0_20px_50px_-20px_rgba(0,74,198,0.35)] sm:p-space-xl" key={step}>
          {step === 0 && (
            <>
              <StepTitle emoji="👋" title={`Chào ${firstName || 'bạn'}! Em đang học lớp mấy?`} sub="Bản đồ ải sẽ bám đúng chương trình lớp em." />
              <div className="grid grid-cols-2 gap-space-sm">
                {GRADES.map((g) => (
                  <Choice key={g.grade} active={grade === g.grade} onClick={() => setGrade(g.grade)}>
                    <div className="text-headline-md font-extrabold">Lớp {g.grade}</div>
                    <div className={`mt-1 flex items-center gap-1 text-body-sm ${g.ready ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                      <Icon name={g.ready ? 'check_circle' : 'construction'} className="text-[16px]" filled={g.ready} /> {g.desc}
                    </div>
                  </Choice>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <StepTitle emoji="🎯" title="Mục tiêu của em là gì?" sub="Thầy AI sẽ gợi ý ải và bài ôn theo mục tiêu này." />
              <div className="flex flex-col gap-space-sm">
                {GOALS.map((g) => (
                  <Choice key={g.id} active={goal === g.id} onClick={() => setGoal(g.id)}>
                    <div className="flex items-center gap-space-md">
                      <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${g.color}`}>
                        <Icon name={g.icon} className="text-[26px]" filled />
                      </span>
                      <div className="text-left">
                        <div className="text-headline-sm">{g.title}</div>
                        <div className="text-body-sm text-on-surface-variant">{g.desc}</div>
                      </div>
                    </div>
                  </Choice>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <StepTitle emoji="🐾" title="Chọn một bạn đồng hành" sub="Bạn ấy sẽ đi cùng em qua từng ải. Qua ải trùm còn mở được thêm thú hiếm!" />
              <div className="grid grid-cols-3 gap-space-sm">
                {starters.map((p) => (
                  <button key={p.code} type="button" onClick={() => setPet(p.code)}
                    className={`group flex flex-col items-center rounded-3xl border-[3px] p-space-sm pb-space-md transition-all active:scale-95 ${
                      pet === p.code ? 'border-primary bg-primary-fixed/50 shadow-tactile-lg' : 'border-transparent bg-surface-container-low hover:bg-surface-container'
                    }`}>
                    <Pet code={p.code} size={104} bounce={pet === p.code} className="transition-transform group-hover:scale-105" />
                    <span className="mt-1 text-label-lg font-extrabold text-on-surface">{p.name}</span>
                    <span className="mt-0.5 hidden text-center text-body-sm text-on-surface-variant sm:block">{p.description}</span>
                  </button>
                ))}
              </div>
              <div className="mt-space-md flex items-center justify-center gap-2 rounded-2xl bg-secondary-fixed/60 px-space-md py-space-sm text-label-md text-on-secondary-fixed">
                <Coin size={20} /> Quà chào mừng: 30 xu để đổi thú mới
              </div>
            </>
          )}

          <ErrorBox message={error} />

          <div className="mt-space-lg flex items-center justify-between gap-space-sm">
            {step > 0 ? (
              <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>
                <Icon name="arrow_back" className="text-[20px]" /> Quay lại
              </button>
            ) : <span />}
            {step < 2 ? (
              <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className="btn-primary px-space-xl py-space-md text-headline-sm">
                Tiếp tục <Icon name="arrow_forward" className="text-[22px]" />
              </button>
            ) : (
              <button type="button" disabled={!canNext || saving} onClick={finish} className="btn-primary px-space-xl py-space-md text-headline-sm">
                {saving ? 'Đang mở bản đồ...' : 'Bắt đầu Ải 1'} <Icon name="flag" className="text-[22px]" filled />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepTitle({ emoji, title, sub }) {
  return (
    <div className="mb-space-lg text-center">
      <div className="mb-1 text-[40px] leading-none">{emoji}</div>
      <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{title}</h1>
      <p className="mt-1 text-body-md text-on-surface-variant">{sub}</p>
    </div>
  )
}

function Choice({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-2xl border-[3px] p-space-md text-left transition-all active:scale-[0.98] ${
        active ? 'border-primary bg-primary-fixed/50 shadow-tactile' : 'border-transparent bg-surface-container-low hover:bg-surface-container'
      }`}>
      {children}
    </button>
  )
}
