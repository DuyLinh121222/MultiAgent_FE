import Icon from './Icon'

export default function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-space-sm rounded-xl bg-surface-container-low px-space-lg py-space-xl text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high text-primary">
        <Icon name={icon} className="text-[28px]" />
      </div>
      <h3 className="text-headline-sm text-on-surface">{title}</h3>
      {description && <p className="max-w-md text-body-md text-on-surface-variant">{description}</p>}
      {action}
    </div>
  )
}
