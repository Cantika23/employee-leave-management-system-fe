import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, UserRound } from 'lucide-react'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import { formatDate, statusLabel } from '../../lib/format'

export default function ApprovalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { push } = useToast()
  const [item, setItem] = useState(null)
  const [note, setNote] = useState('')
  const [deciding, setDeciding] = useState(false)

  useEffect(() => {
    api
      .get(`/leave-requests/${id}`)
      .then((res) => setItem(res.data))
      .catch(() => push('Gagal memuat detail pengajuan.', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function decide(status) {
    setDeciding(true)
    try {
      await api.patch(`/leave-requests/${id}/decide`, { status, note })
      push(status === 'approved' ? 'Pengajuan disetujui.' : 'Pengajuan ditolak.')
      navigate('/app/approvals')
    } catch (err) {
      push(err.response?.data?.message || 'Gagal memproses keputusan.', 'error')
    } finally {
      setDeciding(false)
    }
  }

  if (!item) {
    return (
      <div className="page-head">
        <div>
          <h1>Detail pengajuan</h1>
          <p>Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline btn-sm"
        style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <ArrowLeft size={16} /> Kembali
      </button>

      <section className="card panel">
        <div className="panel__head">
          <div className="person">
            <span className="avatar">
              <UserRound size={18} />
            </span>
            <span>
              <strong>{item.employee}</strong>
              <span>{item.department}</span>
            </span>
          </div>
          <span className={`badge badge--${item.status}`}>{statusLabel(item.status)}</span>
        </div>

        <div className="list-soft" style={{ marginTop: 10 }}>
          <article>
            <span>Jenis Pengajuan</span>
            <strong>{item.type}</strong>
          </article>
          <article>
            <span>Tanggal</span>
            <strong>
              {formatDate(item.from)} - {formatDate(item.to)}
            </strong>
          </article>
          <article>
            <span>Durasi</span>
            <strong>{item.days} Hari</strong>
          </article>
          <article>
            <span>Alasan</span>
            <strong>{item.reason}</strong>
          </article>
          {item.attachment_url && (
            <article>
              <span>Lampiran</span>
              <a href={item.attachment_url} target="_blank" rel="noreferrer">
                Lihat lampiran
              </a>
            </article>
          )}
          {item.hr_note && (
            <article>
              <span>Catatan HR</span>
              <strong>{item.hr_note}</strong>
            </article>
          )}
        </div>

        {item.status === 'pending_manager' ? (
          <>
            <div className="field" style={{ marginTop: 18 }}>
              <label htmlFor="note">Catatan (Opsional)</label>
              <textarea
                id="note"
                placeholder="Tulis catatan jika diperlukan..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn btn-outline" disabled={deciding} onClick={() => decide('rejected')}>
                Tolak
              </button>
              <button className="btn btn-success" disabled={deciding} onClick={() => decide('approved')}>
                Setujui
              </button>
            </div>
          </>
        ) : (
          item.note && (
            <div className="notice" style={{ marginTop: 18 }}>
              <strong>Catatan:</strong> {item.note}
            </div>
          )
        )}
      </section>
    </div>
  )
}
