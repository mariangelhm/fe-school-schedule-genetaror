import { Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ConfigPanel } from './components/ConfigPanel'
import { Dashboard } from './pages/Dashboard'
import { MaintenancePage } from './pages/MaintenancePage'
import { ScheduleView } from './pages/ScheduleView'
import { TopNavigation } from './components/TopNavigation'
import { fetchConfig } from './services/configService'

export default function App() {
  const [schoolName, setSchoolName] = useState('School Scheduler')

  useEffect(() => {
    fetchConfig()
      .then((config) => {
        setSchoolName(config.schoolName ?? 'School Scheduler')
        document.documentElement.style.setProperty('--brand-color', config.primaryColor ?? '#2563eb')
      })
      .catch(() => {
        document.documentElement.style.setProperty('--brand-color', '#2563eb')
      })
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <TopNavigation schoolName={schoolName} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<ScheduleView />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/config" element={<ConfigPanel />} />
        </Routes>
      </main>
    </div>
  )
}
