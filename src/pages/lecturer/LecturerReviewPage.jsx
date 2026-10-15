import { useCallback, useEffect, useState } from 'react'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import { lecturerApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDateTime } from '../../utils/format'

const TABS = [
  { key: 'lessons', label: 'Bài giảng chờ duyệt', icon: 'menu_book' },
  { key: 'questions', label: 'Câu hỏi chờ duyệt', icon: 'quiz' },
  { key: 'reports', label: 'Báo lỗi từ học sinh', icon: 'flag' },
]
const REASON = { WRONG_ANSWER: 'Đáp án sai', WRONG_EXPLANATION: 'Giải thích sai', TYPO: 'Lỗi chính tả', OTHER: 'Khác' }
const TARGET = { LESSON: 'Bài giảng', QUESTION: 'Câu hỏi', MESSAGE: 'Câu trả lời AI', SOLUTION: 'Lời giải ảnh' }

/** Cổng giảng viên: duyệt nội dung trước khi xuất bản, xử lý báo lỗi */
export default function LecturerReviewPage() {
  const [tab, setTab] = useState('lessons')
  const [data, setData] = useState({ lessons: [], questions: [], reports: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [lessons, questions, reports] = await Promise.all([
        lecturerApi.pendingLessons(), lecturerApi.pendingQuestions(), lecturerApi.reports(),
      ])
      setData({ lessons, questions, reports })
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const act = async (fn, msg) => {
    setError('')
    try {
      await fn()
      setNotice(msg)
      setTimeout(() => setNotice(''), 3000)
      load()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const review = (type, id, decision) => {
    let comment = ''
    if (decision === 'REJECTED') {
      comment = window.prompt('Góp ý cho người soạn (bắt buộc khi từ chối):') || ''
      if (!comment.trim()) return
    }
    const fn = type === 'lesson' ? lecturerApi.reviewLesson : lecturerApi.reviewQuestion
    act(() => fn(id, decision, comment), decision === 'APPROVED' ? 'Đã duyệt và xuất bản' : 'Đã từ chối, gửi góp ý cho người soạn')
  }

  if (loading) return <Loading />

  return (
    <div className="page">
      <div className="flex flex-col gap-space-xs">
        <h1 className="text-headline-lg text-on-surface">Duyệt nội dung</h1>
        <p className="text-body-md text-on-surface-variant">Học sinh và AI chỉ dùng nội dung đã được giảng viên duyệt.</p>
      </div>
      <ErrorBox message={error} onRetry={load} />
      {notice && <div className="rounded-xl bg-tertiary-fixed px-space-md py-space-sm text-label-lg text-on-tertiary-fixed">{notice}</div>}

      <div className="flex flex-wrap gap-space-sm">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`flex items-center gap-space-xs rounded-xl px-space-md py-space-sm text-label-lg ${tab === t.key ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
            <Icon name={t.icon} className="text-[18px]" /> {t.label}
            <span className={`rounded-full px-2 text-label-sm ${tab === t.key ? 'bg-on-primary/20' : 'bg-surface-container-high'}`}>{data[t.key].length}</span>
          </button>
        ))}
      </div>

      {tab === 'lessons' && (
        data.lessons.length === 0 ? <EmptyState icon="task_alt" title="Không có bài giảng chờ duyệt" /> : (
          <div className="flex flex-col gap-space-md">
            {data.lessons.map((l) => (
              <div key={l.id} className="card flex flex-col gap-space-sm">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <span className="chip bg-primary-fixed text-on-primary-fixed">Lớp {l.gradeLevel} • {l.topicName}</span>
                  <span className="text-body-sm text-outline">Cập nhật {formatDateTime(l.updatedAt)}</span>
                </div>
                <h3 className="text-headline-sm text-on-surface">{l.title}</h3>
                <p className="whitespace-pre-line rounded-lg bg-surface-container-low p-space-md text-body-md">{l.content}</p>
                <ReviewButtons onApprove={() => review('lesson', l.id, 'APPROVED')} onReject={() => review('lesson', l.id, 'REJECTED')} />
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'questions' && (
        data.questions.length === 0 ? <EmptyState icon="task_alt" title="Không có câu hỏi chờ duyệt" /> : (
          <div className="flex flex-col gap-space-md">
            {data.questions.map((q) => (
              <div key={q.id} className="card flex flex-col gap-space-sm">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <span className="chip bg-primary-fixed text-on-primary-fixed">{q.topicName}</span>
                  <span className="chip bg-surface-container text-on-surface-variant">{q.difficulty}</span>
                  {q.source === 'AI' && <span className="chip bg-secondary-fixed text-on-secondary-fixed">AI sinh</span>}
                </div>
                <h3 className="text-headline-sm text-on-surface">{q.content}</h3>
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {(q.options || []).map((o) => (
                    <li key={o} className={`rounded-lg px-space-sm py-1 text-body-md ${o.startsWith(q.correctAnswer) ? 'bg-tertiary-fixed/50 font-bold' : 'bg-surface-container-low'}`}>{o}</li>
                  ))}
                </ul>
                <p className="text-body-sm text-on-surface-variant">Đáp án: <b>{q.correctAnswer}</b> • {q.explanation}</p>
                <ReviewButtons onApprove={() => review('question', q.id, 'APPROVED')} onReject={() => review('question', q.id, 'REJECTED')} />
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'reports' && (
        data.reports.length === 0 ? <EmptyState icon="task_alt" title="Không có báo lỗi cần xử lý" /> : (
          <div className="flex flex-col gap-space-md">
            {data.reports.map((r) => (
              <div key={r.id} className="card flex flex-col gap-space-sm">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <span className="chip bg-error-container text-on-error-container">{REASON[r.reason]}</span>
                  <span className="chip bg-surface-container text-on-surface-variant">{TARGET[r.targetType]}</span>
                  <span className="text-body-sm text-outline">{r.studentName} • {formatDateTime(r.createdAt)}</span>
                </div>
                <p className="rounded-lg bg-surface-container-low p-space-md text-body-md">“{r.targetPreview}”</p>
                {r.description && <p className="text-body-md text-on-surface-variant">Học sinh ghi chú: {r.description}</p>}
                <div className="flex flex-wrap gap-space-sm">
                  <button type="button" className="btn-primary" onClick={() => act(() => lecturerApi.handleReport(r.id, 'RESOLVED', 'Đã xác nhận lỗi, đưa nội dung về chờ duyệt lại'), 'Đã xác nhận lỗi')}>
                    <Icon name="check" className="text-[18px]" /> Xác nhận có lỗi
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => act(() => lecturerApi.handleReport(r.id, 'DISMISSED', 'Nội dung đúng'), 'Đã bỏ qua báo cáo')}>
                    Nội dung đúng, bỏ qua
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function ReviewButtons({ onApprove, onReject }) {
  return (
    <div className="flex flex-wrap gap-space-sm pt-space-xs">
      <button type="button" className="btn-primary" onClick={onApprove}><Icon name="check" className="text-[18px]" /> Duyệt & xuất bản</button>
      <button type="button" className="btn-secondary text-error" onClick={onReject}><Icon name="close" className="text-[18px]" /> Từ chối</button>
    </div>
  )
}
