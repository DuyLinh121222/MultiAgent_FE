export default function ProgressBar({ value = 0, color = 'bg-primary', className = '' }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-surface-container ${className}`}>
      <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${v}%` }} />
    </div>
  )
}
