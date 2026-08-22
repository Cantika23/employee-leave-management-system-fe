import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
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

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      await register(form)
      push('Akun berhasil dibuat. Selamat datang di Aether Leave.')
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
          <h2>Bergabung dengan workspace cuti yang rapi sejak hari pertama.</h2>
          <p>Buat akun, lihat sisa kuota, dan ajukan cuti tanpa menunggu spreadsheet beredar.</p>
        </div>
        <div className="auth-stats">
          <div>
            <strong>Cepat</strong>
            onboarding 2 menit
          </div>
          <div>
            <strong>Aman</strong>
            peran terkontrol
          </div>
          <div>
            <strong>Jelas</strong>
            status selalu terlihat
          </div>
        </div>
      </section>
      <section className="auth__panel">
        <div className="auth-card">
          <Brand />
          <h1>Buat akun</h1>
          <p className="hint">Lengkapi data singkat untuk masuk ke dashboard.</p>
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
            <div className="field">
              <label htmlFor="password">Kata sandi</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
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
