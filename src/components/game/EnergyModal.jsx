import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../common/Icon'
import Pet from './Pet'
import { gameApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

/** Thanh thể lực dạng các tia sét */
export function EnergyBar({ energy = 0, max = 5, size = 22, className = '' }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`Thể lực ${energy}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon key={i} name="bolt" filled className={`${i < energy ? 'text-[#ffb703] drop-shadow-[0_1px_0_#c27c00]' : 'text-outline-variant'}`}
          style={{ fontSize: size }} />
      ))}
    </div>
  )
}

export function formatCountdown(sec) {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Màn "Hết thể lực": hiện khi BE trả lỗi 429 (client.js phát sự kiện mael:no-energy).
 * Mỗi lượt chơi tốn 1 thể lực, tự hồi 1 điểm sau 30 phút.
 */
export default function EnergyModal() {
  const { user, patchUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [left, setLeft] = useState(0)

  useEffect(() => {
    const onEvent = () => {
      setOpen(true)
      gameApi.profile().then((p) => {
        setProfile(p)
        setLeft(p.nextEnergyInSeconds)
        patchUser({ energy: p.energy })
      }).catch(() => {})
    }
    window.addEventListener('mael:no-energy', onEvent)
    return () => window.removeEventListener('mael:no-energy', onEvent)
  }, [patchUser])

  useEffect(() => {
    if (!open || left <= 0) return undefined
    const t = setInterval(() => setLeft((x) => x - 1), 1000)
    return () => clearInterval(t)
  }, [open, left])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="pop-in w-full max-w-sm rounded-[28px] bg-gradient-to-b from-[#e8ecff] to-surface-container-lowest p-space-lg text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="relative mx-auto w-fit">
          <Pet code={user?.activePetCode} size={110} />
          <span className="absolute -right-4 top-0 text-headline-md font-black text-primary/70">z<span className="text-headline-sm">z</span></span>
        </div>
        <h2 className="mt-space-sm text-headline-md text-on-surface">Hết thể lực rồi!</h2>
        <EnergyBar energy={profile?.energy ?? 0} max={profile?.maxEnergy ?? 5} size={30} className="mt-space-sm justify-center" />
        <div className="mt-space-sm flex items-center justify-center gap-2 text-headline-sm text-primary">
          <Icon name="timer" className="text-[24px]" /> +1 <Icon name="bolt" filled className="text-[22px] text-[#ffb703]" /> sau {formatCountdown(left)}
        </div>
        <div className="mt-space-md grid grid-cols-2 gap-space-sm">
          <Link to="/study-room" onClick={() => setOpen(false)} className="flex flex-col items-center gap-1 rounded-2xl bg-white p-space-sm text-label-md text-on-surface shadow-sm">
            <Icon name="forum" className="text-[28px] text-primary" /> Thảo luận AI
            <span className="text-[10px] text-tertiary">Không tốn thể lực</span>
          </Link>
          <Link to="/pets" onClick={() => setOpen(false)} className="flex flex-col items-center gap-1 rounded-2xl bg-white p-space-sm text-label-md text-on-surface shadow-sm">
            <Icon name="pets" className="text-[28px] text-secondary" /> Thăm thú cưng
            <span className="text-[10px] text-tertiary">Không tốn thể lực</span>
          </Link>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="btn-primary mt-space-md w-full py-space-md">Nghỉ một chút</button>
      </div>
    </div>
  )
}
