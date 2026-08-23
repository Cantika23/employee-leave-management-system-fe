import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import { initials, statusLabel } from '../lib/format'

export default function Employees() {
  const { push } = useToast()

  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    api
      .get('/employees')
      .then((res) => setEmployees(res.data))
      .catch(() => push('Gagal memuat direktori karyawan.', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const departments = [
    'all',
    ...new Set(employees.map((item) => item.dept)),
  ]

  const rows = useMemo(
    () =>
      employees
        .filter((item) =>
          dept === 'all'
            ? true
            : item.dept === dept,
        )
        .filter((item) =>
          `${item.name} ${item.id} ${item.title}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [employees, query, dept],
  )


  return (
    <div>

      <div className="page-head">
        <div>
          <h1>Direktori karyawan</h1>

          <p>
            Pantau status kehadiran, sisa cuti,
            dan sebaran tim.
          </p>
        </div>
      </div>



      {/* Filter */}
      <section
        className="card panel"
        style={{
          padding: 16,
          borderRadius: 18,
          marginBottom: 18,
        }}
      >

        <div
          style={{
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: 12,
            alignItems: 'end',
          }}
        >

          <div>

            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                color: 'var(--muted)',
                marginBottom: 5,
              }}
            >
              Departemen
            </label>


            <select
              value={dept}
              onChange={(e) =>
                setDept(e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid #dbe7f3',
                background: '#fff',
              }}
            >

              {departments.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === 'all'
                    ? 'Semua Unit'
                    : item}
                </option>
              ))}

            </select>

          </div>



          <label
            className="search"
          >
            <input
              placeholder="Cari karyawan"
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
            />
          </label>


        </div>

      </section>




      {/* Table */}
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

                      <span className="avatar">
                        {initials(row.name)}
                      </span>


                      <span>

                        <strong>
                          {row.name}
                        </strong>


                        <span>
                          {row.title}
                        </span>

                      </span>

                    </div>

                  </td>


                  <td>
                    {row.id}
                  </td>


                  <td>
                    {row.dept}
                  </td>


                  <td>
                    {row.location}
                  </td>


                  <td>
                    {row.leave} hari
                  </td>


                  <td>

                    <span
                      className={`badge badge--${row.status}`}
                    >
                      {statusLabel(row.status)}
                    </span>

                  </td>


                </tr>

              ))}

            </tbody>

          </table>


          {rows.length === 0 && (
            <div className="empty">
              Tidak ada data karyawan.
            </div>
          )}

        </div>

      </section>


    </div>
  )
}