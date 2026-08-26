import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
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

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      await login(form.email, form.password)
      push('Selamat datang kembali di Employee Leave')
      navigate('/app')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth">
      <section
        className="auth__showcase"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 40,
        }}
      >
        <div style={{ width: '100%', maxWidth: 460 }}>
          <Logo size={40} showText textColor="#fff" />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.12)',
            width: 'fit-content',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.3,
            alignSelf: 'center',
            marginRight: 'auto',
            marginLeft: 'calc(50% - 230px)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#fff',
              display: 'inline-block',
            }}
          />
          Workspace Cuti Karyawan
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 460 }}>
          <h2 style={{ margin: 0 }}>
            Sistem Pengelolaan Cuti Karyawan
          </h2>
          <p style={{ margin: 0 }}>
            Mengintegrasikan seluruh proses cuti karyawan — pengajuan, persetujuan, hingga pelacakan kuota — dalam satu platform terpusat.
          </p>
        </div>
      </section>

      <section className="auth__panel">
        <div className="auth-card">
          <Logo size={40} showText />
          <h1>Masuk  Sistem</h1>
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