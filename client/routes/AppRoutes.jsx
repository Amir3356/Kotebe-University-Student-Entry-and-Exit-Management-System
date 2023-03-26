import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from '../context/store'
import ProtectedRoute from './ProtectedRoute'
import Login from '../pages/Login'
import NotFound from '../pages/NotFound'

// Student pages
import StudentDashboard from '../pages/student/StudentDashboard'
import MyBelongings from '../pages/student/MyBelongings'
import NewRequest from '../pages/student/NewRequest'
import MyRequests from '../pages/student/MyRequests'

// Guard pages
import GuardDashboard from '../pages/guard/GuardDashboard'
import RecordEntry from '../pages/guard/RecordEntry'
import VerifyExit from '../pages/guard/VerifyExit'
import GuardAudit from '../pages/guard/GuardAudit'
import GateRecords from '../pages/shared/GateRecords'

// Proctor pages
import ProctorDashboard from '../pages/proctor/ProctorDashboard'
import StudentLeaveRequests from '../pages/proctor/StudentLeaveRequests'
import AccountProvision from '../pages/proctor/AccountProvision'

function Home() {
  const { currentUser } = useStore()
  return <Navigate to={currentUser ? `/${currentUser.role}` : '/login'} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Student Portal */}
      <Route path="/student" element={<ProtectedRoute role="student" />}>
        <Route index element={<Navigate to="belongings" replace />} />
        <Route path="belongings" element={<MyBelongings />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="requests/new" element={<NewRequest />} />
      </Route>

      {/* Guard Portal */}
      <Route path="/guard" element={<ProtectedRoute role="guard" />}>
        <Route index element={<Navigate to="belongings" replace />} />
        <Route path="belongings" element={<RecordEntry />} />
        <Route path="audit" element={<GuardAudit />} />
        <Route path="dashboard" element={<GuardDashboard />} />
        <Route path="exit" element={<VerifyExit />} />
        <Route path="logs" element={<GateRecords title="Gate Log" />} />
      </Route>

      {/* Proctor Portal */}
      <Route path="/proctor" element={<ProtectedRoute role="proctor" />}>
        <Route index element={<Navigate to="requests" replace />} />
        <Route path="requests" element={<StudentLeaveRequests />} />
        <Route path="users" element={<AccountProvision />} />
        <Route path="dashboard" element={<ProctorDashboard />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
