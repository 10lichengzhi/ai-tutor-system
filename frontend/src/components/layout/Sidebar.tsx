import { NavLink } from 'react-router-dom'
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
} from 'lucide-react'

const menuItems = [
  { path: '/tutor', label: 'AI智师', icon: Bot },
  { path: '/dashboard', label: '学习概览', icon: LayoutDashboard },
  { path: '/knowledge', label: '知识图谱', icon: Network },
  { path: '/learning-path', label: '学习路径', icon: Route },
  { path: '/qa', label: '智能答疑', icon: MessageSquare },
  { path: '/wrong-book', label: '错题本', icon: BookX },
  { path: '/exercises', label: '练习库', icon: Library },
  { path: '/planner', label: '学习规划', icon: CalendarClock },
  { path: '/profile', label: '个人中心', icon: User },
  { path: '/settings', label: '设置', icon: Settings },
]

interface SidebarProps {
  isOpen?: boolean
  collapsed?: boolean
  onClose?: () => void
}

const Sidebar = ({ isOpen = false, collapsed = false, onClose }: SidebarProps) => {
  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 
        桌面端：static 定位，作为 flex 子元素占据空间，不会跳动
        移动端：fixed 定位，滑入滑出
      */}
      <aside
        className={`
          glass-sidebar
          fixed lg:static left-0 z-50 lg:z-auto
          transform lg:transform-none
          transition-transform duration-300
          h-screen lg:h-[calc(100vh-3.5rem)]
          top-0 lg:top-auto
          flex flex-col flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-16' : 'w-60'}
        `}
      >
        <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-primary-700/10 text-primary-700 border-l-2 border-primary-700'
                    : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-text-primary border-l-2 border-transparent'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" size={20} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* 底部品牌标识 */}
        {!collapsed && (
          <div className="p-3 border-t border-border-theme/30 flex-shrink-0">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-2 h-2 rounded-full bg-primary-700 animate-pulse" />
              <span className="text-xs text-text-secondary">AI智师 v1.0</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

export default Sidebar
