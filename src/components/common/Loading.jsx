import Icon from './Icon'

export function Spinner({ className = '' }) {
  return <Icon name="progress_activity" className={`animate-spin ${className}`} />
}

/** Khối loading giữa trang */
export default function Loading({ text = 'Đang tải...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-space-sm py-24 text-on-surface-variant">
      <Spinner className="text-[36px] text-primary" />
      <span className="text-label-lg">{text}</span>
    </div>
  )
}
