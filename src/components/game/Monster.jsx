import { useId } from 'react'

const COLORS = [
  ['#7ee08a', '#2e8b3a'],
  ['#ffb36b', '#d9600a'],
  ['#5fd6b7', '#0d7c63'],
  ['#7fb7ff', '#1f5fd1'],
  ['#b9a4ff', '#5b3fd0'],
]

/** Quái vật hoạt hình của Đấu trường (mỗi chương một màu). hurt = vừa bị trúng đòn */
export default function Monster({ index = 0, size = 150, hurt = false, defeated = false, className = '' }) {
  const id = useId().replace(/:/g, '')
  const [light, dark] = COLORS[index % COLORS.length]
  return (
    <svg viewBox="0 0 160 150" width={size} height={size * 0.94} className={className} aria-hidden="true"
      style={defeated ? { filter: 'grayscale(0.9)', opacity: 0.6 } : undefined}>
      <defs>
        <radialGradient id={`m${id}`} cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="140" rx="52" ry="8" fill="#000" opacity="0.15" />
      {/* Sừng */}
      <path d="M44 40 L36 8 L60 32 Z" fill="#fff4d6" stroke={dark} strokeWidth="3" strokeLinejoin="round" />
      <path d="M116 40 L124 8 L100 32 Z" fill="#fff4d6" stroke={dark} strokeWidth="3" strokeLinejoin="round" />
      {/* Thân */}
      <path d="M20 96 C20 50 46 26 80 26 C114 26 140 50 140 96 C140 126 118 138 80 138 C42 138 20 126 20 96 Z" fill={`url(#m${id})`} stroke={dark} strokeWidth="3" />
      <ellipse cx="62" cy="48" rx="16" ry="8" fill="#fff" opacity="0.25" />
      {/* Tay */}
      <path d="M22 92 C6 88 6 112 22 108" fill={light} stroke={dark} strokeWidth="3" />
      <path d="M138 92 C154 88 154 112 138 108" fill={light} stroke={dark} strokeWidth="3" />
      {/* Mắt */}
      {defeated ? (
        <g stroke="#1a1a2a" strokeWidth="4" strokeLinecap="round">
          <path d="M50 68 l14 12 M64 68 l-14 12" /><path d="M96 68 l14 12 M110 68 l-14 12" />
        </g>
      ) : hurt ? (
        <g stroke="#1a1a2a" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M48 76 l16 -6 l-16 -6" /><path d="M112 76 l-16 -6 l16 -6" />
        </g>
      ) : (
        <g>
          <ellipse cx="57" cy="72" rx="13" ry="15" fill="#fff" />
          <ellipse cx="103" cy="72" rx="13" ry="15" fill="#fff" />
          <circle cx="60" cy="75" r="6.5" fill="#1a1a2a" />
          <circle cx="100" cy="75" r="6.5" fill="#1a1a2a" />
          <circle cx="62" cy="72" r="2.2" fill="#fff" />
          <circle cx="102" cy="72" r="2.2" fill="#fff" />
          <path d="M42 54 L68 62" stroke="#1a1a2a" strokeWidth="4" strokeLinecap="round" />
          <path d="M118 54 L92 62" stroke="#1a1a2a" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {/* Miệng */}
      <path d={hurt || defeated ? 'M58 112 Q80 100 102 112' : 'M54 104 Q80 126 106 104 Z'} fill={hurt || defeated ? 'none' : '#5a1a2a'} stroke="#1a1a2a" strokeWidth="3" strokeLinejoin="round" />
      {!hurt && !defeated && (
        <g fill="#fff">
          <path d="M64 106 l5 9 l5 -9 Z" /><path d="M86 106 l5 9 l5 -9 Z" />
        </g>
      )}
    </svg>
  )
}
