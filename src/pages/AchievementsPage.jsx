import { useEffect, useState } from 'react'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import { studentApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { formatDate } from '../utils/format'

const ICONS = { FIRST_LESSON: 'directions_walk', BUG_HUNTER: 'manage_search', QUIZ_MASTER: 'emoji_events', PHOTO_SOLVER: 'photo_camera', STREAK_7: 'local_fire_department' }

export default function AchievementsPage() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    studentApi.achievements().then(setItems).catch((e) => setError(getErrorMessage(e)))
  }, [])

  if (!items && !error) return <Loading />
  const earned = items?.filter((a) => a.earned) || []
  const points = earned.reduce((s, a) => s + a.points, 0)

  return (
    <div className="page">
      <div className="flex flex-col gap-space-xs">
        <h1 className="text-headline-lg text-on-surface">Thành tích của bạn</h1>
        <p className="text-body-md text-on-surface-variant">Đã đạt {earned.length}/{items?.length || 0} huy hiệu • {points} điểm</p>
      </div>
      <ErrorBox message={error} />
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((a) => (
          <div key={a.id} className={`card flex items-center gap-space-md ${a.earned ? '' : 'opacity-50 grayscale'}`}>
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${a.earned ? 'bg-secondary-fixed text-secondary' : 'bg-surface-container text-outline'}`}>
              <Icon name={ICONS[a.code] || 'military_tech'} className="text-[28px]" />
            </div>
            <div className="flex flex-col">
              <span className="text-label-lg text-on-surface">{a.name}</span>
              <span className="text-body-sm text-on-surface-variant">{a.description}</span>
              <span className="text-label-sm text-primary">
                +{a.points} điểm{a.earned ? ` • đạt ngày ${formatDate(a.earnedAt)}` : ` • ${a.criteria}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
