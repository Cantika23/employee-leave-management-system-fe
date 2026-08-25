import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, UserRound } from 'lucide-react'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import { formatDate, statusLabel } from '../../lib/format'

export default function Approvals() {
  const { push } = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/team-requests', { params: { status: 'pending_manager' } })
      .then((res) => setRequests(res.data))
      .catch(() => push('Gagal memuat daftar pengajuan.', 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Pengajuan Tim</h1>
          <p>Tinjau pengajuan cuti anggota tim yang menunggu keputusan Anda.</p>
        </div>
      </div>

      <section className="card panel">
        <div className="list-soft">
          {requests.map((row) => (
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
          {!loading && requests.length === 0 && (
            <div className="empty">Tidak ada pengajuan yang menunggu. Kalender tim sedang seimbang.</div>
          )}
        </div>
      </section>
    </div>
  )
}
