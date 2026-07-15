import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import KnowledgeMap from './pages/KnowledgeMap'
import LearningPath from './pages/LearningPath'
import QA from './pages/QA'
import WrongBook from './pages/WrongBook'
import ExerciseLibrary from './pages/ExerciseLibrary'
import Planner from './pages/Planner'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import AITutor from './pages/AITutor'
import { ThemeProvider } from './contexts/ThemeContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { LearningStatsProvider } from './contexts/LearningStatsContext'
import { LearningPlanProvider } from './contexts/LearningPlanContext'
import { WrongAnswersProvider } from './contexts/WrongAnswersContext'
import { ExercisesProvider } from './contexts/ExercisesContext'
import { BackgroundProvider } from './contexts/BackgroundContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <LearningStatsProvider>
            <LearningPlanProvider>
              <WrongAnswersProvider>
                <ExercisesProvider>
                  <BackgroundProvider>
                    <Routes>
                    {/* 带主布局的页面（统一Header+Sidebar） */}
                    <Route element={<MainLayout />}>
                      <Route path="/tutor" element={<AITutor />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/knowledge" element={<KnowledgeMap />} />
                      <Route path="/learning-path" element={<LearningPath />} />
                      <Route path="/qa" element={<QA />} />
                      <Route path="/wrong-book" element={<WrongBook />} />
                      <Route path="/exercises" element={<ExerciseLibrary />} />
                      <Route path="/planner" element={<Planner />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<Settings />} />
                    </Route>

                    {/* 默认重定向到AI智师（核心功能） */}
                    <Route path="/" element={<Navigate to="/tutor" replace />} />
                    <Route path="*" element={<Navigate to="/tutor" replace />} />
                  </Routes>
                  </BackgroundProvider>
                </ExercisesProvider>
              </WrongAnswersProvider>
            </LearningPlanProvider>
          </LearningStatsProvider>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
