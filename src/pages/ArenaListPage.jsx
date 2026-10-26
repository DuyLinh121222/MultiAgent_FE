import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import Monster from '../components/game/Monster'
import Pet from '../components/game/Pet'
import { EnergyBar, formatCountdown } from '../components/game/EnergyModal'
import { gameApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
const BG = [
  'from-[#e3f9d9] to-[#c9efb8]', 'from-[#fff2d6] to-[#ffdca3]', 'from-[#dcf5ef] to-[#b6e6d8]',
  'from-[#ddefff] to-[#b8dcff]', 'from-[#ece6ff] to-[#d6ccff]',
]

/** Danh sách Đấu trường theo chương: mỗi chương 1 quái vật */
export default function ArenaListPage() {
  const { user } = useAuth()
  const [arenas, setArenas] = useState(null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([gameApi.arenas(), gameApi.profile()])
      .then(([a, p]) => { setArenas(a); setProfile(p) })
      .catch((e) => setError(getErrorMessage(e)))
  }, [])

  if (!arenas && !error) return <Loading text="Đang mở Đấu trường..." />

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-space-lg px-margin-mobile py-space-lg md:px-margin">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#3b2a8f] to-[#5b3fd0] p-space-lg text-white shadow-lg sm:p-space-xl">
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-space-md sm:flex-row sm:items-center">
          <div className="flex items-end gap-2">
            <Pet code={user?.activePetCode} size={90} bounce />
            <Icon name="swords" filled className="mb-6 text-[34px] text-secondary-container" />
            <Monster index={1} size={90} className="monster-idle" />
          </div>
          <div className="flex-1">
            <h1 className="text-headline-lg font-black">Đấu trường</h1>
            <div className="mt-1 flex flex-wrap gap-2 text-label-md">
              <span className="chip bg-white/15"><Icon name="timer" className="text-[16px]" /> 2 phút</span>
              <span className="chip bg-white/15"><Icon name="favorite" filled className="text-[16px] text-[#ff8fa3]" /> 3 tim</span>
              <span className="chip bg-white/15"><Icon name="bolt" filled className="text-[16px] text-secondary-container" /> Combo x điểm</span>
            </div>
          </div>
          {profile && (
            <div className="rounded-2xl bg-white/15 px-space-md py-space-sm">
              <EnergyBar energy={profile.energy} max={profile.maxEnergy} size={22} />
              <div className="mt-0.5 text-center text-label-sm text-white/80">
                {profile.energy >= profile.maxEnergy ? 'Thể lực đầy' : `+1 sau ${formatCountdown(profile.nextEnergyInSeconds)}`}
              </div>
            </div>
          )}
        </div>
      </section>

      <ErrorBox message={error} />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
        {arenas?.map((a, i) => {
          const locked = !a.unlocked
          const name = a.name.split('. ').slice(1).join('. ') || a.name
          return (
            <div key={a.topicId} className={`relative flex items-center gap-space-md overflow-hidden rounded-[28px] bg-gradient-to-br ${BG[i % BG.length]} p-space-md shadow-sm ${locked ? 'opacity-70 grayscale-[0.6]' : ''}`}>
              <Monster index={i} size={96} className={locked ? '' : 'monster-idle'} />
              <div className="min-w-0 flex-1">
                <div className="text-label-sm uppercase tracking-wider text-on-surface-variant">Chương {ROMAN[a.orderIndex - 1] || a.orderIndex}</div>
                <div className="line-clamp-2 text-headline-sm text-on-surface">{name}</div>
                <div className="mt-1 flex items-center gap-2 text-label-md text-on-surface-variant">
                  <Icon name="emoji_events" filled className="text-[18px] text-secondary" /> {a.bestScore || 0}
                  <span className="text-outline">•</span>
                  <Icon name="quiz" className="text-[18px]" /> {a.questionCount}
                </div>
              </div>
              {locked ? (
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-outline"><Icon name="lock" filled /></span>
              ) : (
                <Link to={`/arena/${a.topicId}`} state={{ index: i, name }} className="flex flex-col items-center rounded-2xl bg-primary px-space-md py-space-sm text-label-lg font-extrabold text-white shadow-[0_4px_0_0_#00318a] active:translate-y-[2px]">
                  <Icon name="play_arrow" filled className="text-[26px]" />
                  <span className="flex items-center text-[11px]"><Icon name="bolt" filled className="text-[14px] text-secondary-container" />1</span>
                </Link>
              )}
            </div>
          )
        })}
      </div>
      {arenas?.length === 0 && <p className="text-center text-body-md text-on-surface-variant">Chưa có đấu trường cho lớp của em.</p>}
    </div>
  )
}
