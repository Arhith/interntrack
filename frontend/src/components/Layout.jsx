import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Avatar } from './UI'

const NAV = {
  manager: [
    { to: '/', icon: '◈', label: 'Dashboard' },
    { to: '/tasks', icon: '✓', label: 'All tasks' },
    { to: '/departments', icon: '⊞', label: 'Departments' },
    { to: '/team', icon: '⊙', label: 'Team' },
    { to: '/report', icon: '✉', label: 'Weekly report' },
    { to: '/users/new', icon: '+', label: 'Add user' },
  ],
  mentor: [
    { to: '/', icon: '◈', label: 'Dashboard' },
    { to: '/tasks', icon: '✓', label: 'My tasks' },
    { to: '/tasks/new', icon: '+', label: 'Assign task' },
    { to: '/team', icon: '⊙', label: 'My interns' },
  ],
  intern: [
    { to: '/', icon: '◈', label: 'My dashboard' },
    { to: '/tasks', icon: '✓', label: 'My tasks' },
  ],
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = NAV[user?.role] || []

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <aside style={{ width:220, minWidth:220, background:'#fff', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>🚀</span>
          <span style={{ fontWeight:600, fontSize:15 }}>InternTrack</span>
        </div>

        <div style={{ padding:'0.75rem 0.75rem 0.25rem' }}>
          <p style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Signed in as</p>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0 8px 4px' }}>
            <Avatar name={user?.name} size={28} index={user?.id % 6} />
            <div>
              <p style={{ fontSize:13, fontWeight:500 }}>{user?.name}</p>
              <span style={{ fontSize:11, padding:'1px 6px', borderRadius:20, fontWeight:500,
                background: user?.role === 'manager' ? '#eef1fd' : user?.role === 'mentor' ? '#e1f5ee' : '#faeeda',
                color: user?.role === 'manager' ? '#3b4fbd' : user?.role === 'mentor' ? '#0f6e56' : '#854f0b'
              }}>{user?.role}</span>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'4px 0', overflowY:'auto' }}>
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:8, padding:'7px 1rem', fontSize:13,
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                borderRadius:6, margin:'1px 8px', fontWeight: isActive ? 500 : 400, textDecoration:'none',
              })}>
              <span style={{ fontSize:14 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding:'0.75rem', borderTop:'1px solid var(--border)' }}>
          <button className="btn btn-sm" style={{ width:'100%', justifyContent:'center' }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex:1, overflowY:'auto', padding:'1.5rem', background:'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
