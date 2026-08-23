import { useEffect, useState } from 'react'
import api from '../api/axios'
import { formatDate, initials } from '../lib/format'
import { useToast } from '../context/ToastContext'

export default function Approvals() {
  const { push } = useToast()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [decidingId, setDecidingId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    loadApprovals()
  }, [])

  function loadApprovals() {
    setLoading(true)
    api
      .get('/approvals')
      .then((res) => setPending(res.data))
      .catch(() =>
        push('Gagal memuat daftar persetujuan.', 'error'),
      )
      .finally(() => setLoading(false))
  }

  async function decide(id, status) {
    setDecidingId(id)
    try {
      await api.patch(`/leave-requests/${id}/decide`, { status })
      setPending((prev) => prev.filter((item) => item.id !== id))
      setSelectedItem(null)
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
          <p>
            Tinjau pengajuan sebelum memberikan keputusan.
          </p>
        </div>
      </div>

      {!loading && pending.length === 0 && (
        <div className="card empty">
          Tidak ada permohonan yang menunggu.
          Kalender tim sedang seimbang.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: 16,
        }}
      >
        {pending.map((item) => (
          <article
            className="card panel"
            key={item.id}
          >
            <div className="panel__head">
              <div className="person">
                <span className="avatar">
                  {initials(item.employee)}
                </span>

                <span>
                  <strong>
                    {item.employee}
                  </strong>

                  <span>
                    {item.department}
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

              <button
                className="btn btn-primary btn-sm"
                onClick={() => setSelectedItem(item)}
              >
                Lihat Detail
              </button>
            </div>
          </article>
        ))}
      </div>


      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 1000,
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="card panel"
            style={{
              width: '100%',
              maxWidth: 760,
              borderRadius: 24,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20,
              }}
            >
              <div>
                <div className="hint">
                  Detail Pengajuan
                </div>

                <div
                  className="person"
                  style={{
                    marginTop: 8,
                  }}
                >
                  <span className="avatar">
                    {initials(selectedItem.employee)}
                  </span>

                  <span>
                    <strong>
                      {selectedItem.employee}
                    </strong>

                    <span>
                      {selectedItem.department}
                    </span>
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <span className="badge badge--pending">
                  Menunggu
                </span>

                <button
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: 22,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedItem(null)}
                >
                  ×
                </button>
              </div>
            </div>


            {/* Detail */}
            <div
              className="grid-3"
              style={{
                marginBottom: 18,
              }}
            >
              <div className="notice">
                <div className="hint">
                  Jenis
                </div>

                <strong>
                  {selectedItem.type}
                </strong>
              </div>


              <div className="notice">
                <div className="hint">
                  Periode
                </div>

                <strong>
                  {formatDate(selectedItem.from)}
                  {' – '}
                  {formatDate(selectedItem.to)}
                </strong>
              </div>


              <div className="notice">
                <div className="hint">
                  Durasi
                </div>

                <strong>
                  {selectedItem.days} hari kerja
                </strong>
              </div>
            </div>


            {/* Alasan */}
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div className="hint">
                Alasan Pengajuan
              </div>

              <p
                style={{
                  margin: '8px 0 0',
                  lineHeight: 1.6,
                }}
              >
                {selectedItem.reason}
              </p>
            </div>


            {/* Serah Terima */}
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div className="hint">
                Serah Terima Pekerjaan
              </div>

              <p
                style={{
                  margin: '8px 0 0',
                  lineHeight: 1.6,
                }}
              >
                {selectedItem.handover ||
                  'Tidak ada informasi serah terima pekerjaan.'}
              </p>
            </div>


            {/* Action */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                className="btn btn-danger btn-sm"
                disabled={decidingId === selectedItem.id}
                onClick={() =>
                  decide(selectedItem.id, 'rejected')
                }
              >
                Tolak
              </button>

              <button
                className="btn btn-success btn-sm"
                disabled={decidingId === selectedItem.id}
                onClick={() =>
                  decide(selectedItem.id, 'approved')
                }
              >
                Setujui
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}