import { useContext, createContext } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import VerticalNav from './VerticalNav'
import { useBackground } from '../../contexts/BackgroundContext'

// 导航上下文
interface NavContextType {
  isHero: boolean
}
export const NavContext = createContext<NavContextType>({ isHero: false })
export const useNav = () => useContext(NavContext)

const MainLayout = () => {
  const location = useLocation()
  const isHero = location.pathname === '/' || location.pathname === '/tutor'

  const { type, currentPreset, customImage, blur, overlayOpacity } = useBackground()

  return (
    <NavContext.Provider value={{ isHero }}>
      <div className="relative w-full h-full overflow-hidden">
        {/* 全屏背景层 */}
        <div className="page-bg">
          {type === 'custom' && customImage ? (
            <>
              {/* 自定义图片层 */}
              <div
                className="page-bg-image"
                style={{
                  backgroundImage: `url(${customImage})`,
                  filter: `blur(${blur}px)`,
                }}
              />
              {/* 遮罩层 */}
              <div
                className="page-bg-overlay"
                style={{
                  background: `rgba(248, 246, 240, ${overlayOpacity})`,
                }}
              />
            </>
          ) : (
            <>
              {/* 预设渐变层（包含护眼纸色等所有预设） */}
              <div
                className="page-bg-preset"
                style={{ background: currentPreset.background }}
              />
              {blur > 0 && (
                <div
                  className="page-bg-blur-soft"
                  style={{ backdropFilter: `blur(${blur}px)` }}
                />
              )}
            </>
          )}
        </div>

        {/* 顶部Header */}
        <Header />

        {/* 左侧圆形垂直导航 */}
        <VerticalNav />

        {/* 内容区域 */}
        <main className="absolute inset-0 z-10">
          <Outlet />
        </main>
      </div>
    </NavContext.Provider>
  )
}

export default MainLayout
