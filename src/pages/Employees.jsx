import { useMemo, useState } from 'react'
import { EMPLOYEES } from '../data/mock'
import { initials, statusLabel } from '../lib/format'

export default function Employees() {
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const departments = ['all', ...new Set(EMPLOYEES.map((item) => item.dept))]

  const rows = useMemo(
    () =>
      EMPLOYEES.filter((item) => (dept === 'all' ? true : item.dept === dept)).filter((item) =>
        `${item.name} ${item.id} ${item.title}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, dept],
  )

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Direktori karyawan</h1>
          <p>Pantau status kehadiran, sisa cuti, dan sebaran tim.</p>
        </div>
      </div>

      <div className="filters">
        {departments.map((item) => (
          <button
            key={item}
            className={`chip ${dept === item ? 'is-on' : ''}`}
            onClick={() => setDept(item)}
          >
            {item === 'all' ? 'Semua unit' : item}
          </button>
        ))}
        <label className="search" style={{ marginLeft: 'auto' }}>
          <input
            placeholder="Cari karyawan"
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
                <th>Karyawan</th>
                <th>ID</th>
                <th>Departemen</th>
                <th>Lokasi</th>
                <th>Sisa cuti</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="person">
                      <span className="avatar">{initials(row.name)}</span>
                      <span>
                        <strong>{row.name}</strong>
                        <span>{row.title}</span>
                      </span>
                    </div>
                  </td>
                  <td>{row.id}</td>
                  <td>{row.dept}</td>
                  <td>{row.location}</td>
                  <td>{row.leave} hari</td>
                  <td>
                    <span className={`badge badge--${row.status}`}>{statusLabel(row.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
