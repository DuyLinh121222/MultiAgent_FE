import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import { documentApi } from '../../api/services'
import { fileUrl, getErrorMessage } from '../../api/client'
import { formatDateTime } from '../../utils/format'

const STATUS = {
  PROCESSING: { label: 'AI đang đọc...', cls: 'bg-primary-fixed text-on-primary-fixed', icon: 'progress_activity' },
  DONE: { label: 'AI đã soạn xong', cls: 'bg-tertiary-fixed text-on-tertiary-fixed', icon: 'task_alt' },
  FAILED: { label: 'Chưa đọc được', cls: 'bg-error-container text-on-error-container', icon: 'error' },
  NONE: { label: 'Chưa xử lý', cls: 'bg-surface-container text-on-surface-variant', icon: 'schedule' },
}
const LESSON_STATUS = { DRAFT: 'Nháp', PENDING_REVIEW: 'Chờ duyệt', PUBLISHED: 'Đã xuất bản', REJECTED: 'Bị từ chối', APPROVED: 'Đã duyệt', ARCHIVED: 'Lưu trữ' }

/**
 * Giảng viên tải tài liệu PDF: AI đọc và soạn lý thuyết tóm tắt, lỗi sai hay gặp, câu hỏi ngắn cho ải + Đấu trường.
 * Mọi thứ AI soạn đều chờ giảng viên duyệt rồi mới tới học sinh.
 */
export default function LecturerDocumentsPage() {
  const [topics, setTopics] = useState([])
  const [docs, setDocs] = useState(null)
  const [form, setForm] = useState({ topicId: '', lessonId: '', title: '' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([documentApi.topics(), documentApi.list()])
      setTopics(t)
      setDocs(d)
      setForm((f) => (f.topicId ? f : { ...f, topicId: t[0]?.id || '' }))
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Có tài liệu AI đang đọc: hỏi lại mỗi 4 giây
  const processing = docs?.some((d) => d.aiStatus === 'PROCESSING')
  useEffect(() => {
    if (!processing) return undefined
    const t = setInterval(() => documentApi.list().then(setDocs).catch(() => {}), 4000)
    return () => clearInterval(t)
  }, [processing])

  const topic = useMemo(() => topics.find((t) => t.id === form.topicId), [topics, form.topicId])

  const pickFile = (f) => {
    setError('')
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) return setError('Chỉ nhận file PDF')
    if (f.size > 12 * 1024 * 1024) return setError('File PDF tối đa 12MB')
    setFile(f)
    if (!form.title && !form.lessonId) setForm((x) => ({ ...x, title: f.name.replace(/\.pdf$/i, '') }))
  }

  const upload = async (e) => {
    e.preventDefault()
    if (!file) return setError('Chọn file PDF trước nhé')
    setUploading(true)
    setError('')
    try {
      await documentApi.upload(file, form)
      setFile(null)
      setForm((f) => ({ ...f, lessonId: '', title: '' }))
      if (inputRef.current) inputRef.current.value = ''
      setNotice('Đã tải lên. AI đang đọc tài liệu, khoảng 20-60 giây.')
      setTimeout(() => setNotice(''), 5000)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const act = async (fn, msg) => {
    setError('')
    try {
      await fn()
      setNotice(msg)
      setTimeout(() => setNotice(''), 3000)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (!docs && !error) return <Loading />

  return (
    <div className="page">
      <div className="flex flex-col gap-space-xs">
        <h1 className="text-headline-lg text-on-surface">Tài liệu PDF</h1>
        <p className="text-body-md text-on-surface-variant">
          Tải PDF bài giảng lên, AI soạn lý thuyết tóm tắt, lỗi sai hay gặp và câu hỏi ngắn cho ải + mini game Đấu trường. Thầy cô duyệt xong học sinh mới thấy.
        </p>
      </div>
      <ErrorBox message={error} />
      {notice && <div className="rounded-xl bg-tertiary-fixed px-space-md py-space-sm text-label-lg text-on-tertiary-fixed">{notice}</div>}

      <form onSubmit={upload} className="grid grid-cols-1 gap-space-md rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm lg:grid-cols-2">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0]) }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-space-sm rounded-[24px] border-[3px] border-dashed p-space-xl text-center transition-colors ${drag ? 'border-primary bg-primary-fixed/40' : 'border-outline-variant bg-surface-container-low hover:border-primary'}`}>
          <Icon name="picture_as_pdf" filled className="text-[56px] text-error" />
          {file ? (
            <>
              <div className="text-headline-sm text-on-surface">{file.name}</div>
              <div className="text-body-sm text-on-surface-variant">{(file.size / 1024 / 1024).toFixed(2)} MB • bấm để đổi file</div>
            </>
          ) : (
            <>
              <div className="text-headline-sm text-on-surface">Kéo thả hoặc bấm để chọn PDF</div>
              <div className="text-body-sm text-on-surface-variant">Tối đa 12MB</div>
            </>
          )}
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>

        <div className="flex flex-col gap-space-sm">
          <label className="flex flex-col gap-1">
            <span className="text-label-md text-on-surface-variant">Chương</span>
            <select className="input h-12" value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value, lessonId: '' })}>
              {topics.map((t) => <option key={t.id} value={t.id}>Lớp {t.gradeLevel} • {t.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label-md text-on-surface-variant">Gắn vào bài</span>
            <select className="input h-12" value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: e.target.value })}>
              <option value="">+ Tạo bài (ải) mới từ tài liệu này</option>
              {topic?.lessons.map((l) => <option key={l.id} value={l.id}>{l.title} ({LESSON_STATUS[l.reviewStatus] || l.reviewStatus})</option>)}
            </select>
          </label>
          {!form.lessonId && (
            <label className="flex flex-col gap-1">
              <span className="text-label-md text-on-surface-variant">Tên bài mới</span>
              <input className="input h-12" value={form.title} maxLength={250} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Để trống: AI tự đặt tên theo tài liệu" />
            </label>
          )}
          <button type="submit" disabled={uploading || !file} className="btn-primary mt-auto py-space-md text-label-lg">
            <Icon name="auto_awesome" className="text-[20px]" /> {uploading ? 'Đang tải lên...' : 'Tải lên & cho AI soạn câu hỏi'}
          </button>
        </div>
      </form>

      {docs?.length === 0 ? (
        <EmptyState icon="picture_as_pdf" title="Chưa có tài liệu nào" />
      ) : (
        <div className="flex flex-col gap-space-md">
          {docs?.map((d) => {
            const st = STATUS[d.aiStatus] || STATUS.NONE
            return (
              <div key={d.id} className="card flex flex-col gap-space-sm">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <span className={`chip ${st.cls}`}>
                    <Icon name={st.icon} className={`text-[16px] ${d.aiStatus === 'PROCESSING' ? 'animate-spin' : ''}`} /> {st.label}
                  </span>
                  <span className="chip bg-primary-fixed text-on-primary-fixed">{d.topicName}</span>
                  <span className="chip bg-surface-container text-on-surface-variant">Bài: {LESSON_STATUS[d.lessonStatus] || d.lessonStatus}</span>
                  <span className="text-body-sm text-outline">{formatDateTime(d.uploadedAt)}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm">
                  <div>
                    <h3 className="text-headline-sm text-on-surface">{d.lessonTitle}</h3>
                    <a href={fileUrl(d.fileUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-body-sm text-primary hover:underline">
                      <Icon name="attach_file" className="text-[16px]" /> {d.fileName}
                    </a>
                  </div>
                  <div className="flex gap-space-md text-center">
                    <div><div className="text-headline-md font-black text-secondary">{d.pendingQuestions}</div><div className="text-label-sm text-on-surface-variant">chờ duyệt</div></div>
                    <div><div className="text-headline-md font-black text-tertiary">{d.publishedQuestions}</div><div className="text-label-sm text-on-surface-variant">đã xuất bản</div></div>
                  </div>
                </div>
                {d.aiNote && <p className="rounded-lg bg-surface-container-low p-space-sm text-body-sm text-on-surface-variant">{d.aiNote}</p>}
                <div className="flex flex-wrap gap-space-sm">
                  {(d.pendingQuestions > 0 || d.lessonStatus === 'PENDING_REVIEW') && (
                    <button type="button" className="btn-primary" onClick={() => act(() => documentApi.approveAll(d.id), 'Đã duyệt và xuất bản bài + câu hỏi')}>
                      <Icon name="done_all" className="text-[18px]" /> Duyệt tất cả
                    </button>
                  )}
                  <Link to="/lecturer" className="btn-secondary"><Icon name="fact_check" className="text-[18px]" /> Duyệt từng câu</Link>
                  {d.aiStatus !== 'PROCESSING' && (
                    <button type="button" className="btn-ghost" onClick={() => act(() => documentApi.reprocess(d.id), 'AI đang đọc lại tài liệu')}>
                      <Icon name="refresh" className="text-[18px]" /> AI đọc lại
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
