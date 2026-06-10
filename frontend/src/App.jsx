import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import NewTask from './pages/NewTask'
import { Team, Departments, Report, NewUser } from './pages/OtherPages'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text2)' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function RoleRoute({ children, roles }) {
  const { user } = useAuth()
  if (!roles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/tasks" element={<RequireAuth><Tasks /></RequireAuth>} />
          <Route path="/tasks/new" element={<RequireAuth><RoleRoute roles={['mentor','manager']}><NewTask /></RoleRoute></RequireAuth>} />
          <Route path="/team" element={<RequireAuth><RoleRoute roles={['mentor','manager']}><Team /></RoleRoute></RequireAuth>} />
          <Route path="/departments" element={<RequireAuth><RoleRoute roles={['manager']}><Departments /></RoleRoute></RequireAuth>} />
          <Route path="/report" element={<RequireAuth><RoleRoute roles={['manager','mentor']}><Report /></RoleRoute></RequireAuth>} />
          <Route path="/users/new" element={<RequireAuth><RoleRoute roles={['manager']}><NewUser /></RoleRoute></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
