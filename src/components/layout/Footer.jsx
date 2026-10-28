import { Link } from 'react-router-dom'
import Icon from '../common/Icon'
import { LogoMark } from '../common/Logo'
import { CONTACT } from '../../constants/site'

export default function Footer() {
  return (
    <footer className="relative z-10 mt-space-xl w-full bg-surface-container-low py-space-xl">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-space-lg px-margin-mobile text-body-sm text-on-surface-variant md:grid-cols-3 md:px-margin">
        <div className="flex items-start gap-space-sm">
          <LogoMark size={40} />
          <div>
            <div className="text-label-lg font-black text-primary">MAEL<span className="text-secondary-container">.EDU</span></div>
            <div>Học Toán THCS như chơi game, cùng Thầy AI và 2 bạn AI.</div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 font-semibold text-on-surface hover:text-primary">
            <Icon name="mail" className="text-[18px] text-primary" /> {CONTACT.email}
          </a>
        </div>
        <div className="flex flex-wrap items-start gap-x-space-lg gap-y-1 md:justify-end">
          <Link className="transition-colors hover:text-primary" to="/plans">Bảng giá</Link>
          <Link className="transition-colors hover:text-primary" to="/#lien-he">Liên hệ</Link>
          <Link className="transition-colors hover:text-primary" to="/#tin-tuc">Tin tức</Link>
          <span>© {new Date().getFullYear()} MAEL.EDU</span>
        </div>
      </div>
    </footer>
  )
}
