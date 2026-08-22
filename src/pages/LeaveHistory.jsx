import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatDate, initials, statusLabel } from '../lib/format'

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'rejected', label: 'Ditolak' },
]

export default function LeaveHistory() {
  const { user } = useAuth()
  const { push } = useToast()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/leave-requests')
      .then((res) => setRequests(res.data))
      .catch(() => push('Gagal memuat riwayat cuti.', 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = useMemo(
    () =>
      requests
        .filter((item) => (filter === 'all' ? true : item.status === filter))
        .filter((item) =>
          `${user.name} ${item.id} ${item.type}`.toLowerCase().includes(query.toLowerCase()),
        ),
    [requests, filter, query, user.name],
  )

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Riwayat cuti</h1>
          <p>Seluruh permohonan tercatat rapi, siap ditelusuri kapan saja.</p>
        </div>
      </div>

      <div className="filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            className={`chip ${filter === item.id ? 'is-on' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
        <label className="search" style={{ marginLeft: 'auto' }}>
          <input
            placeholder="Cari nama atau nomor cuti"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <section className="card panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nomor</th>
                <th>Karyawan</th>
                <th>Jenis</th>
                <th>Periode</th>
                <th>Diajukan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <b>{row.id}</b>
                  </td>
                  <td>
                    <div className="person">
                      <span className="avatar">{initials(user.name)}</span>
                      <span>
                        <strong>{user.name}</strong>
                        <span>{row.reason}</span>
                      </span>
                    </div>
                  </td>
                  <td>{row.type}</td>
                  <td>
                    {formatDate(row.from)} – {formatDate(row.to)} · {row.days}h
                  </td>
                  <td>{formatDate(row.submitted)}</td>
                  <td>
                    <span className={`badge badge--${row.status}`}>{statusLabel(row.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 && (
            <div className="empty">Tidak ada permohonan pada filter ini.</div>
          )}
        </div>
      </section>
    </div>
  )
}
