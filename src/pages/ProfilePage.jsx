import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import Pet from '../components/game/Pet'
import { EnergyBar, formatCountdown } from '../components/game/EnergyModal'
import { gameApi, profileApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatVND } from '../utils/format'

const GOALS = [
  { key: 'EXAM_10', label: 'Thi vào 10', icon: 'school' },
  { key: 'FOLLOW_CLASS', label: 'Theo kịp lớp', icon: 'menu_book' },
  { key: 'REBUILD_BASICS', label: 'Lấy lại gốc', icon: 'construction' },
]

/** Hồ sơ học sinh: sửa thông tin, đổi mật khẩu, xem gói và ngày hết hạn, chuỗi ngày, thể lực */
export default function ProfilePage() {
  const { refreshUser, patchUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [game, setGame] = useState(null)
  const [form, setForm] = useState(null)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [p, g] = await Promise.all([profileApi.get(), gameApi.profile()])
      setProfile(p)
      setGame(g)
      setForm({ fullName: p.fullName || '', phone: p.phone || '', gradeLevel: p.gradeLevel, dateOfBirth: p.dateOfBirth || '', learningGoal: p.learningGoal || 'FOLLOW_CLASS' })
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }
  useEffect(() => { load() }, [])

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const p = await profileApi.update({ ...form, gradeLevel: Number(form.gradeLevel), dateOfBirth: form.dateOfBirth || null, phone: form.phone.trim() })
      setProfile(p)
      await refreshUser()
      flash('Đã lưu hồ sơ')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setError('')
    if (pw.newPassword !== pw.confirm) return setError('Mật khẩu nhập lại chưa khớp')
    try {
      await profileApi.changePassword(pw.currentPassword, pw.newPassword)
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      flash('Đã đổi mật khẩu')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const buyShield = async () => {
    setError('')
    try {
      const g = await gameApi.buyShield()
      setGame(g)
      patchUser({ coins: g.coins })
      flash('Đã mua 1 khiên giữ chuỗi')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (!profile && !error) return <Loading />
  if (!profile) return <div className="page"><ErrorBox message={error} /></div>

  const sub = profile.subscription
  const totalDays = sub ? Math.max(1, Math.round((new Date(sub.endDate) - new Date(sub.startDate)) / 86400000)) : 1
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-space-lg px-margin-mobile py-space-lg md:px-margin">
      {notice && <div className="pop-in fixed left-1/2 top-24 z-[70] -translate-x-1/2 rounded-2xl bg-tertiary px-space-lg py-space-sm text-label-lg text-white shadow-lg">{notice}</div>}

      {/* Thẻ người chơi */}
      <section className="flex flex-col gap-space-md rounded-[28px] bg-gradient-to-r from-primary to-primary-container p-space-lg text-white shadow-lg sm:flex-row sm:items-center">
        <span className="rounded-3xl bg-white/15 p-1"><Pet code={profile.activePetCode} size={84} bounce /></span>
        <div className="flex-1">
          <h1 className="text-headline-lg font-black">{profile.fullName}</h1>
          <div className="text-body-md text-primary-fixed">{profile.email} • Lớp {profile.gradeLevel} • Tham gia {formatDate(profile.joinedAt)}</div>
        </div>
        {game && (
          <div className="grid grid-cols-3 gap-space-sm">
            <Mini icon="local_fire_department" value={game.streakDays} label="ngày" color="text-[#ffb27a]" />
            <Mini icon="shield" value={game.streakShields} label="khiên" color="text-[#9be7ff]" />
            <Mini icon="trending_up" value={game.level} label="cấp" color="text-tertiary-fixed" />
          </div>
        )}
      </section>

      <ErrorBox message={error} />

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
        {/* Gói học */}
        <section className="flex flex-col gap-space-md rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm lg:col-span-5">
          <h2 className="flex items-center gap-2 text-headline-sm text-on-surface"><Icon name="workspace_premium" className="text-[24px] text-primary" /> Gói học</h2>
          {sub ? (
            <>
              <div className={`rounded-2xl p-space-md ${sub.trial ? 'bg-secondary-fixed/60' : 'bg-tertiary-fixed/50'}`}>
                <div className="text-label-md text-on-surface-variant">{sub.trial ? 'Đang dùng thử miễn phí' : 'Đang dùng'}</div>
                <div className="text-headline-md font-extrabold text-on-surface">{sub.planName}</div>
                <div className="mt-space-sm flex items-baseline gap-1">
                  <span className="text-display font-black text-primary">{sub.daysLeft}</span>
                  <span className="text-body-lg text-on-surface-variant">ngày còn lại</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary-fixed-dim to-primary" style={{ width: `${Math.min(100, (sub.daysLeft * 100) / totalDays)}%` }} />
                </div>
                <div className="mt-space-sm grid grid-cols-2 gap-2 text-body-sm">
                  <div><div className="text-on-surface-variant">Bắt đầu</div><b>{formatDate(sub.startDate)}</b></div>
                  <div><div className="text-on-surface-variant">Hết hạn</div><b className="text-error">{formatDate(sub.endDate)}</b></div>
                </div>
              </div>
              <Link to="/pricing" className="btn-primary py-space-md"><Icon name="bolt" className="text-[20px]" /> {sub.trial ? 'Kích hoạt gói' : 'Gia hạn'}</Link>
            </>
          ) : (
            <div className="rounded-2xl bg-error-container/60 p-space-md text-on-error-container">
              <div className="text-headline-sm">Gói học đã hết hạn</div>
              <Link to="/pricing" className="btn-primary mt-space-sm w-full">Kích hoạt gói</Link>
            </div>
          )}
          {profile.history?.length > 0 && (
            <div>
              <div className="mb-1 text-label-md text-on-surface-variant">Lịch sử gói</div>
              <ul className="flex flex-col gap-1">
                {profile.history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between rounded-xl bg-surface-container-low px-space-sm py-1.5 text-body-sm">
                    <span className="font-semibold">{h.planName}</span>
                    <span className="text-on-surface-variant">{formatDate(h.startDate)} → {formatDate(h.endDate)}</span>
                    <span>{h.trial ? '0đ' : formatVND(h.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {game && (
            <div className="rounded-2xl bg-surface-container-low p-space-md">
              <div className="flex items-center justify-between">
                <span className="text-label-lg text-on-surface">Thể lực</span>
                <EnergyBar energy={game.energy} max={game.maxEnergy} size={20} />
              </div>
              <div className="text-body-sm text-on-surface-variant">
                {game.energy >= game.maxEnergy ? 'Đầy' : `+1 sau ${formatCountdown(game.nextEnergyInSeconds)}`} • mỗi lượt chơi tốn 1
              </div>
              <div className="mt-space-sm flex items-center justify-between gap-2">
                <span className="text-body-sm text-on-surface-variant"><Icon name="shield" filled className="align-middle text-[18px] text-primary" /> Khiên giữ chuỗi: <b>{game.streakShields}/3</b></span>
                <button type="button" onClick={buyShield} disabled={game.streakShields >= 3} className="btn-secondary py-1 text-label-md">Mua 60 xu</button>
              </div>
            </div>
          )}
        </section>

        {/* Sửa hồ sơ */}
        <div className="flex flex-col gap-space-lg lg:col-span-7">
          <form onSubmit={save} className="flex flex-col gap-space-sm rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm">
            <h2 className="flex items-center gap-2 text-headline-sm text-on-surface"><Icon name="edit" className="text-[24px] text-primary" /> Thông tin của em</h2>
            <Label text="Họ và tên"><input className="input h-12" value={form.fullName} onChange={set('fullName')} required maxLength={150} /></Label>
            <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
              <Label text="Số điện thoại phụ huynh"><input className="input h-12" value={form.phone} onChange={set('phone')} inputMode="tel" placeholder="09xxxxxxxx" /></Label>
              <Label text="Ngày sinh"><input className="input h-12" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} /></Label>
            </div>
            <Label text="Lớp">
              <div className="grid grid-cols-4 gap-2">
                {[6, 7, 8, 9].map((g) => (
                  <button key={g} type="button" onClick={() => setForm((f) => ({ ...f, gradeLevel: g }))}
                    className={`rounded-2xl py-space-sm text-headline-sm font-black ${Number(form.gradeLevel) === g ? 'bg-primary text-white shadow-tactile' : 'bg-surface-container-low text-on-surface-variant'}`}>{g}</button>
                ))}
              </div>
            </Label>
            <Label text="Mục tiêu">
              <div className="grid grid-cols-3 gap-2">
                {GOALS.map((g) => (
                  <button key={g.key} type="button" onClick={() => setForm((f) => ({ ...f, learningGoal: g.key }))}
                    className={`flex flex-col items-center gap-1 rounded-2xl py-space-sm text-label-md ${form.learningGoal === g.key ? 'bg-secondary-fixed text-on-secondary-fixed ring-2 ring-secondary-container' : 'bg-surface-container-low text-on-surface-variant'}`}>
                    <Icon name={g.icon} className="text-[22px]" /> {g.label}
                  </button>
                ))}
              </div>
            </Label>
            <button type="submit" disabled={saving} className="btn-primary mt-space-xs py-space-md">{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
          </form>

          <form onSubmit={changePassword} className="flex flex-col gap-space-sm rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm">
            <h2 className="flex items-center gap-2 text-headline-sm text-on-surface"><Icon name="lock_reset" className="text-[24px] text-primary" /> Đổi mật khẩu</h2>
            <input className="input h-12" type="password" placeholder="Mật khẩu hiện tại" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required autoComplete="current-password" />
            <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
              <input className="input h-12" type="password" placeholder="Mật khẩu mới (từ 6 kí tự)" minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required autoComplete="new-password" />
              <input className="input h-12" type="password" placeholder="Nhập lại mật khẩu mới" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn-secondary py-space-sm">Đổi mật khẩu</button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Label({ text, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-md text-on-surface-variant">{text}</span>
      {children}
    </label>
  )
}

function Mini({ icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white/15 px-space-sm py-space-xs">
      <Icon name={icon} filled className={`text-[24px] ${color}`} />
      <span className="text-headline-sm font-black">{value}</span>
      <span className="text-[10px] text-primary-fixed">{label}</span>
    </div>
  )
}
