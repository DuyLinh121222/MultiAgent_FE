import { getVolume } from './speech'

/**
 * Hiệu ứng âm thanh nhỏ cho mini game (tự tạo bằng Web Audio, không cần file mp3).
 * Âm lượng theo thanh âm lượng giọng đọc; tắt tiếng thì không kêu.
 */
let ctx = null

function audio() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, start, duration, type = 'sine', gain = 0.2, slideTo) {
  const c = audio()
  const vol = getVolume()
  if (!c || vol <= 0) return
  const t = c.currentTime + start
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain * vol, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(g).connect(c.destination)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

export const sfx = {
  correct: () => { tone(660, 0, 0.12, 'triangle'); tone(990, 0.1, 0.18, 'triangle') },
  wrong: () => { tone(220, 0, 0.25, 'sawtooth', 0.12, 120) },
  pop: () => tone(900, 0, 0.08, 'square', 0.08, 300),
  hit: () => tone(160, 0, 0.18, 'square', 0.15, 60),
  combo: (n) => tone(500 + Math.min(n, 10) * 60, 0, 0.15, 'triangle', 0.18),
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.22, 'triangle')),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.15, 0.25, 'sine')),
}
