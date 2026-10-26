import { Link } from 'react-router-dom'

/** Biểu tượng MAEL.EDU: chữ M dạng đường đi ải + ngôi sao thưởng */
export function LogoMark({ size = 36, className = '' }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mael-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#004ac6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#mael-logo-g)" />
      <rect x="2" y="2" width="60" height="30" rx="16" fill="#fff" opacity="0.12" />
      <path d="M14 46V20l10 12 8-10 8 10 10-12v26" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 8l2.6 5.4L58 16l-5.4 2.6L50 24l-2.6-5.4L42 16l5.4-2.6z" fill="#fea619" className="logo-spark" />
    </svg>
  )
}

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="group flex items-center gap-2" aria-label="MAEL.EDU - Trang chủ">
      <LogoMark size={38} className="transition-transform group-hover:-rotate-6 group-hover:scale-105" />
      <span className={`text-[22px] font-black leading-none tracking-tight ${light ? 'text-white' : 'text-primary'}`}>
        MAEL<span className="text-secondary-container">.EDU</span>
      </span>
    </Link>
  )
}
