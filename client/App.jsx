import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './context/StoreProvider'
import { useStore } from './context/store'
import RequireRole from './components/RequireRole'
import Toasts from './components/Toasts'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

import StudentDashboard from './pages/student/StudentDashboard'
import MyBelongings from './pages/student/MyBelongings'
import NewRequest from './pages/student/NewRequest'
import MyRequests from './pages/student/MyRequests'

import GuardDashboard from './pages/guard/GuardDashboard'
import RecordEntry from './pages/guard/RecordEntry'
import VerifyExit from './pages/guard/VerifyExit'

import ProctorDashboard from './pages/proctor/ProctorDashboard'

import ManageUsers from './pages/admin/ManageUsers'
import AllBelongings from './pages/admin/AllBelongings'

import GateRecords from './pages/shared/GateRecords'
import RequestsBrowser from './pages/shared/RequestsBrowser'

function Home() {
  const { currentUser } = useStore()
  return <Navigate to={currentUser ? `/${currentUser.role}` : '/login'} replace />
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route path="/student" element={<RequireRole role="student" />}>
            <Route index element={<Navigate to="belongings" replace />} />
            <Route path="belongings" element={<MyBelongings />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="requests" element={<MyRequests />} />
            <Route path="requests/new" element={<NewRequest />} />
          </Route>

          <Route path="/guard" element={<RequireRole role="guard" />}>
            <Route index element={<Navigate to="belongings" replace />} />
            <Route path="belongings" element={<RecordEntry />} />
            <Route path="dashboard" element={<GuardDashboard />} />
            <Route path="exit" element={<VerifyExit />} />
            <Route path="logs" element={<GateRecords title="Gate Log" />} />
          </Route>

          <Route path="/proctor" element={<RequireRole role="proctor" />}>
            <Route index element={<ProctorDashboard />} />
            <Route path="requests" element={<RequestsBrowser canReview />} />
          </Route>

          <Route path="/admin" element={<RequireRole role="admin" />}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="requests" element={<RequestsBrowser />} />
            <Route path="records" element={<GateRecords title="Gate Records" />} />
            <Route path="belongings" element={<AllBelongings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toasts />
    </StoreProvider>
  )
}
