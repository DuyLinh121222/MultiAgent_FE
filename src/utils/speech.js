import { ttsApi } from '../api/services'

/**
 * Đọc tin nhắn của 3 AI bằng 3 giọng khác nhau.
 * - BE có GOOGLE_TTS_API_KEY: dùng giọng Google (Wavenet) cấu hình trong bảng AI_AGENT.
 * - Không có: dùng giọng tiếng Việt có sẵn của trình duyệt, mỗi AI một cao độ / tốc độ / giọng khác.
 */

// Giọng trình duyệt: pitch 0-2, rate 0.1-10. Thầy trầm & chậm, Kiệt cao & nhanh, An trong & vui
// gender: giọng nam / nữ ưu tiên. Mỗi máy có bộ giọng khác nhau nên KHÔNG chọn theo thứ tự danh sách
// (thứ tự khác nhau giữa Windows / Mac / Chrome / Edge) mà chọn theo tên giọng đã biết.
// Khi máy chỉ có 1 giọng tiếng Việt, 3 AI phân biệt bằng cao độ + tốc độ (để chênh lệch rõ).
// Lưu ý: giọng online của Chrome ("Google Tiếng Việt") bỏ qua pitch, chỉ nghe được khác biệt tốc độ.
const BROWSER_VOICE = {
  'agent-tutor': { pitch: 0.7, rate: 0.9, gender: 'male', slot: 0 },
  'agent-critic': { pitch: 1.35, rate: 1.15, gender: 'male', slot: 1 },
  'agent-creative': { pitch: 1.6, rate: 1.02, gender: 'female', slot: 0 },
}

// Nghỉ giữa các câu trong một tin nhắn và giữa tin nhắn của các AI (ms)
const PAUSE_SENTENCE = 250
const PAUSE_MESSAGE = 700
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Tách tin nhắn thành từng câu: đọc từng câu có ngắt nghỉ, và tránh lỗi Chrome cắt ngang câu dài */
function splitSentences(text) {
  return text.split(/(?<=[.!?…])\s+|\n+/).map((t) => t.trim()).filter(Boolean)
}

// Giọng tiếng Việt phổ biến, xếp theo chất lượng (tốt trước). Khớp theo tên, không phân biệt hoa thường
const KNOWN_VOICES = [
  { match: 'namminh', gender: 'male' },          // Edge: Microsoft NamMinh Online (Natural)
  { match: 'hoaimy', gender: 'female' },         // Edge: Microsoft HoaiMy Online (Natural)
  { match: 'google tiếng việt', gender: 'female' }, // Chrome
  { match: 'google vietnamese', gender: 'female' },
  { match: 'microsoft an', gender: 'male' },     // Windows: gói giọng Tiếng Việt
  { match: 'linh', gender: 'female' },           // macOS / iOS
]

const isVietnamese = (v) => v.lang?.toLowerCase().replace('_', '-').startsWith('vi')
  || /vietnam|tiếng việt/i.test(v.name)

const rankOf = (v) => {
  const i = KNOWN_VOICES.findIndex((k) => v.name.toLowerCase().includes(k.match))
  return i === -1 ? KNOWN_VOICES.length : i
}

const genderOf = (v) => KNOWN_VOICES[rankOf(v)]?.gender || 'unknown'

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
// Mỗi lần stopSpeaking() tăng lên 1: các câu đang xếp hàng của lượt cũ sẽ bị bỏ qua (tránh đọc lặp)
let generation = 0
const VOLUME_KEY = 'mael_voice_volume'

/** Âm lượng 0..1, lưu trong trình duyệt */
export function getVolume() {
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8
  } catch {
    return 0.8
  }
}

export function setVolume(v) {
  const vol = Math.min(1, Math.max(0, v))
  try { localStorage.setItem(VOLUME_KEY, String(vol)) } catch { /* bỏ qua */ }
  if (currentAudio) currentAudio.volume = vol
  return vol
}

async function isGoogleEnabled() {
  if (googleEnabled === null) {
    try {
      googleEnabled = Boolean((await ttsApi.status()).enabled)
    } catch {
      // Lỗi mạng / chưa đăng nhập: lần này dùng giọng trình duyệt, lần sau hỏi lại BE
      return false
    }
  }
  return googleEnabled
}

let voicesPromise = null

/** Chrome / Edge nạp danh sách giọng bất đồng bộ: chờ sự kiện voiceschanged (tối đa 2 giây) */
function loadVoices() {
  if (!('speechSynthesis' in window)) return Promise.resolve([])
  const now = window.speechSynthesis.getVoices()
  if (now.length) return Promise.resolve(now)
  if (!voicesPromise) {
    voicesPromise = new Promise((resolve) => {
      const done = () => {
        window.speechSynthesis.removeEventListener?.('voiceschanged', done)
        resolve(window.speechSynthesis.getVoices())
      }
      window.speechSynthesis.addEventListener?.('voiceschanged', done)
      setTimeout(done, 2000)
    }).finally(() => { voicesPromise = null })
  }
  return voicesPromise
}

/** Giọng tiếng Việt của máy, sắp xếp cố định: giọng tốt trước, cùng hạng thì theo tên */
function vietnameseVoices(all) {
  return all.filter(isVietnamese).sort((x, y) => rankOf(x) - rankOf(y) || x.name.localeCompare(y.name))
}

function pickBrowserVoice(agentId, voices) {
  const cfg = BROWSER_VOICE[agentId] || BROWSER_VOICE['agent-tutor']
  if (voices.length === 0) return null
  const sameGender = voices.filter((v) => genderOf(v) === cfg.gender)
  if (sameGender.length) return sameGender[cfg.slot % sameGender.length]
  // Máy chỉ có giọng khác giới / giọng lạ: dùng giọng tốt nhất, phân biệt AI bằng cao độ & tốc độ
  return voices[0]
}

let warned = false
/** Máy không có giọng tiếng Việt: báo 1 lần cho trang hiện thông báo, KHÔNG đọc bằng giọng tiếng Anh */
function warnNoVietnameseVoice() {
  if (warned) return
  warned = true
  window.dispatchEvent(new CustomEvent('mael:voice-warning', {
    detail: 'Máy/trình duyệt này chưa có giọng đọc tiếng Việt. Hãy mở web bằng Microsoft Edge hoặc Google Chrome, '
      + 'hoặc cài "Vietnamese" trong Cài đặt Windows → Thời gian & ngôn ngữ → Giọng nói.',
  }))
}

export function stopSpeaking() {
  generation++
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

/** Mã lượt đọc hiện tại: truyền vào speak() để câu của lượt cũ không đọc nữa */
export function currentGeneration() {
  return generation
}

/** Đọc một câu, trả về Promise xong khi đọc xong (để đọc lần lượt nhiều tin nhắn) */
export async function speak(agentId, text, gen = generation) {
  const content = speakableText(text)
  const volume = getVolume()
  if (!content || volume <= 0 || gen !== generation) return
  if (await isGoogleEnabled()) {
    try {
      const blob = await ttsApi.speak(agentId, content)
      if (gen !== generation) return
      if (blob) {
        const url = URL.createObjectURL(blob)
        await new Promise((resolve) => {
          const audio = new Audio(url)
          audio.volume = getVolume()
          currentAudio = audio
          audio.onended = audio.onerror = audio.onpause = () => { URL.revokeObjectURL(url); resolve() }
          audio.play().catch(resolve)
        })
        if (gen === generation) await sleep(PAUSE_MESSAGE)
        return
      }
    } catch {
      // lỗi mạng / hết quota: chuyển sang giọng trình duyệt
    }
  }
  if (!('speechSynthesis' in window) || gen !== generation) return
  const voices = vietnameseVoices(await loadVoices())
  if (gen !== generation) return
  const voice = pickBrowserVoice(agentId, voices)
  if (!voice) {
    warnNoVietnameseVoice()
    return
  }
  const cfg = BROWSER_VOICE[agentId] || BROWSER_VOICE['agent-tutor']
  const sentences = splitSentences(content)
  for (let i = 0; i < sentences.length; i++) {
    if (gen !== generation) return
    const part = sentences[i]
    await new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(part)
      u.voice = voice
      u.lang = voice.lang || 'vi-VN'
      u.pitch = cfg.pitch
      u.rate = cfg.rate
      u.volume = volume
      // Chrome đôi khi không gọi onend: tự kết thúc sau thời gian ước lượng để hàng đợi không bị kẹt
      const timer = setTimeout(resolve, 2000 + part.length * 120)
      u.onend = u.onerror = () => { clearTimeout(timer); resolve() }
      window.speechSynthesis.speak(u)
    })
    if (i < sentences.length - 1) await sleep(PAUSE_SENTENCE)
  }
  if (gen === generation) await sleep(PAUSE_MESSAGE)
}

/** Trình duyệt nạp danh sách giọng bất đồng bộ, gọi sớm để lần đọc đầu có giọng tiếng Việt */
export function warmUpVoices() {
  loadVoices()
}
