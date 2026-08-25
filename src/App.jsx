import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppShell from './components/layout/AppShell'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
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

function ByRole({ employee, manager, hr }) {
  const { user } = useAuth()
  if (user.role === 'employee') return employee ?? null
  if (user.role === 'manager') return manager ?? null
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
      <Route
        path="/register"
        element={
          <GuestOnly>
            <Register />
          </GuestOnly>
        }
      />
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
          element={<ByRole employee={<EmployeeDashboard />} manager={<ManagerDashboard />} hr={<HrDashboard />} />}
        />
        <Route
          path="leave/apply"
          element={<ByRole employee={<EmployeeLeaveApply />} manager={<ManagerLeaveApply />} hr={<HrLeaveApply />} />}
        />
        <Route
          path="leave/history"
          element={
            <ByRole employee={<EmployeeLeaveHistory />} manager={<ManagerLeaveHistory />} hr={<HrLeaveHistory />} />
          }
        />
        
        <Route path="approvals" element={<ByRole manager={<ManagerApprovals />} hr={<HrApprovals />} />} />
        <Route path="approvals/:id" element={<ByRole manager={<ManagerApprovalDetail />} />} />
        <Route path="employees" element={<HrEmployees />} />
        <Route path="reports" element={<ByRole manager={<ManagerReports />} hr={<HrReports />} />} />
        <Route path="settings" element={<ByRole manager={<ManagerSettings />} hr={<HrSettings />} />} />
        <Route
          path="profile"
          element={<ByRole employee={<EmployeeProfile />} manager={<ManagerProfile />} hr={<HrProfile />} />}
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
