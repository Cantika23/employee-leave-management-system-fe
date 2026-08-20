import { useState } from 'react'
import { LEAVE_REQUESTS } from '../data/mock'
import { formatDate, initials } from '../lib/format'
import { useToast } from '../context/ToastContext'

export default function Approvals() {
  const { push } = useToast()
  const [rows, setRows] = useState(LEAVE_REQUESTS)
  const pending = rows.filter((item) => item.status === 'pending')

  function decide(id, status) {
    setRows((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
    push(status === 'approved' ? 'Permohonan disetujui.' : 'Permohonan ditolak.')
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Persetujuan</h1>
          <p>Tinjau dampak ke tim, lalu berikan keputusan yang jelas.</p>
        </div>
      </div>

      {pending.length === 0 && (
        <div className="card empty">Tidak ada permohonan yang menunggu. Kalender tim sedang seimbang.</div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {pending.map((item) => (
          <article className="card panel" key={item.id}>
            <div className="panel__head">
              <div className="person">
                <span className="avatar">{initials(item.employee)}</span>
                <span>
                  <strong>{item.employee}</strong>
                  <span>
                    {item.department} · {item.id}
                  </span>
                </span>
              </div>
              <span className="badge badge--pending">Menunggu</span>
            </div>
            <div className="grid-3" style={{ marginBottom: 14 }}>
              <div className="notice">
                <div className="hint">Jenis</div>
                <strong>{item.type}</strong>
              </div>
              <div className="notice">
                <div className="hint">Periode</div>
                <strong>
                  {formatDate(item.from)} – {formatDate(item.to)}
                </strong>
              </div>
              <div className="notice">
                <div className="hint">Durasi</div>
                <strong>{item.days} hari kerja</strong>
              </div>
            </div>
            <p style={{ marginBottom: 16 }}>{item.reason}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-success btn-sm" onClick={() => decide(item.id, 'approved')}>
                Setujui
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => decide(item.id, 'rejected')}>
                Tolak
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
