import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import { Badge, DIFFICULTY, fieldCls, PageHeader, Segmented, useToast } from '../../components/staff/ui'
import { LessonEditor, QuestionEditor, RejectModal, useContentTree } from '../../components/staff/editors'
import { contentApi, lecturerApi, lecturerInsightApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDateTime } from '../../utils/format'

const REASON = { WRONG_ANSWER: 'Đáp án sai', WRONG_EXPLANATION: 'Giải thích sai', TYPO: 'Lỗi chính tả', OTHER: 'Khác' }
const TARGET = { LESSON: 'Bài giảng', QUESTION: 'Câu hỏi', MESSAGE: 'Câu trả lời AI', SOLUTION: 'Lời giải ảnh' }

/**
 * Duyệt nội dung trước khi tới học sinh: sửa trực tiếp rồi duyệt, duyệt / từ chối hàng loạt,
 * xử lý báo lỗi của học sinh.
 */
export default function LecturerReviewPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'questions'
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [topic, setTopic] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [editing, setEditing] = useState(null) // { type, item }
  const [rejecting, setRejecting] = useState(null) // { lessonIds, questionIds }
  const [tree] = useContentTree()
  const [toast, showToast] = useToast()

  const load = useCallback(async () => {
    setError('')
    try {
      const [lessons, questions, reports] = await Promise.all([
        contentApi.lessons('PENDING_REVIEW'), contentApi.questions({ status: 'PENDING_REVIEW' }), lecturerApi.reports(),
      ])
      setData({ lessons, questions, reports })
      setSelected(new Set())
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }, [])
  useEffect(() => { load() }, [load])

  const setTab = (t) => { setParams(t === 'questions' ? {} : { tab: t }, { replace: true }); setSelected(new Set()) }

  const questionTopics = useMemo(() => {
    const m = new Map()
    data?.questions.forEach((q) => m.set(q.topicId, q.topicName))
    return [...m.entries()]
  }, [data])
  const questions = (data?.questions || []).filter((q) => !topic || q.topicId === topic)

  const bulk = async (payload, msg) => {
    try {
      const r = await lecturerInsightApi.bulkReview(payload)
      showToast(`${msg} ${r.done} mục${r.skipped ? ` (bỏ qua ${r.skipped} mục đã được người khác xử lý)` : ''}`)
      load()
    } catch (e) {
      showToast(getErrorMessage(e), 'red')
    }
  }
  const approve = (type, ids) => bulk({ [type === 'lesson' ? 'lessonIds' : 'questionIds']: ids, decision: 'APPROVED' }, 'Đã duyệt')

  const act = async (fn, msg) => {
    try { await fn(); showToast(msg); load() } catch (e) { showToast(getErrorMessage(e), 'red') }
  }

  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  if (!data && !error) return <Loading />

  return (
    <div className="page">
      {toast}
      <PageHeader icon="fact_check" title="Duyệt nội dung"
        subtitle="Học sinh và AI chỉ dùng nội dung đã duyệt. Sửa trực tiếp nếu chỉ sai nhỏ, không cần từ chối." />
      <ErrorBox message={error} onRetry={load} />
      {data && (
        <>
          <Segmented value={tab} onChange={setTab} options={[
            { value: 'questions', label: 'Câu hỏi', count: data.questions.length },
            { value: 'lessons', label: 'Bài giảng', count: data.lessons.length },
            { value: 'reports', label: 'Báo lỗi từ học sinh', count: data.reports.length },
          ]} />

          {tab === 'questions' && (
            data.questions.length === 0 ? <EmptyState icon="task_alt" title="Không có câu hỏi chờ duyệt" description="Câu hỏi AI soạn từ tài liệu PDF sẽ hiện ở đây." /> : (
              <div className="flex flex-col gap-space-md">
                <div className="sticky top-16 z-20 -mx-1 flex flex-wrap items-center gap-space-sm rounded-xl bg-surface/95 px-1 py-space-sm backdrop-blur">
                  <label className="flex items-center gap-space-xs text-label-lg">
                    <input type="checkbox" className="h-4 w-4 accent-primary"
                      checked={questions.length > 0 && questions.every((q) => selected.has(q.id))}
                      onChange={(e) => setSelected(e.target.checked ? new Set(questions.map((q) => q.id)) : new Set())} />
                    Chọn tất cả
                  </label>
                  {questionTopics.length > 1 && (
                    <select className={`${fieldCls} !h-9 !w-auto`} value={topic} onChange={(e) => { setTopic(e.target.value); setSelected(new Set()) }}>
                      <option value="">Mọi chương ({data.questions.length})</option>
                      {questionTopics.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                  )}
                  {selected.size > 0 && (
                    <div className="ml-auto flex gap-space-sm">
                      <button type="button" className="btn-primary" onClick={() => approve('question', [...selected])}>
                        <Icon name="done_all" className="text-[18px]" /> Duyệt {selected.size} câu
                      </button>
                      <button type="button" className="btn-secondary text-error" onClick={() => setRejecting({ questionIds: [...selected] })}>Từ chối</button>
                    </div>
                  )}
                </div>
                {questions.map((q) => (
                  <div key={q.id} className={`card flex gap-space-md transition-shadow ${selected.has(q.id) ? 'ring-2 ring-primary' : ''}`}>
                    <input type="checkbox" className="mt-1 h-4 w-4 flex-shrink-0 accent-primary" checked={selected.has(q.id)} onChange={() => toggle(q.id)} aria-label="Chọn câu này" />
                    <div className="flex min-w-0 flex-1 flex-col gap-space-sm">
                      <div className="flex flex-wrap items-center gap-space-xs">
                        <Badge tone="primary">{q.topicName}</Badge>
                        <Badge tone="gray">{q.lessonTitle ? `Ải: ${q.lessonTitle}` : 'Ải trùm'}</Badge>
                        <Badge tone="gray">{DIFFICULTY[q.difficulty]}</Badge>
                        {q.source === 'AI' && <Badge tone="orange" icon="auto_awesome">AI soạn</Badge>}
                      </div>
                      <h3 className="text-headline-sm text-on-surface">{q.content}</h3>
                      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {(q.options || []).map((o) => {
                          const ok = q.correctAnswer.split(/[^A-F]+/).includes(o[0])
                          return (
                            <li key={o} className={`flex items-center gap-1 rounded-lg px-space-sm py-1 text-body-md ${ok ? 'bg-tertiary-fixed/50 font-bold' : 'bg-surface-container-low'}`}>
                              {ok && <Icon name="check" className="text-[16px] text-tertiary" />} {o}
                            </li>
                          )
                        })}
                      </ul>
                      {q.explanation && <p className="text-body-sm text-on-surface-variant"><b>Giải thích:</b> {q.explanation}</p>}
                      <div className="flex flex-wrap gap-space-sm pt-space-xs">
                        <button type="button" className="btn-primary" onClick={() => approve('question', [q.id])}><Icon name="check" className="text-[18px]" /> Duyệt</button>
                        <button type="button" className="btn-secondary" onClick={() => setEditing({ type: 'question', item: q })}><Icon name="edit" className="text-[18px]" /> Sửa rồi duyệt</button>
                        <button type="button" className="btn-ghost text-error" onClick={() => setRejecting({ questionIds: [q.id] })}><Icon name="close" className="text-[18px]" /> Từ chối</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'lessons' && (
            data.lessons.length === 0 ? <EmptyState icon="task_alt" title="Không có bài giảng chờ duyệt" /> : (
              <div className="flex flex-col gap-space-md">
                {data.lessons.map((l) => (
                  <div key={l.id} className="card flex flex-col gap-space-sm">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <Badge tone="primary">Lớp {l.gradeLevel} • {l.topicName}</Badge>
                      <span className="text-body-sm text-outline">Cập nhật {formatDateTime(l.updatedAt)}</span>
                    </div>
                    <h3 className="text-headline-sm text-on-surface">{l.title}</h3>
                    <p className="max-h-60 overflow-y-auto whitespace-pre-line rounded-lg bg-surface-container-low p-space-md text-body-md">{l.content || 'Chưa có nội dung'}</p>
                    {l.misconceptions?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-label-md text-on-surface-variant">Lỗi sai hay gặp ({l.misconceptions.length})</span>
                        {l.misconceptions.map((m, i) => (
                          <div key={i} className="rounded-lg border border-surface-container px-space-sm py-1 text-body-sm">
                            <span className="text-error">✗ {m.wrong}</span>{m.fix && <span className="text-tertiary"> → ✓ {m.fix}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-space-sm pt-space-xs">
                      <button type="button" className="btn-primary" onClick={() => approve('lesson', [l.id])}><Icon name="check" className="text-[18px]" /> Duyệt & xuất bản</button>
                      <button type="button" className="btn-secondary" onClick={() => setEditing({ type: 'lesson', item: l })}><Icon name="edit" className="text-[18px]" /> Sửa rồi duyệt</button>
                      <button type="button" className="btn-ghost text-error" onClick={() => setRejecting({ lessonIds: [l.id] })}><Icon name="close" className="text-[18px]" /> Từ chối</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'reports' && (
            data.reports.length === 0 ? <EmptyState icon="task_alt" title="Không có báo lỗi cần xử lý" /> : (
              <div className="flex flex-col gap-space-md">
                <p className="flex items-center gap-space-xs rounded-xl bg-primary-fixed/50 px-space-md py-space-sm text-body-sm text-on-primary-fixed">
                  <Icon name="info" className="text-[18px]" /> Xác nhận có lỗi ở bài / câu hỏi: nội dung đó tạm rút khỏi học sinh và chuyển sang tab chờ duyệt để bạn sửa.
                </p>
                {data.reports.map((r) => (
                  <div key={r.id} className="card flex flex-col gap-space-sm">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <Badge tone="red">{REASON[r.reason]}</Badge>
                      <Badge tone="gray">{TARGET[r.targetType]}</Badge>
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
        </>
      )}

      {editing?.type === 'question' && (
        <QuestionEditor approveMode question={editing.item} tree={tree} onClose={() => setEditing(null)}
          onSaved={(_, published) => { setEditing(null); showToast(published ? 'Đã sửa và duyệt câu hỏi' : 'Đã lưu sửa'); load() }} />
      )}
      {editing?.type === 'lesson' && (
        <LessonEditor approveMode lesson={editing.item} tree={tree} onClose={() => setEditing(null)}
          onSaved={(_, published) => { setEditing(null); showToast(published ? 'Đã sửa và duyệt bài' : 'Đã lưu sửa'); load() }} />
      )}
      {rejecting && (
        <RejectModal count={(rejecting.lessonIds?.length || 0) + (rejecting.questionIds?.length || 0)} onClose={() => setRejecting(null)}
          onConfirm={async (comment) => { await bulk({ ...rejecting, decision: 'REJECTED', comment }, 'Đã từ chối'); setRejecting(null) }} />
      )}
    </div>
  )
}
