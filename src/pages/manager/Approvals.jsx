import { useEffect, useState } from 'react'
import { HeartPulse, Plane, ScrollText, Sparkles, Calendar, Clock, Check, X, ShieldCheck, Paperclip } from 'lucide-react'
import api from '../../api/axios'
import { formatDate, initials } from '../../lib/format'
import { useToast } from '../../context/ToastContext'

const TYPE_STYLE = {
  annual: { icon: Plane, color: '#0EA5E9', soft: '#e6f5fd' },
  sick: { icon: HeartPulse, color: '#f43f5e', soft: '#fdecef' },
  izin: { icon: ScrollText, color: '#f59e0b', soft: '#fef3e2' },
}
const DEFAULT_STYLE = { icon: Sparkles, color: '#8b5cf6', soft: '#f2edfd' }

function resolveTypeStyle(label = '') {
  const value = label.toLowerCase()
  if (value.includes('sakit')) return TYPE_STYLE.sick
  if (value.includes('izin')) return TYPE_STYLE.izin
  if (value.includes('tahunan') || value.includes('annual')) return TYPE_STYLE.annual
  return DEFAULT_STYLE
}

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
      await api.patch(`/leave-requests/${id}/decide`, {
        status,
      })

      setPending((prev) =>
        prev.filter((item) => item.id !== id),
      )

      setSelectedItem(null)

      push(
        status === 'approved'
          ? 'Permohonan disetujui.'
          : 'Permohonan ditolak.',
      )
    } catch (err) {
      push(
        err.response?.data?.message ||
          'Gagal memproses keputusan.',
        'error',
      )
    } finally {
      setDecidingId(null)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div>
            <h1>Persetujuan</h1>
            <p>Memuat data...</p>
          </div>
        </div>
      </div>
    )
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

      {pending.length === 0 && (
        <div
          className="card empty"
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <ShieldCheck size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
          Tidak ada permohonan yang menunggu. Kalender tim sedang seimbang.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: 16,
        }}
      >
        {pending.map((item) => {
          const style = resolveTypeStyle(item.type)
          const Icon = style.icon

          return (
            <article
              className="card panel"
              key={item.id}
              style={{
                position: 'relative',
                borderRadius: 18,
                boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.08)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 12,
                  bottom: 12,
                  width: 3,
                  borderRadius: 4,
                  background: style.color,
                }}
              />
              <div className="panel__head" style={{ paddingLeft: 10 }}>
                <div className="person">
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: style.soft,
                      color: style.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </span>

                  <span>
                    <strong>
                      {item.employee}
                    </strong>

                    <span>
                      {item.department} · {item.type}
                    </span>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge badge--pending">
                    Menunggu
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedItem(item)}
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            </article>
          )
        })}
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
              boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 20px 48px -16px rgba(16,24,40,0.16)',
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
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#0EA5E9',
                    textTransform: 'uppercase',
                  }}
                >
                  Detail Pengajuan
                </span>

                <div
                  className="person"
                  style={{
                    marginTop: 10,
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
                    lineHeight: 1,
                    cursor: 'pointer',
                    color: '#94a3b8',
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
                gap: 12,
              }}
            >
              {(() => {
                const style = resolveTypeStyle(selectedItem.type)
                const Icon = style.icon
                return (
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: style.soft,
                    }}
                  >
                    <Icon size={16} style={{ color: style.color, flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div className="hint">Jenis</div>
                      <strong>{selectedItem.type}</strong>
                    </div>
                  </div>
                )
              })()}

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: '#fbfbfc',
                  border: '1px solid #eef0f3',
                }}
              >
                <Calendar size={16} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div className="hint">Periode</div>
                  <strong>
                    {formatDate(selectedItem.from)}
                    {' – '}
                    {formatDate(selectedItem.to)}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: '#fbfbfc',
                  border: '1px solid #eef0f3',
                }}
              >
                <Clock size={16} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div className="hint">Durasi</div>
                  <strong>
                    {selectedItem.days} hari kerja
                  </strong>
                </div>
              </div>
            </div>


            {/* Alasan */}
            <div
              style={{
                border: '1px solid #eef0f3',
                background: '#fbfbfc',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
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


            {/* Lampiran */}
            {selectedItem.attachment && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  border: '1px solid #eef0f3',
                  background: '#fbfbfc',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: '#e6f5fd',
                      color: '#0EA5E9',
                      flexShrink: 0,
                    }}
                  >
                    <Paperclip size={16} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="hint">Lampiran</div>
                    <strong
                      style={{
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 320,
                      }}
                    >
                      {selectedItem.attachmentName || 'Lampiran pengajuan'}
                    </strong>
                  </div>
                </div>
                <a
                  href={selectedItem.attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  Lihat
                </a>
              </div>
            )}

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
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <X size={14} />
                Tolak
              </button>

              <button
                className="btn btn-success btn-sm"
                disabled={decidingId === selectedItem.id}
                onClick={() =>
                  decide(selectedItem.id, 'approved')
                }
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={14} />
                Setujui
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}