import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, UserRound } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { formatDate, greeting, statusLabel } from '../../lib/format'

export default function Dashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])

  useEffect(() => {
    api.get('/team-requests').then((res) => setRequests(res.data)).catch(() => {})
  }, [])

  const pending = requests.filter((r) => r.status === 'pending_manager')
  const approved = requests.filter((r) => r.status === 'approved')
  const rejected = requests.filter((r) => r.status === 'rejected')
  const recentPending = pending.slice(0, 5)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>
            {greeting()}, {user.name.split(' ')[0]}.
          </h1>
          <p>Berikut ringkasan pengajuan cuti tim Anda.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <article className="card kpi">
          <h3>Menunggu Persetujuan</h3>
          <b>{pending.length}</b>
          <span>Pengajuan</span>
        </article>
        <article className="card kpi">
          <h3>Disetujui</h3>
          <b>{approved.length}</b>
          <span>Pengajuan</span>
        </article>
        <article className="card kpi">
          <h3>Ditolak</h3>
          <b>{rejected.length}</b>
          <span>Pengajuan</span>
        </article>
      </div>

      <section className="card panel">
        <div className="panel__head">
          <h2>Pengajuan Menunggu Persetujuan</h2>
          <Link to="/app/approvals" className="hint">
            Lihat Semua
          </Link>
        </div>
        <div className="list-soft">
          {recentPending.map((row) => (
            <Link
              to={`/app/approvals/${row.id}`}
              key={row.id}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <article>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="status-dot status-dot--pending_manager">
                    <UserRound size={16} />
                  </span>
                  <div>
                    <strong>{row.employee}</strong>
                    <div className="hint">
                      {row.type} · {formatDate(row.from)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge badge--${row.status}`}>{statusLabel(row.status)}</span>
                  <ChevronRight size={16} className="hint" />
                </div>
              </article>
            </Link>
          ))}
          {recentPending.length === 0 && <p className="hint">Tidak ada pengajuan yang menunggu.</p>}
        </div>
      </section>
    </div>
  )
}
