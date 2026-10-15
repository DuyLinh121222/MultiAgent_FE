import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Loading from '../common/Loading'

/**
 * Chặn trang khi chưa đăng nhập hoặc sai vai trò.
 * roles: danh sách role được vào, ví dụ ['STUDENT'] hoặc ['LECTURER', 'ADMIN'].
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'STUDENT' ? '/' : '/lecturer'} replace />
  }
  return <Outlet />
}
