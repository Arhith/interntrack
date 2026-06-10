import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import api from '../lib/api'

const DEPTS = ['Engineering', 'Design', 'Data', 'Marketing', 'Operations']

export default function NewTask() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ title:'', department: user.department === 'All' ? '' : user.department, priority:'medium', due_date:'', requirements:'', notes:'', assignee_ids:[] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { api.get('/users').then(r => setUsers(r.data)) }, [])

  const interns = users.filter(u => u.role === 'intern' && (user.role === 'manager' || u.mentor_id === user.id))

  const toggleAssignee = (id) => {
    setForm(f => ({ ...f, assignee_ids: f.assignee_ids.includes(id) ? f.assignee_ids.filter(x => x !== id) : [...f.assignee_ids, id] }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.assignee_ids.length) { setError('Select at least one intern.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/tasks', form)
      navigate('/tasks')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth:580 }}>
      <h1 style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>Assign task</h1>
      <p style={{ color:'var(--text2)', fontSize:13, marginBottom:'1.5rem' }}>Create and assign a task to one or more interns</p>

      <div className="card">
        <form onSubmit={submit}>
          <div className="form-row">
            <label className="form-label">Task title *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} placeholder="e.g. Build login flow" required />
          </div>

          <div className="grid-2">
            <div className="form-row">
              <label className="form-label">Department *</label>
              <select value={form.department} onChange={e => setForm(f => ({...f, department:e.target.value}))} required>
                <option value="">Select…</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({...f, priority:e.target.value}))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Due date</label>
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date:e.target.value}))} />
          </div>

          <div className="form-row">
            <label className="form-label">Assign to interns * {form.assignee_ids.length > 1 && <span style={{ color:'var(--accent)', fontWeight:500 }}>→ Group task</span>}</label>
            <div style={{ border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:10, display:'flex', flexDirection:'column', gap:6 }}>
              {interns.length ? interns.map((intern, idx) => (
                <label key={intern.id} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                  <input type="checkbox" checked={form.assignee_ids.includes(intern.id)} onChange={() => toggleAssignee(intern.id)} />
                  <span style={{ width:22, height:22, borderRadius:'50%', background:'#eef1fd', color:'#3b4fbd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:500 }}>
                    {intern.name.split(' ').map(w=>w[0]).join('')}
                  </span>
                  {intern.name}
                  <span style={{ fontSize:11, color:'var(--text2)' }}>({intern.department})</span>
                </label>
              )) : <p style={{ fontSize:12, color:'var(--text3)' }}>No interns available.</p>}
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Requirements & resources</label>
            <textarea value={form.requirements} onChange={e => setForm(f => ({...f, requirements:e.target.value}))}
              placeholder="List access needs, links, tools, datasets, GitHub repos…" />
          </div>

          <div className="form-row">
            <label className="form-label">Notes for interns</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))}
              placeholder="Guidance, context, expectations, acceptance criteria…" />
          </div>

          {error && <p style={{ color:'var(--danger)', fontSize:13, marginBottom:12 }}>{error}</p>}

          <div className="flex gap-2" style={{ justifyContent:'flex-end' }}>
            <button type="button" className="btn" onClick={() => navigate('/tasks')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Assigning…' : 'Assign task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
