import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Logo from '../components/common/Logo'
import ErrorBox from '../components/common/ErrorBox'
import { Spinner } from '../components/common/Loading'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/client'
import loginImg from '../assets/login.jpg'

const COMPANIONS = [
  { emoji: '🤖', name: 'Thầy Trí AI', tag: 'Chỉ bài tận nơi', desc: 'Giải thích từng bước siêu dễ hiểu', color: 'bg-primary text-on-primary', text: 'text-primary' },
  { emoji: '👦', name: 'Tuấn Kiệt', tag: 'Đố vui & Phản biện', desc: 'Soi lỗi sai mẹo, đố vui nhận sao', color: 'bg-secondary-container text-on-secondary', text: 'text-secondary' },
  { emoji: '👧', name: 'Bảo An', tag: 'Mẹo tính nhanh', desc: 'Công thức tắt bỏ túi, làm bài siêu tốc', color: 'bg-tertiary-container text-on-tertiary', text: 'text-tertiary' },
]

const FEATURES = [
  { icon: 'smart_toy', title: '3 Bạn AI', desc: 'Kèm cặp & phản biện 1-1', color: 'bg-tertiary-fixed text-tertiary' },
  { icon: 'auto_stories', title: 'SGK Mới', desc: 'Bám sát chương trình GDPT 2018', color: 'bg-primary-fixed text-primary' },
  { icon: 'photo_camera', title: 'Giải bằng ảnh', desc: 'Chụp đề, có lời giải từng bước', color: 'bg-secondary-fixed text-secondary' },
  { icon: 'insights', title: 'Quiz điểm yếu', desc: 'Luyện đúng phần còn yếu', color: 'bg-surface-container-high text-primary' },
]

export default function LoginPage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ fullName: '', email: '', password: '', gradeLevel: 7 })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to={user.role === 'STUDENT' ? '/' : '/lecturer'} replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const isRegister = mode === 'register'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const u = isRegister
        ? await register({ ...form, email: form.email.trim(), gradeLevel: Number(form.gradeLevel) })
        : await login(form.email.trim(), form.password)
      const from = location.state?.from?.pathname
      navigate(u.role === 'STUDENT' ? from || '/' : '/lecturer', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#edf3ff]">
      <header className="bg-surface-container-lowest/95 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex h-20 items-center justify-between px-margin-mobile md:px-margin">
          <Logo to="/login" />
          <span className="chip hidden bg-secondary-fixed text-on-secondary-fixed sm:inline-flex">🎁 Tặng 7 ngày học thử 0đ</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest/80 px-5 py-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-container opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary-container" />
            </span>
            <span className="text-label-md font-bold text-on-surface">Phòng học AI sẵn sàng đón bạn vào thảo luận toán học!</span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Cột trái: nhân vật */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-surface-container-lowest p-6 shadow-xl sm:p-8 lg:col-span-7 lg:p-10">
            <div className="pointer-events-none absolute -left-16 -top-16 h-60 w-60 rounded-full bg-primary-fixed opacity-50 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-60 w-60 rounded-full bg-secondary-fixed opacity-60 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary-fixed px-4 py-1.5 text-label-md font-extrabold text-primary shadow-sm">
                <Icon name="psychology" className="text-[18px]" /> MAEL • BIỆT ĐỘI TOÁN CẤP 2
              </div>
              <div className="rounded-3xl bg-gradient-to-r from-surface-container-low to-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="animate-bounce text-3xl">👋</span>
                  <div className="flex flex-col">
                    <span className="text-headline-md font-extrabold leading-snug tracking-tight text-primary">
                      "Chào cậu! Cùng học toán vui với 3 bạn AI nhé!"
                    </span>
                    <span className="mt-1 text-body-md font-medium text-on-surface-variant">Đố vui tích điểm, giải bài từng bước không sợ sai! 🌟</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 my-4 flex justify-center">
              <div className="group relative aspect-square w-full max-w-[420px] overflow-hidden rounded-3xl shadow-md">
                <img src={loginImg} alt="Các bạn học cùng MAEL" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-md">
                  <span className="flex items-center gap-1.5 text-label-md font-extrabold text-primary">
                    <Icon name="forum" className="text-[18px]" /> Sẵn sàng giải toán hôm nay chưa?
                  </span>
                  <span className="rounded-xl bg-secondary-container px-2.5 py-1 text-label-sm font-black text-on-secondary">LÊN LỚP 🚀</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-2.5 pt-2 sm:gap-4">
              {COMPANIONS.map((c) => (
                <div key={c.name} className="flex flex-col items-center rounded-2xl bg-surface-container-low/90 p-3 shadow-sm sm:items-start sm:p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-sm ${c.color}`}>{c.emoji}</span>
                    <span className="hidden text-label-lg font-bold text-on-surface sm:inline">{c.name}</span>
                  </div>
                  <span className={`text-center text-label-sm font-extrabold sm:text-left ${c.text}`}>{c.tag}</span>
                  <span className="hidden text-body-sm leading-tight text-on-surface-variant sm:inline">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: form */}
          <div className="flex flex-col justify-between rounded-3xl bg-surface-container-lowest p-6 shadow-xl sm:p-8 lg:col-span-5">
            <div>
              <div className="mb-6 grid grid-cols-2 rounded-2xl bg-surface-container p-1.5">
                {[
                  { key: 'login', label: 'ĐĂNG NHẬP', icon: 'login' },
                  { key: 'register', label: 'ĐĂNG KÝ MỚI', icon: 'person_add' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { setMode(t.key); setError('') }}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-label-lg font-extrabold transition-all ${
                      mode === t.key ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Icon name={t.icon} className="text-[20px]" /> {t.label}
                  </button>
                ))}
              </div>

              {isRegister && (
                <div className="mb-6">
                  <label className="mb-2.5 block text-label-sm font-extrabold uppercase tracking-wider text-on-surface-variant">Chọn khối lớp của bạn:</label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[6, 7, 8, 9].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, gradeLevel: g }))}
                        className={`flex flex-col items-center justify-center rounded-2xl px-1 py-2.5 transition-all ${
                          Number(form.gradeLevel) === g
                            ? 'bg-primary text-on-primary shadow-md shadow-primary/30'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        <span className="text-headline-sm font-black">{g}</span>
                        <span className="text-label-sm font-bold">Lớp {g}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {isRegister && (
                  <Field icon="badge" label="Họ và tên của học sinh:">
                    <InputWithIcon icon="face" placeholder="Ví dụ: Nguyễn Minh Quân" value={form.fullName} onChange={set('fullName')} required />
                  </Field>
                )}
                <Field icon="account_circle" label="Email:">
                  <InputWithIcon icon="mail" type="email" placeholder="email@vidu.com" value={form.email} onChange={set('email')} required autoComplete="email" />
                </Field>
                <Field icon="key" label="Mật khẩu:">
                  <div className="relative">
                    <input
                      className="input pl-12 pr-12"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isRegister ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu bí mật của bạn'}
                      value={form.password}
                      onChange={set('password')}
                      required
                      minLength={isRegister ? 6 : undefined}
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                    />
                    <Icon name="lock" className="absolute left-3.5 top-4 text-[24px] text-on-surface-variant" />
                    <button type="button" className="absolute right-3.5 top-4 text-on-surface-variant hover:text-on-surface" onClick={() => setShowPassword((v) => !v)}>
                      <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[24px]" />
                    </button>
                  </div>
                </Field>

                <ErrorBox message={error} />

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-headline-sm font-black tracking-wide text-on-primary shadow-[0_5px_0_0_#003ea8] transition-all hover:bg-primary-container active:translate-y-[2px] disabled:opacity-70"
                >
                  {submitting ? <Spinner className="text-[24px]" /> : <span className="text-2xl">🚀</span>}
                  <span>{isRegister ? 'TẠO TÀI KHOẢN & HỌC THỬ' : 'VÀO HỌC NGAY'}</span>
                </button>
              </form>
            </div>

            <div className="mt-6 flex flex-col gap-2 border-t border-surface-container-low pt-4">
              <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-secondary-fixed/40 to-primary-fixed/30 p-3.5">
                <span className="text-2xl">🎉</span>
                <div className="flex flex-col">
                  <span className="text-label-md font-black text-on-secondary-fixed">Chưa có tài khoản? Nhận ngay 7 ngày học thử miễn phí 0đ</span>
                  <span className="text-body-sm text-on-surface-variant">Sau đó chỉ 99.000đ/tháng để học tiếp cùng 3 bạn AI.</span>
                </div>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
                <span className="font-bold text-on-surface">Tài khoản demo</span> (mật khẩu <code>123456</code>): hocsinh@mael.vn • giangvien@mael.vn
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                <Icon name={f.icon} className="text-[26px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-headline-sm font-black text-on-surface">{f.title}</span>
                <span className="text-label-sm font-bold text-on-surface-variant">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function Field({ icon, label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-label-md font-bold text-on-surface">
        <Icon name={icon} className="text-[18px] text-primary" /> {label}
      </label>
      {children}
    </div>
  )
}

function InputWithIcon({ icon, ...props }) {
  return (
    <div className="relative">
      <input className="input pl-12 pr-4" {...props} />
      <Icon name={icon} className="absolute left-3.5 top-4 text-[24px] text-on-surface-variant" />
    </div>
  )
}
