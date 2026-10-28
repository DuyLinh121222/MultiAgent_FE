/** Trang chủ theo vai trò sau khi đăng nhập */
export const homeOf = (role) => {
  if (role === 'ADMIN') return '/admin'
  if (role === 'LECTURER') return '/lecturer'
  return '/'
}

export const ROLE_LABEL = { STUDENT: 'Học sinh', LECTURER: 'Giảng viên', ADMIN: 'Quản trị viên' }
