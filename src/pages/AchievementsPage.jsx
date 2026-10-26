import { useEffect, useState } from 'react'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import { Badge, TIER_STYLE } from '../components/game/AchievementToast'
import { studentApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { formatDate } from '../utils/format'

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả', icon: 'apps' },
  { key: 'LEARN', label: 'Đi ải', icon: 'map' },
  { key: 'STREAK', label: 'Chuỗi ngày', icon: 'local_fire_department' },
  { key: 'GAME', label: 'Đấu trường', icon: 'sports_esports' },
  { key: 'COLLECT', label: 'Sưu tầm', icon: 'pets' },
  { key: 'SOCIAL', label: 'Cùng AI', icon: 'forum' },
]

/** Bộ sưu tập huy hiệu: có thanh tiến độ để biết còn bao xa */
export default function AchievementsPage() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [cat, setCat] = useState('ALL')

  useEffect(() => {
    studentApi.achievements().then(setItems).catch((e) => setError(getErrorMessage(e)))
  }, [])

  if (!items && !error) return <Loading />
  const earned = items?.filter((a) => a.earned) || []
  const shown = (items || []).filter((a) => cat === 'ALL' || a.category === cat)
    .sort((a, b) => Number(b.earned) - Number(a.earned) || (b.progress / (b.target || 1)) - (a.progress / (a.target || 1)))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-space-lg px-margin-mobile py-space-lg md:px-margin">
      <section className="flex flex-col gap-space-md rounded-[28px] bg-gradient-to-r from-[#fff4cf] to-[#ffe2b8] p-space-lg shadow-sm sm:flex-row sm:items-center">
        <Badge icon="military_tech" tier={3} size={76} />
        <div className="flex-1">
          <h1 className="text-headline-lg text-on-surface">Huy hiệu</h1>
          <div className="mt-1 h-3 w-full max-w-sm overflow-hidden rounded-full bg-white/70">
            <div className="h-full rounded-full bg-gradient-to-r from-secondary-container to-secondary" style={{ width: `${items?.length ? (earned.length * 100) / items.length : 0}%` }} />
          </div>
          <div className="mt-1 text-label-lg text-on-secondary-fixed">{earned.length}/{items?.length || 0} huy hiệu</div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((t) => (
            <div key={t} className="flex flex-col items-center rounded-2xl bg-white/70 px-2 py-1">
              <Badge icon="star" tier={t} size={30} />
              <span className="text-[10px] font-bold text-on-surface-variant">{earned.filter((a) => a.tier === t).length}</span>
            </div>
          ))}
        </div>
      </section>

      <ErrorBox message={error} />

      <div className="flex gap-space-sm overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.key} type="button" onClick={() => setCat(c.key)}
            className={`flex flex-shrink-0 items-center gap-1 rounded-full px-space-md py-space-sm text-label-lg ${cat === c.key ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant shadow-sm'}`}>
            <Icon name={c.icon} className="text-[18px]" /> {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((a) => {
          const pct = a.target ? Math.round((a.progress * 100) / a.target) : a.earned ? 100 : 0
          return (
            <div key={a.id} className={`flex items-center gap-space-md rounded-[24px] p-space-md shadow-sm ${a.earned ? 'bg-surface-container-lowest' : 'bg-surface-container-lowest/80'}`}>
              <Badge icon={a.iconUrl} tier={a.tier} earned={a.earned} size={60} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className={`truncate text-label-lg ${a.earned ? 'text-on-surface' : 'text-on-surface-variant'}`}>{a.name}</span>
                  <span className="rounded px-1 text-[10px] font-bold text-outline">{TIER_STYLE[a.tier]?.label}</span>
                </div>
                <div className="truncate text-body-sm text-on-surface-variant">{a.description}</div>
                {a.earned ? (
                  <div className="text-label-sm text-tertiary">✓ {formatDate(a.earnedAt)} • +{a.points} xu</div>
                ) : a.target ? (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-fixed-dim to-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-label-sm tabular-nums text-on-surface-variant">{a.progress}/{a.target}</span>
                  </div>
                ) : (
                  <div className="text-label-sm text-primary">{a.criteria} • +{a.points} xu</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
