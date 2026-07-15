import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Network,
  Route,
  MessageSquare,
  BookX,
  CalendarClock,
  User,
  Bot,
  Library,
  Settings,
  Home,
} from 'lucide-react'

const navItems = [
  { path: '/tutor', label: '智师', icon: Bot },
  { path: '/dashboard', label: '概览', icon: LayoutDashboard },
  { path: '/knowledge', label: '图谱', icon: Network },
  { path: '/learning-path', label: '路径', icon: Route },
  { path: '/qa', label: '答疑', icon: MessageSquare },
  { path: '/wrong-book', label: '错题', icon: BookX },
  { path: '/exercises', label: '题库', icon: Library },
  { path: '/planner', label: '规划', icon: CalendarClock },
  { path: '/profile', label: '我的', icon: User },
  { path: '/settings', label: '设置', icon: Settings },
]

const VerticalNav = () => {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/tutor') {
      return location.pathname === '/' || location.pathname === '/tutor'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="vertical-nav">
      {/* Logo区域 - 整合到垂直导航顶部 */}
      <div className="vertical-nav-logo">
        <div className="vertical-nav-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="vertical-nav-logo-text">智学</span>
      </div>

      {/* 分隔线 */}
      <div className="vertical-nav-divider" />

      {/* 导航项 */}
      {navItems.map((item) => {
        const active = isActive(item.path)
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`vertical-nav-item ${active ? 'active' : ''}`}
            title={item.label}
          >
            <div className="vertical-nav-icon">
              <item.icon
                size={20}
                className={active ? 'text-white' : 'text-[#332a23]/70'}
              />
            </div>
            <span className="vertical-nav-label">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default VerticalNav
