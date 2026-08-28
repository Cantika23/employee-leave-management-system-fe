import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const { register } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: 'Technology',
    password: '',
  })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      await register(form)
      push('Akun berhasil dibuat. Selamat datang di Employee Leave.')
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
          {/* Header register di tengah */}
          <div className="auth-header"
               style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Logo size={40} showText />
            <h1 style={{ marginTop: 12 }}>Buat Akun</h1>
            <p className="hint">Lengkapi data singkat untuk masuk ke dashboard.</p>
          </div>

          {/* Form register */}
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="name">Nama lengkap</label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama Anda"
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email kantor</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nina.v@example.com"
              />
            </div>
            <div className="field">
              <label htmlFor="department">Departemen</label>
              <select
                id="department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              >
                <option>Technology</option>
                <option>People & Culture</option>
                <option>Finance</option>
                <option>Sales</option>
                <option>Operations</option>
                <option>Product</option>
              </select>
            </div>
            <div className="field password-field">
              <label htmlFor="password">Kata sandi</label>
              <div className="password-wrapper" style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
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
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary btn-block" type="submit">
              Lanjutkan ke dashboard
            </button>
          </form>

          <p className="auth-foot">
            Sudah punya akun? <Link to="/login">Masuk</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
