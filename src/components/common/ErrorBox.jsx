import Icon from './Icon'

export default function ErrorBox({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm rounded-xl bg-error-container px-space-md py-space-sm text-on-error-container">
      <span className="flex items-center gap-space-xs text-label-lg">
        <Icon name="error" className="text-[20px]" />
        {message}
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-lg bg-surface-container-lowest px-space-md py-1 text-label-md text-error">
          Thử lại
        </button>
      )}
    </div>
  )
}
