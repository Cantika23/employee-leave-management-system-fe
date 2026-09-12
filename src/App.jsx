import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppShell from './components/layout/AppShell'
import Landing from './pages/Landing'
import Login from './pages/Login'
import PublicApproval from './pages/PublicApproval'
import NotFound from './pages/NotFound'

import EmployeeDashboard from './pages/employee/Dashboard'
import EmployeeLeaveApply from './pages/employee/LeaveApply'
import EmployeeLeaveHistory from './pages/employee/LeaveHistory'
import EmployeeProfile from './pages/employee/Profile'

import ManagerDashboard from './pages/manager/Dashboard'
import ManagerLeaveApply from './pages/manager/LeaveApply'
import ManagerLeaveHistory from './pages/manager/LeaveHistory'
import ManagerApprovals from './pages/manager/Approvals'
import ManagerApprovalDetail from './pages/manager/ApprovalDetail'
import ManagerReports from './pages/manager/Reports'
import ManagerSettings from './pages/manager/Settings'
import ManagerProfile from './pages/manager/Profile'

import HrDashboard from './pages/hr/Dashboard'
import HrLeaveApply from './pages/hr/LeaveApply'
import HrLeaveHistory from './pages/hr/LeaveHistory'
import HrApprovals from './pages/hr/Approvals'
import HrEmployees from './pages/hr/Employees'
import HrReports from './pages/hr/Reports'
import HrSettings from './pages/hr/Settings'
import HrProfile from './pages/hr/Profile'

import AdminDashboard from './pages/admin/Dashboard'
import AdminLeaveApply from './pages/admin/LeaveApply'
import AdminLeaveHistory from './pages/admin/LeaveHistory'
import AdminApprovals from './pages/admin/Approvals'
import AdminEmployees from './pages/admin/Employees'
import AdminRoles from './pages/admin/Roles'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'
import AdminProfile from './pages/admin/Profile'

function GuestOnly({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/app" replace />
  return children
}

function Protected({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

// employee/manager/hr/admin: setiap role punya folder halamannya
// sendiri di src/pages. Kalau prop untuk role yang sedang login
// tidak diisi di satu route, fallback ke tampilan HR (karena Admin
// adalah superset dari HR+Manager).
function ByRole({ employee, manager, hr, admin }) {
  const { user } = useAuth()
  if (user.role === 'employee') return employee ?? null
  if (user.role === 'manager') return manager ?? null
  if (user.role === 'admin') return admin ?? hr ?? null
  return hr ?? null
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <Login />
          </GuestOnly>
        }
      />
      {/* Halaman publik (tanpa login) yang diklik dari link di email
          notifikasi pengajuan cuti — lihat LeaveRequestSubmitted::toMail(). */}
      <Route path="/public/approval/:token" element={<PublicApproval />} />
      <Route
        path="/app"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route
          index
          element={
            <ByRole
              employee={<EmployeeDashboard />}
              manager={<ManagerDashboard />}
              hr={<HrDashboard />}
              admin={<AdminDashboard />}
            />
          }
        />
        <Route
          path="leave/apply"
          element={
            <ByRole
              employee={<EmployeeLeaveApply />}
              manager={<ManagerLeaveApply />}
              hr={<HrLeaveApply />}
              admin={<AdminLeaveApply />}
            />
          }
        />
        <Route
          path="leave/history"
          element={
            <ByRole
              employee={<EmployeeLeaveHistory />}
              manager={<ManagerLeaveHistory />}
              hr={<HrLeaveHistory />}
              admin={<AdminLeaveHistory />}
            />
          }
        />
        
        <Route
          path="approvals"
          element={<ByRole manager={<ManagerApprovals />} hr={<HrApprovals />} admin={<AdminApprovals />} />}
        />
        <Route path="approvals/:id" element={<ByRole manager={<ManagerApprovalDetail />} />} />
        <Route
          path="employees"
          element={<ByRole manager={<HrEmployees />} hr={<HrEmployees />} admin={<AdminEmployees />} />}
        />
        <Route path="roles" element={<ByRole admin={<AdminRoles />} />} />
        <Route
          path="reports"
          element={<ByRole manager={<ManagerReports />} hr={<HrReports />} admin={<AdminReports />} />}
        />
        <Route
          path="settings"
          element={<ByRole manager={<ManagerSettings />} hr={<HrSettings />} admin={<AdminSettings />} />}
        />
        <Route
          path="profile"
          element={
            <ByRole
              employee={<EmployeeProfile />}
              manager={<ManagerProfile />}
              hr={<HrProfile />}
              admin={<AdminProfile />}
            />
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}