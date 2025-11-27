import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import SimpleFinanceApp from './apps/finance/SimpleFinanceApp'
import FoodApp from './apps/food/FoodApp'
import CalendarApp from './apps/calendar/CalendarApp'
import InvoiceApp from './apps/invoices/InvoiceApp'
import ProductivityApp from './apps/productivity/ProductivityApp'
import AdminPanel from './pages/AdminPanel'
import AuthorizedUsersPage from './apps/admin/AuthorizedUsersPage'
import AllowedUsersSettings from './pages/AllowedUsersSettings'
import TempDeletePage from './pages/TempDeletePage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
import OAuthCallback from './pages/OAuthCallback'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/productivity" element={<ProductivityApp />} />
      <Route path="/finance" element={<SimpleFinanceApp />} />
      <Route path="/food" element={<FoodApp />} />
      <Route path="/calendar" element={<CalendarApp />} />
      <Route path="/invoices/*" element={<InvoiceApp />} />
      <Route path="/auth/google/callback" element={<OAuthCallback />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/admin/users" element={<AuthorizedUsersPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/users" element={<AllowedUsersSettings />} />
      <Route path="/temp-delete" element={<TempDeletePage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}
