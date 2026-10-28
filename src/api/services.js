import client from './client'

/** Gom tất cả API gọi BE. Mỗi hàm trả về data (không phải response). */
const get = (url, config) => client.get(url, config).then((r) => r.data)
const post = (url, body, config) => client.post(url, body, config).then((r) => r.data)
const put = (url, body) => client.put(url, body).then((r) => r.data)
const patch = (url, body) => client.patch(url, body).then((r) => r.data)

export const authApi = {
  login: (email, password) => post('/api/auth/login', { email, password }),
  register: (payload) => post('/api/auth/register', payload),
  me: () => get('/api/auth/me'),
}

export const learningApi = {
  dashboard: () => get('/api/dashboard'),
  paths: () => get('/api/learning-paths'),
  myPath: () => get('/api/learning-paths/me'),
  path: (pathId) => get(`/api/learning-paths/${pathId}`),
  lesson: (lessonId) => get(`/api/lessons/${lessonId}`),
  updateProgress: (lessonId, progressPercent) => put(`/api/lessons/${lessonId}/progress`, { progressPercent }),
}

export const discussionApi = {
  start: (lessonId) => post('/api/discussions', { lessonId }),
  list: () => get('/api/discussions'),
  get: (sessionId) => get(`/api/discussions/${sessionId}`),
  send: (sessionId, content, replyToId) => post(`/api/discussions/${sessionId}/messages`, { content, replyToId }),
  flagError: (sessionId, messageId) => post(`/api/discussions/${sessionId}/messages/${messageId}/flag-error`),
  end: (sessionId) => post(`/api/discussions/${sessionId}/end`),
}

export const photoApi = {
  upload: (file, note) => {
    const form = new FormData()
    form.append('image', file)
    if (note) form.append('note', note)
    return post('/api/photo-problems', form, { timeout: 120000 })
  },
  list: () => get('/api/photo-problems'),
  get: (id) => get(`/api/photo-problems/${id}`),
}

export const planApi = {
  plans: () => get('/api/plans'),
  mySubscription: () => client.get('/api/subscriptions/me').then((r) => (r.status === 204 ? null : r.data)),
}

export const paymentApi = {
  create: (planId) => post('/api/payments', { planId }),
  get: (paymentId) => get(`/api/payments/${paymentId}`),
  list: () => get('/api/payments'),
  mockConfirm: (paymentId) => post(`/api/payments/${paymentId}/mock-confirm`),
}

export const quizApi = {
  list: () => get('/api/quizzes'),
  start: (quizId) => post(`/api/quizzes/${quizId}/attempts`),
  submit: (attemptId, answers) => post(`/api/attempts/${attemptId}/submit`, { answers }),
  weaknesses: () => get('/api/weaknesses'),
}

export const studentApi = {
  notifications: () => get('/api/notifications'),
  markRead: (id) => patch(`/api/notifications/${id}/read`),
  markAllRead: () => patch('/api/notifications/read-all'),
  achievements: () => get('/api/achievements'),
  report: (payload) => post('/api/reports', payload),
}

export const gameApi = {
  map: () => get('/api/game/map'),
  profile: () => get('/api/game/profile'),
  stage: (lessonId) => get(`/api/game/stages/${lessonId}`),
  submitStage: (lessonId, answers) => post(`/api/game/stages/${lessonId}/submit`, { answers }),
  boss: (topicId) => get(`/api/game/bosses/${topicId}`),
  submitBoss: (topicId, answers) => post(`/api/game/bosses/${topicId}/submit`, { answers }),
  pets: () => get('/api/game/pets'),
  starterPets: () => get('/api/game/pets/starters'),
  buyPet: (code) => post(`/api/game/pets/${code}/buy`),
  setActivePet: (code) => put(`/api/game/pets/${code}/active`),
  onboarding: (payload) => post('/api/game/onboarding', payload),
  buyShield: () => post('/api/game/streak/shield'),
  arenas: () => get('/api/game/arenas'),
  startArena: (topicId) => post(`/api/game/arenas/${topicId}/start`),
  answerArena: (runId, questionId, answer) => post(`/api/game/arena-runs/${runId}/answer`, { questionId, answer }),
  finishArena: (runId, timeLeft) => post(`/api/game/arena-runs/${runId}/finish`, { timeLeft }),
}

export const insightApi = {
  me: (refresh = false) => get('/api/insights/me', { params: { refresh } }),
}

export const profileApi = {
  get: () => get('/api/me/profile'),
  update: (payload) => put('/api/me/profile', payload),
  changePassword: (currentPassword, newPassword) => put('/api/me/password', { currentPassword, newPassword }),
}

export const publicApi = {
  captcha: () => get('/api/captcha'),
  site: () => get('/api/public/site'),
  blog: () => get('/api/blog'),
  post: (id) => get(`/api/blog/${id}`),
}

export const blogAdminApi = {
  list: () => get('/api/manage/blog'),
  create: (payload) => post('/api/manage/blog', payload),
  update: (id, payload) => put(`/api/manage/blog/${id}`, payload),
  remove: (id) => client.delete(`/api/manage/blog/${id}`),
}

export const documentApi = {
  topics: () => get('/api/lecturer/topics'),
  list: () => get('/api/lecturer/documents'),
  get: (id) => get(`/api/lecturer/documents/${id}`),
  upload: (file, { topicId, lessonId, title }) => {
    const form = new FormData()
    form.append('file', file)
    if (topicId) form.append('topicId', topicId)
    if (lessonId) form.append('lessonId', lessonId)
    if (title) form.append('title', title)
    return post('/api/lecturer/documents', form, { timeout: 120000 })
  },
  reprocess: (id) => post(`/api/lecturer/documents/${id}/reprocess`),
  approveAll: (id) => post(`/api/lecturer/documents/${id}/approve-all`),
}

export const leadApi = {
  create: (payload) => post('/api/leads', payload),
}

export const ttsApi = {
  status: () => get('/api/tts/status'),
  /** Trả về Blob mp3, hoặc null nếu BE chưa cấu hình Google TTS (204) */
  speak: (agentId, text) =>
    client.post('/api/tts', { agentId, text }, { responseType: 'blob' })
      .then((r) => (r.status === 204 ? null : r.data)),
}

export const lecturerApi = {
  pendingLessons: () => get('/api/lecturer/lessons/pending'),
  pendingQuestions: () => get('/api/lecturer/questions/pending'),
  reviewLesson: (id, decision, comment) => post(`/api/lecturer/lessons/${id}/review`, { decision, comment }),
  reviewQuestion: (id, decision, comment) => post(`/api/lecturer/questions/${id}/review`, { decision, comment }),
  reports: () => get('/api/lecturer/reports'),
  handleReport: (id, status, resolutionNote) => patch(`/api/lecturer/reports/${id}`, { status, resolutionNote }),
}

/** Cổng giảng viên mở rộng: tổng quan, lịch sử duyệt, duyệt hàng loạt, phân tích học tập */
export const lecturerInsightApi = {
  dashboard: () => get('/api/lecturer/dashboard'),
  reviews: (mine = true, limit = 50) => get('/api/lecturer/reviews', { params: { mine, limit } }),
  bulkReview: (payload) => post('/api/lecturer/review-bulk', payload),
  analytics: (grade) => get('/api/lecturer/analytics', { params: { grade: grade || undefined } }),
}

/** Kho nội dung dùng chung giảng viên + admin: cây Lớp → Chương → Bài, ngân hàng câu hỏi */
export const contentApi = {
  tree: (grade) => get('/api/manage/content/tree', { params: { grade: grade || undefined } }),
  createTopic: (payload) => post('/api/manage/topics', payload),
  updateTopic: (id, payload) => put(`/api/manage/topics/${id}`, payload),
  lessons: (status) => get('/api/manage/lessons', { params: { status: status || undefined } }),
  lesson: (id) => get(`/api/manage/lessons/${id}`),
  createLesson: (payload) => post('/api/manage/lessons', payload),
  updateLesson: (id, payload) => put(`/api/manage/lessons/${id}`, payload),
  archiveLesson: (id) => post(`/api/manage/lessons/${id}/archive`),
  restoreLesson: (id) => post(`/api/manage/lessons/${id}/restore`),
  questions: (params) => get('/api/manage/questions', { params }),
  createQuestion: (payload) => post('/api/manage/questions', payload),
  updateQuestion: (id, payload) => put(`/api/manage/questions/${id}`, payload),
  archiveQuestion: (id) => post(`/api/manage/questions/${id}/archive`),
  restoreQuestion: (id) => post(`/api/manage/questions/${id}/restore`),
  resetStats: (id) => post(`/api/manage/questions/${id}/reset-stats`),
}

/** Cổng quản trị (chỉ ADMIN) */
export const adminApi = {
  overview: () => get('/api/admin/overview'),
  users: (params) => get('/api/admin/users', { params }),
  user: (id) => get(`/api/admin/users/${id}`),
  createStaff: (payload) => post('/api/admin/users', payload),
  updateUser: (id, payload) => put(`/api/admin/users/${id}`, payload),
  setStatus: (id, status, reason) => patch(`/api/admin/users/${id}/status`, { status, reason }),
  resetPassword: (id) => post(`/api/admin/users/${id}/reset-password`),
  grantPlan: (id, planId, note) => post(`/api/admin/users/${id}/grant-plan`, { planId, note }),
  plans: () => get('/api/admin/plans'),
  createPlan: (payload) => post('/api/admin/plans', payload),
  updatePlan: (id, payload) => put(`/api/admin/plans/${id}`, payload),
  setPlanActive: (id, active) => client.patch(`/api/admin/plans/${id}/active`, null, { params: { active } }).then((r) => r.data),
  payments: (params) => get('/api/admin/payments', { params }),
  leads: () => get('/api/admin/leads'),
  updateLead: (id, { status, adminNote }) =>
    client.patch(`/api/admin/leads/${id}`, null, { params: { status: status || undefined, adminNote } }).then((r) => r.data),
  auditLogs: (params) => get('/api/admin/audit-logs', { params }),
}
