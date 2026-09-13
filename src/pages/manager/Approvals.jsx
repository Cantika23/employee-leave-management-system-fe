import { useEffect, useState } from 'react'
import { HeartPulse, Plane, ScrollText, Sparkles, Clock, Check, X, ShieldCheck, Paperclip, ShieldX } from 'lucide-react'
import api from '../../api/axios'
import { formatDate, initials } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import { useSearchParams } from 'react-router-dom'

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

function refCode(id) {
  return `CT-${String(id).padStart(4, '0')}`
}

function ApprovalCardSkeleton() {
  return (
    <article
      className="card panel appr-skel-card"
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
          background: '#eef0f3',
        }}
      />
      <div className="panel__head" style={{ paddingLeft: 10 }}>
        <div className="person">
          <span className="appr-skel appr-skel--avatar" />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="appr-skel appr-skel--line" style={{ width: 140, height: 12 }} />
            <span className="appr-skel appr-skel--line" style={{ width: 100, height: 10 }} />
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="appr-skel appr-skel--line" style={{ width: 64, height: 22, borderRadius: 999 }} />
          <span className="appr-skel appr-skel--line" style={{ width: 92, height: 30, borderRadius: 10 }} />
        </div>
      </div>
    </article>
  )
}

// A single label/value row inside the formal detail table.
function DocRow({ label, children, last }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        padding: '13px 0',
        borderBottom: last ? 'none' : '1px solid #eef0f3',
      }}
    >
      <span
        style={{
          flex: '0 0 140px',
          fontSize: 12.5,
          color: '#94a3b8',
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          color: '#1e293b',
          fontWeight: 600,
        }}
      >
        {children}
      </span>
    </div>
  )
}

export default function Approvals() {
  const { push } = useToast()
  const [searchParams] = useSearchParams()

  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [decidingId, setDecidingId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectNote, setRejectNote] = useState('')


  useEffect(() => {
    loadApprovals()
  }, [])


  useEffect(() => {
    const leaveId = searchParams.get('leave')

    if (leaveId && pending.length > 0) {

      const item = pending.find(
        (x) =>
          String(x.database_id) === String(leaveId) ||
          String(x.id) === String(leaveId)
      )

      if (item) {
        setSelectedItem(item)
      }

    }
  }, [pending, searchParams])

  function loadApprovals() {
    setLoading(true)

    api
      .get('/approvals')
      .then((res) => {
        setPending(res.data)
      })
      .catch(() =>
        push('Gagal memuat daftar persetujuan.', 'error'),
      )
      .finally(() => setLoading(false))
  }

  async function decide(id, status, note = '') {

    setDecidingId(id)

    try {

      await api.patch(`/leave-requests/${id}/decide`, {
        status,
        decision_note: note,
      })

      setPending((prev) =>
        prev.filter((item) => item.id !== id)
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

  const modalTypeStyle = selectedItem ? resolveTypeStyle(selectedItem.type) : null
  const ModalIcon = modalTypeStyle?.icon

  return (
    <div>
      <style>{`
        @keyframes appr-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
        .appr-skel {
          display: inline-block;
          border-radius: 8px;
          background: linear-gradient(90deg, rgba(148,163,184,0.14) 25%, rgba(148,163,184,0.26) 37%, rgba(148,163,184,0.14) 63%);
          background-size: 400% 100%;
          animation: appr-shimmer 1.4s ease infinite;
        }
        .appr-skel--avatar {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .appr-skel-card { pointer-events: none; }

        @keyframes appr-card-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .appr-card {
          transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
          animation: appr-card-in 220ms ease-out both;
        }
        .appr-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 14px 32px -14px rgba(16,24,40,0.16);
        }
        .appr-detail-btn {
          transition: transform 120ms ease, box-shadow 120ms ease;
        }
        .appr-detail-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px -6px rgba(37,99,235,0.45);
        }
        @media (prefers-reduced-motion: reduce) {
          .appr-card, .appr-skel { animation: none !important; }
        }
      `}</style>

      <div className="page-head">
        <div>
          <h3>Persetujuan</h3>
          <p>
            Tinjau pengajuan sebelum memberikan keputusan.
          </p>
        </div>

        {!loading && pending.length > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 13,
              fontWeight: 600,
              color: '#b45309',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.22)',
              borderRadius: 999,
              padding: '7px 14px',
              flexShrink: 0,
            }}
          >
            <Clock size={14} />
            {pending.length} menunggu keputusan
          </span>
        )}
      </div>

      {loading && (
        <div style={{ display: 'grid', gap: 16 }}>
          <ApprovalCardSkeleton />
          <ApprovalCardSkeleton />
          <ApprovalCardSkeleton />
        </div>
      )}

      {!loading && pending.length === 0 && (
        <div
          className="card empty"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 10,
            padding: '48px 24px',
            borderRadius: 18,
          }}
        >
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#c23e19',
              marginBottom: 4,
            }}
          >
            <ShieldX size={24} />
          </span>
          <strong style={{ fontSize: 15 }}>Tidak ditemukan pengajuan</strong>
          <p className="hint" style={{ margin: 0, maxWidth: 320 }}>
            Tidak ada permohonan yang menunggu.
          </p>
        </div>
      )}

      {!loading && pending.length > 0 && (
        <div
          style={{
            display: 'grid',
            gap: 16,
          }}
        >
          {pending.map((item, index) => {
            const style = resolveTypeStyle(item.type)
            const Icon = style.icon

            return (
              <article
                className="card panel appr-card"
                key={item.id}
                style={{
                  position: 'relative',
                  borderRadius: 18,
                  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.08)',
                  animationDelay: `${Math.min(index, 6) * 35}ms`,
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
                      className="avatar"
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        lineHeight: 1,
                        boxShadow: `0 0 0 3px ${style.soft}`,
                      }}
                    >
                      {initials(item.employee)}
                    </span>

                    <span>
                      <strong>
                        {item.employee}
                      </strong>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {item.department}
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#dfe3e8', flexShrink: 0 }} />
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: style.color,
                            fontWeight: 600,
                          }}
                        >
                          <Icon size={12} />
                          {item.type}
                        </span>
                      </span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span
                      className="badge badge--pending"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                      Menunggu
                    </span>
                    <button
                      className="btn btn-primary btn-sm appr-detail-btn"
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
      )}


      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.42)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 1000,
            animation: 'approvalOverlayIn 120ms ease-out',
          }}
          onClick={() => setSelectedItem(null)}
        >
          <style>{`
            @keyframes approvalOverlayIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes approvalModalIn {
              from { opacity: 0; transform: translateY(10px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @media (prefers-reduced-motion: reduce) {
              .approval-modal, .approval-overlay { animation: none !important; }
            }
            .approval-close-btn:hover { background: #f1f5f9 !important; color: #475569 !important; }
            .approval-close-btn:focus-visible,
            .approval-btn-reject:focus-visible,
            .approval-btn-approve:focus-visible {
              outline: 2px solid #94a3b8; outline-offset: 2px;
            }
            .approval-btn-reject, .approval-btn-approve {
              transition: transform 120ms ease, box-shadow 120ms ease;
            }
            .approval-btn-reject:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px -6px rgba(244,63,94,0.5); }
            .approval-btn-approve:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px -6px rgba(22,163,74,0.5); }
          `}</style>

          <div
            className="card panel approval-modal"
            style={{
              width: '100%',
              maxWidth: 620,
              borderRadius: 20,
              padding: 0,
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 24px 60px -18px rgba(16,24,40,0.24)',
              animation: 'approvalModalIn 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Letterhead strip */}
            <div
              style={{
                height: 6,
                background: `linear-gradient(90deg, ${modalTypeStyle.color}, ${modalTypeStyle.color}80)`,
                boxShadow: `0 2px 14px -2px ${modalTypeStyle.color}66`,
              }}
            />

            <div style={{ padding: 24 }}>

              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 22,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>
                      Detail Pengajuan
                    </span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#dfe3e8', flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        letterSpacing: 0,
                        color: '#b7bcc4',
                      }}
                    >
                      {refCode(selectedItem.id)}
                    </span>
                  </div>

                  <div
                    className="person"
                    style={{
                      marginTop: 12,
                    }}
                  >
                    <span
                      className="avatar"
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        lineHeight: 1,
                        boxShadow: `0 0 0 3px ${modalTypeStyle.soft}, 0 6px 14px -6px ${modalTypeStyle.color}80`,
                      }}
                    >
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
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <span
                    className="badge badge--pending"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    Menunggu
                  </span>

                  <button
                    aria-label="Tutup"
                    className="approval-close-btn"
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      border: '1px solid #eef0f3',
                      background: '#fbfbfc',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      transition: 'background 120ms ease, color 120ms ease',
                    }}
                    onClick={() => setSelectedItem(null)}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Formal detail table — Jenis / Periode / Durasi as plain label-value rows */}
              <div
                style={{
                  border: '1px solid #eef0f3',
                  borderRadius: 14,
                  padding: '2px 18px',
                  marginBottom: 20,
                }}
              >
                <DocRow label="Jenis cuti">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <ModalIcon size={14} style={{ color: modalTypeStyle.color, flexShrink: 0 }} />
                    {selectedItem.type}
                  </span>
                </DocRow>

                <DocRow label="Periode">
                  {formatDate(selectedItem.from)} &ndash; {formatDate(selectedItem.to)}
                </DocRow>

                <DocRow label="Durasi" last>
                  {selectedItem.days} hari kerja
                </DocRow>
              </div>


              {/* Alasan */}
              <div
                style={{
                  borderLeft: `3px solid ${modalTypeStyle.color}55`,
                  background: '#fbfbfc',
                  borderRadius: '0 12px 12px 0',
                  padding: '14px 18px',
                  marginBottom: 20,
                }}
              >
                <div className="hint" style={{ marginBottom: 6 }}>
                  Alasan Pengajuan
                </div>

                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.6,
                    color: '#334155',
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
                    border: '1px dashed #dfe3e8',
                    borderRadius: 14,
                    padding: '14px 16px',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: '#f1f5f9',
                        color: '#64748b',
                        flexShrink: 0,
                      }}
                    >
                      <Paperclip size={15} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: 13.5,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 320,
                        }}
                      >
                        {selectedItem.attachmentName || 'Lampiran pengajuan'}
                      </strong>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        Dokumen pendukung
                      </span>
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
                  borderTop: '1px solid #eef0f3',
                  paddingTop: 20,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                }}
              >
                <button
                  className="btn btn-danger btn-sm approval-btn-reject"
                  disabled={decidingId === selectedItem.id}
                  onClick={() => {
                    setRejectModal(true)
                  }}

                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <X size={14} />
                  Tolak
                </button>

                <button
                  className="btn btn-success btn-sm approval-btn-approve"
                  disabled={decidingId === selectedItem.id}
                  onClick={() =>
                    decide(selectedItem.id, 'approved')
                  }
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Check size={14} />
                  {decidingId === selectedItem.id ? 'Memproses…' : 'Setujui'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20,
            animation: 'approvalOverlayIn 120ms ease-out',
          }}
          onClick={() => {
            setRejectModal(false)
            setRejectNote('')
          }}
        >

          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              padding: 24,
              borderRadius: 20,
              background: '#fff',
              boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 24px 60px -18px rgba(16,24,40,0.24)',
              animation: 'approvalModalIn 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(244,63,94,0.1)',
                  color: '#f43f5e',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </span>
              <h3 style={{ margin: 0 }}>
                Alasan Penolakan
              </h3>
            </div>

            <p className="hint" style={{ margin: '4px 0 14px' }}>
              Beri tahu alasan penolakan supaya karyawan tahu apa yang perlu diperbaiki.
            </p>

            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Masukkan alasan penolakan..."
              autoFocus
              style={{
                width: '100%',
                height: 100,
                padding: 12,
                borderRadius: 10,
                border: '1px solid #dfe3e8',
                fontFamily: 'inherit',
                fontSize: 13.5,
                resize: 'vertical',
                outline: 'none',
              }}
            />

            <div
              style={{
                marginTop: 16,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >

              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setRejectModal(false)
                  setRejectNote('')
                }}
              >
                Batal
              </button>


              <button
                className="btn btn-danger btn-sm"
                disabled={!rejectNote || decidingId === selectedItem?.id}
                onClick={() => {
                  decide(
                    selectedItem.id,
                    'rejected',
                    rejectNote
                  )

                  setRejectModal(false)
                  setRejectNote('')
                }}
              >
                {decidingId === selectedItem?.id ? 'Memproses…' : 'Konfirmasi Tolak'}
              </button>


            </div>

          </div>

        </div>
      )}
    </div>
  )
}