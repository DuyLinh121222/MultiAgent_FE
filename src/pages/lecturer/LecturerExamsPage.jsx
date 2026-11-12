import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import { Badge, PageHeader, Segmented } from '../../components/staff/ui'
import { documentApi, examAdminApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDateTime } from '../../utils/format'

/** Trạng thái đề kiểm tra (khớp enum ExamStatus ở BE) */
export const EXAM_STATUS = {
  PROCESSING: { label: 'AI đang đọc đề', tone: 'primary', icon: 'progress_activity' },
  DRAFT: { label: 'Nháp - chờ kiểm tra', tone: 'orange', icon: 'edit_note' },
  PUBLISHED: { label: 'Học sinh đang làm', tone: 'green', icon: 'task_alt' },
  FAILED: { label: 'AI chưa đọc được', tone: 'red', icon: 'error' },
  ARCHIVED: { label: 'Đã lưu trữ', tone: 'dark', icon: 'inventory_2' },
}

const ACCEPT = '.pdf,.docx,image/jpeg,image/png,image/webp,application/pdf'
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })

/** Nhóm chương theo lớp cho ô chọn chương */
export function TopicSelect({ topics, value, onChange, className = 'input h-12' }) {
  const grades = [...new Set(topics.map((t) => t.gradeLevel))].sort((a, b) => a - b)
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)} required>
      <option value="" disabled>Chọn chương...</option>
      {grades.map((g) => (
        <optgroup key={g} label={`Lớp ${g}`}>
          {topics.filter((t) => t.gradeLevel === g).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </optgroup>
      ))}
    </select>
  )
}

/**
 * Đề kiểm tra tự luận: giảng viên import file đề (PDF / Word / ảnh), AI tách từng câu + đáp án,
 * giảng viên kiểm tra rồi xuất bản. Học sinh chọn chương để làm, chụp ảnh bài làm từng câu.
 */
export default function LecturerExamsPage() {
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [exams, setExams] = useState(null)
  const [form, setForm] = useState({ topicId: '', title: '' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const [t, e] = await Promise.all([documentApi.topics(), examAdminApi.list(filter === 'ARCHIVED')])
      setTopics(t)
      setExams(e)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [filter])
  useEffect(() => { load() }, [load])

  // Có đề AI đang đọc: hỏi lại mỗi 4 giây
  const processing = exams?.some((e) => e.status === 'PROCESSING')
  useEffect(() => {
    if (!processing) return undefined
    const t = setInterval(() => examAdminApi.list(filter === 'ARCHIVED').then(setExams).catch(() => {}), 4000)
    return () => clearInterval(t)
  }, [processing, filter])

  const pickFile = (f) => {
    setError('')
    if (!f) return
    if (!/\.(pdf|docx|jpe?g|png|webp)$/i.test(f.name)) return setError('Chỉ nhận file đề PDF, Word (.docx) hoặc ảnh chụp đề')
    setFile(f)
  }

  const importFile = async (e) => {
    e.preventDefault()
    if (!file) return setError('Chọn file đề trước nhé')
    if (!form.topicId) return setError('Chọn chương cho đề')
    setBusy(true)
    setError('')
    try {
      const exam = await examAdminApi.importFile(file, form)
      setFile(null)
      setForm((f) => ({ ...f, title: '' }))
      if (inputRef.current) inputRef.current.value = ''
      navigate(`/lecturer/exams/${exam.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const createBlank = async () => {
    if (!form.topicId) return setError('Chọn chương cho đề')
    const title = form.title.trim() || window.prompt('Tên đề kiểm tra?')
    if (!title) return
    setBusy(true)
    setError('')
    try {
      const exam = await examAdminApi.create({ topicId: form.topicId, title })
      navigate(`/lecturer/exams/${exam.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
      setBusy(false)
    }
  }

  if (!exams && !error) return <Loading />
  const shown = filter === 'ALL' ? (exams || []) : (exams || []).filter((e) => e.status === filter)

  return (
    <div className="page">
      <PageHeader icon="edit_note" title="Đề kiểm tra tự luận"
        subtitle="Import file đề, AI tách từng câu và đáp án. Thầy cô kiểm tra, xuất bản; học sinh chọn chương để làm và chụp ảnh bài làm từng câu, AI chấm ngay." />
      <ErrorBox message={error} />

      <form onSubmit={importFile} className="grid grid-cols-1 gap-space-md rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm lg:grid-cols-2">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0]) }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-space-sm rounded-[24px] border-[3px] border-dashed p-space-xl text-center transition-colors ${drag ? 'border-primary bg-primary-fixed/40' : 'border-outline-variant bg-surface-container-low hover:border-primary'}`}>
          <Icon name="upload_file" filled className="text-[56px] text-primary" />
          {file ? (
            <>
              <div className="text-headline-sm text-on-surface">{file.name}</div>
              <div className="text-body-sm text-on-surface-variant">{(file.size / 1024 / 1024).toFixed(2)} MB • bấm để đổi file</div>
            </>
          ) : (
            <>
              <div className="text-headline-sm text-on-surface">Kéo thả hoặc bấm để chọn file đề</div>
              <div className="text-body-sm text-on-surface-variant">PDF, Word (.docx) hoặc ảnh chụp đề. Có đáp án trong file thì AI lấy luôn.</div>
            </>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>

        <div className="flex flex-col gap-space-sm">
          <label className="flex flex-col gap-1">
            <span className="text-label-md text-on-surface-variant">Chương</span>
            <TopicSelect topics={topics} value={form.topicId} onChange={(v) => setForm({ ...form, topicId: v })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label-md text-on-surface-variant">Tên đề</span>
            <input className="input h-12" value={form.title} maxLength={250} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Để trống: AI tự đặt tên theo đề" />
          </label>
          <button type="submit" disabled={busy || !file} className="btn-primary mt-auto py-space-md text-label-lg">
            <Icon name="auto_awesome" className="text-[20px]" /> {busy ? 'Đang tải lên...' : 'Import & cho AI tách câu'}
          </button>
          <button type="button" disabled={busy} className="btn-ghost" onClick={createBlank}>
            <Icon name="add" className="text-[20px]" /> Hoặc tạo đề trống, tự gõ câu hỏi
          </button>
        </div>
      </form>

      <Segmented value={filter} onChange={setFilter} options={[
        { value: 'ALL', label: 'Tất cả' },
        { value: 'DRAFT', label: 'Nháp' },
        { value: 'PUBLISHED', label: 'Đang dùng' },
        { value: 'FAILED', label: 'Lỗi' },
        { value: 'ARCHIVED', label: 'Lưu trữ' },
      ]} />

      {shown.length === 0 ? (
        <EmptyState icon="edit_note" title="Chưa có đề kiểm tra nào" />
      ) : (
        <div className="flex flex-col gap-space-sm">
          {shown.map((e) => {
            const st = EXAM_STATUS[e.status] || { label: e.status, tone: 'gray' }
            return (
              <Link key={e.id} to={`/lecturer/exams/${e.id}`} className="card flex flex-col gap-space-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-space-sm">
                    <Badge tone={st.tone} icon={st.icon}>{st.label}</Badge>
                    <Badge tone="primary">Lớp {e.gradeLevel} • {e.topicName}</Badge>
                  </div>
                  <h3 className="mt-1 text-headline-sm text-on-surface">{e.title}</h3>
                  <div className="text-body-sm text-outline">
                    {e.sourceFileName ? `${e.sourceFileName} • ` : ''}{e.createdByName ? `${e.createdByName} • ` : ''}{formatDateTime(e.createdAt)}
                  </div>
                </div>
                <div className="flex gap-space-lg text-center">
                  <div><div className="text-headline-md font-black text-primary">{e.questionCount}</div><div className="text-label-sm text-on-surface-variant">câu</div></div>
                  <div><div className="text-headline-md font-black text-secondary">{fmt(e.totalPoints)}</div><div className="text-label-sm text-on-surface-variant">điểm</div></div>
                  <div><div className="text-headline-md font-black text-tertiary">{e.attemptCount}</div><div className="text-label-sm text-on-surface-variant">lượt làm</div></div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
