import { useEffect, useMemo, useState } from 'react'
import Icon from '../common/Icon'
import ErrorBox from '../common/ErrorBox'
import { areaCls, Field, fieldCls, Modal } from './ui'
import { contentApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const stripLetter = (o) => o.replace(/^[A-F]\.\s*/, '')

/**
 * Soạn / sửa câu hỏi trắc nghiệm.
 * question: câu đang sửa (null = tạo mới). defaults: { topicId, lessonId } khi tạo mới.
 * tree: cây nội dung (để chọn chương / bài). Gọi onSaved(câu đã lưu).
 */
export function QuestionEditor({ question, defaults, tree, onClose, onSaved, approveMode = false }) {
  const [f, setF] = useState(() => ({
    topicId: question?.topicId || defaults?.topicId || '',
    lessonId: question ? (question.lessonId || 'BOSS') : (defaults?.lessonId || 'BOSS'),
    content: question?.content || '',
    questionType: question?.questionType || 'SINGLE_CHOICE',
    options: question?.options?.length ? question.options.map(stripLetter) : ['', '', '', ''],
    correctAnswer: question?.correctAnswer || 'A',
    explanation: question?.explanation || '',
    difficulty: question?.difficulty || 'MEDIUM',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const topics = useMemo(() => (tree || []).flatMap((p) => p.topics.map((t) => ({ ...t, grade: p.gradeLevel }))), [tree])
  const lessons = topics.find((t) => t.id === f.topicId)?.lessons || []
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const isChoice = f.questionType !== 'SHORT_ANSWER'

  // Độ dài các đáp án nên gần bằng nhau để học sinh không đoán theo độ dài
  const lengths = f.options.filter((o) => o.trim()).map((o) => o.trim().length)
  const unevenOptions = isChoice && lengths.length >= 2 && Math.max(...lengths) > 2.2 * Math.min(...lengths) && Math.max(...lengths) > 12

  const save = async (publish) => {
    setSaving(true)
    setError('')
    const payload = {
      topicId: f.topicId,
      lessonId: f.lessonId === 'BOSS' ? null : f.lessonId,
      content: f.content,
      questionType: f.questionType,
      options: isChoice ? f.options.map((o, i) => (o.trim() ? `${LETTERS[i]}. ${o.trim()}` : '')).filter(Boolean) : [],
      correctAnswer: f.correctAnswer,
      explanation: f.explanation,
      difficulty: f.difficulty,
      publish,
    }
    try {
      const saved = question ? await contentApi.updateQuestion(question.id, payload) : await contentApi.createQuestion(payload)
      onSaved(saved, publish)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const published = question?.reviewStatus === 'PUBLISHED'
  return (
    <Modal open wide title={question ? (approveMode ? 'Sửa rồi duyệt câu hỏi' : 'Sửa câu hỏi') : 'Soạn câu hỏi mới'} onClose={onClose} footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
      {!published && (
        <button type="button" className="btn-secondary" disabled={saving} onClick={() => save(false)}>
          {approveMode ? 'Chỉ lưu sửa' : 'Lưu nháp'}
        </button>
      )}
      <button type="button" className="btn-primary" disabled={saving} onClick={() => save(true)}>
        <Icon name={published ? 'save' : 'publish'} className="text-[18px]" />
        {published ? 'Lưu thay đổi' : approveMode ? 'Lưu & duyệt' : 'Lưu & xuất bản'}
      </button>
    </>}>
      <div className="flex flex-col gap-space-md">
        <ErrorBox message={error} />
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field label="Chương">
            <select className={fieldCls} value={f.topicId} onChange={(e) => setF((x) => ({ ...x, topicId: e.target.value, lessonId: 'BOSS' }))}>
              <option value="" disabled>Chọn chương</option>
              {topics.map((t) => <option key={t.id} value={t.id}>Lớp {t.grade} • {t.name}</option>)}
            </select>
          </Field>
          <Field label="Dùng cho">
            <select className={fieldCls} value={f.lessonId} onChange={set('lessonId')}>
              <option value="BOSS">Ải trùm cuối chương (ngân hàng chung)</option>
              {lessons.map((l) => <option key={l.id} value={l.id}>Ải: {l.title}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Nội dung câu hỏi">
          <textarea className={areaCls} rows={3} value={f.content} onChange={set('content')} maxLength={2000} placeholder="Ví dụ: Nghiệm của hệ x + y = 3, x − y = 1 là" />
        </Field>
        <div className="grid grid-cols-2 gap-space-md">
          <Field label="Loại câu">
            <select className={fieldCls} value={f.questionType} onChange={set('questionType')}>
              <option value="SINGLE_CHOICE">Chọn 1 đáp án</option>
              <option value="MULTI_CHOICE">Chọn nhiều đáp án</option>
              <option value="SHORT_ANSWER">Điền đáp án ngắn</option>
            </select>
          </Field>
          <Field label="Độ khó">
            <select className={fieldCls} value={f.difficulty} onChange={set('difficulty')}>
              <option value="EASY">Dễ</option><option value="MEDIUM">Vừa</option><option value="HARD">Khó</option>
            </select>
          </Field>
        </div>

        {isChoice ? (
          <div className="flex flex-col gap-space-sm">
            <span className="text-label-md text-on-surface-variant">
              Các lựa chọn — bấm chữ cái để đánh dấu đáp án đúng{f.questionType === 'MULTI_CHOICE' ? ' (chọn được nhiều)' : ''}
            </span>
            {f.options.map((o, i) => {
              const letter = LETTERS[i]
              const correct = f.correctAnswer.split(/[^A-F]+/).includes(letter)
              const toggle = () => setF((x) => {
                if (x.questionType === 'SINGLE_CHOICE') return { ...x, correctAnswer: letter }
                const cur = new Set(x.correctAnswer.split(/[^A-F]+/).filter(Boolean))
                if (cur.has(letter)) cur.delete(letter); else cur.add(letter)
                return { ...x, correctAnswer: [...cur].sort().join(',') }
              })
              return (
                <div key={letter} className="flex items-center gap-space-sm">
                  <button type="button" onClick={toggle} title="Đánh dấu là đáp án đúng"
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-label-lg font-extrabold transition-colors ${correct ? 'bg-tertiary-container text-on-tertiary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                    {correct ? <Icon name="check" className="text-[20px]" /> : letter}
                  </button>
                  <input className={fieldCls} value={o} maxLength={480} placeholder={`Lựa chọn ${letter}`}
                    onChange={(e) => setF((x) => ({ ...x, options: x.options.map((v, j) => (j === i ? e.target.value : v)) }))} />
                  {f.options.length > 2 && (
                    <button type="button" className="btn-ghost px-2" aria-label="Xoá lựa chọn"
                      onClick={() => setF((x) => ({ ...x, options: x.options.filter((_, j) => j !== i), correctAnswer: 'A' }))}>
                      <Icon name="remove_circle" className="text-[20px]" />
                    </button>
                  )}
                </div>
              )
            })}
            {f.options.length < 6 && (
              <button type="button" className="btn-ghost self-start" onClick={() => setF((x) => ({ ...x, options: [...x.options, ''] }))}>
                <Icon name="add" className="text-[18px]" /> Thêm lựa chọn
              </button>
            )}
            {unevenOptions && (
              <p className="flex items-center gap-1 text-body-sm text-secondary">
                <Icon name="lightbulb" className="text-[16px]" /> Các lựa chọn dài ngắn chênh nhau nhiều, học sinh dễ đoán đáp án theo độ dài.
              </p>
            )}
          </div>
        ) : (
          <Field label="Đáp án đúng"><input className={fieldCls} value={f.correctAnswer} onChange={set('correctAnswer')} maxLength={255} /></Field>
        )}
        <Field label="Giải thích (học sinh thấy sau khi trả lời)">
          <textarea className={areaCls} rows={2} value={f.explanation} onChange={set('explanation')} maxLength={2000} />
        </Field>
      </div>
    </Modal>
  )
}

/** Soạn / sửa bài (ải): lý thuyết tóm tắt + lỗi sai hay gặp (AI phản biện chỉ được "nói sai" trong danh sách này) */
export function LessonEditor({ lesson, defaults, tree, onClose, onSaved, approveMode = false }) {
  const [f, setF] = useState(() => ({
    topicId: lesson?.topicId || defaults?.topicId || '',
    title: lesson?.title || '',
    content: lesson?.content || '',
    videoUrl: lesson?.videoUrl || '',
    durationMinutes: lesson?.durationMinutes || '',
    misconceptions: lesson?.misconceptions?.length ? lesson.misconceptions : [],
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const topics = useMemo(() => (tree || []).flatMap((p) => p.topics.map((t) => ({ ...t, grade: p.gradeLevel }))), [tree])
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const setMis = (i, k, v) => setF((x) => ({ ...x, misconceptions: x.misconceptions.map((m, j) => (j === i ? { ...m, [k]: v } : m)) }))

  const save = async (publish) => {
    setSaving(true)
    setError('')
    const payload = {
      topicId: f.topicId, title: f.title, content: f.content, videoUrl: f.videoUrl || null,
      durationMinutes: f.durationMinutes === '' ? null : Number(f.durationMinutes),
      misconceptions: f.misconceptions.filter((m) => m.wrong?.trim()),
      publish,
    }
    try {
      const saved = lesson ? await contentApi.updateLesson(lesson.id, payload) : await contentApi.createLesson(payload)
      onSaved(saved, publish)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const published = lesson?.reviewStatus === 'PUBLISHED'
  return (
    <Modal open wide title={lesson ? (approveMode ? 'Sửa rồi duyệt bài' : 'Sửa bài') : 'Soạn bài mới'} onClose={onClose} footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
      {!published && <button type="button" className="btn-secondary" disabled={saving} onClick={() => save(false)}>{approveMode ? 'Chỉ lưu sửa' : 'Lưu nháp'}</button>}
      <button type="button" className="btn-primary" disabled={saving} onClick={() => save(true)}>
        <Icon name={published ? 'save' : 'publish'} className="text-[18px]" />
        {published ? 'Lưu thay đổi' : approveMode ? 'Lưu & duyệt' : 'Lưu & xuất bản'}
      </button>
    </>}>
      <div className="flex flex-col gap-space-md">
        <ErrorBox message={error} />
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-3">
          <Field label="Chương" className="sm:col-span-2">
            <select className={fieldCls} value={f.topicId} onChange={set('topicId')}>
              <option value="" disabled>Chọn chương</option>
              {topics.map((t) => <option key={t.id} value={t.id}>Lớp {t.grade} • {t.name}</option>)}
            </select>
          </Field>
          <Field label="Thời lượng (phút)"><input type="number" min={1} className={fieldCls} value={f.durationMinutes} onChange={set('durationMinutes')} /></Field>
        </div>
        <Field label="Tên bài"><input className={fieldCls} value={f.title} onChange={set('title')} maxLength={255} /></Field>
        <Field label="Lý thuyết tóm tắt" hint="Ngắn gọn, mỗi ý 1 dòng: học sinh đọc trước khi vào thử thách, AI dùng làm ngữ cảnh.">
          <textarea className={areaCls} rows={7} value={f.content} onChange={set('content')} maxLength={20000} />
        </Field>
        <Field label="Video (tuỳ chọn)"><input className={fieldCls} value={f.videoUrl} onChange={set('videoUrl')} placeholder="https://youtube.com/..." /></Field>

        <div className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="text-label-lg">Lỗi sai hay gặp <span className="text-body-sm text-outline">(bạn AI phản biện chỉ cố tình nói sai trong các lỗi này)</span></span>
            <button type="button" className="btn-ghost" onClick={() => setF((x) => ({ ...x, misconceptions: [...x.misconceptions, { wrong: '', why: '', fix: '' }] }))}>
              <Icon name="add" className="text-[18px]" /> Thêm
            </button>
          </div>
          {f.misconceptions.length === 0 && <p className="rounded-xl bg-surface-container-low px-space-md py-space-sm text-body-sm text-outline">Chưa có lỗi sai nào.</p>}
          {f.misconceptions.map((m, i) => (
            <div key={i} className="grid grid-cols-1 gap-space-sm rounded-xl border border-surface-container p-space-sm sm:grid-cols-[1fr_1fr_1fr_auto]">
              <input className={fieldCls} value={m.wrong || ''} onChange={(e) => setMis(i, 'wrong', e.target.value)} placeholder="Học sinh hay nghĩ sai là..." />
              <input className={fieldCls} value={m.why || ''} onChange={(e) => setMis(i, 'why', e.target.value)} placeholder="Vì sao sai" />
              <input className={fieldCls} value={m.fix || ''} onChange={(e) => setMis(i, 'fix', e.target.value)} placeholder="Cách đúng" />
              <button type="button" className="btn-ghost px-2" aria-label="Xoá" onClick={() => setF((x) => ({ ...x, misconceptions: x.misconceptions.filter((_, j) => j !== i) }))}>
                <Icon name="delete" className="text-[20px]" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

/** Hộp thoại từ chối: bắt buộc ghi góp ý cho người soạn */
export function RejectModal({ title = 'Từ chối nội dung', count = 1, onClose, onConfirm }) {
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const quick = ['Đáp án sai', 'Giải thích chưa rõ', 'Vượt chương trình lớp', 'Lựa chọn dễ đoán theo độ dài', 'Trùng câu đã có']
  return (
    <Modal open title={title} onClose={onClose} footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
      <button type="button" className="btn-primary bg-error shadow-none hover:bg-error/90" disabled={busy || !comment.trim()}
        onClick={async () => { setBusy(true); await onConfirm(comment.trim()); setBusy(false) }}>
        Từ chối {count > 1 ? `${count} mục` : ''}
      </button>
    </>}>
      <div className="flex flex-col gap-space-sm">
        <span className="text-label-md text-on-surface-variant">Góp ý cho người soạn (bắt buộc)</span>
        <div className="flex flex-wrap gap-1">
          {quick.map((q) => (
            <button key={q} type="button" className="rounded-full bg-surface-container px-3 py-1 text-label-md hover:bg-surface-container-high"
              onClick={() => setComment((c) => (c ? `${c}; ${q}` : q))}>{q}</button>
          ))}
        </div>
        <textarea className={areaCls} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} autoFocus />
      </div>
    </Modal>
  )
}

/** Tải cây nội dung 1 lần cho các editor */
export function useContentTree() {
  const [tree, setTree] = useState(null)
  const reload = () => contentApi.tree().then(setTree).catch(() => setTree([]))
  useEffect(() => { reload() }, [])
  return [tree, reload]
}
