import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading, { Spinner } from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import CameraCapture, { canUseWebcam, isTouchDevice } from '../components/common/CameraCapture'
import { examApi } from '../api/services'
import { fileUrl, getErrorMessage } from '../api/client'
import { compressImage } from '../utils/image'

const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 }))
const MAX_IMAGE_MB = 15

/**
 * Làm bài kiểm tra tự luận: mỗi câu tự trình bày ra vở, chụp / tải ảnh bài làm câu đó lên -> AI chấm ngay.
 * Nộp lại câu nào thì AI chấm lại câu đó. Bấm "Nộp bài" để chốt điểm và xem đáp án.
 */
export default function ExamAttemptPage() {
  const { attemptId } = useParams()
  const [attempt, setAttempt] = useState(null)
  const [current, setCurrent] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    setError('')
    examApi.attempt(attemptId).then((a) => {
      setAttempt(a)
      // Mở câu đầu tiên chưa làm
      const firstOpen = a.questions.findIndex((q) => !q.answer)
      setCurrent(a.status === 'IN_PROGRESS' && firstOpen >= 0 ? firstOpen : 0)
    }).catch((e) => setError(getErrorMessage(e)))
  }, [attemptId])
  useEffect(() => { load() }, [load])

  const submitAll = async () => {
    const left = attempt.questions.filter((q) => !q.answer).length
    const msg = left > 0
      ? `Còn ${left} câu chưa nộp ảnh, các câu đó sẽ được 0 điểm. Em chắc chắn nộp bài?`
      : 'Nộp bài để chốt điểm và xem đáp án nhé?'
    if (!window.confirm(msg)) return
    setSubmitting(true)
    setError('')
    try {
      const a = await examApi.submit(attemptId)
      setAttempt(a)
      setCurrent(0)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (!attempt && !error) return <Loading text="Đang mở đề..." />
  if (!attempt) return <div className="page"><ErrorBox message={error} onRetry={load} /><Link to="/exams" className="btn-primary w-fit">Về danh sách đề</Link></div>

  const done = attempt.status === 'SUBMITTED'
  const q = attempt.questions[current]
  const total = attempt.questions.length

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-space-md px-margin-mobile py-space-lg md:px-margin">
      <Link to="/exams" className="flex w-fit items-center gap-1 text-label-lg text-on-surface-variant hover:text-primary">
        <Icon name="arrow_back" className="text-[20px]" /> Chọn đề khác
      </Link>

      {/* Đầu bài: tên đề, tiến độ, điểm */}
      <section className={`rounded-[28px] p-space-lg shadow-sm ${done ? 'bg-gradient-to-r from-tertiary-container to-[#1fae8c] text-white' : 'bg-surface-container-lowest'}`}>
        <div className="flex flex-col gap-space-md sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className={`text-label-sm uppercase tracking-wider ${done ? 'text-white/80' : 'text-on-surface-variant'}`}>{attempt.topicName}</div>
            <h1 className="text-headline-md font-extrabold">{attempt.examTitle}</h1>
            <div className={`text-body-sm ${done ? 'text-white/85' : 'text-on-surface-variant'}`}>
              Đã nộp {attempt.answeredCount}/{total} câu
              {attempt.needReviewCount > 0 && ` • ${attempt.needReviewCount} câu chờ thầy cô chấm`}
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <div className={`rounded-2xl px-space-md py-space-sm text-center ${done ? 'bg-white/20' : 'bg-secondary-fixed text-on-secondary-fixed'}`}>
              <div className="text-headline-md font-black">{fmt(attempt.score)}<span className="text-label-lg font-bold">/{fmt(attempt.maxScore)}</span></div>
              <div className="text-label-sm">{done ? 'Điểm bài làm' : 'Điểm tạm'}</div>
            </div>
            {!done && (
              <button type="button" className="btn-primary py-space-md" disabled={submitting || attempt.answeredCount === 0} onClick={submitAll}>
                {submitting ? <Spinner className="text-[20px]" /> : <Icon name="send" className="text-[20px]" filled />} Nộp bài
              </button>
            )}
          </div>
        </div>
        {/* Thanh tiến độ */}
        {!done && (
          <div className="mt-space-md h-3 overflow-hidden rounded-full bg-surface-container">
            <div className="h-full rounded-full bg-gradient-to-r from-[#7ee0c3] to-tertiary-container transition-all"
              style={{ width: `${(attempt.answeredCount * 100) / total}%` }} />
          </div>
        )}
      </section>

      <ErrorBox message={error} />

      {/* Chọn câu */}
      <div className="flex flex-wrap gap-2">
        {attempt.questions.map((x, i) => {
          const a = x.answer
          const tone = !a ? 'bg-surface-container-low text-on-surface-variant'
            : a.status === 'NEED_REVIEW' && a.lecturerScore == null ? 'bg-secondary-fixed text-on-secondary-fixed'
              : 'bg-tertiary-fixed text-on-tertiary-fixed'
          return (
            <button key={x.questionId} type="button" onClick={() => setCurrent(i)}
              className={`flex h-11 min-w-[2.75rem] items-center justify-center gap-1 rounded-2xl px-3 text-label-lg font-extrabold transition-all ${tone} ${i === current ? 'ring-[3px] ring-primary' : ''}`}>
              {a && <Icon name={a.status === 'NEED_REVIEW' && a.lecturerScore == null ? 'hourglass_top' : 'check'} className="text-[16px]" />}
              {x.orderIndex}
            </button>
          )
        })}
      </div>

      {q && (
        <QuestionCard key={q.questionId} attempt={attempt} question={q} done={done}
          onAnswered={(a) => setAttempt(a)}
          onNext={current < total - 1 ? () => { setCurrent(current + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) } : null}
          onPrev={current > 0 ? () => setCurrent(current - 1) : null} />
      )}
    </div>
  )
}

function QuestionCard({ attempt, question: q, done, onAnswered, onNext, onPrev }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [camOpen, setCamOpen] = useState(false)
  const [showRef, setShowRef] = useState(false)
  const pickInput = useRef(null)
  const camInput = useRef(null)
  const maxImages = attempt.maxImagesPerAnswer
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const addFiles = (list) => {
    setError('')
    const imgs = Array.from(list || []).filter((f) => f.type.startsWith('image/'))
    if (!imgs.length) return setError('Chọn file ảnh (JPG, PNG, WEBP) nhé')
    if (imgs.some((f) => f.size > MAX_IMAGE_MB * 1024 * 1024)) return setError(`Mỗi ảnh tối đa ${MAX_IMAGE_MB}MB`)
    setFiles((cur) => {
      const next = [...cur, ...imgs]
      if (next.length > maxImages) setError(`Mỗi câu nộp tối đa ${maxImages} ảnh`)
      return next.slice(0, maxImages)
    })
  }

  const openCamera = () => {
    if (isTouchDevice() || !canUseWebcam()) camInput.current?.click()
    else setCamOpen(true)
  }

  const upload = async () => {
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const small = await Promise.all(files.map((f) => compressImage(f)))
      const a = await examApi.answer(attempt.id, q.questionId, small)
      setFiles([])
      onAnswered(a)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setUploading(false)
    }
  }

  const ans = q.answer
  const waiting = ans && ans.status === 'NEED_REVIEW' && ans.lecturerScore == null

  return (
    <section className="flex flex-col gap-space-md rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <h2 className="text-headline-sm text-primary">Câu {q.orderIndex}</h2>
        <span className="chip bg-secondary-fixed text-on-secondary-fixed"><Icon name="grade" className="text-[16px]" /> {fmt(q.points)} điểm</span>
      </div>
      <div className="whitespace-pre-line rounded-2xl bg-surface-container-low p-space-md text-body-lg leading-relaxed text-on-surface">{q.content}</div>

      {/* Bài đã nộp + kết quả chấm */}
      {ans && (
        <div className={`flex flex-col gap-space-sm rounded-2xl p-space-md ${waiting ? 'bg-secondary-fixed/50' : 'bg-tertiary-fixed/40'}`}>
          <div className="flex flex-wrap items-center gap-space-sm">
            <Icon name={waiting ? 'hourglass_top' : 'task_alt'} filled className={`text-[26px] ${waiting ? 'text-secondary' : 'text-tertiary'}`} />
            <span className="text-headline-sm font-extrabold text-on-surface">
              {waiting ? 'Chờ thầy cô chấm' : `${fmt(ans.score)}/${fmt(q.points)} điểm`}
            </span>
            {ans.lecturerScore != null && <span className="chip bg-primary-fixed text-on-primary-fixed"><Icon name="school" className="text-[16px]" /> Thầy cô đã chấm</span>}
          </div>
          {ans.feedback && <p className="whitespace-pre-line text-body-md text-on-surface">{ans.feedback}</p>}
          {ans.lecturerComment && (
            <p className="whitespace-pre-line rounded-xl bg-surface-container-lowest p-space-sm text-body-md text-on-surface">
              <b>Thầy cô nhận xét:</b> {ans.lecturerComment}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {ans.imageUrls.map((u, i) => (
              <a key={u} href={fileUrl(u)} target="_blank" rel="noreferrer" title={`Ảnh ${i + 1}`}>
                <img src={fileUrl(u)} alt={`Bài làm câu ${q.orderIndex} - ảnh ${i + 1}`} className="h-20 w-20 rounded-xl bg-surface-container object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Đáp án: chỉ có sau khi nộp bài */}
      {done && q.referenceAnswer && (
        <div className="rounded-2xl border-2 border-dashed border-primary/40 p-space-md">
          <button type="button" className="flex w-full items-center justify-between text-label-lg font-bold text-primary" onClick={() => setShowRef(!showRef)}>
            <span className="flex items-center gap-2"><Icon name="lightbulb" filled className="text-[20px]" /> Đáp án / hướng dẫn chấm</span>
            <Icon name={showRef ? 'expand_less' : 'expand_more'} />
          </button>
          {showRef && <p className="mt-space-sm whitespace-pre-line text-body-md text-on-surface">{q.referenceAnswer}</p>}
        </div>
      )}

      {/* Nộp ảnh bài làm */}
      {!done && (
        <div className="flex flex-col gap-space-sm">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previews.map((u, i) => (
                <div key={u} className="relative">
                  <img src={u} alt={`Ảnh ${i + 1}`} className="h-24 w-24 rounded-xl object-cover" />
                  <button type="button" disabled={uploading} onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-error text-white shadow" aria-label="Bỏ ảnh">
                    <Icon name="close" className="text-[16px]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-space-sm">
            <button type="button" className="btn-secondary flex-1 py-space-md text-primary" disabled={uploading || files.length >= maxImages} onClick={openCamera}>
              <Icon name="photo_camera" className="text-[22px]" filled /> Chụp ảnh
            </button>
            <button type="button" className="btn-secondary flex-1 py-space-md" disabled={uploading || files.length >= maxImages} onClick={() => pickInput.current?.click()}>
              <Icon name="upload" className="text-[22px]" /> Chọn ảnh
            </button>
          </div>
          {files.length > 0 && (
            <button type="button" className="btn-primary py-space-md text-headline-sm" disabled={uploading} onClick={upload}>
              {uploading ? <><Spinner className="text-[22px]" /> AI đang chấm câu {q.orderIndex}...</>
                : <><Icon name="send" filled className="text-[22px]" /> {ans ? `Nộp lại câu ${q.orderIndex}` : `Nộp câu ${q.orderIndex}`} ({files.length} ảnh)</>}
            </button>
          )}
          {files.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">
              {ans ? 'Muốn sửa bài? Chụp lại rồi nộp lại, AI sẽ chấm lại câu này.' : `Làm ra vở rồi chụp bài làm câu ${q.orderIndex}. Bài dài chụp tối đa ${maxImages} ảnh.`}
            </p>
          )}
          <ErrorBox message={error} />

          <input ref={pickInput} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
          <input ref={camInput} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
          <CameraCapture open={camOpen} onClose={() => setCamOpen(false)}
            onCapture={(f) => {
              addFiles([f])
              if (files.length + 1 >= maxImages) setCamOpen(false)
            }} />
        </div>
      )}

      <div className="flex justify-between gap-space-sm border-t border-surface-container pt-space-md">
        <button type="button" className="btn-ghost" disabled={!onPrev} onClick={onPrev}>
          <Icon name="arrow_back" className="text-[20px]" /> Câu trước
        </button>
        <button type="button" className="btn-ghost" disabled={!onNext} onClick={onNext}>
          Câu sau <Icon name="arrow_forward" className="text-[20px]" />
        </button>
      </div>
    </section>
  )
}
