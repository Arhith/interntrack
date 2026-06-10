import { useState } from 'react'
import api from '../lib/api'

const STATUS_MAP = {
  'todo': { label: 'To do', cls: 'tag-todo' },
  'in-progress': { label: 'In progress', cls: 'tag-in-progress' },
  'in-review': { label: 'In review', cls: 'tag-in-review' },
  'done': { label: 'Done', cls: 'tag-done' },
  'blocked': { label: 'Blocked', cls: 'tag-blocked' },
}

export function StatusTag({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP['todo']
  return <span className={`tag ${s.cls}`}>{s.label}</span>
}

export function Avatar({ name = '', size = 32, index = 0 }) {
  const initials = name.split(' ').slice(0,2).map(w => w[0]?.toUpperCase()).join('')
  return (
    <div className={`avatar av-${index % 6}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  )
}

export function ProgressBar({ value = 0 }) {
  const cls = value >= 75 ? 'green' : value >= 40 ? '' : 'amber'
  return (
    <div className="progress-bar">
      <div className={`progress-fill ${cls}`} style={{ width: `${value}%` }} />
    </div>
  )
}

export function DeptBadge({ dept }) {
  return <span className={`dept-badge dept-${dept}`}>{dept}</span>
}

export function TaskRow({ task, onClick }) {
  return (
    <div onClick={() => onClick(task)} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ flex:1 }}>
        <div className="flex gap-2" style={{ marginBottom:4 }}>
          <span style={{ fontWeight:500, fontSize:13 }}>{task.title}</span>
          {task.is_group && <span className="tag" style={{ background:'#eef1fd', color:'#3b4fbd' }}>Group</span>}
        </div>
        <div className="flex gap-2">
          <DeptBadge dept={task.department} />
          {task.due_date && <span style={{ fontSize:11, color:'var(--text2)' }}>Due {task.due_date}</span>}
          <div className="flex gap-2">
            {task.assignees?.slice(0,3).map((a,i) => (
              <Avatar key={a.id} name={a.name} size={18} index={i} />
            ))}
          </div>
        </div>
      </div>
      <StatusTag status={task.status} />
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width:560, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>
        <div className="flex sb" style={{ marginBottom:'1.25rem' }}>
          <span style={{ fontWeight:600, fontSize:16 }}>{title}</span>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function TaskModal({ task, onClose, onUpdate, currentUser }) {
  const [status, setStatus] = useState(task.status)
  const [progress, setProgress] = useState(task.progress)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [saving, setSaving] = useState(false)
  const canEditStatus = currentUser.role !== 'intern'

  useState(() => {
    api.get(`/tasks/${task.id}/comments`).then(r => setComments(r.data)).catch(() => {})
  })

  const save = async () => {
    setSaving(true)
    try {
      const payload = { progress }
      if (canEditStatus) payload.status = status
      await api.patch(`/tasks/${task.id}`, payload)
      onUpdate()
      onClose()
    } finally { setSaving(false) }
  }

  const postComment = async () => {
    if (!comment.trim()) return
    const r = await api.post(`/tasks/${task.id}/comments`, { content: comment })
    setComments(prev => [...prev, r.data])
    setComment('')
  }

  return (
    <Modal title={task.title} onClose={onClose}>
      <div className="flex gap-2" style={{ flexWrap:'wrap', marginBottom:'1rem' }}>
        <StatusTag status={task.status} />
        <DeptBadge dept={task.department} />
        {task.is_group && <span className="tag" style={{ background:'#eef1fd', color:'#3b4fbd' }}>Group task</span>}
        <span style={{ fontSize:12, color:'var(--text2)' }}>Priority: <b>{task.priority}</b></span>
      </div>

      {task.due_date && <p style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>📅 Due {task.due_date}</p>}

      <div style={{ marginBottom:'1rem' }}>
        <div className="flex sb" style={{ marginBottom:4 }}>
          <span style={{ fontSize:12, color:'var(--text2)' }}>Progress</span>
          <span style={{ fontSize:12, fontWeight:500 }}>{progress}%</span>
        </div>
        <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(+e.target.value)}
          style={{ width:'100%' }} />
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <p style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>Assigned to</p>
        <div className="flex gap-2">
          {task.assignees?.map((a, i) => (
            <div key={a.id} className="flex gap-2">
              <Avatar name={a.name} size={24} index={i} />
              <span style={{ fontSize:13 }}>{a.name}</span>
            </div>
          ))}
        </div>
      </div>

      {task.requirements && (
        <div style={{ marginBottom:'1rem' }}>
          <p style={{ fontSize:12, fontWeight:500, color:'var(--text2)', marginBottom:4 }}>Requirements & resources</p>
          <div style={{ background:'var(--bg)', borderRadius:'var(--radius)', padding:'10px 12px', fontSize:12, whiteSpace:'pre-wrap', lineHeight:1.7 }}>
            {task.requirements}
          </div>
        </div>
      )}

      {task.notes && (
        <div style={{ marginBottom:'1rem' }}>
          <p style={{ fontSize:12, fontWeight:500, color:'var(--text2)', marginBottom:4 }}>Notes</p>
          <div style={{ background:'var(--bg)', borderRadius:'var(--radius)', padding:'10px 12px', fontSize:12, lineHeight:1.7 }}>
            {task.notes}
          </div>
        </div>
      )}

      {canEditStatus && (
        <div className="form-row">
          <label className="form-label">Update status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      )}

      <div style={{ marginBottom:'1rem' }}>
        <p style={{ fontSize:12, fontWeight:500, color:'var(--text2)', marginBottom:8 }}>Comments ({comments.length})</p>
        <div style={{ maxHeight:160, overflowY:'auto', marginBottom:8 }}>
          {comments.map(c => (
            <div key={c.id} style={{ marginBottom:8, padding:'8px 10px', background:'var(--bg)', borderRadius:'var(--radius)' }}>
              <div className="flex gap-2" style={{ marginBottom:2 }}>
                <Avatar name={c.user?.name} size={18} index={c.user?.id % 6} />
                <span style={{ fontSize:12, fontWeight:500 }}>{c.user?.name}</span>
                <span style={{ fontSize:11, color:'var(--text3)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize:13, paddingLeft:26 }}>{c.content}</p>
            </div>
          ))}
          {!comments.length && <p style={{ fontSize:12, color:'var(--text3)' }}>No comments yet.</p>}
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Add a comment…" value={comment} onChange={e => setComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && postComment()} style={{ flex:1 }} />
          <button className="btn btn-sm btn-primary" onClick={postComment}>Post</button>
        </div>
      </div>

      <div className="flex gap-2" style={{ justifyContent:'flex-end' }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </Modal>
  )
}
