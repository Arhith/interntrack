import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import api from '../lib/api'
import { TaskRow, TaskModal } from '../components/UI'

const STATUSES = ['all', 'todo', 'in-progress', 'in-review', 'done', 'blocked']
const STATUS_LABELS = { all:'All', todo:'To do', 'in-progress':'In progress', 'in-review':'In review', done:'Done', blocked:'Blocked' }

export default function Tasks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/tasks'); setTasks(r.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div>
      <div className="flex sb" style={{ marginBottom:4 }}>
        <h1 style={{ fontSize:20, fontWeight:600 }}>
          {user.role === 'manager' ? 'All tasks' : 'My tasks'}
        </h1>
        {user.role !== 'intern' && (
          <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
            + Assign task
          </button>
        )}
      </div>
      <p style={{ color:'var(--text2)', fontSize:13, marginBottom:'1.25rem' }}>{filtered.length} tasks</p>

      <div style={{ display:'flex', gap:4, marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="btn btn-sm"
            style={{ background: filter === s ? 'var(--accent)' : 'var(--bg2)', color: filter === s ? '#fff' : 'var(--text2)', borderColor: filter === s ? 'var(--accent)' : 'var(--border)' }}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? <p className="empty">Loading…</p>
          : filtered.length ? filtered.map(t => <TaskRow key={t.id} task={t} onClick={setSelected} />)
          : <p className="empty">No tasks found.</p>}
      </div>

      {selected && <TaskModal task={selected} onClose={() => setSelected(null)} onUpdate={load} currentUser={user} />}
    </div>
  )
}
