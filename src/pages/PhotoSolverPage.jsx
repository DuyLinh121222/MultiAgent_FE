import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/common/Icon'
import ErrorBox from '../components/common/ErrorBox'
import { Spinner } from '../components/common/Loading'
import ReportButton from '../components/common/ReportButton'
import { photoApi } from '../api/services'
import { fileUrl, getErrorMessage } from '../api/client'
import { formatDateTime } from '../utils/format'

const MAX_SIZE = 10 * 1024 * 1024

/** Giải toán bằng ảnh: tải / chụp ảnh đề bài, AI giải từng bước */
export default function PhotoSolverPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [note, setNote] = useState('')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const fileInput = useRef(null)
  const cameraInput = useRef(null)

  useEffect(() => {
    photoApi.list().then(setHistory).catch(() => {})
  }, [])

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const pick = (f) => {
    setError('')
    if (!f) return
    if (!f.type.startsWith('image/')) return setError('Vui lòng chọn file ảnh (JPG, PNG, WEBP)')
    if (f.size > MAX_SIZE) return setError('Ảnh quá lớn, tối đa 10MB')
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files?.[0])
  }

  const upload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const r = await photoApi.upload(file, note.trim())
      setResult(r)
      setHistory((h) => [r, ...h])
      setFile(null)
      setPreview('')
      setNote('')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page">
      <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-fixed/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-secondary-fixed/50 blur-2xl" />
        <div className="relative z-10 flex max-w-3xl flex-col gap-space-xs">
          <span className="chip w-fit bg-surface-container text-primary"><Icon name="auto_awesome" className="text-[16px]" /> Giải toán bằng ảnh • Phân tích đa AI</span>
          <h1 className="text-headline-lg-mobile tracking-tight text-on-surface md:text-display">Tải ảnh bài tập • 3 bạn AI cùng phân tích</h1>
          <p className="text-body-lg text-on-surface-variant">Chụp trang vở hoặc sách giáo khoa Toán 6-9. Thầy AI giải từng bước, bạn Soát Lỗi kiểm tra lại kết quả.</p>
        </div>
      </section>

      {/* Vùng tải ảnh */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex w-full flex-col items-center justify-center rounded-xl p-space-lg text-center shadow-md transition-all sm:p-space-xl ${
          dragging ? 'bg-primary-fixed/40 ring-2 ring-primary' : 'bg-surface-container-lowest'
        }`}
      >
        {preview ? (
          <div className="flex w-full max-w-xl flex-col items-center gap-space-md">
            <img src={preview} alt="Ảnh đề bài" className="max-h-80 rounded-xl object-contain shadow-sm" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="Gõ lại đề bài nếu ảnh mờ (không bắt buộc). Ví dụ: Tìm x biết |2x - 3| = 7"
              className="w-full rounded-xl bg-surface-container-low p-space-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary" />
            <div className="flex w-full flex-col gap-space-sm sm:flex-row">
              <button type="button" className="btn-primary flex-1 py-space-md" onClick={upload} disabled={uploading}>
                {uploading ? <Spinner className="text-[20px]" /> : <Icon name="auto_awesome" className="text-[20px]" />}
                {uploading ? 'Các bạn AI đang giải...' : 'Giải bài này'}
              </button>
              <button type="button" className="btn-secondary py-space-md" onClick={() => { setFile(null); setPreview('') }} disabled={uploading}>
                Chọn ảnh khác
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-space-md flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-high text-primary shadow-inner">
              <Icon name="document_scanner" className="text-[44px]" />
            </div>
            <h2 className="mb-space-xs text-headline-md text-on-surface md:text-headline-lg">Kéo thả ảnh bài tập vào đây hoặc chọn tải lên</h2>
            <p className="mb-space-lg max-w-xl text-body-md text-on-surface-variant">Hỗ trợ ảnh chụp vở bài tập, sách giáo khoa, chữ viết tay rõ nét (PNG, JPG, WEBP tối đa 10MB).</p>
            <div className="mb-space-md flex w-full max-w-md flex-wrap items-center justify-center gap-space-md">
              <button type="button" className="btn-primary min-w-[200px] flex-1 py-space-md" onClick={() => fileInput.current?.click()}>
                <Icon name="upload_file" className="text-[20px]" /> Chọn ảnh từ máy
              </button>
              <button type="button" className="btn-secondary min-w-[200px] flex-1 py-space-md text-primary" onClick={() => cameraInput.current?.click()}>
                <Icon name="photo_camera" className="text-[20px]" /> Chụp bằng Camera
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-space-lg text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-space-xs"><Icon name="verified" className="text-[18px] text-tertiary-container" /> Giải từng bước</span>
              <span className="flex items-center gap-space-xs"><Icon name="spellcheck" className="text-[18px] text-tertiary-container" /> Tự kiểm tra lại đáp án</span>
              <span className="flex items-center gap-space-xs"><Icon name="lock" className="text-[18px] text-tertiary-container" /> Bảo mật bài vở học sinh</span>
            </div>
          </>
        )}
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </div>

      <ErrorBox message={error} />

      {result && <SolutionView problem={result} />}

      {history.length > 0 && (
        <section className="flex flex-col gap-space-md">
          <h2 className="text-headline-sm text-on-surface">Bài đã giải gần đây</h2>
          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-3">
            {history.map((p) => (
              <button key={p.id} type="button" onClick={() => { setResult(p); window.scrollTo({ top: 400, behavior: 'smooth' }) }}
                className="card flex gap-space-md p-space-md text-left transition-colors hover:bg-surface-container-low">
                <img src={fileUrl(p.imageUrl)} alt="" className="h-16 w-16 flex-shrink-0 rounded-lg bg-surface-container object-cover" />
                <div className="flex min-w-0 flex-col">
                  <span className="line-clamp-2 text-label-lg text-on-surface">{p.extractedText || 'Bài toán từ ảnh'}</span>
                  <span className="text-body-sm text-on-surface-variant">{formatDateTime(p.uploadedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SolutionView({ problem }) {
  const s = problem.solution
  return (
    <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
      <div className="flex flex-col gap-space-md lg:col-span-5">
        <div className="card flex flex-col gap-space-md p-space-md">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-space-xs text-headline-sm text-on-surface">
              <Icon name="image" className="text-[20px] text-primary" /> Ảnh vừa tải lên
            </span>
            <span className={`chip ${problem.status === 'SOLVED' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-error-container text-on-error-container'}`}>
              <Icon name={problem.status === 'SOLVED' ? 'check_circle' : 'error'} className="text-[14px]" />
              {problem.status === 'SOLVED' ? 'Đã giải' : problem.status === 'FAILED' ? 'Chưa giải được' : 'Đang xử lý'}
            </span>
          </div>
          <img src={fileUrl(problem.imageUrl)} alt="Đề bài" className="aspect-[4/3] w-full rounded-lg bg-surface-container-high object-contain" />
          <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md">
            <span className="text-label-sm font-bold uppercase tracking-wider text-primary">Đề bài nhận diện</span>
            <p className="rounded-lg bg-surface-container-lowest p-space-md text-body-md text-on-surface shadow-inner">{problem.extractedText || '—'}</p>
          </div>
          {problem.topicName && <span className="chip w-fit bg-primary-fixed text-on-primary-fixed">{problem.topicName}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-space-md lg:col-span-7">
        <div className="card flex flex-col gap-space-md p-space-md">
          <div className="flex items-center gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="school" className="text-[20px]" />
            </div>
            <div className="flex flex-col">
              <span className="text-label-lg font-bold text-on-surface">Lời giải từng bước</span>
              <span className="text-body-sm text-on-surface-variant">Đối chiếu với bài làm trong vở của em nhé!</span>
            </div>
          </div>
          {!s ? (
            <p className="text-body-md text-on-surface-variant">Chưa có lời giải cho ảnh này. Thử chụp rõ hơn hoặc gõ lại đề bài.</p>
          ) : (
            <>
              <div className="flex flex-col gap-space-sm">
                {s.steps.map((step, i) => {
                  const m = step.match(/^(Bước \d+|Lưu ý)\s*:\s*(.*)$/)
                  const title = m ? m[1] : `Bước ${i + 1}`
                  const body = m ? m[2] : step
                  return (
                    <div key={i} className="flex gap-space-md rounded-xl bg-surface p-space-md shadow-sm">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                        {title.startsWith('Bước') ? title.replace('Bước ', '') : '!'}
                      </div>
                      <div className="flex flex-col gap-space-xs">
                        <span className="text-label-lg font-bold text-on-surface">{title}</span>
                        <p className="text-body-md text-on-surface-variant">{body}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between gap-space-sm rounded-xl bg-tertiary-fixed/40 p-space-md">
                <div className="flex items-center gap-space-sm">
                  <Icon name="task_alt" className="text-[24px] text-tertiary" />
                  <div className="flex flex-col">
                    <span className="text-label-sm uppercase text-on-tertiary-fixed">Đáp án</span>
                    <span className="text-headline-sm text-on-surface">{s.finalAnswer}</span>
                  </div>
                </div>
                <ReportButton targetType="SOLUTION" targetId={s.id} />
              </div>
              <span className="text-body-sm text-outline">Lời giải do AI tạo ({s.generatedBy}).</span>
            </>
          )}
        </div>

        <div className="card flex flex-col items-center justify-between gap-space-md md:flex-row">
          <div className="flex flex-col">
            <h3 className="text-headline-sm text-on-surface">Vẫn còn thắc mắc về bài này?</h3>
            <p className="text-body-md text-on-surface-variant">Vào Phòng học nhóm để hỏi trực tiếp Thầy AI hoặc nhờ 2 bạn giải thích thêm.</p>
          </div>
          <Link to="/study-room" className="btn-primary whitespace-nowrap py-space-md">
            <Icon name="groups" className="text-[20px]" /> Vào phòng học nhóm
          </Link>
        </div>
      </div>
    </div>
  )
}
