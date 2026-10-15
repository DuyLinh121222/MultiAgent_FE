import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import ProgressBar from '../components/common/ProgressBar'
import AgentAvatar from '../components/common/AgentAvatar'
import { discussionApi, learningApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { AGENTS_INTRO } from '../constants/agents'

const GRADE_DESC = { 6: 'Số tự nhiên, Phân số', 7: 'Số hữu tỉ, Tam giác', 8: 'Hằng đẳng thức, Phương trình', 9: 'Căn thức, Thi vào 10' }
const TOPIC_COLORS = [
  { chip: 'bg-primary-fixed text-primary', bar: 'bg-primary', text: 'text-primary' },
  { chip: 'bg-secondary-fixed text-secondary', bar: 'bg-secondary-container', text: 'text-secondary' },
  { chip: 'bg-tertiary-fixed text-tertiary', bar: 'bg-tertiary-container', text: 'text-tertiary' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [paths, setPaths] = useState([])
  const [viewPath, setViewPath] = useState(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [dash, allPaths] = await Promise.all([learningApi.dashboard(), learningApi.paths()])
      setData(dash)
      setPaths(allPaths)
      setViewPath(dash.learningPath)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }, [])

  useEffect(() => { load() }, [load])

  const selectGrade = async (grade) => {
    const p = paths.find((x) => x.gradeLevel === grade)
    if (!p) return
    if (grade === data.gradeLevel) return setViewPath(data.learningPath)
    try {
      setViewPath(await learningApi.path(p.id))
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const startDiscussion = async (lessonId) => {
    setStarting(true)
    try {
      const session = await discussionApi.start(lessonId)
      navigate(`/study-room/${session.id}`)
    } catch (e) {
      setError(getErrorMessage(e))
      setStarting(false)
    }
  }

  if (!data && !error) return <Loading />
  if (!data) return <div className="page"><ErrorBox message={error} onRetry={load} /></div>

  const percent = data.totalLessons ? Math.round((data.completedLessons * 100) / data.totalLessons) : 0
  const firstLesson = data.learningPath?.topics?.flatMap((t) => t.lessons).find((l) => l.progressStatus !== 'COMPLETED')
  const cont = data.continueLesson || (firstLesson && { lessonId: firstLesson.id, lessonTitle: firstLesson.title, topicName: '', progressPercent: firstLesson.progressPercent })

  return (
    <div className="page">
      <ErrorBox message={error} />

      {/* Lời chào + mục tiêu */}
      <section className="flex flex-col items-start justify-between gap-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm lg:flex-row lg:items-center">
        <div className="flex max-w-2xl flex-col gap-space-xs">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="chip bg-primary-fixed text-on-primary-fixed">
              <Icon name="school" className="text-[16px]" /> Toán Lớp {data.gradeLevel} • Chương trình GDPT mới
            </span>
            <span className="chip bg-secondary-fixed text-on-secondary-fixed">
              <Icon name="military_tech" className="text-[16px] text-secondary" /> {data.totalPoints} điểm thành tích
            </span>
            {data.subscription ? (
              <span className="chip bg-tertiary-fixed text-on-tertiary-fixed">
                <Icon name="schedule" className="text-[16px]" /> {data.subscription.trial ? 'Dùng thử' : data.subscription.planName}: còn {data.subscription.daysLeft} ngày
              </span>
            ) : (
              <Link to="/pricing" className="chip bg-error-container text-on-error-container">
                <Icon name="error" className="text-[16px]" /> Gói học đã hết hạn - gia hạn ngay
              </Link>
            )}
          </div>
          <h1 className="mt-space-xs text-headline-lg-mobile tracking-tight text-on-surface md:text-headline-lg">
            Chào {data.fullName}! Hôm nay bạn muốn học cùng Thầy AI và hai bạn học nào?
          </h1>
          <p className="text-body-md text-on-surface-variant">Chọn một bài học, vào phòng thảo luận và thử bắt lỗi sai của bạn AI nhé!</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-space-md self-stretch rounded-xl bg-surface-container-low px-space-lg py-space-md sm:self-auto">
          <div className="flex flex-col">
            <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">Tiến độ lộ trình</span>
            <span className="text-headline-sm font-bold text-primary">{data.completedLessons} / {data.totalLessons} bài</span>
          </div>
          <Ring value={percent} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
        <section className="flex flex-col gap-space-lg lg:col-span-8">
          {/* Bài học dở dang */}
          <div className="card flex flex-col gap-space-lg">
            <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-center">
              <div className="flex items-center gap-space-sm">
                <span className="flex items-center justify-center rounded-xl bg-primary-fixed p-space-sm text-primary">
                  <Icon name="functions" className="text-[24px]" />
                </span>
                <div>
                  <span className="text-label-sm font-semibold text-on-surface-variant">{data.continueLesson ? 'BÀI HỌC DỞ DANG' : 'BÀI HỌC TIẾP THEO'}</span>
                  <h2 className="text-headline-md text-on-surface">{cont ? cont.lessonTitle : 'Bạn đã học hết lộ trình 🎉'}</h2>
                </div>
              </div>
              {cont && (
                <span className="self-start rounded-full bg-surface-container px-space-md py-space-xs text-label-sm text-on-surface sm:self-auto">
                  Đã học {cont.progressPercent}%
                </span>
              )}
            </div>

            <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
              <div className="flex items-center justify-between">
                <span className="text-label-md font-semibold text-on-surface-variant">Phòng học thảo luận 3 AI</span>
                <span className="inline-flex items-center gap-1 text-label-sm font-bold text-tertiary">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary-container" /> 3 AI đang trực tuyến
                </span>
              </div>
              <div className="grid grid-cols-1 gap-space-sm pt-space-xs sm:grid-cols-3">
                {AGENTS_INTRO.map((a) => (
                  <div key={a.id} className="flex items-center gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
                    <AgentAvatar agentId={a.id} size="w-9 h-9" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-label-md font-bold text-on-surface">{a.name}</span>
                      <span className="truncate text-body-sm text-on-surface-variant">{a.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-space-md pt-space-xs sm:flex-row">
              <button type="button" disabled={!cont || starting} onClick={() => startDiscussion(cont.lessonId)}
                className="btn-primary w-full px-space-xl py-space-md shadow-[0_3px_0_0_#003ea8] sm:w-auto">
                <Icon name="forum" className="text-[22px]" />
                <span>{starting ? 'Đang mở phòng...' : 'Vào phòng học nhóm AI ngay'}</span>
              </button>
              {cont && (
                <Link to={`/lessons/${cont.lessonId}`} className="btn-secondary w-full py-space-md sm:w-auto">
                  <Icon name="menu_book" className="text-[20px]" /> Xem bài giảng
                </Link>
              )}
              <Link to="/photo-solver" className="btn-secondary w-full py-space-md sm:w-auto">
                <Icon name="photo_camera" className="text-[20px]" /> Quét đề tập vở
              </Link>
            </div>
          </div>

          {/* Chọn khối lớp */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-headline-sm text-on-surface">Lộ trình Toán THCS</h3>
              <span className="text-body-sm text-on-surface-variant">Chuyển khối để ôn luyện sớm hoặc xem lại</span>
            </div>
            <div className="grid grid-cols-2 gap-space-sm sm:grid-cols-4">
              {[6, 7, 8, 9].map((g) => {
                const active = viewPath?.gradeLevel === g
                const isMine = data.gradeLevel === g
                return (
                  <button key={g} type="button" onClick={() => selectGrade(g)}
                    className={`flex items-center justify-between rounded-xl px-space-md py-space-md text-left transition-all ${
                      active ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container'
                    }`}>
                    <div>
                      <div className="text-headline-sm">Lớp {g}</div>
                      <div className={`text-body-sm ${active ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
                        {GRADE_DESC[g]}{isMine ? ' (Hiện tại)' : ''}
                      </div>
                    </div>
                    <Icon name={active ? 'verified' : g < data.gradeLevel ? 'check_circle' : 'lock_open'}
                      className={active ? 'text-tertiary-fixed' : 'text-outline-variant'} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Các chủ đề */}
          {viewPath && (
            <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
              {viewPath.topics.map((t, idx) => {
                const c = TOPIC_COLORS[idx % TOPIC_COLORS.length]
                const p = t.totalLessons ? Math.round((t.completedLessons * 100) / t.totalLessons) : 0
                return (
                  <div key={t.id} className="card flex flex-col justify-between gap-space-md">
                    <div className="flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between">
                        <span className={`chip font-bold ${c.chip}`}>
                          <Icon name="calculate" className="text-[16px]" /> Chủ đề {t.orderIndex}
                        </span>
                        <span className={`text-label-lg font-bold ${c.text}`}>{p}%</span>
                      </div>
                      <h3 className="text-headline-sm text-on-surface">{t.name}</h3>
                      <p className="text-body-sm text-on-surface-variant">{t.description}</p>
                      <ProgressBar value={p} color={c.bar} className="my-space-xs" />
                      {t.masteryScore != null && (
                        <span className={`chip w-fit ${Number(t.masteryScore) < 50 ? 'bg-error-container text-on-error-container' : 'bg-secondary-fixed text-on-secondary-fixed'}`}>
                          <Icon name="insights" className="text-[14px]" /> Mức nắm vững {Math.round(t.masteryScore)}%
                        </span>
                      )}
                      <div className="flex flex-wrap gap-space-xs pt-space-xs">
                        {t.lessons.length === 0 && <span className="text-body-sm text-outline">Bài học đang được biên soạn</span>}
                        {t.lessons.map((l) => (
                          <Link key={l.id} to={`/lessons/${l.id}`}
                            className={`rounded-md px-space-sm py-space-xs text-label-sm transition-colors ${
                              l.progressStatus === 'COMPLETED'
                                ? 'bg-tertiary-fixed/50 text-on-tertiary-fixed'
                                : l.progressStatus === 'IN_PROGRESS'
                                  ? 'bg-surface-container-highest font-semibold text-primary'
                                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                            }`}>
                            {l.title}{l.progressStatus === 'COMPLETED' ? ' ✓' : l.progressStatus === 'IN_PROGRESS' ? ' • Đang học' : ''}
                          </Link>
                        ))}
                      </div>
                    </div>
                    {t.lessons.length > 0 && (
                      <div className="flex items-center gap-space-sm pt-space-sm">
                        <Link to={`/lessons/${(t.lessons.find((l) => l.progressStatus !== 'COMPLETED') || t.lessons[0]).id}`}
                          className="flex-1 rounded-xl bg-primary px-space-md py-space-sm text-center text-label-lg text-on-primary transition-colors hover:bg-primary-container">
                          Học bài
                        </Link>
                        <Link to="/quizzes" className="btn-secondary">Luyện tập</Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Cột phải */}
        <aside className="flex flex-col gap-space-lg lg:col-span-4">
          <div className="card flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Phần kiến thức cần ôn</span>
              <Icon name="insights" className="text-[20px] text-primary" />
            </div>
            {data.weaknesses.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">Chưa phát hiện điểm yếu. Làm quiz để Thầy AI đánh giá nhé!</p>
            ) : (
              data.weaknesses.map((w) => (
                <div key={w.id} className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-label-lg text-on-surface">{w.topicName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-label-sm ${
                      w.severity === 'HIGH' ? 'bg-error-container text-on-error-container' : w.severity === 'MEDIUM' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-tertiary-fixed text-on-tertiary-fixed'
                    }`}>
                      {w.severity === 'HIGH' ? 'Cần ôn gấp' : w.severity === 'MEDIUM' ? 'Cần ôn' : 'Khá ổn'}
                    </span>
                  </div>
                  <ProgressBar value={Number(w.masteryScore)} color={w.severity === 'HIGH' ? 'bg-error' : 'bg-secondary-container'} />
                  <span className="text-body-sm text-on-surface-variant">Mức nắm vững {Math.round(w.masteryScore)}%</span>
                </div>
              ))
            )}
            <Link to="/quizzes" className="btn-primary w-full">
              <Icon name="quiz" className="text-[18px]" /> Làm quiz củng cố
            </Link>
          </div>

          <div className="card flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <h3 className="text-headline-sm text-on-surface">Kết quả học tập</h3>
              <Icon name="bar_chart" className="text-[20px] text-primary" />
            </div>
            <div className="grid grid-cols-2 gap-space-sm">
              <Stat label="Bài đã hoàn thành" value={data.completedLessons} />
              <Stat label="Điểm thành tích" value={data.totalPoints} highlight />
            </div>
            <Link to="/achievements" className="flex items-center justify-between rounded-xl bg-surface-container p-space-sm">
              <span className="flex items-center gap-space-sm text-label-md text-on-surface">
                <Icon name="military_tech" className="text-[22px] text-secondary" /> Huy hiệu đã đạt: {data.achievementCount}
              </span>
              <Icon name="chevron_right" className="text-on-surface-variant" />
            </Link>
            <Link to="/notifications" className="flex items-center justify-between rounded-xl bg-surface-container p-space-sm">
              <span className="flex items-center gap-space-sm text-label-md text-on-surface">
                <Icon name="notifications" className="text-[22px] text-primary" /> Thông báo chưa đọc: {data.unreadNotifications}
              </span>
              <Icon name="chevron_right" className="text-on-surface-variant" />
            </Link>
          </div>
        </aside>
      </div>

      {/* Gợi ý giải bằng ảnh */}
      <section className="flex flex-col items-center justify-between gap-space-md rounded-xl bg-surface-container-high p-space-md sm:p-space-lg md:flex-row">
        <div className="flex items-center gap-space-md">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
            <Icon name="document_scanner" className="text-[28px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-headline-sm text-on-surface">Gặp bài toán khó trong sách giáo khoa hoặc đề cương?</span>
            <span className="text-body-md text-on-surface-variant">Chụp ảnh bài tập, Thầy AI và hai bạn học sẽ giải từng bước và chỉ ra lỗi sai.</span>
          </div>
        </div>
        <Link to="/photo-solver" className="btn-primary whitespace-nowrap px-space-xl py-space-md">
          <Icon name="camera_alt" className="text-[20px]" /> Tải ảnh lên giải ngay
        </Link>
      </section>
    </div>
  )
}

function Ring({ value }) {
  const r = 15.9155
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-surface-container" />
        <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={`${value}, 100`} className="text-primary-container" />
      </svg>
      <span className="absolute text-label-md font-bold text-primary">{value}%</span>
    </div>
  )
}

function Stat({ label, value, highlight }) {
  return (
    <div className="flex flex-col rounded-xl bg-surface-container-low p-space-md">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <span className={`text-headline-lg font-extrabold ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</span>
    </div>
  )
}
