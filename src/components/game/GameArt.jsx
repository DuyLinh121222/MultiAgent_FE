import { useId } from 'react'

/** Đồ hoạ SVG dùng chung cho bản đồ ải: sao, xu, rương báu, cảnh vật từng vùng đất. */

export function Star({ filled = true, size = 20, className = '' }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff07a" />
          <stop offset="100%" stopColor="#ffb703" />
        </linearGradient>
      </defs>
      <path d="M12 1.8l3.1 6.4 7 1-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7L1.9 9.2l7-1z"
        fill={filled ? `url(#s${id})` : '#d5dbea'} stroke={filled ? '#e08e00' : '#b8c0d4'} strokeWidth="1.2" strokeLinejoin="round" />
      {filled && <path d="M8.6 8.9l2.2-.3" stroke="#fffbe0" strokeWidth="1.4" strokeLinecap="round" />}
    </svg>
  )
}

export function Stars({ value = 0, max = 3, size = 18, className = '' }) {
  return (
    <div className={`flex items-end gap-0.5 ${className}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} filled={i < value} size={i === 1 ? size * 1.2 : size} className={i === 1 ? '-translate-y-1' : ''} />
      ))}
    </div>
  )
}

export function Coin({ size = 20, className = '' }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`c${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff6b0" />
          <stop offset="60%" stopColor="#ffc93c" />
          <stop offset="100%" stopColor="#e89400" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10.5" fill={`url(#c${id})`} stroke="#c97a00" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="#e89400" strokeWidth="1.1" opacity="0.7" />
      <path d="M12 7.4l1.4 2.9 3.2.4-2.3 2.2.6 3.1-2.9-1.5-2.9 1.5.6-3.1-2.3-2.2 3.2-.4z" fill="#fff3b0" />
    </svg>
  )
}

/** Rương báu: open = đã mở (phát sáng) */
export function Chest({ size = 72, open = false, locked = false, className = '' }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9} className={className} aria-hidden="true"
      style={locked ? { filter: 'grayscale(0.85)', opacity: 0.75 } : undefined}>
      <defs>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c47a3c" />
          <stop offset="100%" stopColor="#7d4519" />
        </linearGradient>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff07a" />
          <stop offset="100%" stopColor="#f0a000" />
        </linearGradient>
        <radialGradient id={`l${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7c2" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff7c2" stopOpacity="0" />
        </radialGradient>
      </defs>
      {open && <ellipse cx="50" cy="38" rx="48" ry="34" fill={`url(#l${id})`} />}
      <ellipse cx="50" cy="86" rx="38" ry="4" fill="#0b1c30" opacity="0.15" />
      {/* Thân rương */}
      <rect x="14" y="44" width="72" height="38" rx="6" fill={`url(#w${id})`} stroke="#5c300d" strokeWidth="1.5" />
      <rect x="14" y="56" width="72" height="5" fill={`url(#g${id})`} />
      {open ? (
        <>
          <path d="M14 44 L20 18 C22 12 78 12 80 18 L86 44 Z" fill={`url(#w${id})`} stroke="#5c300d" strokeWidth="1.5" transform="rotate(-8 14 44) translate(-2 -6)" />
          <circle cx="38" cy="42" r="6" fill={`url(#g${id})`} stroke="#c97a00" />
          <circle cx="52" cy="38" r="7" fill={`url(#g${id})`} stroke="#c97a00" />
          <circle cx="64" cy="43" r="5.5" fill={`url(#g${id})`} stroke="#c97a00" />
          <path d="M28 20 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 z" fill="#fff" />
          <path d="M76 14 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 z" fill="#fff" />
        </>
      ) : (
        <>
          <path d="M14 46 L14 34 C14 22 86 22 86 34 L86 46 Z" fill={`url(#w${id})`} stroke="#5c300d" strokeWidth="1.5" />
          <rect x="14" y="40" width="72" height="6" fill={`url(#g${id})`} />
          <rect x="44" y="38" width="12" height="16" rx="3" fill={`url(#g${id})`} stroke="#c97a00" />
          <circle cx="50" cy="45" r="2.2" fill="#5c300d" />
        </>
      )}
      <rect x="22" y="44" width="6" height="38" fill={`url(#g${id})`} opacity="0.9" />
      <rect x="72" y="44" width="6" height="38" fill={`url(#g${id})`} opacity="0.9" />
    </svg>
  )
}

/** Lâu đài ải trùm */
export function Castle({ size = 90, className = '' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <ellipse cx="50" cy="94" rx="40" ry="5" fill="#0b1c30" opacity="0.15" />
      <rect x="18" y="40" width="64" height="52" rx="4" fill="#8b93b8" stroke="#4d5578" strokeWidth="1.5" />
      <rect x="10" y="30" width="20" height="62" rx="3" fill="#a3abcf" stroke="#4d5578" strokeWidth="1.5" />
      <rect x="70" y="30" width="20" height="62" rx="3" fill="#a3abcf" stroke="#4d5578" strokeWidth="1.5" />
      <path d="M8 30 L20 12 L32 30 Z" fill="#ef4b5f" stroke="#a0233a" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M68 30 L80 12 L92 30 Z" fill="#ef4b5f" stroke="#a0233a" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M40 92 L40 70 C40 60 60 60 60 70 L60 92 Z" fill="#4d3a2a" />
      <rect x="44" y="46" width="12" height="10" rx="5" fill="#ffe27a" />
      <path d="M20 12 L20 2 L30 6 L20 9" fill="#ffcf4d" stroke="#c97a00" strokeWidth="1" />
    </svg>
  )
}

/**
 * Chủ đề màu + cảnh vật cho từng chương (vùng đất trên bản đồ).
 */
export const CHAPTER_THEMES = [
  { land: 'Đồng cỏ Phương Trình', bg: 'from-[#e3f9d9] to-[#c9efb8]', path: '#8cc56e', ribbon: 'from-[#4caf50] to-[#2e8b3a]', deco: 'meadow', accent: '#2e8b3a' },
  { land: 'Sa mạc Bất Đẳng Thức', bg: 'from-[#fff2d6] to-[#ffdca3]', path: '#e3b363', ribbon: 'from-[#ff9f43] to-[#e8730c]', deco: 'desert', accent: '#c75f00' },
  { land: 'Rừng trúc Căn Thức', bg: 'from-[#dcf5ef] to-[#b6e6d8]', path: '#6cc0a6', ribbon: 'from-[#1fae8c] to-[#0d7c63]', deco: 'bamboo', accent: '#0d7c63' },
  { land: 'Đảo Lượng Giác', bg: 'from-[#ddefff] to-[#b8dcff]', path: '#7fb7ea', ribbon: 'from-[#3d8bfd] to-[#1f5fd1]', deco: 'ocean', accent: '#1f5fd1' },
  { land: 'Núi tuyết Đường Tròn', bg: 'from-[#ece6ff] to-[#d6ccff]', path: '#a99be6', ribbon: 'from-[#8b6cf6] to-[#5b3fd0]', deco: 'mountain', accent: '#5b3fd0' },
]

export function chapterTheme(index) {
  return CHAPTER_THEMES[index % CHAPTER_THEMES.length]
}

/** Cảnh vật trang trí 2 bên đường đi của mỗi vùng đất */
export function Decor({ type, side = 'left', className = '' }) {
  const flip = side === 'right' ? 'scale(-1,1) translate(-120,0)' : undefined
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <g transform={flip}>{DECOR[type] || DECOR.meadow}</g>
    </svg>
  )
}

const Cloud = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity="0.9">
    <ellipse cx="0" cy="0" rx="14" ry="9" fill="#fff" />
    <ellipse cx="12" cy="-4" rx="12" ry="10" fill="#fff" />
    <ellipse cx="24" cy="1" rx="11" ry="8" fill="#fff" />
  </g>
)

const DECOR = {
  meadow: (
    <g>
      <Cloud x={70} y={18} s={0.9} />
      <path d="M0 110 C20 80 50 78 80 98 C95 106 110 104 120 100 L120 120 L0 120 Z" fill="#9fdc84" />
      <rect x="22" y="58" width="8" height="30" rx="3" fill="#8a5a36" />
      <circle cx="26" cy="52" r="18" fill="#5cc25b" />
      <circle cx="16" cy="58" r="12" fill="#4fb34f" />
      <circle cx="36" cy="58" r="11" fill="#6fd46b" />
      <circle cx="20" cy="46" r="5" fill="#ff6b7a" />
      <circle cx="34" cy="50" r="4" fill="#ff6b7a" />
      <g transform="translate(70 92)">
        <circle cx="0" cy="0" r="4" fill="#ffd23f" /><circle cx="-5" cy="0" r="3" fill="#fff" /><circle cx="5" cy="0" r="3" fill="#fff" />
        <circle cx="0" cy="-5" r="3" fill="#fff" /><circle cx="0" cy="5" r="3" fill="#fff" /><circle cx="0" cy="0" r="2.6" fill="#ffd23f" />
      </g>
    </g>
  ),
  desert: (
    <g>
      <circle cx="92" cy="22" r="12" fill="#ffd166" opacity="0.9" />
      <path d="M0 108 C30 90 60 92 90 104 C104 110 114 108 120 106 L120 120 L0 120 Z" fill="#f4c67a" />
      <rect x="28" y="50" width="12" height="52" rx="6" fill="#4caf6d" />
      <path d="M28 76 L18 76 C14 76 12 72 12 68 L12 60" stroke="#4caf6d" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M40 68 L50 68 C54 68 56 64 56 60 L56 54" stroke="#4caf6d" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="48" r="3.5" fill="#ff7aa2" />
      <path d="M76 100 L84 86 L92 100 Z" fill="#e3a94f" />
    </g>
  ),
  bamboo: (
    <g>
      <Cloud x={74} y={16} s={0.8} />
      <path d="M0 110 C30 94 70 96 120 104 L120 120 L0 120 Z" fill="#8fd6bd" />
      {[14, 30, 46].map((x, i) => (
        <g key={x}>
          <rect x={x} y={20 + i * 10} width="7" height={90 - i * 10} rx="3" fill={i === 1 ? '#5cbf7a' : '#74cf8a'} />
          <path d={`M${x} ${48 + i * 8} h7 M${x} ${72 + i * 6} h7`} stroke="#3d9c5a" strokeWidth="1.6" />
          <path d={`M${x + 7} ${36 + i * 10} C${x + 16} ${30 + i * 10} ${x + 22} ${32 + i * 10} ${x + 24} ${36 + i * 10} C${x + 18} ${36 + i * 10} ${x + 14} ${38 + i * 10} ${x + 7} ${40 + i * 10} Z`} fill="#9be08a" />
        </g>
      ))}
    </g>
  ),
  ocean: (
    <g>
      <circle cx="96" cy="20" r="11" fill="#ffd166" />
      <path d="M0 96 C10 90 20 102 30 96 C40 90 50 102 60 96 C70 90 80 102 90 96 C100 90 110 102 120 96 L120 120 L0 120 Z" fill="#6fb8f2" />
      <path d="M0 106 C10 100 20 112 30 106 C40 100 50 112 60 106 C70 100 80 112 90 106 C100 100 110 112 120 106 L120 120 L0 120 Z" fill="#4c9ee6" />
      <ellipse cx="34" cy="94" rx="24" ry="8" fill="#f6dd9a" />
      <path d="M34 92 C34 70 30 56 26 46" stroke="#9a6a3a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M26 46 C16 40 8 44 6 50 C14 46 20 48 26 46 Z M26 46 C30 34 40 32 44 36 C36 38 32 42 26 46 Z M26 46 C38 42 46 48 46 54 C40 48 32 48 26 46 Z" fill="#4caf6d" />
    </g>
  ),
  mountain: (
    <g>
      <Cloud x={76} y={20} s={0.8} />
      <path d="M-4 112 L36 40 L76 112 Z" fill="#9d8fe0" />
      <path d="M36 40 L46 58 L40 54 L34 60 L28 54 L26 58 Z" fill="#ffffff" />
      <path d="M40 112 L74 58 L110 112 Z" fill="#b6a9f0" />
      <path d="M74 58 L82 71 L76 68 L70 73 L66 70 Z" fill="#ffffff" />
      <path d="M0 112 C40 104 80 104 120 110 L120 120 L0 120 Z" fill="#f4f0ff" />
    </g>
  ),
}
