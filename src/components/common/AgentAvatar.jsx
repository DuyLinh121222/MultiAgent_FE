import Icon from './Icon'
import { agentUi } from '../../constants/agents'

/** Ảnh đại diện AI agent kèm huy hiệu nhỏ ở góc */
export default function AgentAvatar({ agentId, agentType, size = 'w-10 h-10' }) {
  const ui = agentUi(agentId, agentType)
  return (
    <div className="relative flex-shrink-0">
      <img src={ui.avatar} alt="" className={`${size} rounded-full bg-surface-container-low object-cover shadow-sm`} />
      <span className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${ui.badge}`}>
        <Icon name={ui.icon} className="text-[10px]" />
      </span>
    </div>
  )
}
