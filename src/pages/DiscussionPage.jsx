import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import AgentAvatar from '../components/common/AgentAvatar'
import ReportButton from '../components/common/ReportButton'
import { discussionApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { AGENTS_INTRO, agentUi } from '../constants/agents'
import { useAuth } from '../context/AuthContext'
import { formatTime } from '../utils/format'
import Pet from '../components/game/Pet'
import { speak, stopSpeaking, warmUpVoices } from '../utils/speech'

// Dự phòng khi tin nhắn AI cuối cùng không kèm lựa chọn
const FALLBACK_REPLIES = [
  'Em chưa hiểu, thầy giải thích lại giúp em',
  'Thầy cho em một ví dụ',
  'Có cách giải nào khác không?',
]
const VOICE_KEY = 'mael_voice_on'

function readVoicePref() {
  try {
    return localStorage.getItem(VOICE_KEY) !== 'off'
  } catch {
    return true
  }
}

/** Phòng thảo luận: học sinh chat với Thầy AI + 2 bạn AI */
export default function DiscussionPage() {
  const { sessionId } = useParams()
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [flagged, setFlagged] = useState({})
  const [showLesson, setShowLesson] = useState(true)
  const [voiceOn, setVoiceOn] = useState(readVoicePref)
  const [speakingId, setSpeakingId] = useState(null)
  const bottomRef = useRef(null)
  const queueRef = useRef(Promise.resolve())
  const voiceRef = useRef(voiceOn)

  // Đọc lần lượt các tin nhắn của AI, mỗi AI một giọng
  const readAloud = useCallback((list) => {
    list.filter((m) => m.senderType === 'AGENT').forEach((m) => {
      queueRef.current = queueRef.current.then(async () => {
        if (!voiceRef.current) return
        setSpeakingId(m.id)
        await speak(m.agentId, m.content)
        setSpeakingId(null)
      })
    })
  }, [])

  useEffect(() => {
    warmUpVoices()
    discussionApi.get(sessionId)
      .then((s) => {
        setSession(s)
        setMessages(s.messages)
        // Vừa mở phòng (chưa có tin nhắn học sinh) thì đọc lời chào
        if (s.status === 'ACTIVE' && !s.messages.some((m) => m.senderType === 'STUDENT')) readAloud(s.messages)
      })
      .catch((e) => setError(getErrorMessage(e)))
    return () => stopSpeaking()
  }, [sessionId, readAloud])

  const toggleVoice = () => {
    const next = !voiceOn
    setVoiceOn(next)
    voiceRef.current = next
    try { localStorage.setItem(VOICE_KEY, next ? 'on' : 'off') } catch { /* bỏ qua */ }
    if (!next) {
      stopSpeaking()
      queueRef.current = Promise.resolve()
      setSpeakingId(null)
    }
  }

  const speakOne = (m) => {
    stopSpeaking()
    queueRef.current = Promise.resolve()
    setSpeakingId(m.id)
    speak(m.agentId, m.content).finally(() => setSpeakingId(null))
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, sending])

  const send = async (text) => {
    const content = (text ?? input).trim()
    if (!content || sending) return
    stopSpeaking()
    queueRef.current = Promise.resolve()
    setInput('')
    setSending(true)
    setError('')
    // Hiện ngay tin nhắn của học sinh, thay bằng dữ liệu thật khi BE trả về
    const tempId = `temp-${Date.now()}`
    setMessages((m) => [...m, { id: tempId, senderType: 'STUDENT', content, createdAt: new Date().toISOString() }])
    try {
      const newMessages = await discussionApi.send(sessionId, content)
      setMessages((m) => [...m.filter((x) => x.id !== tempId), ...newMessages])
      readAloud(newMessages)
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== tempId))
      setInput(content)
      setError(getErrorMessage(e))
    } finally {
      setSending(false)
    }
  }

  const flagError = async (messageId) => {
    try {
      const res = await discussionApi.flagError(sessionId, messageId)
      setFlagged((f) => ({ ...f, [messageId]: res.correct ? 'correct' : 'wrong' }))
      setToast({
        ok: res.correct,
        text: res.feedback + (res.explanation ? ' ' + res.explanation : '') + (res.achievementUnlocked ? ' 🏅 Bạn vừa nhận huy hiệu Thám tử bắt lỗi!' : ''),
      })
      setTimeout(() => setToast(null), 9000)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const endSession = async () => {
    try {
      const s = await discussionApi.end(sessionId)
      setSession(s)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  if (!session && !error) return <Loading text="Đang vào phòng học..." />
  if (!session) return <div className="page"><ErrorBox message={error} /></div>

  const ended = session.status === 'ENDED'
  // Thứ tự hiển thị: Thầy AI, Tuấn Kiệt, Bảo An
  const order = (id) => { const i = AGENTS_INTRO.findIndex((a) => a.id === id); return i < 0 ? 99 : i }
  const agents = [...session.agents].sort((a, b) => order(a.agentId) - order(b.agentId))
  const last = messages[messages.length - 1]
  const choices = last?.senderType === 'AGENT' && last.quickReplies?.length ? last.quickReplies : FALLBACK_REPLIES
  const hasRealChoices = last?.senderType === 'AGENT' && last.quickReplies?.length > 0

  return (
    <div className="w-full px-margin-mobile py-space-md md:px-margin">
      {/* Thanh trên */}
      <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex flex-wrap items-center gap-space-sm">
          <Link to="/study-room" className="flex items-center gap-1 text-label-md text-on-surface-variant hover:text-primary">
            <Icon name="arrow_back" className="text-[18px]" /> Phòng học
          </Link>
          <span className="text-outline-variant">•</span>
          <span className="rounded-full bg-primary-fixed px-space-sm py-0.5 text-label-sm text-on-primary-fixed">{session.topicName}</span>
          <span className={`flex items-center gap-1 rounded-full px-space-sm py-0.5 text-label-sm ${ended ? 'bg-surface-container text-on-surface-variant' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
            {!ended && <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />}
            {ended ? 'Phiên đã kết thúc' : 'Phòng thảo luận trực tiếp (3 AI đang hỗ trợ)'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <button type="button" onClick={toggleVoice} title="Bật / tắt giọng đọc của 3 AI"
            className={`flex items-center gap-1 rounded-xl px-space-md py-1.5 text-label-md ${voiceOn ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container text-on-surface-variant'}`}>
            <Icon name={voiceOn ? 'volume_up' : 'volume_off'} className="text-[18px]" /> {voiceOn ? 'Đang đọc to' : 'Tắt tiếng'}
          </button>
          <Link to={`/stage/${session.lessonId}`} className="btn-primary py-1.5 text-label-md">
            <Icon name="bolt" filled className="text-[18px]" /> Vào thử thách ải
          </Link>
          {!ended && (
            <button type="button" onClick={endSession} className="btn-secondary py-1.5 text-label-md">
              <Icon name="logout" className="text-[18px] text-secondary" /> Kết thúc & tóm tắt
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        {/* Cột trái: bài học */}
        <aside className="flex flex-col gap-space-md lg:col-span-4">
          <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="mb-space-sm flex items-center justify-between gap-space-sm">
              <span className="rounded-md bg-primary-fixed px-space-sm py-1 text-label-sm uppercase tracking-wide text-on-primary-fixed">Bài đang thảo luận</span>
              <button type="button" onClick={() => setShowLesson((v) => !v)} className="text-on-surface-variant lg:hidden">
                <Icon name={showLesson ? 'expand_less' : 'expand_more'} />
              </button>
            </div>
            <h1 className="mb-space-sm text-headline-sm leading-snug text-on-surface">{session.lessonTitle}</h1>
            <div className={`${showLesson ? 'block' : 'hidden'} lg:block`}>
              <details className="group rounded-xl bg-surface-container-low p-space-md open:bg-surface-container" open>
                <summary className="flex cursor-pointer list-none items-center justify-between text-label-lg text-on-surface">
                  <span className="flex items-center gap-2"><Icon name="menu_book" className="text-[20px] text-primary" /> Lý thuyết bài học</span>
                  <Icon name="expand_more" className="text-[20px] text-outline transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-space-sm max-h-80 overflow-y-auto whitespace-pre-line pt-space-sm text-body-sm text-on-surface-variant">
                  {session.lessonContent}
                </div>
              </details>
              <div className="mt-space-md rounded-xl bg-primary-fixed/50 p-space-md">
                <div className="mb-1.5 flex items-center gap-2">
                  <Icon name="psychology" className="text-[20px] text-primary" />
                  <span className="text-label-md font-bold text-on-primary-fixed">Mẹo thảo luận</span>
                </div>
                <p className="text-body-sm leading-relaxed text-on-primary-fixed-variant">
                  Đọc kỹ từng câu của các bạn AI. Khi thấy lập luận sai, bấm “Bạn ấy nói sai!” rồi giải thích vì sao sai nhé.
                </p>
              </div>
              <Link to={`/lessons/${session.lessonId}`} className="btn-secondary mt-space-md w-full text-primary">
                <Icon name="open_in_new" className="text-[18px]" /> Mở trang bài giảng
              </Link>
            </div>
          </div>

          {session.summary && (
            <div className="rounded-2xl bg-tertiary-fixed/40 p-space-lg shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-label-lg text-on-tertiary-fixed">
                <Icon name="summarize" className="text-[20px]" /> Tóm tắt buổi học
              </div>
              <p className="text-body-md text-on-surface">{session.summary}</p>
            </div>
          )}
        </aside>

        {/* Cột phải: chat */}
        <section className="flex max-h-[calc(100vh-170px)] min-h-[560px] flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm lg:col-span-8">
          <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-space-sm bg-surface-container-low p-space-md">
            <div className="flex items-center gap-space-xs">
              <Icon name="diversity_3" className="text-[22px] text-primary" />
              <span className="text-headline-sm text-on-surface">Phòng thảo luận & Tranh luận</span>
            </div>
            <div className="flex items-center gap-space-sm overflow-x-auto py-1">
              {agents.map((a) => {
                const ui = agentUi(a.agentId, a.agentType)
                return (
                  <div key={a.sessionAgentId} className="flex items-center gap-2 rounded-xl bg-surface-container-lowest px-space-sm py-1 shadow-sm">
                    <AgentAvatar agentId={a.agentId} agentType={a.agentType} size="w-8 h-8" />
                    <div className="hidden flex-col pr-1 sm:flex">
                      <span className="text-label-sm font-bold leading-tight text-on-surface">{a.name}</span>
                      <span className={`text-[10px] font-semibold ${ui.text}`}>{ui.role}</span>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center gap-2 rounded-xl bg-primary-fixed/70 px-space-sm py-1 shadow-sm">
                <Pet code={user?.activePetCode} size={32} />
                <div className="hidden flex-col pr-1 sm:flex">
                  <span className="text-label-sm font-bold leading-tight text-on-primary-fixed">{user?.fullName}</span>
                  <span className="text-[10px] font-bold text-on-primary-fixed-variant">Bạn (Lớp {user?.gradeLevel})</span>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-space-md overflow-y-auto p-space-md sm:p-space-lg">
            <div className="flex justify-center">
              <span className="rounded-full bg-surface-container px-space-md py-1 text-label-sm text-on-surface-variant">
                {formatTime(session.startedAt)} - Bắt đầu thảo luận
              </span>
            </div>

            {messages.map((m) =>
              m.senderType === 'STUDENT' ? (
                <div key={m.id} className="ml-auto flex max-w-[85%] flex-row-reverse items-start gap-space-sm">
                  <span className="flex-shrink-0 rounded-full bg-primary-fixed/60"><Pet code={user?.activePetCode} size={40} /></span>
                  <div className="flex flex-col items-end">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-label-sm text-on-surface-variant">{formatTime(m.createdAt)}</span>
                      <span className="text-label-md font-bold text-on-primary-fixed">Bạn</span>
                    </div>
                    <div className="rounded-2xl rounded-tr-sm bg-primary-container p-space-md text-body-md leading-relaxed text-on-primary shadow-sm">
                      {m.content}
                    </div>
                  </div>
                </div>
              ) : (
                <AgentMessage key={m.id} m={m} flagged={flagged[m.id]} onFlag={() => flagError(m.id)} disabled={ended}
                  speaking={speakingId === m.id} onSpeak={() => speakOne(m)} />
              ),
            )}

            {sending && (
              <div className="flex items-center gap-space-sm pl-1 text-on-surface-variant">
                <div className="flex gap-1 rounded-2xl bg-surface-container-low px-space-md py-space-sm">
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-secondary-container" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-tertiary-container" />
                </div>
                <span className="text-label-sm">Các bạn AI đang suy nghĩ...</span>
              </div>
            )}

            {!ended && !sending && (
              <div className="pop-in flex flex-col gap-space-sm pl-0 pt-space-xs sm:pl-12">
                <span className="flex items-center gap-1 text-label-md text-on-surface-variant">
                  <Icon name="touch_app" className="text-[18px] text-primary" /> {hasRealChoices ? 'Bấm chọn câu trả lời của em:' : 'Em muốn hỏi gì tiếp?'}
                </span>
                <div className={`grid gap-space-sm ${hasRealChoices ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                  {choices.map((text, i) => (
                    <button key={text} type="button" onClick={() => send(text)}
                      className="flex items-start gap-space-sm rounded-2xl border-2 border-primary-fixed bg-surface-container-lowest px-space-md py-space-sm text-left text-body-md text-on-surface shadow-[0_3px_0_0_#b4c5ff] transition-all hover:border-primary hover:bg-primary-fixed/40 active:translate-y-[2px] active:shadow-none">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-label-sm font-extrabold text-on-primary">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <footer className="flex flex-shrink-0 flex-col gap-space-sm bg-surface-container-lowest p-space-md shadow-lg">
            {toast && (
              <div className={`rounded-xl px-space-md py-space-sm text-label-md ${toast.ok ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-secondary-fixed text-on-secondary-fixed'}`}>
                {toast.text}
              </div>
            )}
            <ErrorBox message={error} />
            {ended ? (
              <div className="flex flex-wrap items-center justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-md">
                <span className="text-label-lg text-on-surface-variant">Phiên thảo luận đã kết thúc.</span>
                <Link to="/study-room" className="btn-primary">Mở phiên mới</Link>
              </div>
            ) : (
              <form className="flex items-center gap-space-sm" onSubmit={(e) => { e.preventDefault(); send() }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hoặc tự gõ câu trả lời của em..."
                  className="h-12 flex-1 rounded-xl bg-surface-container-low px-space-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={2000}
                />
                <button type="submit" disabled={sending || !input.trim()}
                  className="flex h-12 flex-shrink-0 items-center gap-2 rounded-xl bg-primary-container px-space-lg text-label-lg text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50">
                  <span className="hidden sm:inline">Gửi</span>
                  <Icon name="send" className="text-[20px]" />
                </button>
              </form>
            )}
          </footer>
        </section>
      </div>
    </div>
  )
}

function AgentMessage({ m, flagged, onFlag, disabled, speaking, onSpeak }) {
  const ui = agentUi(m.agentId, m.agentType)
  return (
    <div className="flex max-w-[90%] items-start gap-space-sm sm:max-w-[85%]">
      <AgentAvatar agentId={m.agentId} agentType={m.agentType} />
      <div className="flex min-w-0 flex-col">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className={`text-label-md font-bold ${ui.text}`}>{m.agentName}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ui.chip}`}>{ui.role}</span>
          <span className="text-label-sm text-on-surface-variant">{formatTime(m.createdAt)}</span>
          <button type="button" onClick={onSpeak} title="Nghe lại"
            className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${speaking ? 'bg-tertiary-container text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}>
            <Icon name={speaking ? 'graphic_eq' : 'volume_up'} className="text-[16px]" />
          </button>
        </div>
        <div className={`rounded-2xl rounded-tl-sm p-space-md text-body-md leading-relaxed text-on-surface shadow-sm ${ui.bubble} ${speaking ? 'ring-2 ring-tertiary-container' : ''}`}>
          {m.content}
        </div>
        <div className="mt-1 flex items-center gap-space-md pl-1">
          {m.agentType === 'CRITIC' && !disabled && (
            flagged ? (
              <span className={`text-label-sm ${flagged === 'correct' ? 'text-tertiary' : 'text-secondary'}`}>
                {flagged === 'correct' ? '✓ Bạn đã bắt được lỗi' : 'Câu này đúng đó'}
              </span>
            ) : (
              <button type="button" onClick={onFlag} className="flex items-center gap-1 text-label-sm text-secondary hover:underline">
                <Icon name="report" className="text-[14px]" /> Bạn ấy nói sai!
              </button>
            )
          )}
          <ReportButton targetType="MESSAGE" targetId={m.id} compact />
        </div>
      </div>
    </div>
  )
}
