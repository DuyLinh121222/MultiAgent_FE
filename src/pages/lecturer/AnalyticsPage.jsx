import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Loading from '../../components/common/Loading'
import ErrorBox from '../../components/common/ErrorBox'
import EmptyState from '../../components/common/EmptyState'
import { Badge, PageHeader, RateBar, Segmented, StatCard } from '../../components/staff/ui'
import { lecturerInsightApi } from '../../api/services'
import { getErrorMessage } from '../../api/client'
import { formatDate } from '../../utils/format'

const pct = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`)

/**
 * Phân tích học tập: chương nào nhiều học sinh yếu, ải nào khó, câu nào hay sai, học sinh nào cần hỗ trợ.
 * Dùng để quyết định soạn thêm bài / sửa câu hỏi / chú ý học sinh.
 */
export default function AnalyticsPage() {
  const [grade, setGrade] = useState(9)
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setD(null)
    setError('')
    lecturerInsightApi.analytics(grade).then(setD).catch((e) => setError(getErrorMessage(e)))
  }, [grade])

  const o = d?.overview
  return (
    <div className="page">
      <PageHeader icon="monitoring" title="Phân tích học tập"
        subtitle="Tổng hợp từ kết quả đi ải, ải trùm, Đấu trường và quiz của học sinh."
        actions={<Segmented value={grade} onChange={setGrade} options={[
          { value: 0, label: 'Tất cả' }, ...[6, 7, 8, 9].map((g) => ({ value: g, label: `Lớp ${g}` })),
        ]} />} />
      <ErrorBox message={error} />
      {!d ? (!error && <Loading />) : (
        <>
          <div className="grid grid-cols-2 gap-space-md xl:grid-cols-4">
            <StatCard icon="school" label="Học sinh" value={o.students} hint={`${o.activeStudents7d} học trong 7 ngày`} />
            <StatCard icon="flag" tone="green" label="Lượt đi ải" value={o.stagePlays} />
            <StatCard icon="sports_esports" tone="orange" label="Lượt Đấu trường" value={o.arenaPlays} />
            <StatCard icon="percent" tone="dark" label="Tỉ lệ đúng trung bình" value={pct(o.avgCorrectRate)} hint="Theo lần làm tốt nhất mỗi ải" />
          </div>

          <section className="card flex flex-col gap-space-sm overflow-hidden">
            <h2 className="text-headline-sm">Theo chương</h2>
            <div className="-mx-space-lg overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-body-md">
                <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
                  <tr>
                    <th className="px-space-lg py-2">Chương</th>
                    <th className="px-space-md py-2">Học sinh còn yếu</th>
                    <th className="px-space-md py-2">Thành thạo TB (HS yếu)</th>
                    <th className="px-space-md py-2">Đấu trường</th>
                    <th className="px-space-md py-2">Qua ải trùm</th>
                  </tr>
                </thead>
                <tbody>
                  {d.topics.map((t) => (
                    <tr key={t.topicId} className="border-t border-surface-container">
                      <td className="px-space-lg py-2">
                        <Link to={`/lecturer/content?grade=${t.gradeLevel}&topic=${t.topicId}`} className="text-label-lg hover:text-primary">{t.name}</Link>
                        {!grade && <span className="ml-1 text-body-sm text-outline">Lớp {t.gradeLevel}</span>}
                      </td>
                      <td className="px-space-md py-2">{t.weakStudents ? <Badge tone={t.weakStudents >= 5 ? 'red' : 'orange'}>{t.weakStudents} học sinh</Badge> : <span className="text-outline">0</span>}</td>
                      <td className="px-space-md py-2"><RateBar value={t.avgMastery == null ? null : t.avgMastery / 100} /></td>
                      <td className="px-space-md py-2 text-body-sm">{t.arenaPlays ? <span className="flex items-center gap-2">{t.arenaPlays} lượt <RateBar value={t.arenaAccuracy} /></span> : <span className="text-outline">Chưa chơi</span>}</td>
                      <td className="px-space-md py-2">{t.bossClears} học sinh</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-space-md xl:grid-cols-2">
            <section className="card flex flex-col gap-space-sm">
              <h2 className="text-headline-sm">Ải khó nhất <span className="text-body-sm text-outline">(tỉ lệ đúng thấp nhất trước)</span></h2>
              {d.lessons.length === 0 ? <EmptyState icon="flag" title="Chưa có học sinh nào chơi ải" /> : d.lessons.slice(0, 12).map((l) => (
                <Link key={l.lessonId} to={`/lecturer/content?grade=${l.gradeLevel}&lesson=${l.lessonId}`}
                  className="flex flex-wrap items-center gap-space-sm rounded-xl px-space-sm py-2 hover:bg-surface-container-low">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-label-lg">{l.title}</span>
                    <span className="truncate text-body-sm text-outline">{l.players} học sinh • {l.attempts} lượt • {l.avgStars.toFixed(1)} ⭐ TB</span>
                  </div>
                  <RateBar value={l.correctRate} />
                </Link>
              ))}
            </section>

            <section className="card flex flex-col gap-space-sm">
              <h2 className="text-headline-sm">Câu hỏi hay sai nhất</h2>
              {d.hardestQuestions.length === 0 ? (
                <EmptyState icon="quiz" title="Chưa đủ dữ liệu" description="Mỗi câu cần ít nhất 3 lượt trả lời mới được thống kê." />
              ) : d.hardestQuestions.map((q) => (
                <Link key={q.id} to={`/lecturer/content?grade=${q.gradeLevel}&${q.lessonId ? `lesson=${q.lessonId}` : `topic=${q.topicId}`}`}
                  className="flex flex-col gap-1 rounded-xl border border-surface-container px-space-md py-space-sm hover:bg-surface-container-low">
                  <div className="flex items-center gap-space-xs">
                    <Badge tone={q.wrongRate >= 0.6 ? 'red' : 'orange'}>{pct(q.wrongRate)} sai</Badge>
                    <span className="text-body-sm text-outline">{q.wrongCount}/{q.answeredCount} lượt • {q.lessonTitle || 'Ải trùm'}</span>
                  </div>
                  <span className="text-body-md">{q.content}</span>
                  <span className="text-body-sm text-tertiary">Đáp án đúng: {(q.options || []).find((x) => x[0] === q.correctAnswer[0]) || q.correctAnswer}</span>
                </Link>
              ))}
            </section>
          </div>

          <section className="card flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <h2 className="text-headline-sm">Học sinh cần hỗ trợ</h2>
              <span className="text-body-sm text-outline">Nhiều chương chưa vững nhất trước</span>
            </div>
            {d.studentsNeedHelp.length === 0 ? (
              <p className="flex items-center gap-space-xs py-space-sm text-body-md text-tertiary"><Icon name="sentiment_satisfied" className="text-[20px]" /> Chưa có học sinh nào bị đánh dấu yếu.</p>
            ) : (
              <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2 xl:grid-cols-3">
                {d.studentsNeedHelp.map((s) => (
                  <div key={s.studentId} className="flex flex-col gap-1 rounded-xl border border-surface-container p-space-md">
                    <div className="flex items-center justify-between gap-space-sm">
                      <span className="truncate text-label-lg">{s.fullName}</span>
                      <Badge tone="gray">Lớp {s.gradeLevel}</Badge>
                    </div>
                    <span className="text-body-sm text-on-surface-variant">
                      {s.weakTopics} chương chưa vững • thành thạo TB {s.avgMastery == null ? '—' : `${Math.round(s.avgMastery)}%`}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {s.topicNames.map((n) => <span key={n} className="rounded-full bg-error-container/60 px-2 py-0.5 text-label-sm text-on-error-container">{n.replace(/^Chương [IVXL]+\.\s*/, '')}</span>)}
                    </div>
                    <span className="text-body-sm text-outline">
                      {s.lastActiveDate ? `Học gần nhất ${formatDate(s.lastActiveDate)}` : 'Chưa học'}{s.streakDays ? ` • 🔥 ${s.streakDays} ngày` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
