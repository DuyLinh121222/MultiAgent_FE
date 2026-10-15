import { useEffect, useState } from 'react'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import EmptyState from '../components/common/EmptyState'
import { studentApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { timeAgo } from '../utils/format'

const TYPE_ICON = {
  PAYMENT: { icon: 'payments', cls: 'bg-momo/10 text-momo' },
  ACHIEVEMENT: { icon: 'military_tech', cls: 'bg-secondary-fixed text-secondary' },
  QUIZ: { icon: 'quiz', cls: 'bg-primary-fixed text-primary' },
  SYSTEM: { icon: 'campaign', cls: 'bg-tertiary-fixed text-tertiary' },
}

export default function NotificationsPage() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    studentApi.notifications().then(setItems).catch((e) => setError(getErrorMessage(e)))
  }, [])

  const markAll = async () => {
    await studentApi.markAllRead()
    setItems((list) => list.map((n) => ({ ...n, read: true })))
  }
  const markOne = async (id) => {
    await studentApi.markRead(id)
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  if (!items && !error) return <Loading />

  return (
    <div className="page max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-lg text-on-surface">Thông báo</h1>
        {items?.some((n) => !n.read) && <button type="button" className="btn-ghost text-primary" onClick={markAll}>Đánh dấu đã đọc hết</button>}
      </div>
      <ErrorBox message={error} />
      {items?.length === 0 && <EmptyState icon="notifications" title="Chưa có thông báo" />}
      <div className="flex flex-col gap-space-sm">
        {items?.map((n) => {
          const t = TYPE_ICON[n.type] || TYPE_ICON.SYSTEM
          return (
            <button key={n.id} type="button" onClick={() => !n.read && markOne(n.id)}
              className={`card flex items-start gap-space-md p-space-md text-left ${n.read ? 'opacity-70' : ''}`}>
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${t.cls}`}>
                <Icon name={t.icon} className="text-[22px]" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-label-lg text-on-surface">{n.title}</span>
                {n.content && <span className="text-body-md text-on-surface-variant">{n.content}</span>}
                <span className="text-body-sm text-outline">{timeAgo(n.createdAt)}</span>
              </div>
              {!n.read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
