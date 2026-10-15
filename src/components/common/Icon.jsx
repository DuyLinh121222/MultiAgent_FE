/** Icon Material Symbols. Ví dụ: <Icon name="school" className="text-[20px]" filled /> */
export default function Icon({ name, className = '', filled = false }) {
  return (
    <span className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`} aria-hidden="true">
      {name}
    </span>
  )
}
