import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { DEMO_ACCOUNTS } from '../data/mock'

export default function Login() {
  const { login } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [error, setError] = useState('')

  function fill(account) {
    setForm((prev) => ({ ...prev, email: account.email, password: account.password }))
    setError('')
  }

  function onSubmit(event) {
    event.preventDefault()
    try {
      login(form.email, form.password)
      push('Selamat datang kembali di Aether Leave')
      navigate('/app')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth">
      <section className="auth__showcase">
        <Brand invert />
        <div>
          <h2>Satu pintu masuk untuk seluruh ritme cuti perusahaan.</h2>
          <p>
            Pantau kuota, persetujuan, dan kalender tim dalam workspace yang tenang, presisi, dan
            nyaman digunakan setiap hari.
          </p>
        </div>
        <div className="auth-stats">
          <div>
            <strong>98%</strong>
            pengajuan tuntas
          </div>
          <div>
            <strong>1.2 hari</strong>
            rata-rata tinjauan
          </div>
          <div>
            <strong>0</strong>
            spreadsheet terpisah
          </div>
        </div>
      </section>

      <section className="auth__panel">
        <div className="auth-card">
          <Brand />
          <h1>Masuk ke workspace</h1>
          <p className="hint">Gunakan akun korporat Anda untuk melanjutkan.</p>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="yuki.t@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Kata sandi</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="auth-row">
              <label className="check">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                />
                Ingat perangkat ini
              </label>
              <span className="hint">Lupa sandi? Hubungi HR</span>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary btn-block" type="submit">
              Masuk
            </button>
          </form>
          <div className="demo-box">
            Akun demo · sandi <b>aether123</b>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {DEMO_ACCOUNTS.map((account) => (
                <button key={account.email} type="button" onClick={() => fill(account)}>
                  {account.role.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <p className="auth-foot">
            Belum punya akses? <Link to="/register">Buat akun karyawan</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
