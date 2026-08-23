import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatDate, initials, statusLabel } from '../lib/format'


const TYPE_FILTERS = [
  { id: 'all', label: 'Semua Jenis' },
  { id: 'Cuti Tahunan', label: 'Cuti Tahunan' },
  { id: 'Sakit', label: 'Sakit' },
  { id: 'Izin', label: 'Izin' },
]


const STATUS_FILTERS = [
  { id: 'all', label: 'Semua Status' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'rejected', label: 'Ditolak' },
]


export default function LeaveHistory() {
  const { user } = useAuth()
  const { push } = useToast()

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')

  const [searched, setSearched] = useState(false)


  useEffect(() => {
    api
      .get('/leave-requests')
      .then((res) => setRequests(res.data))
      .catch(() => {
        push('Gagal memuat riwayat cuti.', 'error')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])


  const rows = useMemo(() => {
    let result = requests


    if (searched) {
      result = result.filter((item) => {
        const matchType =
          typeFilter === 'all' ||
          item.type === typeFilter

        const matchStatus =
          statusFilter === 'all' ||
          item.status === statusFilter

        return matchType && matchStatus
      })
    }


    if (query.trim()) {
      result = result.filter((item) =>
        `${user.name} ${item.id} ${item.type}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    }


    return result

  }, [
    requests,
    searched,
    typeFilter,
    statusFilter,
    query,
    user.name,
  ])


  function resetFilter() {
    setTypeFilter('all')
    setStatusFilter('all')
    setQuery('')
    setSearched(false)
  }


  return (
    <div>

      <div className="page-head">
        <div>
          <h1>Riwayat cuti</h1>
          <p>
            Seluruh permohonan tercatat rapi,
            siap ditelusuri kapan saja.
          </p>
        </div>
      </div>



      {/* Filter Card */}
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
          }}
        >
          🕒 Riwayat Pengajuan
        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr auto',
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
              Jenis Pengajuan
            </label>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border:
                  '1px solid #dbe7f3',
                background: '#fff',
              }}
            >
              {TYPE_FILTERS.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </div>



          <div>

            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                color: 'var(--muted)',
                marginBottom: 5,
              }}
            >
              Status Pengajuan
            </label>


            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border:
                  '1px solid #dbe7f3',
                background: '#fff',
              }}
            >

              {STATUS_FILTERS.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.label}
                </option>
              ))}

            </select>

          </div>



          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >

            <button
              className="btn"
              onClick={resetFilter}
            >
              Reset
            </button>


            <button
              className="btn btn-primary"
              onClick={() => setSearched(true)}
            >
              🔍 Cari
            </button>

          </div>


        </div>



        <div
          style={{
            marginTop: 12,
          }}
        >

          <input
            className="search"
            style={{
              width: '100%',
            }}
            placeholder="Cari nama atau nomor cuti"
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
          />

        </div>


      </section>





      {/* Table */}

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
                      <span className="avatar">
                        {initials(row.employee || user.name)}
                      </span>

                      <span>
                        <strong>
                          {row.employee || user.name}
                        </strong>

                        <span>
                          {row.department || row.reason}
                        </span>
                      </span>
                    </div>
                  </td>


                  <td>
                    {row.type}
                  </td>


                  <td>
                    {formatDate(row.from)}
                    {' – '}
                    {formatDate(row.to)}
                    {' · '}
                    {row.days}h
                  </td>


                  <td>
                    {formatDate(row.submitted)}
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


          {!loading && rows.length === 0 && (
            <div className="empty">
              Tidak ada permohonan pada filter ini.
            </div>
          )}

        </div>

      </section>


    </div>
  )
}