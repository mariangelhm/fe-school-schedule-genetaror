import { Link, NavLink } from 'react-router-dom'

interface TopNavigationProps {
  schoolName: string
}

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/schedule', label: 'Horarios' },
  { path: '/maintenance', label: 'Mantenedores' },
  { path: '/config', label: 'Configuración' }
]

export function TopNavigation({ schoolName }: TopNavigationProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4" aria-label="Principal">
        <Link to="/" className="text-lg font-semibold text-brand-dynamic">
          {schoolName}
        </Link>
        <div className="flex gap-4 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded px-3 py-2 font-medium transition-colors ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
