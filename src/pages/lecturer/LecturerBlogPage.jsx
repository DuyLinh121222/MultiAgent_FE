import { useCallback, useEffect, useState } from 'react'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import Pet from '../../components/game/Pet'
import { blogAdminApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDateTime } from '../../utils/format'
import { POST_THEMES } from '../LandingPage'

const EMPTY = { title: '', summary: '', content: '', coverUrl: '', theme: 'BLUE', tag: '', published: true, pinned: false }
const THEMES = ['BLUE', 'ORANGE', 'GREEN', 'PURPLE', 'PINK']

/** Giảng viên / admin đăng bài lên banner trang chủ */
export default function LecturerBlogPage() {
  const [posts, setPosts] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => blogAdminApi.list().then(setPosts).catch((e) => setError(getErrorMessage(e))), [])
  useEffect(() => { load() }, [load])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) await blogAdminApi.update(editing, form)
      else await blogAdminApi.create(form)
      setForm(EMPTY)
      setEditing(null)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const edit = (p) => {
    setEditing(p.id)
    setForm({ title: p.title, summary: p.summary || '', content: p.content, coverUrl: p.coverUrl || '', theme: p.theme, tag: p.tag || '', published: p.published, pinned: p.pinned })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = async (p) => {
    if (!window.confirm(`Xoá bài "${p.title}"?`)) return
    try {
      await blogAdminApi.remove(p.id)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (!posts && !error) return <Loading />
  const th = POST_THEMES[form.theme] || POST_THEMES.BLUE

  return (
    <div className="page">
      <div className="flex flex-col gap-space-xs">
        <h1 className="text-headline-lg text-on-surface">Bài viết trang chủ</h1>
        <p className="text-body-md text-on-surface-variant">Bài đã đăng hiện ở banner và mục Tin tức của trang chủ cho khách.</p>
      </div>
      <ErrorBox message={error} />

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <form onSubmit={submit} className="flex flex-col gap-space-sm rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm">
          <h2 className="text-headline-sm text-on-surface">{editing ? 'Sửa bài viết' : 'Bài viết mới'}</h2>
          <input className="input h-12" placeholder="Tiêu đề *" value={form.title} onChange={set('title')} required maxLength={200} />
          <input className="input h-12" placeholder="Tóm tắt 1-2 câu (hiện trên banner)" value={form.summary} onChange={set('summary')} maxLength={500} />
          <textarea className="input h-48 py-3" placeholder={'Nội dung *\nMỗi ý 1 dòng, bắt đầu bằng "• " để thành gạch đầu dòng'} value={form.content} onChange={set('content')} required />
          <div className="grid grid-cols-2 gap-space-sm">
            <input className="input h-12" placeholder="Nhãn (vd: Tính năng mới)" value={form.tag} onChange={set('tag')} maxLength={50} />
            <input className="input h-12" placeholder="Link ảnh bìa (https://...)" value={form.coverUrl} onChange={set('coverUrl')} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label-md text-on-surface-variant">Màu banner:</span>
            {THEMES.map((t) => (
              <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, theme: t }))} aria-label={t}
                className={`h-8 w-8 rounded-full bg-gradient-to-br ${POST_THEMES[t].bg} ${form.theme === t ? 'ring-4 ring-primary-fixed-dim' : ''}`} />
            ))}
          </div>
          <div className="flex gap-space-lg text-label-lg">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={set('published')} /> Hiện trên trang chủ</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.pinned} onChange={set('pinned')} /> Ghim lên đầu</label>
          </div>
          <div className="flex gap-space-sm">
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-space-md">{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Đăng bài'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm(EMPTY) }}>Huỷ</button>}
          </div>
        </form>

        {/* Xem trước banner */}
        <div className="flex flex-col gap-space-sm">
          <span className="text-label-md text-on-surface-variant">Xem trước banner</span>
          <div className={`relative min-h-[220px] overflow-hidden rounded-[28px] bg-gradient-to-br ${th.bg} p-space-lg text-white`}>
            {form.coverUrl && <img src={form.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
            <Pet code={th.pet} size={120} className="absolute -bottom-3 right-3" />
            <div className="relative max-w-[70%]">
              {form.tag && <span className={`chip ${th.chip}`}>{form.tag}</span>}
              <div className="mt-space-sm text-headline-md font-black">{form.title || 'Tiêu đề bài viết'}</div>
              <div className="mt-1 text-body-md text-white/90">{form.summary || 'Tóm tắt ngắn gọn hiện ở đây.'}</div>
            </div>
          </div>
        </div>
      </div>

      {posts?.length === 0 ? <EmptyState icon="campaign" title="Chưa có bài viết" /> : (
        <div className="flex flex-col gap-space-sm">
          {posts?.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center gap-space-md">
              <span className={`h-12 w-12 flex-shrink-0 rounded-2xl bg-gradient-to-br ${(POST_THEMES[p.theme] || POST_THEMES.BLUE).bg}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-label-lg text-on-surface">{p.title}</span>
                  {p.pinned && <span className="chip bg-secondary-fixed px-2 py-0 text-on-secondary-fixed">Ghim</span>}
                  {!p.published && <span className="chip bg-surface-container px-2 py-0 text-on-surface-variant">Đang ẩn</span>}
                </div>
                <div className="text-body-sm text-outline">{p.authorName} • {formatDateTime(p.createdAt)}</div>
              </div>
              <button type="button" className="btn-ghost" onClick={() => edit(p)}><Icon name="edit" className="text-[18px]" /> Sửa</button>
              <button type="button" className="btn-ghost text-error" onClick={() => remove(p)}><Icon name="delete" className="text-[18px]" /> Xoá</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
