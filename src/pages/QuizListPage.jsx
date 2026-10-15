import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import EmptyState from '../components/common/EmptyState'
import ProgressBar from '../components/common/ProgressBar'
import { quizApi } from '../api/services'
import { getErrorMessage } from '../api/client'

const TYPE_LABEL = {
  REINFORCEMENT: { text: 'Củng cố điểm yếu', cls: 'bg-secondary-fixed text-on-secondary-fixed' },
  PRACTICE: { text: 'Luyện tập', cls: 'bg-primary-fixed text-on-primary-fixed' },
  PLACEMENT: { text: 'Kiểm tra đầu vào', cls: 'bg-tertiary-fixed text-on-tertiary-fixed' },
}

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState(null)
  const [weaknesses, setWeaknesses] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([quizApi.list(), quizApi.weaknesses()])
      .then(([q, w]) => { setQuizzes(q); setWeaknesses(w) })
      .catch((e) => setError(getErrorMessage(e)))
  }, [])

  if (!quizzes && !error) return <Loading />

  return (
    <div className="page">
      <div className="flex flex-col gap-space-xs">
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Luyện tập & Củng cố</h1>
        <p className="text-body-md text-on-surface-variant">Làm quiz để Thầy AI đánh giá mức nắm vững từng chủ đề và gợi ý phần cần ôn.</p>
      </div>
      <ErrorBox message={error} />

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
        <section className="grid grid-cols-1 content-start gap-space-md sm:grid-cols-2 lg:col-span-8">
          {quizzes?.length === 0 && <EmptyState icon="quiz" title="Chưa có bài quiz" />}
          {quizzes?.map((q) => {
            const t = TYPE_LABEL[q.quizType] || TYPE_LABEL.PRACTICE
            return (
              <div key={q.id} className="card flex flex-col gap-space-sm">
                <span className={`chip w-fit ${t.cls}`}>{t.text}</span>
                <h3 className="text-headline-sm text-on-surface">{q.title}</h3>
                <div className="flex flex-wrap gap-space-md text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1"><Icon name="help" className="text-[16px]" /> {q.questionCount} câu</span>
                  {q.timeLimitMinutes && <span className="flex items-center gap-1"><Icon name="timer" className="text-[16px]" /> {q.timeLimitMinutes} phút</span>}
                  {q.bestScore != null && <span className="flex items-center gap-1 text-tertiary"><Icon name="emoji_events" className="text-[16px]" /> Tốt nhất: {Number(q.bestScore)}/{q.questionCount}</span>}
                </div>
                {q.weaknessTopicName && <span className="text-body-sm text-secondary">Dành cho chủ đề: {q.weaknessTopicName}</span>}
                <Link to={`/quizzes/${q.id}`} className="btn-primary mt-auto w-full">
                  <Icon name="play_arrow" className="text-[20px]" /> {q.bestScore != null ? 'Làm lại' : 'Bắt đầu'}
                </Link>
              </div>
            )
          })}
        </section>
        <aside className="flex flex-col gap-space-md lg:col-span-4">
          <div className="card flex flex-col gap-space-md">
            <h2 className="text-headline-sm text-on-surface">Mức nắm vững theo chủ đề</h2>
            {weaknesses.length === 0 && <p className="text-body-sm text-on-surface-variant">Chưa có dữ liệu. Làm quiz đầu tiên nhé!</p>}
            {weaknesses.map((w) => (
              <div key={w.id} className="flex flex-col gap-1">
                <div className="flex justify-between text-label-md">
                  <span className="text-on-surface">{w.topicName}</span>
                  <span className="text-on-surface-variant">{Math.round(w.masteryScore)}%</span>
                </div>
                <ProgressBar value={Number(w.masteryScore)} color={w.status === 'RESOLVED' ? 'bg-tertiary-container' : w.severity === 'HIGH' ? 'bg-error' : 'bg-secondary-container'} />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
