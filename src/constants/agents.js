import teacherImg from '../assets/avatar-teacher.jpg'
import kietImg from '../assets/avatar-kiet.jpg'
import anImg from '../assets/avatar-an.jpg'

/**
 * Giao diện cho từng AI agent (map theo agentId trong DB, dự phòng theo agentType).
 */
const AGENT_UI = {
  'agent-tutor': {
    avatar: teacherImg, icon: 'school', role: 'AI Giảng viên',
    text: 'text-primary', bubble: 'bg-primary-fixed/40', badge: 'bg-primary text-on-primary', chip: 'bg-primary-fixed text-on-primary-fixed',
  },
  'agent-critic': {
    avatar: kietImg, icon: 'manage_search', role: 'Bạn Phản biện',
    text: 'text-secondary', bubble: 'bg-secondary-fixed/40', badge: 'bg-secondary-container text-on-secondary', chip: 'bg-secondary-fixed text-on-secondary-fixed',
  },
  'agent-creative': {
    avatar: anImg, icon: 'lightbulb', role: 'Bạn Sáng tạo',
    text: 'text-tertiary', bubble: 'bg-tertiary-fixed/30', badge: 'bg-tertiary-container text-on-tertiary', chip: 'bg-tertiary-fixed text-on-tertiary-fixed',
  },
}

export const AGENTS_INTRO = [
  { id: 'agent-tutor', name: 'Thầy Minh Trí', desc: 'Giảng từng bước, gợi mở để em tự làm' },
  { id: 'agent-critic', name: 'Tuấn Kiệt', desc: 'Hay phản biện, thỉnh thoảng cố tình nói sai' },
  { id: 'agent-creative', name: 'Bảo An', desc: 'Tìm cách giải khác, mẹo tính nhanh' },
]

export function agentUi(agentId, agentType) {
  if (AGENT_UI[agentId]) return AGENT_UI[agentId]
  return agentType === 'TUTOR' ? AGENT_UI['agent-tutor'] : AGENT_UI['agent-creative']
}
