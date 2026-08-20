import { useMemo, useState } from 'react'
import { LEAVE_REQUESTS } from '../data/mock'
import { formatDate, initials, statusLabel } from '../lib/format'

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'rejected', label: 'Ditolak' },
]

export default function LeaveHistory() {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(
    () =>
      LEAVE_REQUESTS.filter((item) => (filter === 'all' ? true : item.status === filter)).filter(
        (item) =>
          `${item.employee} ${item.id} ${item.type}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [filter, query],
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
                      <span className="avatar">{initials(row.employee)}</span>
                      <span>
                        <strong>{row.employee}</strong>
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
          {rows.length === 0 && <div className="empty">Tidak ada permohonan pada filter ini.</div>}
        </div>
      </section>
    </div>
  )
}
