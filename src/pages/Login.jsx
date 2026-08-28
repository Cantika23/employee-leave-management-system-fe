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
  const [showPassword, setShowPassword] = useState(false)

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
      {/* Showcase kiri */}
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

      {/* Panel kanan */}
      <section className="auth__panel">
        <div className="auth-card">
          {/* Header login di tengah */}
          <div className="auth-header"
               style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Logo size={40} showText />
            <h1 style={{ marginTop: 12 }}>Masuk Sistem</h1>
            <p className="hint">Gunakan akun korporat Anda untuk melanjutkan.</p>
          </div>

          {/* Form login */}
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
            <div className="field password-field">
              <label htmlFor="password">Kata sandi</label>
              <div className="password-wrapper" style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#888', // abu-abu
                  }}
                >
                  {showPassword ? (
                    // Eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5.52 0-10-4.48-10-10 0-2.21.72-4.25 1.94-5.94M6.1 6.1A10.94 10.94 0 0 1 12 4c5.52 0 10 4.48 10 10 0 2.21-.72 4.25-1.94 5.94M1 1l22 22" />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
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
