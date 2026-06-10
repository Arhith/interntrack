import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import api from '../lib/api'
import { Avatar, ProgressBar, TaskRow, TaskModal, DeptBadge } from '../components/UI'

// ─── Team Page ────────────────────────────────────────────────────────────────
export function Team() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  useEffect(() => {
    Promise.all([api.get('/users'), api.get('/tasks')]).then(([u,t]) => { setUsers(u.data); setTasks(t.data) })
  }, [])
  const interns = users.filter(u => u.role === 'intern' && (user.role === 'manager' || u.mentor_id === user.id))

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>{user.role === 'manager' ? 'All team members' : 'My interns'}</h1>
      <p style={{ color:'var(--text2)', fontSize:13, marginBottom:'1.5rem' }}>{interns.length} interns</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
        {interns.map((intern, idx) => {
          const myTasks = tasks.filter(t => t.assignees?.some(a => a.id === intern.id))
          const done = myTasks.filter(t => t.status === 'done').length
          const avg = myTasks.length ? Math.round(myTasks.reduce((s,t)=>s+t.progress,0)/myTasks.length) : 0
          const mentor = users.find(u => u.id === intern.mentor_id)
          return (
            <div key={intern.id} className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div className="flex gap-2">
                <Avatar name={intern.name} size={36} index={idx} />
                <div>
                  <p style={{ fontWeight:500 }}>{intern.name}</p>
                  <DeptBadge dept={intern.department} />
                </div>
              </div>
              <div>
                <div className="flex sb" style={{ marginBottom:4 }}>
                  <span style={{ fontSize:11, color:'var(--text2)' }}>Progress</span>
                  <span style={{ fontSize:11, fontWeight:500 }}>{avg}%</span>
                </div>
                <ProgressBar value={avg} />
              </div>
              <div className="flex sb" style={{ fontSize:11, color:'var(--text2)' }}>
                <span>{done}/{myTasks.length} tasks</span>
                {mentor && <span>Mentor: {mentor.name.split(' ')[0]}</span>}
              </div>
            </div>
          )
        })}
        {!interns.length && <p className="empty">No interns found.</p>}
      </div>
    </div>
  )
}

// ─── Departments Page ─────────────────────────────────────────────────────────
export function Departments() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)
  const load = async () => {
    const [t,u] = await Promise.all([api.get('/tasks'), api.get('/users')])
    setTasks(t.data); setUsers(u.data)
  }
  useEffect(() => { load() }, [])
  const depts = [...new Set(tasks.map(t => t.department))]

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>Departments</h1>
      <p style={{ color:'var(--text2)', fontSize:13, marginBottom:'1.5rem' }}>Tasks by department</p>
      {depts.map(dept => {
        const dt = tasks.filter(t => t.department === dept)
        const di = users.filter(u => u.role === 'intern' && u.department === dept)
        const done = dt.filter(t => t.status === 'done').length
        return (
          <div key={dept} className="card" style={{ marginBottom:'1rem' }}>
            <div className="flex sb" style={{ marginBottom:12 }}>
              <div className="flex gap-2">
                <DeptBadge dept={dept} />
                <span style={{ fontSize:12, color:'var(--text2)' }}>{di.length} interns · {done}/{dt.length} done</span>
              </div>
              <div className="flex gap-2">
                {di.slice(0,4).map((i,idx) => <Avatar key={i.id} name={i.name} size={24} index={idx} />)}
              </div>
            </div>
            {dt.map(t => <TaskRow key={t.id} task={t} onClick={setSelected} />)}
          </div>
        )
      })}
      {selected && <TaskModal task={selected} onClose={() => setSelected(null)} onUpdate={load} currentUser={user} />}
    </div>
  )
}

// ─── Weekly Report Page ───────────────────────────────────────────────────────
export function Report() {
  const [report, setReport] = useState(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => { api.get('/report/weekly').then(r => setReport(r.data)) }, [])

  const emailText = report ? `Weekly Intern Progress Report\nGenerated: ${new Date(report.generated_at).toLocaleString()}\n\n` +
    report.data.map(r => `${r.intern.name} (${r.intern.department})\nMentor: ${r.mentor}\nProgress: ${r.avg_progress}% | ${r.done}/${r.total_tasks} tasks done${r.blocked_tasks.length ? `\n⚠ Blocked: ${r.blocked_tasks.join(', ')}` : ' ✓ No blockers'}\n`).join('\n')
    + `\nSummary: ${report.data.length} interns, avg ${Math.round(report.data.reduce((s,r)=>s+r.avg_progress,0)/Math.max(report.data.length,1))}% progress` : ''

  const copy = () => { navigator.clipboard.writeText(emailText); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>Weekly report</h1>
      <p style={{ color:'var(--text2)', fontSize:13, marginBottom:'1.5rem' }}>Auto-generated every Friday at 5 PM</p>

      <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:'1.25rem', fontSize:12, color:'#166534', display:'flex', gap:8 }}>
        📅 Next scheduled send: Friday at 5:00 PM · Configure recipients in Settings
      </div>

      {report && (
        <>
          <div className="card" style={{ marginBottom:'1rem' }}>
            <div className="flex sb" style={{ marginBottom:12 }}>
              <p style={{ fontWeight:500, fontSize:13, color:'var(--text2)' }}>Intern summaries</p>
              <button className="btn btn-sm btn-primary" onClick={copy}>{copied ? '✓ Copied!' : 'Copy email'}</button>
            </div>
            {report.data.map((r, idx) => (
              <div key={r.intern.id} style={{ padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <div className="flex sb" style={{ marginBottom:6 }}>
                  <div className="flex gap-2">
                    <Avatar name={r.intern.name} size={28} index={idx} />
                    <div>
                      <p style={{ fontWeight:500, fontSize:13 }}>{r.intern.name}</p>
                      <p style={{ fontSize:11, color:'var(--text2)' }}>{r.intern.department} · Mentor: {r.mentor}</p>
                    </div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600 }}>{r.avg_progress}%</span>
                </div>
                <ProgressBar value={r.avg_progress} />
                <div className="flex gap-2" style={{ marginTop:6, fontSize:11, color:'var(--text2)' }}>
                  <span>{r.done}/{r.total_tasks} done</span>
                  <span>·</span>
                  <span>{r.in_progress} in progress</span>
                  {r.blocked_tasks.length > 0 && <><span>·</span><span style={{ color:'var(--danger)' }}>⚠ {r.blocked_tasks.join(', ')}</span></>}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <p style={{ fontWeight:500, fontSize:13, color:'var(--text2)', marginBottom:12 }}>Email preview</p>
            <pre style={{ background:'var(--bg)', borderRadius:'var(--radius)', padding:'1rem', fontSize:12, lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'monospace' }}>
              {emailText}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}

// ─── New User Page ────────────────────────────────────────────────────────────
export function NewUser() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name:'', email:'', password:'password123', role:'intern', department:'Engineering', mentor_id:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const DEPTS = ['Engineering', 'Design', 'Data', 'Marketing', 'Operations']

  useEffect(() => { api.get('/users').then(r => setUsers(r.data)) }, [])
  const mentors = users.filter(u => u.role === 'mentor')

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.post('/users', { ...form, mentor_id: form.mentor_id ? +form.mentor_id : null })
      navigate('/team')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth:480 }}>
      <h1 style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>Add user</h1>
      <p style={{ color:'var(--text2)', fontSize:13, marginBottom:'1.5rem' }}>Create a new manager, mentor, or intern account</p>
      <div className="card">
        <form onSubmit={submit}>
          <div className="form-row"><label className="form-label">Full name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required /></div>
          <div className="form-row"><label className="form-label">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required /></div>
          <div className="form-row"><label className="form-label">Password *</label>
            <input type="text" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required /></div>
          <div className="grid-2">
            <div className="form-row"><label className="form-label">Role *</label>
              <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                <option value="intern">Intern</option>
                <option value="mentor">Mentor</option>
                <option value="manager">Manager</option>
              </select></div>
            <div className="form-row"><label className="form-label">Department *</label>
              <select value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))}>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                <option value="All">All</option>
              </select></div>
          </div>
          {form.role === 'intern' && (
            <div className="form-row"><label className="form-label">Assign mentor</label>
              <select value={form.mentor_id} onChange={e => setForm(f=>({...f,mentor_id:e.target.value}))}>
                <option value="">None</option>
                {mentors.map(m => <option key={m.id} value={m.id}>{m.name} ({m.department})</option>)}
              </select></div>
          )}
          {error && <p style={{ color:'var(--danger)', fontSize:13, marginBottom:12 }}>{error}</p>}
          <div className="flex gap-2" style={{ justifyContent:'flex-end' }}>
            <button type="button" className="btn" onClick={() => navigate('/team')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create user'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
