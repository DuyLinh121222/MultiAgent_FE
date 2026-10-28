import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PublicLayout from './components/layout/PublicLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Loading from './components/common/Loading'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import WelcomePage from './pages/WelcomePage'
import LandingPage from './pages/LandingPage'
import BlogPostPage from './pages/BlogPostPage'
import HomePage from './pages/HomePage'
import StagePage from './pages/StagePage'
import ArenaListPage from './pages/ArenaListPage'
import ArenaPlayPage from './pages/ArenaPlayPage'
import PetsPage from './pages/PetsPage'
import LessonPage from './pages/LessonPage'
import StudyRoomPage from './pages/StudyRoomPage'
import DiscussionPage from './pages/DiscussionPage'
import PhotoSolverPage from './pages/PhotoSolverPage'
import QuizListPage from './pages/QuizListPage'
import QuizPlayPage from './pages/QuizPlayPage'
import PricingPage from './pages/PricingPage'
import CheckoutPage from './pages/CheckoutPage'
import NotificationsPage from './pages/NotificationsPage'
import AchievementsPage from './pages/AchievementsPage'
import ProfilePage from './pages/ProfilePage'
import StaffLayout from './components/staff/StaffLayout'
import LecturerDashboardPage from './pages/lecturer/LecturerDashboardPage'
import LecturerReviewPage from './pages/lecturer/LecturerReviewPage'
import ContentBankPage from './pages/lecturer/ContentBankPage'
import AnalyticsPage from './pages/lecturer/AnalyticsPage'
import ReviewHistoryPage from './pages/lecturer/ReviewHistoryPage'
import LecturerDocumentsPage from './pages/lecturer/LecturerDocumentsPage'
import LecturerBlogPage from './pages/lecturer/LecturerBlogPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminPlansPage from './pages/admin/AdminPlansPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminLeadsPage from './pages/admin/AdminLeadsPage'
import AdminAuditPage from './pages/admin/AdminAuditPage'
import NotFoundPage from './pages/NotFoundPage'
import { homeOf } from './utils/roles'

/**
 * Trang "/": khách thấy trang giới thiệu (banner tin tức, bảng giá, liên hệ),
 * học sinh thấy bản đồ ải, giảng viên vào cổng giảng viên, admin vào cổng quản trị.
 */
function HomeGate() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <PublicLayout><LandingPage /></PublicLayout>
  if (user.role !== 'STUDENT') return <Navigate to={homeOf(user.role)} replace />
  if (user.onboarded === false) return <Navigate to="/welcome" replace />
  return <AppLayout><HomePage /></AppLayout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route index element={<HomeGate />} />

      {/* Trang công khai: khách xem không cần đăng nhập */}
      <Route element={<PublicLayout />}>
        <Route path="plans" element={<PricingPage />} />
        <Route path="blog/:postId" element={<BlogPostPage />} />
      </Route>

      {/* Học sinh */}
      <Route element={<ProtectedRoute roles={['STUDENT']} />}>
        <Route path="welcome" element={<WelcomePage />} />
        <Route element={<AppLayout />}>
          <Route path="stage/:lessonId" element={<StagePage />} />
          <Route path="boss/:topicId" element={<StagePage boss />} />
          <Route path="arena" element={<ArenaListPage />} />
          <Route path="arena/:topicId" element={<ArenaPlayPage />} />
          <Route path="pets" element={<PetsPage />} />
          <Route path="lessons/:lessonId" element={<LessonPage />} />
          <Route path="study-room" element={<StudyRoomPage />} />
          <Route path="study-room/:sessionId" element={<DiscussionPage />} />
          <Route path="photo-solver" element={<PhotoSolverPage />} />
          <Route path="quizzes" element={<QuizListPage />} />
          <Route path="quizzes/:quizId" element={<QuizPlayPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="checkout/:paymentId" element={<CheckoutPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Giảng viên (admin cũng dùng được các trang nội dung) */}
      <Route element={<ProtectedRoute roles={['LECTURER', 'ADMIN']} />}>
        <Route element={<StaffLayout />}>
          <Route path="lecturer" element={<LecturerDashboardPage />} />
          <Route path="lecturer/review" element={<LecturerReviewPage />} />
          <Route path="lecturer/content" element={<ContentBankPage />} />
          <Route path="lecturer/analytics" element={<AnalyticsPage />} />
          <Route path="lecturer/history" element={<ReviewHistoryPage />} />
          <Route path="lecturer/documents" element={<LecturerDocumentsPage />} />
          <Route path="lecturer/blog" element={<LecturerBlogPage />} />
        </Route>
      </Route>

      {/* Quản trị viên */}
      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<StaffLayout />}>
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/plans" element={<AdminPlansPage />} />
          <Route path="admin/payments" element={<AdminPaymentsPage />} />
          <Route path="admin/leads" element={<AdminLeadsPage />} />
          <Route path="admin/audit" element={<AdminAuditPage />} />
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
