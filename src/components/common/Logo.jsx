import { Link } from 'react-router-dom'
import logoIcon from '../../assets/logo-icon.png'

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-space-sm">
      <img src={logoIcon} alt="MAEL" className="h-8 w-8 object-contain" />
      <span className="text-headline-sm font-bold tracking-tight text-primary">MAEL</span>
    </Link>
  )
}
