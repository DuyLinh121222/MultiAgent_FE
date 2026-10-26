import Pet from './Pet'
import { Chest, Coin, Star } from './GameArt'

/**
 * Trám khoảng trống 2 bên màn hình rộng (>= 1280px) bằng hình và hoạt ảnh:
 * kí hiệu toán bay lơ lửng, đảo mây có thú cưng, sao lấp lánh, xu xoay.
 * Chỉ để trang trí (không bắt sự kiện chuột), màn hình nhỏ tự ẩn.
 *
 * gap: độ rộng nội dung giữa trang (rem) để hai cột trang trí không đè lên nội dung.
 */
const SYMBOLS_LEFT = [
  { t: 'π', x: 18, y: 14, c: 'bg-primary-fixed text-primary', d: 0 },
  { t: '√x', x: 62, y: 30, c: 'bg-tertiary-fixed text-tertiary', d: 1.2 },
  { t: 'x²', x: 24, y: 52, c: 'bg-secondary-fixed text-secondary', d: 0.6 },
  { t: '÷', x: 70, y: 70, c: 'bg-[#ffe1ef] text-[#a50064]', d: 1.8 },
  { t: '∆', x: 30, y: 86, c: 'bg-[#e6e0ff] text-[#5b3fd0]', d: 2.4 },
]
const SYMBOLS_RIGHT = [
  { t: '%', x: 70, y: 12, c: 'bg-secondary-fixed text-secondary', d: 0.4 },
  { t: '∑', x: 26, y: 32, c: 'bg-[#e6e0ff] text-[#5b3fd0]', d: 1.4 },
  { t: '=', x: 66, y: 50, c: 'bg-primary-fixed text-primary', d: 2.1 },
  { t: '∠', x: 22, y: 68, c: 'bg-tertiary-fixed text-tertiary', d: 0.9 },
  { t: '½', x: 64, y: 88, c: 'bg-[#ffe1ef] text-[#a50064]', d: 1.6 },
]

export default function SideDecor({ gap = 60, petLeft = 'meo-mun', petRight = 'cu-tri' }) {
  const width = `max(0px, calc((100vw - ${gap}rem) / 2 - 12px))`
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 top-20 z-0 hidden select-none xl:block" aria-hidden="true">
      <Column side="left" width={width} symbols={SYMBOLS_LEFT} pet={petLeft} />
      <Column side="right" width={width} symbols={SYMBOLS_RIGHT} pet={petRight} />
    </div>
  )
}

function Column({ side, width, symbols, pet }) {
  const left = side === 'left'
  return (
    <div className={`absolute top-0 h-full ${left ? 'left-0' : 'right-0'}`} style={{ width }}>
      {/* Mảng màu nền mềm */}
      <div className={`absolute h-72 w-72 rounded-full blur-3xl ${left ? '-left-24 top-10 bg-primary-fixed/70' : '-right-24 top-1/3 bg-secondary-fixed/70'}`} />
      <div className={`absolute h-60 w-60 rounded-full blur-3xl ${left ? '-left-10 bottom-10 bg-tertiary-fixed/40' : '-right-16 bottom-24 bg-[#e6e0ff]'}`} />

      {symbols.map((s) => (
        <span key={s.t} className={`decor-float absolute flex h-12 w-12 items-center justify-center rounded-2xl text-[22px] font-black shadow-md ${s.c}`}
          style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.d}s` }}>
          {s.t}
        </span>
      ))}

      {[8, 40, 78].map((y, i) => (
        <span key={y} className="decor-twinkle absolute" style={{ left: `${left ? 48 + i * 9 : 40 - i * 8}%`, top: `${y}%`, animationDelay: `${i * 0.7}s` }}>
          <Star size={18 + i * 4} />
        </span>
      ))}

      <span className="decor-spin absolute" style={{ left: left ? '74%' : '12%', top: '44%' }}><Coin size={30} /></span>

      {/* Đảo mây có thú cưng */}
      <div className="decor-drift absolute flex flex-col items-center" style={{ left: left ? '20%' : '30%', top: left ? '60%' : '18%' }}>
        <Pet code={pet} size={86} bounce />
        <svg viewBox="0 0 140 46" width="140" height="46" className="-mt-3">
          <ellipse cx="70" cy="18" rx="62" ry="14" fill="#9fdc84" />
          <path d="M14 20 C30 46 110 46 126 20 Z" fill="#c47a3c" />
          <ellipse cx="40" cy="12" rx="10" ry="4" fill="#bff2a8" />
        </svg>
      </div>

      {!left && (
        <div className="decor-float absolute" style={{ left: '52%', top: '74%', animationDelay: '1s' }}>
          <Chest size={70} />
        </div>
      )}
      {left && (
        <svg viewBox="0 0 120 60" width="120" className="decor-drift absolute opacity-90" style={{ left: '40%', top: '4%', animationDelay: '2s' }}>
          <ellipse cx="34" cy="34" rx="28" ry="18" fill="#fff" />
          <ellipse cx="62" cy="26" rx="26" ry="22" fill="#fff" />
          <ellipse cx="88" cy="36" rx="24" ry="16" fill="#fff" />
        </svg>
      )}
    </div>
  )
}
