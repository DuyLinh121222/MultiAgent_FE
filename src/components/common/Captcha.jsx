import { useCallback, useEffect, useState } from 'react'
import Icon from './Icon'
import { publicApi } from '../../api/services'

/**
 * Ô mã xác nhận hình (chống gửi form tự động / spam).
 * value = { token, answer }. Đổi reloadKey để lấy mã mới (sau mỗi lần gửi lỗi).
 */
export default function Captcha({ value, onChange, reloadKey = 0 }) {
  const [captcha, setCaptcha] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const c = await publicApi.captcha()
      setCaptcha(c)
      onChange({ token: c.token, answer: '', enabled: c.enabled })
    } catch {
      setError('Không tải được mã xác nhận')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load, reloadKey])

  if (captcha && !captcha.enabled) return null
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-label-md font-bold text-on-surface">
        <Icon name="verified_user" className="text-[18px] text-primary" /> Mã xác nhận:
      </label>
      <div className="flex items-center gap-2">
        <div className="flex h-14 w-[150px] flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-low">
          {captcha?.image ? <img src={captcha.image} alt="Mã xác nhận" className="h-full w-full object-cover" /> : <span className="text-body-sm text-outline">{error || '...'}</span>}
        </div>
        <button type="button" onClick={load} title="Đổi mã khác" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high">
          <Icon name="refresh" className="text-[22px] text-primary" />
        </button>
        <input className="input h-14 min-w-0 flex-1 uppercase tracking-[0.3em]" placeholder="Nhập mã" maxLength={6} required
          value={value?.answer || ''} onChange={(e) => onChange({ ...value, answer: e.target.value })} autoComplete="off" />
      </div>
    </div>
  )
}
