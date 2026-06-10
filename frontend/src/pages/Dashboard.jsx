import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import api from '../lib/api'
import { TaskRow, TaskModal, Avatar, ProgressBar } from '../components/UI'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)

  const load = async () => {
    const [d, t, u] = await Promise.all([
      api.get('/dashboard'), api.get('/tasks'), api.get('/users')
    ])
    setStats(d.data); setTasks(t.data); setUsers(u.data)
  }

  useEffect(() => { load() }, [])

  const interns = users.filter(u => u.role === 'intern')
  const myInterns = user.role === 'mentor' ? interns.filter(i => i.mentor_id === user.id) : interns
  const recentTasks = tasks.slice(0, 5)

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>
        {user.role === 'intern' ? 'My dashboard' : 'Dashboard'}
      </h1>
      <p style={{ color:'var(--text2)', marginBottom:'1.5rem', fontSize:13 }}>
        {user.role === 'manager' ? 'All departments overview' :
         user.role === 'mentor' ? `${user.department} · ${myInterns.length} interns` :
         `${user.department} intern`}
      </p>

      {stats && (
        <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
          <div className="metric"><div className="metric-label">Total tasks</div><div className="metric-val">{stats.total_tasks}</div></div>
          <div className="metric"><div className="metric-label">Completed</div><div className="metric-val" style={{ color:'var(--success)' }}>{stats.done}</div></div>
          <div className="metric"><div className="metric-label">{user.role === 'intern' ? 'Group tasks' : 'Blocked'}</div>
            <div className="metric-val" style={{ color: user.role !== 'intern' ? 'var(--danger)' : 'inherit' }}>
              {user.role === 'intern' ? stats.group_tasks : stats.blocked}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">{user.role === 'intern' ? 'My progress' : user.role === 'manager' ? 'Interns' : 'In progress'}</div>
            <div className="metric-val">{user.role === 'intern' ? `${stats.overall_progress}%` : user.role === 'manager' ? stats.intern_count : stats.in_progress}</div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="flex sb" style={{ marginBottom:12 }}>
            <p style={{ fontWeight:500, fontSize:13, color:'var(--text2)' }}>
              {user.role === 'intern' ? 'My tasks' : 'Recent tasks'}
            </p>
            <a href="/tasks" style={{ fontSize:12, color:'var(--accent)' }}>View all</a>
          </div>
          {recentTasks.length
            ? recentTasks.map(t => <TaskRow key={t.id} task={t} onClick={setSelected} />)
            : <p className="empty">No tasks yet.</p>}
        </div>

        {user.role !== 'intern' && (
          <div className="card">
            <p style={{ fontWeight:500, fontSize:13, color:'var(--text2)', marginBottom:12 }}>
              {user.role === 'manager' ? 'All interns' : 'My interns'}
            </p>
            {myInterns.length ? myInterns.map((intern, idx) => {
              const internTasks = tasks.filter(t => t.assignees?.some(a => a.id === intern.id))
              const done = internTasks.filter(t => t.status === 'done').length
              const avg = internTasks.length ? Math.round(internTasks.reduce((s,t) => s + t.progress, 0) / internTasks.length) : 0
              return (
                <div key={intern.id} style={{ marginBottom:12 }}>
                  <div className="flex sb" style={{ marginBottom:4 }}>
                    <div className="flex gap-2">
                      <Avatar name={intern.name} size={26} index={idx} />
                      <div>
                        <p style={{ fontSize:13, fontWeight:500 }}>{intern.name}</p>
                        <p style={{ fontSize:11, color:'var(--text2)' }}>{done}/{internTasks.length} tasks done</p>
                      </div>
                    </div>
                    <span style={{ fontSize:12, fontWeight:500 }}>{avg}%</span>
                  </div>
                  <ProgressBar value={avg} />
                </div>
              )
            }) : <p className="empty">No interns assigned.</p>}
          </div>
        )}

        {user.role === 'manager' && stats?.dept_stats && (
          <div className="card">
            <p style={{ fontWeight:500, fontSize:13, color:'var(--text2)', marginBottom:12 }}>By department</p>
            {Object.entries(stats.dept_stats).map(([dept, s]) => (
              <div key={dept} className="flex sb" style={{ padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                <span className={`dept-badge dept-${dept}`}>{dept}</span>
                <span style={{ fontSize:12, color:'var(--text2)' }}>{s.done}/{s.total} done</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <TaskModal task={selected} onClose={() => setSelected(null)} onUpdate={load} currentUser={user} />}
    </div>
  )
}
