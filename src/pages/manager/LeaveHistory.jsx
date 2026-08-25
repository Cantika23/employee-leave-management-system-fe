import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import { formatDate, statusLabel } from '../../lib/format'

const STATUS_OPTIONS = [
  { id: 'all', label: 'Semua Status' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'rejected', label: 'Ditolak' },
]

const PAGE_SIZE = 5

export default function LeaveHistory() {
  const { push } = useToast()
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/team-requests')
      .then((res) => setRequests(res.data))
      .catch(() => push('Gagal memuat riwayat pengajuan tim.', 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () => requests.filter((item) => (status === 'all' ? true : item.status === status)),
    [requests, status],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageStart = (page - 1) * PAGE_SIZE
  const rows = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  function onStatusChange(value) {
    setStatus(value)
    setPage(1)
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Riwayat Pengajuan</h1>
          <p>Seluruh pengajuan cuti anggota tim Anda.</p>
        </div>
        <select value={status} onChange={(e) => onStatusChange(e.target.value)} style={{ maxWidth: 180 }}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <section className="card panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Jenis</th>
                <th>Tanggal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td>{pageStart + index + 1}</td>
                  <td>{row.employee}</td>
                  <td>{row.type}</td>
                  <td>{formatDate(row.from)}</td>
                  <td>
                    <span className={`badge badge--${row.status}`}>{statusLabel(row.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 && <div className="empty">Tidak ada pengajuan pada filter ini.</div>}
        </div>
        {filtered.length > 0 && (
          <div className="panel__head" style={{ marginTop: 14 }}>
            <span className="hint">
              Menampilkan {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari{' '}
              {filtered.length} Data
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Sebelumnya
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
