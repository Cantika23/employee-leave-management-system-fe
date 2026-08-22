import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, Plane, Users } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { formatDate, greeting, initials, statusLabel } from '../lib/format'

export default function Dashboard() {
  const { user } = useAuth()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [summary, setSummary] = useState({ team_on_leave: [], pending_count: 0 })
  const [holidays, setHolidays] = useState([])
  const [recentRequests, setRecentRequests] = useState([])
  const [reports, setReports] = useState(null) // hanya terisi untuk role hr

  useEffect(() => {
    api.get('/leave-types').then((res) => setLeaveTypes(res.data)).catch(() => {})
    api.get('/dashboard/summary').then((res) => setSummary(res.data)).catch(() => {})
    api.get('/holidays').then((res) => setHolidays(res.data)).catch(() => {})
    api.get('/leave-requests').then((res) => setRecentRequests(res.data.slice(0, 5))).catch(() => {})
    if (user.role === 'hr') {
      api.get('/reports').then((res) => setReports(res.data)).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const annual = leaveTypes.find((t) => t.id === 'annual')
  const remaining = annual ? annual.days - annual.used : 0
  const maxDept = reports?.dept_leave?.length ? Math.max(...reports.dept_leave.map((d) => d.value)) : 1
  const maxTrend = reports?.monthly_trend?.length ? Math.max(...reports.monthly_trend) : 1

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>
            {greeting()}, {user.name.split(' ')[0]}.
          </h1>
          <p>Berikut ringkasan cuti organisasi hari ini — tenang, lengkap, siap ditindaklanjuti.</p>
        </div>
        <Link to="/app/leave/apply" className="btn btn-primary">
          Ajukan cuti
        </Link>
      </div>

      <div className="kpi-grid">
        <article className="card kpi">
          <h3>Sisa cuti tahunan</h3>
          <b>{remaining} hari</b>
          <span>dari {annual?.days ?? 0} hari kuota</span>
          <Plane className="watermark" size={54} />
        </article>
        <article className="card kpi">
          <h3>Menunggu persetujuan</h3>
          <b>{summary.pending_count}</b>
          <span>perlu tinjauan atasan / HR</span>
          <Clock3 className="watermark" size={54} />
        </article>
        <article className="card kpi">
          <h3>Tim sedang cuti</h3>
          <b>{summary.team_on_leave.length}</b>
          <span>terlihat di kalender hari ini</span>
          <Users className="watermark" size={54} />
        </article>
        <article className="card kpi">
          <h3>Hari libur berikutnya</h3>
          <b>{holidays[0] ? formatDate(holidays[0].date) : '—'}</b>
          <span>{holidays[0]?.name ?? 'Belum ada data'}</span>
          <CalendarDays className="watermark" size={54} />
        </article>
      </div>

      <div className="dash-grid">
        <section className="card panel">
          <div className="panel__head">
            <h2>Permohonan terbaru Anda</h2>
            <Link to="/app/leave/history" className="hint">
              Lihat semua
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Jenis</th>
                  <th>Periode</th>
                  <th>Hari</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="person">
                        <span className="avatar">{initials(user.name)}</span>
                        <span>
                          <strong>{user.name}</strong>
                          <span>{user.department}</span>
                        </span>
                      </div>
                    </td>
                    <td>{row.type}</td>
                    <td>
                      {formatDate(row.from)} – {formatDate(row.to)}
                    </td>
                    <td>{row.days}</td>
                    <td>
                      <span className={`badge badge--${row.status}`}>{statusLabel(row.status)}</span>
                    </td>
                  </tr>
                ))}
                {recentRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">
                      Belum ada permohonan cuti.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 16 }}>
          {reports && (
            <section className="card panel">
              <div className="panel__head">
                <h2>Utilisasi per departemen</h2>
              </div>
              <div className="bars">
                {reports.dept_leave.map((dept) => (
                  <div className="bar-row" key={dept.name}>
                    <span>{dept.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(dept.value / maxDept) * 100}%` }} />
                    </div>
                    <b>{dept.value}</b>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="card panel">
            <div className="panel__head">
              <h2>Sedang cuti</h2>
            </div>
            <div className="list-soft">
              {summary.team_on_leave.map((person, index) => (
                <article key={`${person.name}-${index}`}>
                  <div>
                    <strong>{person.name}</strong>
                    <div className="hint">{person.type}</div>
                  </div>
                  <span className="badge badge--sky">s.d. {person.until}</span>
                </article>
              ))}
              {summary.team_on_leave.length === 0 && <p className="hint">Tidak ada yang sedang cuti.</p>}
            </div>
          </section>
        </div>
      </div>

      <div className="dash-grid" style={{ marginTop: 16 }}>
        {reports && (
          <section className="card panel">
            <div className="panel__head">
              <h2>Tren pengajuan {new Date().getFullYear()}</h2>
              <span className="hint">Jan – Des</span>
            </div>
            <div className="spark">
              {reports.monthly_trend.map((value, index) => (
                <i
                  key={index}
                  style={{ height: value ? `${(value / maxTrend) * 100}%` : '8%' }}
                  title={`Bulan ${index + 1}: ${value}`}
                />
              ))}
            </div>
          </section>
        )}
        <section className="card panel">
          <div className="panel__head">
            <h2>Hari libur nasional</h2>
          </div>
          <div className="list-soft">
            {holidays.map((item) => (
              <article key={item.date}>
                <strong>{item.name}</strong>
                <span className="hint">{formatDate(item.date)}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
