const Footer = () => {
  return (
    <footer className="glass-nav border-t border-border-theme/30 py-3 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-700" />
          <span>AI智师导学系统 {new Date().getFullYear()}</span>
          <span className="text-text-secondary/50">·</span>
          <span>智能教育，因材施教</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-primary-700 transition-colors">
            帮助中心
          </a>
          <a href="#" className="hover:text-primary-700 transition-colors">
            反馈建议
          </a>
          <a href="#" className="hover:text-primary-700 transition-colors">
            关于我们
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
