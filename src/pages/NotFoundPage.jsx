import { Link } from 'react-router-dom'
import Icon from '../components/common/Icon'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-space-md bg-surface p-space-lg text-center">
      <div className="text-[64px] font-extrabold text-primary">404</div>
      <p className="text-headline-sm text-on-surface">Ôi, trang này không tồn tại!</p>
      <Link to="/" className="btn-primary">
        <Icon name="home" className="text-[20px]" /> Về trang chủ
      </Link>
    </div>
  )
}
