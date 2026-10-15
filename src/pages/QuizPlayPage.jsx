import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import ReportButton from '../components/common/ReportButton'
import { quizApi } from '../api/services'
import { getErrorMessage } from '../api/client'

/** Làm quiz: từng câu một, nút đáp án to rõ, nộp bài xem kết quả + giải thích */
export default function QuizPlayPage() {
  const { quizId } = useParams()
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return // tránh StrictMode tạo 2 lượt làm bài
    started.current = true
    quizApi.start(quizId).then(setAttempt).catch((e) => setError(getErrorMessage(e)))
  }, [quizId])

  const submit = async () => {
    setSubmitting(true)
    try {
      const payload = attempt.quiz.questions.map((q) => ({ quizQuestionId: q.quizQuestionId, selectedAnswer: answers[q.quizQuestionId] || null }))
      setResult(await quizApi.submit(attempt.attemptId, payload))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (!attempt && !error) return <Loading text="Đang chuẩn bị đề..." />
  if (!attempt) return <div className="page"><ErrorBox message={error} /></div>

  if (result) {
    const pct = Number(result.maxScore) ? Math.round((Number(result.score) * 100) / Number(result.maxScore)) : 0
    return (
      <div className="page max-w-3xl">
        <div className="card flex flex-col items-center gap-space-sm text-center">
          <span className="text-5xl">{pct === 100 ? '🏆' : pct >= 50 ? '👏' : '💪'}</span>
          <h1 className="text-headline-lg text-on-surface">{result.quizTitle}</h1>
          <p className="text-display font-black text-primary">{result.correctCount}/{result.totalQuestions}</p>
          <p className="text-body-md text-on-surface-variant">Bạn trả lời đúng {pct}% số câu.</p>
          {result.weakness && (
            <span className="chip bg-secondary-fixed text-on-secondary-fixed">
              Mức nắm vững "{result.weakness.topicName}": {Math.round(result.weakness.masteryScore)}%
            </span>
          )}
          {result.achievementUnlocked && <span className="chip bg-tertiary-fixed text-on-tertiary-fixed">🏅 Bạn vừa đạt huy hiệu Cao thủ quiz!</span>}
        </div>
        <div className="flex flex-col gap-space-md">
          {result.results.map((r, i) => (
            <div key={r.quizQuestionId} className={`card flex flex-col gap-space-xs border-l-4 ${r.correct ? 'border-tertiary-container' : 'border-error'}`}>
              <div className="flex items-start justify-between gap-space-sm">
                <span className="text-label-lg text-on-surface">Câu {i + 1}: {r.content}</span>
                <Icon name={r.correct ? 'check_circle' : 'cancel'} className={r.correct ? 'text-tertiary' : 'text-error'} />
              </div>
              <span className="text-body-sm text-on-surface-variant">Bạn chọn: <b>{r.selectedAnswer || '(bỏ trống)'}</b> • Đáp án đúng: <b className="text-tertiary">{r.correctAnswer}</b></span>
              {r.explanation && <p className="rounded-lg bg-surface-container-low p-space-sm text-body-md">{r.explanation}</p>}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-space-sm">
          <Link to="/quizzes" className="btn-secondary">Danh sách quiz</Link>
          <Link to="/study-room" className="btn-primary"><Icon name="forum" className="text-[18px]" /> Hỏi Thầy AI phần chưa hiểu</Link>
        </div>
      </div>
    )
  }

  const questions = attempt.quiz.questions
  const q = questions[index]
  const answered = Object.keys(answers).length

  return (
    <div className="page max-w-3xl">
      <div className="flex items-center justify-between">
        <Link to="/quizzes" className="flex items-center gap-1 text-label-md text-on-surface-variant hover:text-primary">
          <Icon name="arrow_back" className="text-[18px]" /> Thoát
        </Link>
        <span className="chip bg-surface-container text-on-surface">Đã làm {answered}/{questions.length}</span>
      </div>
      <h1 className="text-headline-md text-on-surface">{attempt.quiz.title}</h1>
      <ErrorBox message={error} />

      <div className="flex gap-1">
        {questions.map((x, i) => (
          <button key={x.quizQuestionId} type="button" onClick={() => setIndex(i)}
            className={`h-2 flex-1 rounded-full ${i === index ? 'bg-primary' : answers[x.quizQuestionId] ? 'bg-primary-fixed-dim' : 'bg-surface-container-high'}`}
            aria-label={`Câu ${i + 1}`} />
        ))}
      </div>

      <div className="card flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <span className="text-label-md text-primary">Câu {index + 1} / {questions.length}</span>
          <ReportButton targetType="QUESTION" targetId={q.quizQuestionId} compact />
        </div>
        <h2 className="text-headline-sm text-on-surface">{q.content}</h2>
        {q.questionType === 'SHORT_ANSWER' ? (
          <input className="input" placeholder="Nhập đáp án" value={answers[q.quizQuestionId] || ''}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.quizQuestionId]: e.target.value }))} />
        ) : (
          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
            {(q.options || []).map((opt) => {
              const letter = opt.trim().charAt(0)
              const selected = answers[q.quizQuestionId] === letter
              return (
                <button key={opt} type="button" onClick={() => setAnswers((a) => ({ ...a, [q.quizQuestionId]: letter }))}
                  className={`min-h-[56px] rounded-2xl px-space-md py-space-sm text-left text-body-lg transition-all ${
                    selected ? 'bg-primary text-on-primary shadow-tactile' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}>
                  {opt}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-space-sm">
        <button type="button" className="btn-secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          <Icon name="chevron_left" /> Câu trước
        </button>
        {index < questions.length - 1 ? (
          <button type="button" className="btn-primary" onClick={() => setIndex((i) => i + 1)}>
            Câu tiếp <Icon name="chevron_right" />
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={submit} disabled={submitting}>
            <Icon name="send" className="text-[18px]" /> {submitting ? 'Đang chấm...' : 'Nộp bài'}
          </button>
        )}
      </div>
    </div>
  )
}
