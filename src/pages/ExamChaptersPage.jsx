import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading, { Spinner } from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import EmptyState from '../components/common/EmptyState'
import { chapterTheme } from '../components/game/GameArt'
import { examApi } from '../api/services'
import { getErrorMessage } from '../api/client'

const fmt = (n) => (n == null ? '' : Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 }))

/**
 * Kiểm tra theo chương: học sinh chọn chương muốn ôn -> chọn đề -> làm tự luận từng câu (chụp ảnh bài làm).
 * Chương và đề lấy từ lộ trình lớp của học sinh + đề giảng viên đã xuất bản.
 */
export default function ExamChaptersPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const topicId = params.get('chapter')
  const [chapters, setChapters] = useState(null)
  const [exams, setExams] = useState(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState('')

  const loadChapters = useCallback(() => {
    setError('')
    examApi.chapters().then(setChapters).catch((e) => setError(getErrorMessage(e)))
  }, [])
  useEffect(() => { loadChapters() }, [loadChapters])

  useEffect(() => {
    if (!topicId) { setExams(null); return }
    setExams(null)
    examApi.list(topicId).then(setExams).catch((e) => setError(getErrorMessage(e)))
  }, [topicId])

  const start = async (exam) => {
    setStarting(exam.id)
    setError('')
    try {
      const attempt = await examApi.start(exam.id)
      navigate(`/exams/attempt/${attempt.id}`)
    } catch (e) {
      setError(getErrorMessage(e))
      setStarting('')
    }
  }

  if (!chapters && !error) return <Loading text="Đang mở danh sách chương..." />

  const selectedIndex = chapters?.findIndex((c) => c.topicId === topicId) ?? -1
  const selected = selectedIndex >= 0 ? chapters[selectedIndex] : null
  const totalExams = (chapters || []).reduce((s, c) => s + c.examCount, 0)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-space-lg px-margin-mobile py-space-lg md:px-margin">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#5b3fd0] to-[#8b6cf6] p-space-lg text-white shadow-[0_10px_30px_-12px_rgba(91,63,208,0.6)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-1">
          <span className="chip w-fit bg-white/20 text-white"><Icon name="edit_note" className="text-[16px]" /> Kiểm tra tự luận</span>
          <h1 className="text-headline-lg-mobile font-extrabold md:text-headline-lg">Chọn chương để ôn</h1>
          <p className="text-body-md text-white/85">Làm câu nào → chụp bài làm câu đó → AI chấm ngay.</p>
        </div>
      </section>

      <ErrorBox message={error} onRetry={!chapters ? loadChapters : undefined} />

      {chapters && chapters.length === 0 && (
        <EmptyState icon="menu_book" title="Lớp của em chưa có chương nào" description="Thầy cô đang soạn nội dung, em quay lại sau nhé." />
      )}

      {chapters && chapters.length > 0 && totalExams === 0 && (
        <EmptyState icon="edit_note" title="Chưa có đề kiểm tra" description="Thầy cô chưa đăng đề cho lớp của em. Trong lúc chờ, em đi ải trên bản đồ nhé!" />
      )}

      {chapters && chapters.length > 0 && (
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((c, i) => {
            const th = chapterTheme(i)
            const active = c.topicId === topicId
            const empty = c.examCount === 0
            return (
              <button key={c.topicId} type="button" disabled={empty}
                onClick={() => setParams(active ? {} : { chapter: c.topicId })}
                className={`flex items-center gap-space-md rounded-[24px] bg-gradient-to-br ${th.bg} p-space-md text-left transition-all ${
                  active ? 'ring-[3px] ring-primary shadow-tactile' : 'hover:-translate-y-0.5'
                } ${empty ? 'cursor-not-allowed opacity-50' : ''}`}>
                <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${th.ribbon} text-headline-sm font-black text-white`}>
                  {c.orderIndex}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-label-lg font-extrabold text-on-surface">{c.name}</div>
                  <div className="text-body-sm" style={{ color: th.accent }}>
                    {empty ? 'Chưa có đề' : `${c.examCount} đề`} • HK{c.semester}
                  </div>
                </div>
                {!empty && <Icon name={active ? 'expand_less' : 'chevron_right'} className="text-on-surface-variant" />}
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <section className="flex flex-col gap-space-md rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm">
          <h2 className="text-headline-sm text-on-surface">{selected.name}</h2>
          {!exams ? <Loading text="Đang tải đề..." /> : exams.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Chương này chưa có đề.</p>
          ) : (
            <div className="flex flex-col gap-space-sm">
              {exams.map((e) => (
                <div key={e.id} className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-md sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="text-label-lg font-extrabold text-on-surface">{e.title}</div>
                    {e.description && <div className="line-clamp-2 text-body-sm text-on-surface-variant">{e.description}</div>}
                    <div className="mt-1 flex flex-wrap gap-2 text-label-md">
                      <span className="chip bg-primary-fixed text-on-primary-fixed"><Icon name="format_list_numbered" className="text-[16px]" /> {e.questionCount} câu</span>
                      <span className="chip bg-secondary-fixed text-on-secondary-fixed"><Icon name="grade" className="text-[16px]" /> {fmt(e.totalPoints)} điểm</span>
                      {e.bestScore != null && (
                        <span className="chip bg-tertiary-fixed text-on-tertiary-fixed"><Icon name="emoji_events" filled className="text-[16px]" /> Cao nhất {fmt(e.bestScore)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-space-sm">
                    {e.lastSubmittedAttemptId && (
                      <button type="button" className="btn-ghost" onClick={() => navigate(`/exams/attempt/${e.lastSubmittedAttemptId}`)}>
                        <Icon name="history" className="text-[20px]" /> Xem lại
                      </button>
                    )}
                    <button type="button" className="btn-primary" disabled={starting === e.id} onClick={() => start(e)}>
                      {starting === e.id ? <Spinner className="text-[20px]" /> : <Icon name={e.inProgressAttemptId ? 'play_arrow' : 'edit'} className="text-[20px]" filled />}
                      {e.inProgressAttemptId ? 'Làm tiếp' : e.attempts > 0 ? 'Làm lại' : 'Bắt đầu'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
