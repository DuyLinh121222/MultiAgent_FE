import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import ProgressBar from '../components/common/ProgressBar'
import ReportButton from '../components/common/ReportButton'
import { discussionApi, learningApi } from '../api/services'
import { getErrorMessage } from '../api/client'

export default function LessonPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setLesson(null)
    learningApi.lesson(lessonId).then(setLesson).catch((e) => setError(getErrorMessage(e)))
  }, [lessonId])

  const complete = async () => {
    setBusy(true)
    try {
      const s = await learningApi.updateProgress(lessonId, 100)
      setLesson((l) => ({ ...l, progressStatus: s.progressStatus, progressPercent: s.progressPercent }))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const discuss = async () => {
    setBusy(true)
    try {
      const session = await discussionApi.start(lessonId)
      navigate(`/study-room/${session.id}`)
    } catch (e) {
      setError(getErrorMessage(e))
      setBusy(false)
    }
  }

  if (!lesson && !error) return <Loading />

  return (
    <div className="page max-w-4xl">
      <Link to="/" className="flex w-fit items-center gap-1 text-label-md text-on-surface-variant hover:text-primary">
        <Icon name="arrow_back" className="text-[18px]" /> Về lộ trình
      </Link>
      <ErrorBox message={error} />
      {lesson && (
        <article className="card flex flex-col gap-space-lg">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="chip bg-primary-fixed text-on-primary-fixed">Toán {lesson.gradeLevel} • {lesson.topicName}</span>
            {lesson.durationMinutes && (
              <span className="chip bg-surface-container text-on-surface-variant">
                <Icon name="timer" className="text-[16px]" /> {lesson.durationMinutes} phút
              </span>
            )}
            {lesson.progressStatus === 'COMPLETED' && (
              <span className="chip bg-tertiary-fixed text-on-tertiary-fixed"><Icon name="check_circle" className="text-[16px]" /> Đã hoàn thành</span>
            )}
          </div>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{lesson.title}</h1>
          <ProgressBar value={lesson.progressPercent} />

          <div className="whitespace-pre-line rounded-xl bg-surface-container-low p-space-lg text-[19px] leading-9 text-on-surface">
            {lesson.content}
          </div>

          {lesson.videoUrl && (
            <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="btn-secondary w-fit">
              <Icon name="play_circle" className="text-[20px]" /> Xem video bài giảng
            </a>
          )}
          {lesson.materials.length > 0 && (
            <div className="flex flex-col gap-space-xs">
              <span className="text-label-lg text-on-surface">Tài liệu đính kèm</span>
              {lesson.materials.map((m) => (
                <a key={m.id} href={m.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-space-xs text-label-md text-primary hover:underline">
                  <Icon name="attach_file" className="text-[18px]" /> {m.fileName}
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-space-sm border-t border-surface-container pt-space-lg sm:flex-row sm:items-center">
            <button type="button" className="btn-primary py-space-md" onClick={discuss} disabled={busy}>
              <Icon name="forum" className="text-[20px]" /> Thảo luận bài này cùng 3 AI
            </button>
            {lesson.progressStatus !== 'COMPLETED' && (
              <button type="button" className="btn-secondary py-space-md" onClick={complete} disabled={busy}>
                <Icon name="task_alt" className="text-[20px]" /> Đánh dấu đã học xong
              </button>
            )}
            <div className="sm:ml-auto">
              <ReportButton targetType="LESSON" targetId={lesson.id} />
            </div>
          </div>
        </article>
      )}
    </div>
  )
}
