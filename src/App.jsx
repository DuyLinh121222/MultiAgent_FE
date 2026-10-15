import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
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
import LecturerReviewPage from './pages/lecturer/LecturerReviewPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Học sinh */}
      <Route element={<ProtectedRoute roles={['STUDENT']} />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
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
        </Route>
      </Route>

      {/* Giảng viên / Admin */}
      <Route element={<ProtectedRoute roles={['LECTURER', 'ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="lecturer" element={<LecturerReviewPage />} />
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
