import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import { ProtectedRoute, SaasAdminRoute } from './components/ProtectedRoute'
import { AuthProvider } from './stores/useAuthStore'
import { ClientProvider } from './stores/ClientContext'
import { PetProvider } from './stores/PetContext'
import { ConfigProvider } from './stores/ConfigStore'
import { InventoryProvider } from './stores/InventoryStore'
import { BoardingProvider } from './stores/BoardingStore'
import { AppointmentProvider } from './stores/AppointmentStore'
import { HospitalizationProvider } from './stores/HospitalizationContext'

import NotFound from './pages/NotFound'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ConfirmEmailPage from './pages/auth/ConfirmEmailPage'

const DashboardPage       = lazy(() => import('./pages/dashboard/DashboardPage'))
const ClientsPage         = lazy(() => import('./pages/clients/ClientsPage'))
const ClientProfilePage   = lazy(() => import('./pages/clients/ClientProfilePage'))
const PetsPage            = lazy(() => import('./pages/pets/PetsPage'))
const GroomingPage        = lazy(() => import('./pages/grooming/GroomingPage'))
const ClinicPage          = lazy(() => import('./pages/clinic/ClinicPage'))
const BoardingPage        = lazy(() => import('./pages/boarding/BoardingPage'))
const HospitalizationPage = lazy(() => import('./pages/hospitalization/HospitalizationDashboard'))
const AdminPage           = lazy(() => import('./pages/admin/AdminPage'))
const ServicesPage        = lazy(() => import('./pages/services/ServicesPage'))
const SchedulePage        = lazy(() => import('./pages/schedule/SchedulePage'))
const InventoryPage       = lazy(() => import('./pages/inventory/InventoryPage'))
const SalesPage           = lazy(() => import('./pages/sales/SalesPage'))
const BookingPage         = lazy(() => import('./pages/booking/BookingPage'))
const TasksPage           = lazy(() => import('./pages/tasks/TasksPage'))
const FinancialsPage      = lazy(() => import('./pages/financials/FinancialsPage'))
const MyDataPage          = lazy(() => import('./pages/mydata/MyDataPage'))
const KnowledgePage       = lazy(() => import('./pages/knowledge/KnowledgePage'))
const SaasDashboard       = lazy(() => import('./pages/saas/SaasDashboard'))

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/booking" element={<BookingPage />} />

      {/* SAAS Admin */}
      <Route element={<SaasAdminRoute />}>
        <Route path="/saas" element={<SaasDashboard />} />
      </Route>

      {/* App protegido */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientProfilePage />} />
          <Route path="/pets" element={<PetsPage />} />
          <Route path="/grooming" element={<GroomingPage />} />
          <Route path="/clinic" element={<ClinicPage />} />
          <Route path="/boarding" element={<BoardingPage />} />
          <Route path="/hospitalization" element={<HospitalizationPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/financials" element={<FinancialsPage />} />
          <Route path="/my-data" element={<MyDataPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <ConfigProvider>
        <ClientProvider>
          <PetProvider>
            <InventoryProvider>
              <BoardingProvider>
                <HospitalizationProvider>
                  <AppointmentProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <Suspense fallback={<PageLoader />}>
                        <AppRoutes />
                      </Suspense>
                    </TooltipProvider>
                  </AppointmentProvider>
                </HospitalizationProvider>
              </BoardingProvider>
            </InventoryProvider>
          </PetProvider>
        </ClientProvider>
      </ConfigProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
