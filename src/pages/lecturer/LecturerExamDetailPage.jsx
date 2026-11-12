import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Loading, { Spinner } from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import { Badge, Field, Modal, Segmented, areaCls, fieldCls, useToast } from '../../components/staff/ui'
import { documentApi, examAdminApi } from '../../api/services'
import { fileUrl, getErrorMessage } from '../../api/client'
import { formatDateTime } from '../../utils/format'
import { EXAM_STATUS, TopicSelect } from './LecturerExamsPage'

const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 }))
const POINT_STEP = 0.25

const toForm = (e) => ({
  title: e.title || '',
  description: e.description || '',
  topicId: e.topicId,
  questions: (e.questions || []).map((q) => ({ key: q.id, id: q.id, content: q.content, points: q.points, referenceAnswer: q.referenceAnswer || '' })),
})

/**
 * Chi tiết đề kiểm tra: kiểm tra / sửa câu AI tách ra, điểm, đáp án -> xuất bản.
 * Tab "Bài làm": xem ảnh bài làm của học sinh, điểm AI chấm, chấm lại khi cần.
 */
export default function LecturerExamDetailPage() {
  const { examId } = useParams()
  const [exam, setExam] = useState(null)
  const [topics, setTopics] = useState([])
  const [form, setForm] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState('EDIT')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, showToast] = useToast()

  const apply = (e) => {
    setExam(e)
    setForm(toForm(e))
    setDirty(false)
  }

  const load = useCallback(async () => {
    try {
      const [e, t] = await Promise.all([examAdminApi.get(examId), documentApi.topics()])
      setTopics(t)
      apply(e)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [examId])
  useEffect(() => { load() }, [load])

  // AI đang tách đề: hỏi lại mỗi 4 giây
  useEffect(() => {
    if (exam?.status !== 'PROCESSING') return undefined
    const t = setInterval(() => examAdminApi.get(examId).then((e) => { if (e.status !== 'PROCESSING') apply(e) }).catch(() => {}), 4000)
    return () => clearInterval(t)
  }, [exam?.status, examId])

  const run = async (fn, msg) => {
    setBusy(true)
    setError('')
    try {
      apply(await fn())
      if (msg) showToast(msg)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const save = () => run(() => examAdminApi.update(examId, {
    title: form.title,
    description: form.description,
    topicId: form.topicId,
    questions: form.questions.map((q) => ({ id: q.id || null, content: q.content, points: Number(q.points), referenceAnswer: q.referenceAnswer })),
  }), 'Đã lưu đề')

  const publish = async () => {
    if (dirty) {
      setError('Thầy cô bấm "Lưu" trước khi xuất bản nhé')
      return
    }
    run(() => examAdminApi.publish(examId), 'Đã xuất bản, học sinh đã thấy đề trong chương')
  }

  const setQ = (i, patch) => {
    setForm((f) => ({ ...f, questions: f.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }))
    setDirty(true)
  }
  const move = (i, d) => {
    setForm((f) => {
      const qs = [...f.questions]
      const j = i + d
      if (j < 0 || j >= qs.length) return f
      ;[qs[i], qs[j]] = [qs[j], qs[i]]
      return { ...f, questions: qs }
    })
    setDirty(true)
  }
  const addQ = () => {
    setForm((f) => ({ ...f, questions: [...f.questions, { key: `new-${Date.now()}`, id: null, content: '', points: 1, referenceAnswer: '' }] }))
    setDirty(true)
  }
  const removeQ = (i) => {
    if (!window.confirm(`Xoá câu ${i + 1}?`)) return
    setForm((f) => ({ ...f, questions: f.questions.filter((_, j) => j !== i) }))
    setDirty(true)
  }

  if (!exam && !error) return <Loading />
  if (!exam) return <div className="page"><ErrorBox message={error} onRetry={load} /></div>

  const st = EXAM_STATUS[exam.status] || { label: exam.status, tone: 'gray' }
  const total = form.questions.reduce((s, q) => s + (Number(q.points) || 0), 0)
  const processing = exam.status === 'PROCESSING'

  return (
    <div className="page">
      {toast}
      <Link to="/lecturer/exams" className="flex w-fit items-center gap-1 text-label-lg text-on-surface-variant hover:text-primary">
        <Icon name="arrow_back" className="text-[20px]" /> Danh sách đề
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap gap-space-sm">
            <Badge tone={st.tone} icon={st.icon}>{st.label}</Badge>
            <Badge tone="primary">Lớp {exam.gradeLevel} • {exam.topicName}</Badge>
            {exam.sourceFileName && <Badge tone="gray" icon="attach_file">{exam.sourceFileName}</Badge>}
          </div>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{exam.title}</h1>
          <div className="text-body-sm text-outline">{exam.createdByName ? `${exam.createdByName} • ` : ''}{formatDateTime(exam.createdAt)}</div>
        </div>
        {!processing && (
          <div className="flex flex-wrap gap-space-sm">
            {exam.status === 'PUBLISHED' ? (
              <button type="button" className="btn-secondary" disabled={busy}
                onClick={() => window.confirm('Gỡ đề khỏi học sinh (về nháp)?') && run(() => examAdminApi.unpublish(examId), 'Đã gỡ đề về nháp')}>
                <Icon name="visibility_off" className="text-[18px]" /> Gỡ về nháp
              </button>
            ) : (
              <button type="button" className="btn-primary" disabled={busy || form.questions.length === 0} onClick={publish}>
                <Icon name="publish" className="text-[18px]" /> Xuất bản
              </button>
            )}
            {exam.status !== 'ARCHIVED' && (
              <button type="button" className="btn-ghost" disabled={busy}
                onClick={() => window.confirm('Lưu trữ đề này? Học sinh sẽ không thấy nữa.') && run(() => examAdminApi.unpublish(examId, true), 'Đã lưu trữ đề')}>
                <Icon name="inventory_2" className="text-[18px]" /> Lưu trữ
              </button>
            )}
          </div>
        )}
      </div>

      {exam.aiNote && (
        <div className={`flex items-start gap-space-sm rounded-xl p-space-md text-body-md ${exam.status === 'FAILED' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed/50 text-on-primary-fixed'}`}>
          <Icon name={processing ? 'progress_activity' : exam.status === 'FAILED' ? 'error' : 'auto_awesome'} className={`text-[22px] ${processing ? 'animate-spin' : ''}`} />
          {exam.aiNote}
        </div>
      )}
      <ErrorBox message={error} />

      {processing ? (
        <Loading text="AI đang đọc file đề và tách từng câu..." />
      ) : (
        <>
          <Segmented value={tab} onChange={setTab} options={[
            { value: 'EDIT', label: 'Đề & đáp án' },
            { value: 'SUBMISSIONS', label: 'Bài làm học sinh', count: exam.attemptCount },
          ]} />

          {tab === 'EDIT' ? (
            <div className="flex flex-col gap-space-md">
              <div className="card grid grid-cols-1 gap-space-md md:grid-cols-2">
                <Field label="Tên đề"><input className={fieldCls} value={form.title} maxLength={250} onChange={(e) => { setForm({ ...form, title: e.target.value }); setDirty(true) }} /></Field>
                <Field label="Chương">
                  <TopicSelect topics={topics} value={form.topicId} className={fieldCls} onChange={(v) => { setForm({ ...form, topicId: v }); setDirty(true) }} />
                </Field>
                <Field label="Lời dặn cho học sinh (không bắt buộc)" className="md:col-span-2">
                  <textarea className={areaCls} rows={2} value={form.description} onChange={(e) => { setForm({ ...form, description: e.target.value }); setDirty(true) }} />
                </Field>
              </div>

              {form.questions.length === 0 && <EmptyState icon="format_list_numbered" title="Đề chưa có câu hỏi" description="Bấm Thêm câu để tự gõ câu hỏi." />}

              {form.questions.map((q, i) => (
                <div key={q.key} className="card flex flex-col gap-space-sm">
                  <div className="flex flex-wrap items-center justify-between gap-space-sm">
                    <h3 className="text-headline-sm text-primary">Câu {i + 1}</h3>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
                        Điểm
                        <input type="number" min={POINT_STEP} step={POINT_STEP} className={`${fieldCls} !h-9 !w-24`} value={q.points}
                          onChange={(e) => setQ(i, { points: e.target.value })} />
                      </label>
                      <button type="button" className="btn-ghost px-2" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Lên"><Icon name="arrow_upward" /></button>
                      <button type="button" className="btn-ghost px-2" disabled={i === form.questions.length - 1} onClick={() => move(i, 1)} aria-label="Xuống"><Icon name="arrow_downward" /></button>
                      <button type="button" className="btn-ghost px-2 text-error" onClick={() => removeQ(i)} aria-label="Xoá"><Icon name="delete" /></button>
                    </div>
                  </div>
                  <Field label="Đề bài">
                    <textarea className={areaCls} rows={Math.min(10, Math.max(3, q.content.split('\n').length + 1))} value={q.content}
                      onChange={(e) => setQ(i, { content: e.target.value })} placeholder="Nội dung câu hỏi. Các ý a), b) mỗi ý 1 dòng." />
                  </Field>
                  <Field label="Đáp án / hướng dẫn chấm (AI chấm theo phần này, học sinh thấy sau khi nộp bài)">
                    <textarea className={areaCls} rows={Math.min(12, Math.max(3, q.referenceAnswer.split('\n').length + 1))} value={q.referenceAnswer}
                      onChange={(e) => setQ(i, { referenceAnswer: e.target.value })} placeholder="Lời giải các bước + biểu điểm từng bước" />
                  </Field>
                </div>
              ))}

              <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-space-sm rounded-2xl bg-surface-container-lowest/95 p-space-md shadow-lg backdrop-blur">
                <div className="text-label-lg text-on-surface">
                  {form.questions.length} câu • Tổng <b>{fmt(total)}</b> điểm
                  {dirty && <span className="ml-2 text-secondary">• Chưa lưu</span>}
                </div>
                <div className="flex gap-space-sm">
                  <button type="button" className="btn-secondary" onClick={addQ}><Icon name="add" className="text-[18px]" /> Thêm câu</button>
                  <button type="button" className="btn-primary" disabled={busy || !dirty || form.questions.length === 0} onClick={save}>
                    {busy ? <Spinner className="text-[18px]" /> : <Icon name="save" className="text-[18px]" />} Lưu
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Submissions examId={examId} />
          )}
        </>
      )}
    </div>
  )
}

/** Danh sách lượt làm bài + mở từng bài để xem ảnh, chấm lại */
function Submissions({ examId }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  const load = useCallback(() => {
    examAdminApi.submissions(examId).then(setRows).catch((e) => setError(getErrorMessage(e)))
  }, [examId])
  useEffect(() => { load() }, [load])

  if (!rows && !error) return <Loading />
  return (
    <div className="flex flex-col gap-space-sm">
      <ErrorBox message={error} />
      {rows?.length === 0 && <EmptyState icon="assignment" title="Chưa có học sinh làm đề này" />}
      {rows?.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-body-md">
            <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
              <tr>
                <th className="px-space-md py-space-sm">Học sinh</th>
                <th className="px-space-md py-space-sm">Trạng thái</th>
                <th className="px-space-md py-space-sm">Đã nộp</th>
                <th className="px-space-md py-space-sm">Điểm</th>
                <th className="px-space-md py-space-sm">Thời gian</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.attemptId} className="border-t border-surface-container">
                  <td className="px-space-md py-space-sm font-bold text-on-surface">{r.studentName} <span className="font-normal text-outline">• Lớp {r.gradeLevel}</span></td>
                  <td className="px-space-md py-space-sm">
                    {r.status === 'SUBMITTED' ? <Badge tone="green">Đã nộp bài</Badge> : <Badge tone="gray">Đang làm</Badge>}
                    {r.needReviewCount > 0 && <span className="ml-1"><Badge tone="orange" icon="hourglass_top">{r.needReviewCount} câu cần chấm</Badge></span>}
                  </td>
                  <td className="px-space-md py-space-sm">{r.answeredCount}/{r.questionCount} câu</td>
                  <td className="px-space-md py-space-sm font-bold">{fmt(r.score)}/{fmt(r.maxScore)}</td>
                  <td className="px-space-md py-space-sm text-body-sm text-outline">{formatDateTime(r.submittedAt || r.startedAt)}</td>
                  <td className="px-space-md py-space-sm text-right">
                    <button type="button" className="btn-ghost" onClick={() => setOpenId(r.attemptId)}>
                      <Icon name="rate_review" className="text-[18px]" /> Xem / chấm
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {openId && <AttemptReview attemptId={openId} onClose={() => { setOpenId(null); load() }} />}
    </div>
  )
}

function AttemptReview({ attemptId, onClose }) {
  const [a, setA] = useState(null)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState({})
  const [saving, setSaving] = useState('')

  useEffect(() => {
    examAdminApi.attempt(attemptId).then(setA).catch((e) => setError(getErrorMessage(e)))
  }, [attemptId])

  const grade = async (q) => {
    const d = drafts[q.answer.id] || {}
    const score = d.score ?? q.answer.score
    if (score === '' || score == null) return setError('Nhập điểm trước khi lưu')
    setSaving(q.answer.id)
    setError('')
    try {
      setA(await examAdminApi.grade(q.answer.id, Number(score), d.comment ?? q.answer.lecturerComment ?? ''))
      setDrafts((x) => ({ ...x, [q.answer.id]: undefined }))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving('')
    }
  }

  return (
    <Modal open wide title={a ? `${a.studentName} • ${fmt(a.score)}/${fmt(a.maxScore)} điểm` : 'Bài làm'} onClose={onClose}>
      <ErrorBox message={error} />
      {!a ? <Loading /> : (
        <div className="flex flex-col gap-space-md">
          {a.questions.map((q) => {
            const ans = q.answer
            const d = (ans && drafts[ans.id]) || {}
            return (
              <div key={q.questionId} className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-md">
                <div className="flex items-center justify-between">
                  <b className="text-primary">Câu {q.orderIndex}</b>
                  <span className="text-label-md text-on-surface-variant">{fmt(q.points)} điểm</span>
                </div>
                <p className="whitespace-pre-line text-body-md text-on-surface">{q.content}</p>
                {!ans ? <p className="text-body-sm italic text-outline">Học sinh chưa nộp câu này</p> : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {ans.imageUrls.map((u, i) => (
                        <a key={u} href={fileUrl(u)} target="_blank" rel="noreferrer">
                          <img src={fileUrl(u)} alt={`Ảnh ${i + 1}`} className="h-28 w-28 rounded-xl bg-surface-container object-cover" />
                        </a>
                      ))}
                    </div>
                    <div className="rounded-xl bg-surface-container-lowest p-space-sm text-body-sm">
                      <div className="font-bold text-on-surface">
                        AI: {ans.aiScore != null ? `${fmt(ans.aiScore)}/${fmt(q.points)} điểm` : 'chưa chấm được'}
                      </div>
                      {ans.feedback && <p className="whitespace-pre-line text-on-surface-variant">{ans.feedback}</p>}
                      {ans.recognizedText && <p className="mt-1 whitespace-pre-line text-outline"><b>AI đọc được:</b> {ans.recognizedText}</p>}
                    </div>
                    <div className="flex flex-wrap items-end gap-space-sm">
                      <Field label={`Điểm giảng viên (tối đa ${fmt(q.points)})`}>
                        <input type="number" min={0} max={q.points} step={POINT_STEP} className={`${fieldCls} !w-32`}
                          value={d.score ?? ans.lecturerScore ?? ''} placeholder={ans.aiScore != null ? String(ans.aiScore) : ''}
                          onChange={(e) => setDrafts((x) => ({ ...x, [ans.id]: { ...d, score: e.target.value } }))} />
                      </Field>
                      <Field label="Nhận xét" className="min-w-[200px] flex-1">
                        <input className={fieldCls} value={d.comment ?? ans.lecturerComment ?? ''}
                          onChange={(e) => setDrafts((x) => ({ ...x, [ans.id]: { ...d, comment: e.target.value } }))} />
                      </Field>
                      <button type="button" className="btn-primary h-11" disabled={saving === ans.id} onClick={() => grade(q)}>
                        {saving === ans.id ? <Spinner className="text-[18px]" /> : <Icon name="check" className="text-[18px]" />} Lưu điểm
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
