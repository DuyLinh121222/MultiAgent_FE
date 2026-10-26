import { useEffect, useState } from 'react'
import Icon from '../common/Icon'
import { Coin } from './GameArt'

export const TIER_STYLE = {
  1: { ring: 'from-[#e9b38a] to-[#b4693d]', label: 'Đồng' },
  2: { ring: 'from-[#e6ebf2] to-[#9aa5b8]', label: 'Bạc' },
  3: { ring: 'from-[#fff07a] to-[#e8a400]', label: 'Vàng' },
  4: { ring: 'from-[#b9f3ff] to-[#7c6cf6]', label: 'Kim cương' },
}

/** Huy hiệu tròn có viền theo hạng */
export function Badge({ icon, tier = 1, earned = true, size = 56 }) {
  const t = TIER_STYLE[tier] || TIER_STYLE[1]
  return (
    <span className={`flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br p-[3px] ${earned ? t.ring : 'from-surface-container to-surface-container-high'}`}
      style={{ width: size, height: size }}>
      <span className={`flex h-full w-full items-center justify-center rounded-full ${earned ? 'bg-white' : 'bg-surface-container-low'}`}>
        <Icon name={icon || 'military_tech'} filled={earned} className={earned ? 'text-secondary' : 'text-outline'} style={{ fontSize: size * 0.5 }} />
      </span>
    </span>
  )
}

/** Thông báo vừa mở huy hiệu mới (tự ẩn sau vài giây) */
export default function AchievementToast({ items }) {
  const [list, setList] = useState(items || [])
  useEffect(() => {
    setList(items || [])
    if (!items?.length) return undefined
    const t = setTimeout(() => setList([]), 6000)
    return () => clearTimeout(t)
  }, [items])
  if (!list.length) return null
  return (
    <div className="fixed right-4 top-24 z-[70] flex w-72 flex-col gap-2">
      {list.slice(0, 4).map((a, i) => (
        <div key={a.code} className="pop-in flex items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-sm shadow-xl ring-2 ring-secondary-fixed"
          style={{ animationDelay: `${i * 0.15}s` }}>
          <Badge icon={a.iconUrl} tier={a.tier} size={48} />
          <div className="min-w-0 flex-1">
            <div className="text-label-sm uppercase text-secondary">Huy hiệu mới!</div>
            <div className="truncate text-label-lg text-on-surface">{a.name}</div>
          </div>
          <span className="flex items-center gap-0.5 text-label-lg font-extrabold text-on-surface"><Coin size={16} />+{a.points}</span>
        </div>
      ))}
    </div>
  )
}
