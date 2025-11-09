import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TimeApp from './apps/time/TimeApp'
import FinanceApp from './apps/finance/FinanceApp'
import FlowApp from './apps/flow/FlowApp'
import FoodApp from './apps/food/FoodApp'
import CalendarApp from './apps/calendar/CalendarApp'
import AdminPanel from './pages/AdminPanel'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/time" element={<TimeApp />} />
      <Route path="/finance" element={<FinanceApp />} />
      <Route path="/flow" element={<FlowApp />} />
      <Route path="/food" element={<FoodApp />} />
      <Route path="/calendar" element={<CalendarApp />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  )
}
