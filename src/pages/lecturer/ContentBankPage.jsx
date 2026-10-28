import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import {
  areaCls, Badge, DIFFICULTY, Field, fieldCls, Modal, PageHeader, RateBar, ReviewBadge, SearchBox, Segmented, useToast,
} from '../../components/staff/ui'
import { LessonEditor, QuestionEditor } from '../../components/staff/editors'
import { contentApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'

/**
 * Kho bài & câu hỏi: cây Lớp → Chương → Ải bên trái, câu hỏi của mục đang chọn bên phải.
 * Xem tỉ lệ học sinh trả lời sai từng câu để sửa câu gây hiểu nhầm.
 */
export default function ContentBankPage() {
  const [params, setParams] = useSearchParams()
  const [grade, setGrade] = useState(Number(params.get('grade')) || 9)
  const [tree, setTree] = useState(null)
  const [fullTree, setFullTree] = useState(null)
  const [error, setError] = useState('')
  const [openTopics, setOpenTopics] = useState(new Set())
  const [toast, showToast] = useToast()
  const lessonId = params.get('lesson')
  const topicId = params.get('topic')

  const loadTree = useCallback(() => {
    contentApi.tree(grade).then((t) => {
      setTree(t)
      // Mở sẵn chương đang chọn (hoặc chương đầu tiên)
      setOpenTopics((s) => {
        if (s.size) return s
        const topics = t[0]?.topics || []
        const cur = topics.find((x) => x.id === topicId || x.lessons.some((l) => l.id === lessonId))
        return new Set([cur?.id || topics[0]?.id].filter(Boolean))
      })
    }).catch((e) => setError(getErrorMessage(e)))
  }, [grade]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadTree() }, [loadTree])
  // Cây đủ 4 khối để editor chọn chương bất kỳ
  useEffect(() => { contentApi.tree().then(setFullTree).catch(() => {}) }, [])

  const path = tree?.[0]
  const selection = useMemo(() => {
    if (!path) return null
    for (const t of path.topics) {
      if (topicId === t.id) return { topic: t }
      const l = t.lessons.find((x) => x.id === lessonId)
      if (l) return { topic: t, lesson: l }
    }
    return null
  }, [path, lessonId, topicId])

  const select = (next) => setParams({ grade: String(grade), ...next }, { replace: true })
  const changeGrade = (g) => { setGrade(g); setOpenTopics(new Set()); setParams({ grade: String(g) }, { replace: true }) }

  const [topicForm, setTopicForm] = useState(null) // { id?, name, description, semester }
  const [lessonEdit, setLessonEdit] = useState(null) // { lesson?, defaults }

  const saveTopic = async (e) => {
    e.preventDefault()
    try {
      if (topicForm.id) await contentApi.updateTopic(topicForm.id, topicForm)
      else {
        const t = await contentApi.createTopic({ ...topicForm, pathId: path.pathId })
        setOpenTopics((s) => new Set([...s, t.id]))
      }
      showToast(topicForm.id ? 'Đã lưu chương' : 'Đã thêm chương')
      setTopicForm(null)
      loadTree()
    } catch (err) {
      showToast(getErrorMessage(err), 'red')
    }
  }

  const openLessonEditor = async (lessonNode, topic) => {
    try {
      const lesson = lessonNode ? await contentApi.lesson(lessonNode.id) : null
      setLessonEdit({ lesson, defaults: { topicId: topic.id } })
    } catch (e) {
      showToast(getErrorMessage(e), 'red')
    }
  }

  return (
    <div className="page">
      {toast}
      <PageHeader icon="library_books" title="Kho bài & câu hỏi"
        subtitle="Quản lý chương, ải và ngân hàng câu hỏi. Câu có tỉ lệ sai cao thường là câu khó hoặc đề gây hiểu nhầm."
        actions={<Segmented value={grade} onChange={changeGrade} options={[6, 7, 8, 9].map((g) => ({ value: g, label: `Lớp ${g}` }))} />} />
      <ErrorBox message={error} onRetry={loadTree} />
      {!tree ? <Loading /> : !path ? (
        <EmptyState icon="library_books" title={`Chưa có lộ trình Lớp ${grade}`} />
      ) : (
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-[340px_1fr]">
          {/* Cây nội dung */}
          <aside className="card flex flex-col gap-1 self-start p-space-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <div className="flex items-center justify-between px-space-sm py-1">
              <span className="text-label-lg">{path.name}</span>
              <button type="button" className="btn-ghost px-2 py-1 text-label-md" onClick={() => setTopicForm({ name: '', description: '', semester: 1 })}>
                <Icon name="add" className="text-[18px]" /> Chương
              </button>
            </div>
            {path.topics.map((t) => {
              const open = openTopics.has(t.id)
              return (
                <div key={t.id} className="flex flex-col">
                  <div className={`flex items-center gap-1 rounded-xl ${topicId === t.id ? 'bg-primary-fixed/60' : 'hover:bg-surface-container-low'}`}>
                    <button type="button" className="p-2 text-on-surface-variant" aria-label={open ? 'Thu gọn' : 'Mở rộng'}
                      onClick={() => setOpenTopics((s) => { const n = new Set(s); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n })}>
                      <Icon name={open ? 'expand_more' : 'chevron_right'} className="text-[20px]" />
                    </button>
                    <button type="button" className="flex min-w-0 flex-1 flex-col py-2 pr-2 text-left" onClick={() => { select({ topic: t.id }); setOpenTopics((s) => new Set([...s, t.id])) }}>
                      <span className="truncate text-label-lg">{t.name}</span>
                      <span className="text-label-sm text-outline">HK{t.semester} • {t.lessons.length} ải • {t.bossQuestions} câu ải trùm</span>
                    </button>
                  </div>
                  {open && (
                    <div className="ml-6 flex flex-col border-l border-surface-container pl-1">
                      {t.lessons.map((l) => (
                        <button key={l.id} type="button" onClick={() => select({ lesson: l.id })}
                          className={`flex items-center gap-space-xs rounded-lg px-space-sm py-1.5 text-left ${lessonId === l.id ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-low'}`}>
                          <span className={`min-w-0 flex-1 truncate text-body-md ${l.reviewStatus === 'ARCHIVED' ? 'line-through opacity-60' : ''}`}>{l.title}</span>
                          {l.questionsPending > 0 && <span className="rounded-full bg-secondary-container px-1.5 text-label-sm text-on-secondary-container" title="Câu chờ duyệt">{l.questionsPending}</span>}
                          <span className={`text-label-sm ${lessonId === l.id ? 'text-on-primary/80' : 'text-outline'}`}>{l.questionsPublished} câu</span>
                        </button>
                      ))}
                      <button type="button" className="flex items-center gap-1 rounded-lg px-space-sm py-1.5 text-label-md text-primary hover:bg-surface-container-low"
                        onClick={() => openLessonEditor(null, t)}>
                        <Icon name="add" className="text-[16px]" /> Thêm ải
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </aside>

          {/* Chi tiết */}
          <section className="flex min-w-0 flex-col gap-space-md">
            {!selection ? (
              <EmptyState icon="touch_app" title="Chọn một chương hoặc ải bên trái" description="Bạn sẽ thấy câu hỏi, tỉ lệ học sinh làm sai và có thể soạn thêm câu mới." />
            ) : selection.lesson ? (
              <>
                <div className="card flex flex-col gap-space-sm">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <Badge tone="primary">{selection.topic.name}</Badge>
                    <ReviewBadge status={selection.lesson.reviewStatus} />
                  </div>
                  <h2 className="text-headline-md">{selection.lesson.title}</h2>
                  <div className="flex flex-wrap items-center gap-space-lg text-body-sm text-on-surface-variant">
                    <span><b className="text-on-surface">{selection.lesson.players}</b> học sinh đã chơi</span>
                    <span className="flex items-center gap-1">Tỉ lệ đúng TB <RateBar value={selection.lesson.correctRate} /></span>
                  </div>
                  <div className="flex flex-wrap gap-space-sm">
                    <button type="button" className="btn-secondary" onClick={() => openLessonEditor(selection.lesson, selection.topic)}><Icon name="edit" className="text-[18px]" /> Sửa lý thuyết & lỗi sai</button>
                    {selection.lesson.reviewStatus === 'ARCHIVED' ? (
                      <button type="button" className="btn-ghost text-tertiary" onClick={async () => {
                        try { await contentApi.restoreLesson(selection.lesson.id); showToast('Đã khôi phục ải'); loadTree() } catch (e) { showToast(getErrorMessage(e), 'red') }
                      }}><Icon name="unarchive" className="text-[18px]" /> Khôi phục</button>
                    ) : (
                      <button type="button" className="btn-ghost text-error" onClick={async () => {
                        if (!window.confirm('Gỡ ải này khỏi bản đồ của học sinh? Có thể khôi phục lại sau.')) return
                        try { await contentApi.archiveLesson(selection.lesson.id); showToast('Đã gỡ ải'); loadTree() } catch (e) { showToast(getErrorMessage(e), 'red') }
                      }}><Icon name="archive" className="text-[18px]" /> Gỡ ải</button>
                    )}
                  </div>
                </div>
                <QuestionList key={selection.lesson.id} topicId={selection.topic.id} lessonId={selection.lesson.id}
                  tree={fullTree} onChanged={(msg, tone) => { showToast(msg, tone); loadTree() }} />
              </>
            ) : (
              <>
                <div className="card flex flex-col gap-space-sm">
                  <span className="text-label-md text-outline">Chương • Học kỳ {selection.topic.semester}</span>
                  <h2 className="text-headline-md">{selection.topic.name}</h2>
                  {selection.topic.description && <p className="text-body-md text-on-surface-variant">{selection.topic.description}</p>}
                  <div className="flex flex-wrap gap-space-sm">
                    <button type="button" className="btn-secondary" onClick={() => setTopicForm({ id: selection.topic.id, name: selection.topic.name, description: selection.topic.description || '', semester: selection.topic.semester })}>
                      <Icon name="edit" className="text-[18px]" /> Sửa chương
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => openLessonEditor(null, selection.topic)}><Icon name="add" className="text-[18px]" /> Thêm ải</button>
                  </div>
                  <div className="grid grid-cols-1 gap-1 pt-space-xs sm:grid-cols-2">
                    {selection.topic.lessons.map((l) => (
                      <button key={l.id} type="button" onClick={() => select({ lesson: l.id })}
                        className="flex items-center gap-space-sm rounded-xl border border-surface-container px-space-md py-space-sm text-left hover:bg-surface-container-low">
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-label-lg">{l.title}</span>
                          <span className="text-body-sm text-outline">{l.questionsPublished} câu • {l.players} học sinh</span>
                        </span>
                        <ReviewBadge status={l.reviewStatus} />
                      </button>
                    ))}
                  </div>
                </div>
                <h3 className="text-headline-sm">Câu hỏi ải trùm (ngân hàng chung của chương)</h3>
                <QuestionList key={`boss-${selection.topic.id}`} topicId={selection.topic.id} lessonId="BOSS"
                  tree={fullTree} onChanged={(msg, tone) => { showToast(msg, tone); loadTree() }} />
              </>
            )}
          </section>
        </div>
      )}

      {topicForm && (
        <Modal open title={topicForm.id ? 'Sửa chương' : `Thêm chương cho Lớp ${grade}`} onClose={() => setTopicForm(null)} footer={<>
          <button type="button" className="btn-secondary" onClick={() => setTopicForm(null)}>Huỷ</button>
          <button type="submit" form="topic-form" className="btn-primary">Lưu</button>
        </>}>
          <form id="topic-form" onSubmit={saveTopic} className="flex flex-col gap-space-md">
            <Field label="Tên chương"><input className={fieldCls} value={topicForm.name} required maxLength={150} placeholder="Chương V. Đường tròn"
              onChange={(e) => setTopicForm((f) => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Học kỳ">
              <select className={fieldCls} value={topicForm.semester} onChange={(e) => setTopicForm((f) => ({ ...f, semester: Number(e.target.value) }))}>
                <option value={1}>Học kỳ 1</option><option value={2}>Học kỳ 2</option>
              </select>
            </Field>
            <Field label="Mô tả"><textarea className={areaCls} rows={3} value={topicForm.description} maxLength={2000}
              onChange={(e) => setTopicForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          </form>
        </Modal>
      )}
      {lessonEdit && (
        <LessonEditor lesson={lessonEdit.lesson} defaults={lessonEdit.defaults} tree={fullTree} onClose={() => setLessonEdit(null)}
          onSaved={(saved) => { setLessonEdit(null); showToast('Đã lưu ải'); loadTree(); select({ lesson: saved.id }) }} />
      )}
    </div>
  )
}

/** Danh sách câu hỏi của 1 ải (hoặc ải trùm), có thống kê sai và thao tác sửa / gỡ */
function QuestionList({ topicId, lessonId, tree, onChanged }) {
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('new')
  const [q, setQ] = useState('')
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // question | 'new'

  const load = useCallback(() => {
    contentApi.questions({ topicId, lessonId, status: status || undefined, q: q || undefined, sort: sort === 'wrong' ? 'wrong' : undefined })
      .then(setItems).catch((e) => setError(getErrorMessage(e)))
  }, [topicId, lessonId, status, q, sort])
  useEffect(() => { load() }, [load])

  const act = async (fn, msg) => {
    try { await fn(); onChanged(msg); load() } catch (e) { onChanged(getErrorMessage(e), 'red') }
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center gap-space-sm">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm trong nội dung câu hỏi..." />
        <select className={`${fieldCls} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Đang dùng + chờ duyệt + nháp</option>
          <option value="PUBLISHED">Đang dùng</option>
          <option value="PENDING_REVIEW">Chờ duyệt</option>
          <option value="REJECTED">Bị từ chối</option>
          <option value="DRAFT">Nháp</option>
          <option value="ARCHIVED">Đã gỡ</option>
        </select>
        <Segmented value={sort} onChange={setSort} options={[{ value: 'new', label: 'Mới nhất' }, { value: 'wrong', label: 'Sai nhiều nhất' }]} />
        <button type="button" className="btn-primary" onClick={() => setEditing('new')}><Icon name="add" className="text-[18px]" /> Soạn câu hỏi</button>
      </div>
      <ErrorBox message={error} onRetry={load} />
      {!items ? <Loading /> : items.length === 0 ? (
        <EmptyState icon="quiz" title="Chưa có câu hỏi" description="Soạn câu mới hoặc tải tài liệu PDF để AI soạn giúp." />
      ) : items.map((x) => (
        <div key={x.id} className="card flex flex-col gap-space-sm">
          <div className="flex flex-wrap items-center gap-space-xs">
            <ReviewBadge status={x.reviewStatus} />
            <Badge tone="gray">{DIFFICULTY[x.difficulty]}</Badge>
            {x.source === 'AI' && <Badge tone="orange" icon="auto_awesome">AI soạn</Badge>}
            <span className="ml-auto flex items-center gap-space-sm text-body-sm text-on-surface-variant">
              {x.answeredCount > 0 ? <>Sai {x.wrongCount}/{x.answeredCount} lượt <RateBar value={x.wrongRate} invert goodAt={0.65} badAt={0.4} /></> : 'Chưa có lượt trả lời'}
            </span>
          </div>
          <p className="text-label-lg text-on-surface">{x.content}</p>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {(x.options || []).map((o) => {
              const ok = x.correctAnswer.split(/[^A-F]+/).includes(o[0])
              return <li key={o} className={`rounded-lg px-space-sm py-1 text-body-sm ${ok ? 'bg-tertiary-fixed/50 font-bold' : 'bg-surface-container-low'}`}>{o}</li>
            })}
          </ul>
          {x.explanation && <p className="text-body-sm text-on-surface-variant"><b>Giải thích:</b> {x.explanation}</p>}
          <div className="flex flex-wrap gap-space-xs">
            <button type="button" className="btn-ghost" onClick={() => setEditing(x)}><Icon name="edit" className="text-[18px]" /> Sửa</button>
            {x.reviewStatus === 'ARCHIVED' ? (
              <button type="button" className="btn-ghost text-tertiary" onClick={() => act(() => contentApi.restoreQuestion(x.id), 'Đã dùng lại câu hỏi')}><Icon name="unarchive" className="text-[18px]" /> Dùng lại</button>
            ) : (
              <button type="button" className="btn-ghost text-error" onClick={() => act(() => contentApi.archiveQuestion(x.id), 'Đã gỡ câu hỏi')}><Icon name="archive" className="text-[18px]" /> Gỡ</button>
            )}
            {x.answeredCount > 0 && (
              <button type="button" className="btn-ghost" title="Sau khi sửa đề, xoá thống kê cũ để đo lại"
                onClick={() => window.confirm('Xoá thống kê đúng/sai của câu này?') && act(() => contentApi.resetStats(x.id), 'Đã xoá thống kê')}>
                <Icon name="restart_alt" className="text-[18px]" /> Đo lại
              </button>
            )}
          </div>
        </div>
      ))}
      {editing && (
        <QuestionEditor question={editing === 'new' ? null : editing} defaults={{ topicId, lessonId }} tree={tree}
          onClose={() => setEditing(null)}
          onSaved={(_, published) => { setEditing(null); onChanged(published ? 'Đã lưu và xuất bản câu hỏi' : 'Đã lưu nháp'); load() }} />
      )}
    </div>
  )
}
