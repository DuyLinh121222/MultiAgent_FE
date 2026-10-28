import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import { Badge, PageHeader, RateBar, StatCard } from '../../components/staff/ui'
import { lecturerInsightApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { timeAgo } from '../../utils/format'

const greeting = () => {
  const h = new Date().getHours()
  return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
}

/** Trang đầu của giảng viên: việc cần làm hôm nay + điểm nóng học tập */
export default function LecturerDashboardPage() {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    setError('')
    lecturerInsightApi.dashboard().then(setD).catch((e) => setError(getErrorMessage(e)))
  }, [])
  useEffect(() => { load() }, [load])

  if (!d && !error) return <Loading />
  if (!d) return <div className="page"><ErrorBox message={error} onRetry={load} /></div>

  const pendingTotal = d.pendingLessons + d.pendingQuestions
  const approveRate = d.myReviewsTotal ? Math.round((d.myApproved / d.myReviewsTotal) * 100) : null

  return (
    <div className="page">
      <PageHeader title={`${greeting()}, ${d.lecturerName.split(' ').pop()}!`}
        subtitle={pendingTotal + d.openReports > 0
          ? `Có ${pendingTotal} nội dung chờ duyệt và ${d.openReports} báo lỗi từ học sinh đang chờ bạn.`
          : 'Không còn nội dung nào chờ duyệt. Xem phân tích để biết học sinh đang vướng ở đâu.'}
        actions={<>
          <Link to="/lecturer/documents" className="btn-secondary"><Icon name="upload_file" className="text-[18px]" /> Tải tài liệu PDF</Link>
          <Link to="/lecturer/review" className="btn-primary"><Icon name="fact_check" className="text-[18px]" /> Duyệt ngay</Link>
        </>} />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="quiz" tone="orange" label="Câu hỏi chờ duyệt" value={d.pendingQuestions} hint="Phần lớn do AI soạn từ PDF" to="/lecturer/review" />
        <StatCard icon="menu_book" tone="primary" label="Bài giảng chờ duyệt" value={d.pendingLessons} to="/lecturer/review?tab=lessons" />
        <StatCard icon="flag" tone="red" label="Báo lỗi từ học sinh" value={d.openReports} to="/lecturer/review?tab=reports" />
        <StatCard icon="groups" tone="green" label="Học sinh học trong 7 ngày" value={d.activeStudents7d} to="/lecturer/analytics" />
      </div>

      <div className="grid grid-cols-1 gap-space-md lg:grid-cols-3">
        <section className="card flex flex-col gap-space-md">
          <h2 className="text-headline-sm">Hoạt động của bạn</h2>
          <div className="grid grid-cols-2 gap-space-sm">
            <Num label="Lượt duyệt" value={d.myReviewsTotal} />
            <Num label="Tuần này" value={d.myReviewsWeek} />
            <Num label="Tỉ lệ duyệt" value={approveRate == null ? '—' : `${approveRate}%`} />
            <Num label="Tài liệu PDF" value={d.myDocuments} />
          </div>
          {d.processingDocuments > 0 && (
            <Link to="/lecturer/documents" className="flex items-center gap-space-sm rounded-xl bg-primary-fixed/60 px-space-md py-space-sm text-label-lg text-on-primary-fixed">
              <Icon name="progress_activity" className="animate-spin text-[18px]" /> AI đang đọc {d.processingDocuments} tài liệu
            </Link>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-label-md text-on-surface-variant">Duyệt gần đây</span>
            {d.recentReviews.length === 0 && <span className="text-body-sm text-outline">Bạn chưa duyệt nội dung nào.</span>}
            {d.recentReviews.map((r) => (
              <div key={r.id} className="flex items-center gap-space-sm py-1">
                <Icon name={r.decision === 'APPROVED' ? 'check_circle' : 'cancel'} filled className={`text-[18px] ${r.decision === 'APPROVED' ? 'text-tertiary' : 'text-error'}`} />
                <span className="min-w-0 flex-1 truncate text-body-sm">{r.targetTitle}</span>
                <span className="text-label-sm text-outline">{timeAgo(r.reviewedAt)}</span>
              </div>
            ))}
            <Link to="/lecturer/history" className="pt-1 text-label-lg text-primary hover:underline">Xem lịch sử duyệt</Link>
          </div>
        </section>

        <section className="card flex flex-col gap-space-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm">Ải học sinh thấy khó nhất</h2>
            <Link to="/lecturer/analytics" className="text-label-lg text-primary hover:underline">Phân tích đầy đủ</Link>
          </div>
          {d.hardestLessons.length === 0 && <span className="py-space-md text-body-sm text-outline">Chưa có học sinh nào chơi ải.</span>}
          {d.hardestLessons.map((l) => (
            <Link key={l.lessonId} to={`/lecturer/content?grade=${l.gradeLevel}&lesson=${l.lessonId}`}
              className="flex flex-wrap items-center gap-space-sm rounded-xl px-space-sm py-2 hover:bg-surface-container-low">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-label-lg">{l.title}</span>
                <span className="truncate text-body-sm text-outline">Lớp {l.gradeLevel} • {l.players} học sinh • {l.attempts} lượt</span>
              </div>
              <RateBar value={l.correctRate} />
            </Link>
          ))}

          <h2 className="pt-space-sm text-headline-sm">Câu hỏi học sinh hay sai</h2>
          {d.hardestQuestions.length === 0 && <span className="text-body-sm text-outline">Cần ít nhất 3 lượt trả lời mỗi câu để thống kê.</span>}
          {d.hardestQuestions.map((q) => (
            <Link key={q.id} to={`/lecturer/content?grade=${q.gradeLevel}&${q.lessonId ? `lesson=${q.lessonId}` : `topic=${q.topicId}`}`}
              className="flex items-center gap-space-sm rounded-xl px-space-sm py-2 hover:bg-surface-container-low">
              <Badge tone="red">{Math.round(q.wrongRate * 100)}% sai</Badge>
              <span className="min-w-0 flex-1 truncate text-body-md">{q.content}</span>
              <span className="text-label-sm text-outline">{q.answeredCount} lượt</span>
            </Link>
          ))}
        </section>
      </div>
    </div>
  )
}

function Num({ label, value }) {
  return (
    <div className="flex flex-col rounded-xl bg-surface-container-low px-space-md py-space-sm">
      <span className="text-headline-sm font-extrabold">{value}</span>
      <span className="text-label-sm text-outline">{label}</span>
    </div>
  )
}
