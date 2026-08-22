import { useEffect, useState } from 'react'
import api from '../api/axios'
import { formatDate, initials } from '../lib/format'
import { useToast } from '../context/ToastContext'

export default function Approvals() {
  const { push } = useToast()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [decidingId, setDecidingId] = useState(null)

  useEffect(() => {
    loadApprovals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadApprovals() {
    setLoading(true)
    api
      .get('/approvals')
      .then((res) => setPending(res.data))
      .catch(() => push('Gagal memuat daftar persetujuan.', 'error'))
      .finally(() => setLoading(false))
  }

  async function decide(id, status) {
    setDecidingId(id)
    try {
      await api.patch(`/leave-requests/${id}/decide`, { status })
      setPending((prev) => prev.filter((item) => item.id !== id))
      push(status === 'approved' ? 'Permohonan disetujui.' : 'Permohonan ditolak.')
    } catch (err) {
      push(err.response?.data?.message || 'Gagal memproses keputusan.', 'error')
    } finally {
      setDecidingId(null)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Persetujuan</h1>
          <p>Tinjau dampak ke tim, lalu berikan keputusan yang jelas.</p>
        </div>
      </div>

      {!loading && pending.length === 0 && (
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
              <button
                className="btn btn-success btn-sm"
                disabled={decidingId === item.id}
                onClick={() => decide(item.id, 'approved')}
              >
                Setujui
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={decidingId === item.id}
                onClick={() => decide(item.id, 'rejected')}
              >
                Tolak
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
