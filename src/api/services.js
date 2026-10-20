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
