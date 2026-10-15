import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import EmptyState from '../components/common/EmptyState'
import AgentAvatar from '../components/common/AgentAvatar'
import { discussionApi, learningApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { AGENTS_INTRO } from '../constants/agents'
import { formatDateTime } from '../utils/format'

/** Chọn bài học để mở phòng thảo luận, xem lại các phiên cũ */
export default function StudyRoomPage() {
  const navigate = useNavigate()
  const [path, setPath] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startingId, setStartingId] = useState(null)

  useEffect(() => {
    Promise.all([learningApi.myPath(), discussionApi.list()])
      .then(([p, s]) => { setPath(p); setSessions(s) })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const start = async (lessonId) => {
    setStartingId(lessonId)
    setError('')
    try {
      const s = await discussionApi.start(lessonId)
      navigate(`/study-room/${s.id}`)
    } catch (e) {
      setError(getErrorMessage(e))
      setStartingId(null)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="page">
      <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-fixed/40 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-space-lg md:flex-row md:items-center">
          <div className="flex max-w-2xl flex-col gap-space-xs">
            <span className="chip w-fit bg-surface-container text-primary"><Icon name="diversity_3" className="text-[16px]" /> Phòng học nhóm AI</span>
            <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Chọn bài học để thảo luận cùng Thầy AI và 2 bạn</h1>
            <p className="text-body-md text-on-surface-variant">
              Tuấn Kiệt đôi khi cố tình nói sai đó! Hãy bấm <b>“Bạn ấy nói sai!”</b> khi phát hiện lỗi để nhận huy hiệu Thám tử bắt lỗi.
            </p>
          </div>
          <div className="flex flex-col gap-space-xs">
            {AGENTS_INTRO.map((a) => (
              <div key={a.id} className="flex items-center gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
                <AgentAvatar agentId={a.id} size="w-9 h-9" />
                <div className="flex flex-col">
                  <span className="text-label-md font-bold">{a.name}</span>
                  <span className="text-body-sm text-on-surface-variant">{a.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ErrorBox message={error} />

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
        <section className="flex flex-col gap-space-md lg:col-span-8">
          <h2 className="text-headline-sm text-on-surface">{path?.name}</h2>
          {path?.topics.map((t) => (
            <div key={t.id} className="card flex flex-col gap-space-sm">
              <span className="text-label-lg text-primary">Chủ đề {t.orderIndex}: {t.name}</span>
              {t.lessons.length === 0 && <span className="text-body-sm text-outline">Bài học đang được biên soạn</span>}
              {t.lessons.map((l) => (
                <div key={l.id} className="flex flex-col justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-md sm:flex-row sm:items-center">
                  <div className="flex items-center gap-space-sm">
                    <Icon name={l.progressStatus === 'COMPLETED' ? 'check_circle' : 'menu_book'}
                      className={`text-[22px] ${l.progressStatus === 'COMPLETED' ? 'text-tertiary' : 'text-primary'}`} />
                    <span className="text-label-lg text-on-surface">{l.title}</span>
                  </div>
                  <button type="button" className="btn-primary" disabled={startingId === l.id} onClick={() => start(l.id)}>
                    <Icon name="forum" className="text-[18px]" />
                    {startingId === l.id ? 'Đang mở...' : 'Vào thảo luận'}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </section>

        <aside className="flex flex-col gap-space-md lg:col-span-4">
          <h2 className="text-headline-sm text-on-surface">Các phiên gần đây</h2>
          {sessions.length === 0 ? (
            <EmptyState icon="forum" title="Chưa có phiên thảo luận" description="Chọn một bài học bên trái để bắt đầu nhé!" />
          ) : (
            sessions.map((s) => (
              <Link key={s.id} to={`/study-room/${s.id}`} className="card flex flex-col gap-space-xs p-space-md transition-colors hover:bg-surface-container-low">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label-lg text-on-surface">{s.lessonTitle}</span>
                  <span className={`rounded-full px-2 py-0.5 text-label-sm ${s.status === 'ACTIVE' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container text-on-surface-variant'}`}>
                    {s.status === 'ACTIVE' ? 'Đang mở' : 'Đã kết thúc'}
                  </span>
                </div>
                <span className="text-body-sm text-on-surface-variant">{formatDateTime(s.startedAt)}</span>
              </Link>
            ))
          )}
        </aside>
      </div>
    </div>
  )
}
