import { ttsApi } from '../api/services'

/**
 * Đọc tin nhắn của 3 AI bằng 3 giọng khác nhau.
 * - BE có GOOGLE_TTS_API_KEY: dùng giọng Google (Wavenet) cấu hình trong bảng AI_AGENT.
 * - Không có: dùng giọng tiếng Việt có sẵn của trình duyệt, mỗi AI một cao độ / tốc độ / giọng khác.
 */

// Giọng trình duyệt: pitch 0-2, rate 0.1-10. Thầy trầm & chậm, Kiệt cao & nhanh, An trong & vui
const BROWSER_VOICE = {
  'agent-tutor': { pitch: 0.75, rate: 0.95, prefer: ['nam', 'male', 'NamMinh', 'An'], index: 0 },
  'agent-critic': { pitch: 1.35, rate: 1.12, prefer: ['nam', 'male', 'NamMinh'], index: 1 },
  'agent-creative': { pitch: 1.55, rate: 1.05, prefer: ['nữ', 'female', 'HoaiMy', 'Linh', 'Google'], index: 2 },
}

/** Đổi kí hiệu toán sang chữ để máy đọc tự nhiên: √9 → "căn 9", x² → "x bình phương" */
export function speakableText(text) {
  return (text || '')
    .replace(/∛/g, ' căn bậc ba của ')
    .replace(/√/g, ' căn ')
    .replace(/²/g, ' bình phương ')
    .replace(/³/g, ' lập phương ')
    .replace(/≠/g, ' khác ')
    .replace(/≥/g, ' lớn hơn hoặc bằng ')
    .replace(/≤/g, ' nhỏ hơn hoặc bằng ')
    .replace(/⇒/g, ', suy ra ')
    .replace(/⇔/g, ', tương đương ')
    .replace(/°/g, ' độ ')
    .replace(/π/g, ' pi ')
    .replace(/·/g, ' nhân ')
    .replace(/(\d)\s*\/\s*(\d)/g, '$1 phần $2')
    .replace(/(\S)\s*=\s*/g, '$1 bằng ')
    .replace(/(\d|\))\s*\+\s*/g, '$1 cộng ')
    .replace(/(\d|\)|[a-z])\s*[−-]\s*(?=\d|[a-z(])/g, '$1 trừ ')
    .replace(/[−]/g, ' âm ')
    .replace(/\|([^|]+)\|/g, ' giá trị tuyệt đối của $1 ')
    .replace(/>/g, ' lớn hơn ')
    .replace(/</g, ' nhỏ hơn ')
    .replace(/["“”•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

let googleEnabled = null
let currentAudio = null

async function isGoogleEnabled() {
  if (googleEnabled === null) {
    try {
      googleEnabled = Boolean((await ttsApi.status()).enabled)
    } catch {
      googleEnabled = false
    }
  }
  return googleEnabled
}

function vietnameseVoices() {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('vi'))
}

function pickBrowserVoice(agentId) {
  const cfg = BROWSER_VOICE[agentId] || BROWSER_VOICE['agent-tutor']
  const voices = vietnameseVoices()
  if (voices.length === 0) return null
  const named = voices.find((v) => cfg.prefer.some((p) => v.name.toLowerCase().includes(p.toLowerCase())))
  // Có nhiều giọng tiếng Việt thì chia mỗi AI một giọng khác nhau
  return voices.length > 1 ? voices[cfg.index % voices.length] : named || voices[0]
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

/** Đọc một câu, trả về Promise xong khi đọc xong (để đọc lần lượt nhiều tin nhắn) */
export async function speak(agentId, text) {
  const content = speakableText(text)
  if (!content) return
  if (await isGoogleEnabled()) {
    try {
      const blob = await ttsApi.speak(agentId, content)
      if (blob) {
        const url = URL.createObjectURL(blob)
        await new Promise((resolve) => {
          const audio = new Audio(url)
          currentAudio = audio
          audio.onended = audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
          audio.play().catch(resolve)
        })
        return
      }
    } catch {
      // lỗi mạng / hết quota: chuyển sang giọng trình duyệt
    }
  }
  if (!('speechSynthesis' in window)) return
  const cfg = BROWSER_VOICE[agentId] || BROWSER_VOICE['agent-tutor']
  await new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(content)
    u.lang = 'vi-VN'
    const voice = pickBrowserVoice(agentId)
    if (voice) u.voice = voice
    u.pitch = cfg.pitch
    u.rate = cfg.rate
    u.onend = u.onerror = resolve
    window.speechSynthesis.speak(u)
  })
}

/** Trình duyệt nạp danh sách giọng bất đồng bộ, gọi sớm để lần đọc đầu có giọng tiếng Việt */
export function warmUpVoices() {
  if ('speechSynthesis' in window) window.speechSynthesis.getVoices()
}
