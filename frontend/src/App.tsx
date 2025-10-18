import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { useQuery } from 'react-query'
import { ConfigPanel } from './components/ConfigPanel'
import { Dashboard } from './pages/Dashboard'
import { MaintenancePage } from './pages/MaintenancePage'
import { ScheduleView } from './pages/ScheduleView'
import { TopNavigation } from './components/TopNavigation'
import { fetchConfig } from './services/configService'
import { SubjectsPage } from './pages/maintainers/SubjectsPage'
import { CoursesPage } from './pages/maintainers/CoursesPage'
import { TeachersPage } from './pages/maintainers/TeachersPage'
import { ClassroomsPage } from './pages/maintainers/ClassroomsPage'

export default function App() {
  const { data } = useQuery(['config'], fetchConfig, {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    initialData: {
      schoolName: 'School Scheduler',
      primaryColor: '#2563eb',
      theme: 'dark',
      blockDuration: 45,
      dayStart: '08:00',
      lunchStart: '13:00',
      lunchDuration: 60
    }
  })

  const schoolName = data?.schoolName ?? 'School Scheduler'
  const theme = data?.theme ?? 'dark'

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', data?.primaryColor ?? '#2563eb')
  }, [data?.primaryColor])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <TopNavigation schoolName={schoolName} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<ScheduleView />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/config" element={<ConfigPanel />} />
          <Route path="/maintenance/subjects" element={<SubjectsPage />} />
          <Route path="/maintenance/courses" element={<CoursesPage />} />
          <Route path="/maintenance/teachers" element={<TeachersPage />} />
          <Route path="/maintenance/classrooms" element={<ClassroomsPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/classrooms" element={<ClassroomsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
