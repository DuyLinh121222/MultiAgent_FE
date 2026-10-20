import { useId } from 'react'

/**
 * Thú đồng hành vẽ bằng SVG theo pet_code (khớp bảng PET ở BE).
 * Phong cách chibi bóng bẩy: đầu to, mắt to có 2 đốm sáng, má hồng, đổ bóng gradient như avatar 3 AI.
 *
 * <Pet code="meo-mun" size={96} />            thú bình thường
 * <Pet code="cu-tri" size={64} locked />       bóng đen (chưa sở hữu)
 * <Pet code="cao-lua" size={80} bounce />      nhún nhảy (đứng trên bản đồ)
 */

// Bảng màu từng loài: body = màu thân (sáng → tối), belly = bụng / mặt, ear = trong tai, eye = tròng mắt
const PETS = {
  'meo-mun': { body: ['#5b6280', '#2b2f45'], belly: '#8c93b3', ear: '#ff9fb8', eye: '#ffd23f', ears: 'cat', tail: 'cat', extra: 'whiskers' },
  'cun-vang': { body: ['#ffd88a', '#f0a43a'], belly: '#fff3d6', ear: '#b86a2a', eye: '#3a2618', ears: 'dog', tail: 'dog', extra: 'dogNose' },
  'tho-bong': { body: ['#ffffff', '#e4dcf3'], belly: '#ffffff', ear: '#ffb3c8', eye: '#3a2a4a', ears: 'bunny', tail: 'bunny', extra: 'teeth' },
  'cu-tri': { body: ['#c99a6b', '#8a5a36'], belly: '#fbe8c8', ear: '#6e4426', eye: '#2a1d14', ears: 'owl', tail: 'none', extra: 'owl' },
  'cao-lua': { body: ['#ffa45c', '#ea5a1c'], belly: '#fff4e8', ear: '#3a2418', eye: '#2a1a12', ears: 'fox', tail: 'fox', extra: 'foxCheeks' },
  'gau-truc': { body: ['#ffffff', '#e6e9f0'], belly: '#ffffff', ear: '#262a36', eye: '#ffffff', ears: 'panda', tail: 'none', extra: 'panda' },
  'rua-xanh': { body: ['#a6eba8', '#4fb36a'], belly: '#f3f7c8', ear: '#4fb36a', eye: '#1f2a1f', ears: 'none', tail: 'none', extra: 'shell' },
  'rong-con': { body: ['#a99bff', '#5a46d6'], belly: '#ffe9b8', ear: '#ffcf4d', eye: '#1e1640', ears: 'horns', tail: 'dragon', extra: 'wings' },
  'chim-canh-cut': { body: ['#4a5a82', '#1f2945'], belly: '#ffffff', ear: '#1f2945', eye: '#1a1a2a', ears: 'none', tail: 'none', extra: 'penguin' },
  'ky-lan': { body: ['#ffffff', '#efe6ff'], belly: '#ffffff', ear: '#ffc1dc', eye: '#3b2a5a', ears: 'horse', tail: 'rainbow', extra: 'unicorn' },
}

export const PET_CODES = Object.keys(PETS)

export default function Pet({ code, size = 96, locked = false, bounce = false, className = '', title }) {
  const raw = useId().replace(/:/g, '')
  const id = (k) => `${raw}-${k}`
  const p = PETS[code] || PETS['meo-mun']
  const [light, dark] = p.body
  const style = locked ? { filter: 'brightness(0) saturate(0)', opacity: 0.22 } : undefined
  // Viền mảnh để thú màu trắng không bị chìm vào nền sáng
  const outline = { stroke: light === '#ffffff' ? '#d6cde6' : 'rgba(11,28,48,0.10)', strokeWidth: 1.4 }

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`${bounce ? 'pet-bounce' : ''} ${className}`} style={style}
      role="img" aria-label={title || code}>
      <defs>
        <radialGradient id={id('body')} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        <radialGradient id={id('belly')} cx="45%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={p.belly} />
        </radialGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3a8" />
          <stop offset="100%" stopColor="#f2a516" />
        </linearGradient>
        <linearGradient id={id('rainbow')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8fb1" />
          <stop offset="35%" stopColor="#ffd36e" />
          <stop offset="65%" stopColor="#7ee0c3" />
          <stop offset="100%" stopColor="#8fa8ff" />
        </linearGradient>
        <linearGradient id={id('shell')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5fc77c" />
          <stop offset="100%" stopColor="#2a7f4a" />
        </linearGradient>
      </defs>

      {/* Bóng dưới chân */}
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#0b1c30" opacity="0.12" />

      <Tail type={p.tail} id={id} body={`url(#${id('body')})`} dark={dark} />
      {p.extra === 'wings' && <DragonWings />}
      {p.extra === 'shell' && <TurtleShell id={id} />}

      {/* Thân */}
      {p.extra !== 'shell' && <ellipse cx="60" cy="92" rx="25" ry="19" fill={`url(#${id('body')})`} {...outline} />}
      {p.extra !== 'shell' && <ellipse cx="60" cy="96" rx="15" ry="12" fill={`url(#${id('belly')})`} />}
      {p.extra === 'owl' && <OwlWings dark={dark} />}
      {p.extra === 'penguin' && <PenguinFlippers dark={dark} />}
      {/* Chân */}
      <ellipse cx="48" cy="108" rx="8" ry="5" fill={p.extra === 'penguin' || p.extra === 'owl' ? '#ff9b2f' : dark} />
      <ellipse cx="72" cy="108" rx="8" ry="5" fill={p.extra === 'penguin' || p.extra === 'owl' ? '#ff9b2f' : dark} />
      {p.extra === 'panda' && <Bamboo />}

      <g {...outline}><Ears type={p.ears} body={`url(#${id('body')})`} inner={p.ear} id={id} /></g>

      {/* Đầu */}
      <ellipse cx="60" cy="54" rx="37" ry="33" fill={`url(#${id('body')})`} {...outline} />
      {p.extra === 'unicorn' && <Mane id={id} />}
      <Face type={p.extra} belly={`url(#${id('belly')})`} />
      {/* Đốm sáng trên đầu tạo cảm giác bóng 3D */}
      <ellipse cx="44" cy="32" rx="12" ry="6" fill="#ffffff" opacity="0.35" transform="rotate(-20 44 32)" />

      <Eyes extra={p.extra} eye={p.eye} />
      {/* Má hồng */}
      <ellipse cx="34" cy="66" rx="7" ry="4" fill="#ff7aa2" opacity="0.45" />
      <ellipse cx="86" cy="66" rx="7" ry="4" fill="#ff7aa2" opacity="0.45" />
      <Mouth extra={p.extra} />
      <Extras extra={p.extra} id={id} />
    </svg>
  )
}

function Ears({ type, body, inner, id }) {
  switch (type) {
    case 'cat':
      return (
        <g>
          <path d="M26 40 L30 8 L52 28 Z" fill={body} />
          <path d="M31 34 L33 16 L45 28 Z" fill={inner} />
          <path d="M94 40 L90 8 L68 28 Z" fill={body} />
          <path d="M89 34 L87 16 L75 28 Z" fill={inner} />
        </g>
      )
    case 'fox':
      return (
        <g>
          <path d="M24 42 L22 4 L54 26 Z" fill={body} />
          <path d="M24 14 L22 4 L32 10 Z" fill={inner} />
          <path d="M30 34 L29 16 L45 27 Z" fill="#fff4e8" />
          <path d="M96 42 L98 4 L66 26 Z" fill={body} />
          <path d="M96 14 L98 4 L88 10 Z" fill={inner} />
          <path d="M90 34 L91 16 L75 27 Z" fill="#fff4e8" />
        </g>
      )
    case 'dog':
      return (
        <g>
          <path d="M28 30 C10 30 6 58 16 70 C22 76 30 66 32 56 Z" fill={inner} />
          <path d="M92 30 C110 30 114 58 104 70 C98 76 90 66 88 56 Z" fill={inner} />
        </g>
      )
    case 'bunny':
      return (
        <g>
          <ellipse cx="44" cy="22" rx="9" ry="21" fill={body} transform="rotate(-10 44 22)" />
          <ellipse cx="44" cy="23" rx="4.5" ry="15" fill={inner} transform="rotate(-10 44 23)" />
          <ellipse cx="76" cy="22" rx="9" ry="21" fill={body} transform="rotate(10 76 22)" />
          <ellipse cx="76" cy="23" rx="4.5" ry="15" fill={inner} transform="rotate(10 76 23)" />
        </g>
      )
    case 'panda':
      return (
        <g>
          <circle cx="30" cy="26" r="12" fill={inner} />
          <circle cx="90" cy="26" r="12" fill={inner} />
        </g>
      )
    case 'owl':
      return (
        <g>
          <path d="M28 34 L22 10 L46 26 Z" fill={inner} />
          <path d="M92 34 L98 10 L74 26 Z" fill={inner} />
        </g>
      )
    case 'horns':
      return (
        <g>
          <path d="M36 28 L30 4 L48 22 Z" fill={`url(#${id('gold')})`} />
          <path d="M84 28 L90 4 L72 22 Z" fill={`url(#${id('gold')})`} />
          <ellipse cx="22" cy="46" rx="9" ry="6" fill="#7b6cf0" transform="rotate(-30 22 46)" />
          <ellipse cx="98" cy="46" rx="9" ry="6" fill="#7b6cf0" transform="rotate(30 98 46)" />
        </g>
      )
    case 'horse':
      return (
        <g>
          <path d="M30 34 L32 10 L48 26 Z" fill={body} />
          <path d="M34 28 L35 16 L44 25 Z" fill={inner} />
          <path d="M90 34 L88 10 L72 26 Z" fill={body} />
          <path d="M86 28 L85 16 L76 25 Z" fill={inner} />
        </g>
      )
    default:
      return null
  }
}

function Face({ type, belly }) {
  switch (type) {
    case 'dogNose':
      return <ellipse cx="60" cy="68" rx="18" ry="13" fill={belly} />
    case 'foxCheeks':
      return <path d="M24 58 C34 82 50 84 60 72 C70 84 86 82 96 58 C84 66 70 64 60 60 C50 64 36 66 24 58 Z" fill={belly} />
    case 'owl':
      return <path d="M60 30 C44 22 22 30 24 54 C26 76 46 82 60 74 C74 82 94 76 96 54 C98 30 76 22 60 30 Z" fill={belly} />
    case 'penguin':
      return <path d="M60 32 C42 30 30 44 32 62 C34 80 50 86 60 84 C70 86 86 80 88 62 C90 44 78 30 60 32 Z" fill={belly} />
    case 'shell':
      return <ellipse cx="60" cy="66" rx="20" ry="12" fill={belly} opacity="0.7" />
    case 'teeth':
      return <ellipse cx="60" cy="68" rx="15" ry="10" fill={belly} opacity="0.9" />
    default:
      return null
  }
}

function Eyes({ extra, eye }) {
  if (extra === 'panda') {
    return (
      <g>
        <ellipse cx="43" cy="54" rx="11" ry="13" fill="#262a36" transform="rotate(-18 43 54)" />
        <ellipse cx="77" cy="54" rx="11" ry="13" fill="#262a36" transform="rotate(18 77 54)" />
        <circle cx="44" cy="54" r="5.5" fill="#ffffff" />
        <circle cx="76" cy="54" r="5.5" fill="#ffffff" />
        <circle cx="45" cy="55" r="3.2" fill="#1a1a2a" />
        <circle cx="75" cy="55" r="3.2" fill="#1a1a2a" />
        <circle cx="46.2" cy="53.5" r="1.3" fill="#ffffff" />
        <circle cx="76.2" cy="53.5" r="1.3" fill="#ffffff" />
      </g>
    )
  }
  if (extra === 'owl') {
    return (
      <g>
        <circle cx="44" cy="50" r="12" fill="#ffffff" />
        <circle cx="76" cy="50" r="12" fill="#ffffff" />
        <circle cx="45" cy="51" r="7" fill={eye} />
        <circle cx="75" cy="51" r="7" fill={eye} />
        <circle cx="47.5" cy="48" r="2.6" fill="#ffffff" />
        <circle cx="77.5" cy="48" r="2.6" fill="#ffffff" />
        {/* Kính tròn của Cú Trí Tuệ */}
        <circle cx="44" cy="50" r="14" fill="none" stroke="#3a2a1a" strokeWidth="2.4" />
        <circle cx="76" cy="50" r="14" fill="none" stroke="#3a2a1a" strokeWidth="2.4" />
        <path d="M58 50 Q60 47 62 50" fill="none" stroke="#3a2a1a" strokeWidth="2.4" />
      </g>
    )
  }
  const isCat = extra === 'whiskers'
  return (
    <g>
      <ellipse cx="44" cy="54" rx="7" ry="8.5" fill={isCat ? '#1d1b2c' : eye} />
      <ellipse cx="76" cy="54" rx="7" ry="8.5" fill={isCat ? '#1d1b2c' : eye} />
      {isCat && (
        <>
          <ellipse cx="44" cy="55" rx="5.4" ry="6.8" fill={eye} />
          <ellipse cx="76" cy="55" rx="5.4" ry="6.8" fill={eye} />
          <ellipse cx="44" cy="55" rx="2" ry="5.5" fill="#1d1b2c" />
          <ellipse cx="76" cy="55" rx="2" ry="5.5" fill="#1d1b2c" />
        </>
      )}
      <circle cx="46.5" cy="50.5" r="2.8" fill="#ffffff" />
      <circle cx="78.5" cy="50.5" r="2.8" fill="#ffffff" />
      <circle cx="42" cy="58" r="1.3" fill="#ffffff" opacity="0.9" />
      <circle cx="74" cy="58" r="1.3" fill="#ffffff" opacity="0.9" />
    </g>
  )
}

function Mouth({ extra }) {
  if (extra === 'owl' || extra === 'penguin') {
    return <path d="M54 63 L66 63 L60 72 Z" fill="#ff9b2f" stroke="#e07a10" strokeWidth="1" strokeLinejoin="round" />
  }
  if (extra === 'dogNose') {
    return (
      <g>
        <ellipse cx="60" cy="63" rx="6" ry="4.2" fill="#2a1a12" />
        <ellipse cx="58.5" cy="61.8" rx="2" ry="1.1" fill="#ffffff" opacity="0.6" />
        <path d="M53 69 Q56.5 73 60 69 Q63.5 73 67 69" fill="none" stroke="#2a1a12" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M57 71 Q60 79 63 71 Z" fill="#ff7a8a" />
      </g>
    )
  }
  return (
    <g>
      <path d="M57.5 62.5 Q60 65.5 62.5 62.5 Z" fill={extra === 'teeth' || extra === 'unicorn' ? '#ff8fb1' : '#2a1a2a'} />
      <path d="M53.5 66.5 Q57 70 60 66.5 Q63 70 66.5 66.5" fill="none" stroke="#2a1a2a" strokeWidth="1.8" strokeLinecap="round" />
      {extra === 'teeth' && <rect x="57.5" y="67.5" width="5" height="4.5" rx="1" fill="#ffffff" stroke="#d9d0e6" strokeWidth="0.8" />}
    </g>
  )
}

function Extras({ extra, id }) {
  switch (extra) {
    case 'whiskers':
      return (
        <g stroke="#c9cde0" strokeWidth="1.3" strokeLinecap="round" opacity="0.8">
          <path d="M28 62 L14 59" /><path d="M28 66 L14 68" />
          <path d="M92 62 L106 59" /><path d="M92 66 L106 68" />
        </g>
      )
    case 'owl':
      // Mũ tốt nghiệp nhỏ
      return (
        <g>
          <path d="M40 22 L60 13 L80 22 L60 31 Z" fill="#283044" />
          <rect x="50" y="22" width="20" height="8" rx="2" fill="#283044" />
          <path d="M78 22 L80 34" stroke={`url(#${id('gold')})`} strokeWidth="2" />
          <circle cx="80" cy="35" r="2.6" fill={`url(#${id('gold')})`} />
        </g>
      )
    case 'unicorn':
      return (
        <g>
          <path d="M60 2 L53 26 L67 26 Z" fill={`url(#${id('gold')})`} />
          <path d="M55.5 18 L64.5 15 M54.5 23 L65.5 20" stroke="#e59a12" strokeWidth="1.4" />
          <path d="M100 18 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" fill="#ffd36e" />
          <path d="M16 30 l1.4 3.5 l3.5 1.4 l-3.5 1.4 l-1.4 3.5 l-1.4 -3.5 l-3.5 -1.4 l3.5 -1.4 z" fill="#8fd3ff" />
        </g>
      )
    case 'penguin':
      return (
        <g>
          <path d="M34 80 Q60 92 86 80 L84 88 Q60 98 36 88 Z" fill="#ef4b5f" />
          <rect x="70" y="84" width="8" height="16" rx="3" fill="#ef4b5f" transform="rotate(-12 74 92)" />
        </g>
      )
    case 'foxCheeks':
      return <path d="M60 60 m-4 0 a4 3 0 1 0 8 0 a4 3 0 1 0 -8 0" fill="#2a1a12" />
    default:
      return null
  }
}

function Tail({ type, id, body, dark }) {
  switch (type) {
    case 'cat':
      return <path d="M82 98 C104 98 108 76 100 64 C96 58 92 64 96 70 C100 78 96 90 80 90 Z" fill={dark} />
    case 'dog':
      return <path d="M82 92 C98 86 102 70 96 64 C92 68 92 78 80 84 Z" fill={dark} />
    case 'bunny':
      return <circle cx="84" cy="98" r="8" fill="#ffffff" stroke="#efe8f8" />
    case 'fox':
      return (
        <g>
          <path d="M78 98 C108 104 118 72 104 56 C100 74 92 82 76 86 Z" fill={body} />
          <path d="M104 56 C112 66 112 76 108 84 C104 76 102 66 104 56 Z" fill="#fff4e8" />
          {/* Ngọn lửa nhỏ của Cáo Lửa */}
          <path d="M104 50 C98 44 104 38 102 32 C108 36 112 44 106 52 Z" fill="#ffcf4d" />
        </g>
      )
    case 'dragon':
      return (
        <g>
          <path d="M80 100 C100 106 110 96 112 84 L106 86 C104 94 96 96 82 92 Z" fill={dark} />
          <path d="M112 84 L118 78 L114 90 Z" fill="#ffcf4d" />
        </g>
      )
    case 'rainbow':
      return <path d="M80 96 C104 100 112 80 104 66 C100 80 92 86 78 88 Z" fill={`url(#${id('rainbow')})`} />
    default:
      return null
  }
}

function TurtleShell({ id }) {
  return (
    <g>
      <ellipse cx="60" cy="92" rx="32" ry="20" fill={`url(#${id('shell')})`} />
      <path d="M60 76 L70 82 L70 94 L60 100 L50 94 L50 82 Z" fill="#7ed39a" opacity="0.65" />
      <path d="M38 86 L48 82 L48 94 L40 98 Z M82 86 L72 82 L72 94 L80 98 Z" fill="#7ed39a" opacity="0.5" />
      <ellipse cx="50" cy="80" rx="10" ry="4" fill="#ffffff" opacity="0.3" />
    </g>
  )
}

function DragonWings() {
  return (
    <g>
      <path d="M38 82 C18 70 8 80 6 92 C14 88 18 92 22 96 C26 90 32 90 38 92 Z" fill="#7ee0c3" />
      <path d="M82 82 C102 70 112 80 114 92 C106 88 102 92 98 96 C94 90 88 90 82 92 Z" fill="#7ee0c3" />
    </g>
  )
}

function OwlWings({ dark }) {
  return (
    <g>
      <path d="M36 84 C26 90 28 104 40 106 C38 98 38 90 40 84 Z" fill={dark} />
      <path d="M84 84 C94 90 92 104 80 106 C82 98 82 90 80 84 Z" fill={dark} />
    </g>
  )
}

function PenguinFlippers({ dark }) {
  return (
    <g>
      <path d="M36 84 C26 92 26 102 32 104 C36 98 38 92 40 86 Z" fill={dark} />
      <path d="M84 84 C94 92 94 102 88 104 C84 98 82 92 80 86 Z" fill={dark} />
    </g>
  )
}

function Bamboo() {
  return (
    <g>
      <rect x="86" y="62" width="7" height="48" rx="3" fill="#7cc96b" transform="rotate(14 89 86)" />
      <path d="M86 78 L94 80 M84 94 L92 96" stroke="#4e9c43" strokeWidth="1.6" />
      <path d="M94 66 C102 60 108 62 110 66 C104 66 100 68 94 70 Z" fill="#9be08a" />
    </g>
  )
}

function Mane({ id }) {
  return (
    <path d="M30 40 C30 18 50 10 66 14 C58 16 52 22 50 30 C44 26 38 30 36 38 C34 44 32 50 30 54 Z" fill={`url(#${id('rainbow')})`} />
  )
}
