import { Link } from 'react-router-dom'
import Brand from '../components/Brand'

export default function NotFound() {
  return (
    <div className="auth__panel" style={{ minHeight: '100vh' }}>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <Brand />
        <h1 style={{ marginTop: 18 }}>Halaman tidak ditemukan</h1>
        <p className="hint">Tautan ini tidak membawa ke layar Aether Leave yang valid.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
          <Link to="/" className="btn btn-outline">
            Beranda
          </Link>
          <Link to="/app" className="btn btn-primary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
