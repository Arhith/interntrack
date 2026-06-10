import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const QUICK = [
    { label: 'Manager', email: 'jordan@company.com' },
    { label: 'Mentor (Eng)', email: 'priya@company.com' },
    { label: 'Mentor (Design)', email: 'sam@company.com' },
    { label: 'Intern', email: 'chris@company.com' },
  ]

  const handle = async (e) => {
    e?.preventDefault()
    setLoading(true); setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const quick = async (e) => {
    setEmail(e); setPassword('password123')
    setLoading(true); setError('')
    try {
      await login(e, 'password123')
      navigate('/')
    } catch { setError('Login failed') } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:400 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <span style={{ fontSize:40 }}>🚀</span>
          <h1 style={{ fontSize:24, fontWeight:600, marginTop:8 }}>InternTrack</h1>
          <p style={{ color:'var(--text2)', marginTop:4 }}>Sign in to your account</p>
        </div>

        <div className="card">
          <form onSubmit={handle}>
            <div className="form-row">
              <label className="form-label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="form-row">
              <label className="form-label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p style={{ color:'var(--danger)', fontSize:13, marginBottom:12 }}>{error}</p>}
            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop:'1.5rem', paddingTop:'1.25rem', borderTop:'1px solid var(--border)' }}>
            <p style={{ fontSize:12, color:'var(--text3)', marginBottom:10, textAlign:'center' }}>Quick access (demo)</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {QUICK.map(q => (
                <button key={q.email} className="btn btn-sm" onClick={() => quick(q.email)} style={{ justifyContent:'center' }}>
                  {q.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:8 }}>All passwords: password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
