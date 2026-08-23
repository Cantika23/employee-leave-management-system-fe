import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FilePlus2,
  History,
  Plane,
  Users,
  XCircle,
} from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { formatDate, greeting, statusLabel } from '../lib/format'

export default function Dashboard() {
  const { user } = useAuth()
  return user.role === 'employee' ? <EmployeeDashboard /> : <ManagerDashboard user={user} />
}

// Dashboard karyawan: sesuai mockup MITRAL — Sisa Cuti, Pengajuan Aktif,
// Pengajuan Disetujui, Pengajuan Ditolak, Pengajuan Terbaru, dan shortcut.
function EmployeeDashboard() {
  const { user } = useAuth()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [requests, setRequests] = useState([])

  useEffect(() => {
    api.get('/leave-types').then((res) => setLeaveTypes(res.data)).catch(() => {})
    api.get('/leave-requests').then((res) => setRequests(res.data)).catch(() => {})
  }, [])

  const annual = leaveTypes.find((t) => t.id === 'annual')
  const remaining = annual ? annual.days - annual.used : 0
  const active = requests.filter((r) => r.status === 'pending').length
  const approved = requests.filter((r) => r.status === 'approved').length
  const rejected = requests.filter((r) => r.status === 'rejected').length
  const recent = requests.slice(0, 5)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>
            {greeting()}, {user.name.split(' ')[0]}.
          </h1>
          <p>Berikut ringkasan pengajuan cuti/izin/sakit Anda.</p>
        </div>
        <Link to="/app/leave/apply" className="btn btn-primary">
          Ajukan cuti
        </Link>
      </div>

      <div className="kpi-grid">
        <article className="card kpi kpi--info">
          <h3>Sisa cuti</h3>
          <b>{remaining} hari</b>
          <span>dari {annual?.days ?? 0} hari kuota</span>
          <Plane className="watermark" size={54} />
        </article>
        <article className="card kpi kpi--warning">
          <h3>Pengajuan aktif</h3>
          <b>{active}</b>
          <span>menunggu keputusan</span>
          <Clock3 className="watermark" size={54} />
        </article>
        <article className="card kpi kpi--success">
          <h3>Pengajuan disetujui</h3>
          <b>{approved}</b>
          <span>sepanjang tahun ini</span>
          <CheckCircle2 className="watermark" size={54} />
        </article>
        <article className="card kpi kpi--danger">
          <h3>Pengajuan ditolak</h3>
          <b>{rejected}</b>
          <span>sepanjang tahun ini</span>
          <XCircle className="watermark" size={54} />
        </article>
      </div>

      <section className="card panel">
        <div className="panel__head">
          <h2>Pengajuan terbaru</h2>
          <Link to="/app/leave/history" className="hint">
            Lihat semua
          </Link>
        </div>
        <div className="list-soft">
          {recent.map((row) => {
            const StatusIcon = row.status === 'approved' ? CheckCircle2 : row.status === 'rejected' ? XCircle : Clock3
            return (
              <Link
                to="/app/leave/history"
                key={row.id}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`status-dot status-dot--${row.status}`}>
                      <StatusIcon size={16} />
                    </span>
                    <div>
                      <strong>{row.type}</strong>
                      <div className="hint">
                        {formatDate(row.from)} – {formatDate(row.to)} · {row.days} hari
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge badge--${row.status}`}>{statusLabel(row.status)}</span>
                    <ChevronRight size={16} className="hint" />
                  </div>
                </article>
              </Link>
            )
          })}
          {recent.length === 0 && <p className="hint">Belum ada pengajuan.</p>}
        </div>
      </section>

      <div className="dash-grid" style={{ marginTop: 16 }}>
        <Link to="/app/leave/apply" className="card panel shortcut-card">
          <FilePlus2 size={22} />
          <div>
            <strong>Ajukan Cuti/Izin/Sakit</strong>
            <div className="hint">Buat pengajuan baru</div>
          </div>
        </Link>
        <Link to="/app/leave/history" className="card panel shortcut-card">
          <History size={22} />
          <div>
            <strong>Riwayat Pengajuan</strong>
            <div className="hint">Lihat riwayat pengajuan</div>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Dashboard manager/HR: ringkasan tim & organisasi (tidak diubah dari sebelumnya).
function ManagerDashboard({ user }) {
  const [leaveTypes, setLeaveTypes] = useState([])
  const [summary, setSummary] = useState({ team_on_leave: [], pending_count: 0 })
  const [holidays, setHolidays] = useState([])
  const [recentRequests, setRecentRequests] = useState([])
  const [reports, setReports] = useState(null)

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

    return (
      <div>
        <div className="page-head">
          <div>
            <h1>{greeting()}, {user.name.split(' ')[0]}.</h1>
            <p>Berikut ringkasan aktivitas cuti organisasi hari ini.</p>
          </div>
        </div>

        <div className="kpi-grid">
          <article className="card kpi">
            <h3>Menunggu persetujuan</h3>
            <b>{summary.pending_count}</b>
            <span>Perlu keputusan</span>
            <Clock3 className="watermark" size={54} />
          </article>
          <article className="card kpi">
            <h3>Tim sedang cuti</h3>
            <b>{summary.team_on_leave.length}</b>
            <span>Hari ini</span>
            <Users className="watermark" size={54} />
          </article>
          <article className="card kpi">
            <h3>Hari libur berikutnya</h3>
            <b>{holidays[0] ? formatDate(holidays[0].date) : '—'}</b>
            <span>{holidays[0]?.name ?? 'Belum ada data'}</span>
            <CalendarDays className="watermark" size={54} />
          </article>
        </div>

        <section className="card panel">
          <div className="panel__head">
            <h2>Sedang cuti</h2>
            <Link to="/app/calendar" className="hint">Lihat kalender</Link>
          </div>
          <div className="list-soft">
            {summary.team_on_leave.map((person, index) => (
              <article key={`${person.name}-${index}`}>
                <strong>{person.name}</strong>
                <span className="badge badge--sky">s.d. {person.until}</span>
              </article>
            ))}
            {summary.team_on_leave.length === 0 && <p className="hint">Tidak ada yang sedang cuti.</p>}
          </div>
        </section>
      </div>
    )
  }

/*
    return (
      <div>
        <div className="page-head">
          <div>
            <h1>{greeting()}, {user.name.split(' ')[0]}.</h1>
            <p>Berikut ringkasan aktivitas cuti organisasi hari ini.</p>
          </div>
        </div>

        <div className="kpi-grid">
          <article className="card kpi">
            <h3>Menunggu persetujuan</h3>
            <b>{summary.pending_count}</b>
            <span>Perlu keputusan</span>
            <Clock3 className="watermark" size={54} />
          </article>
          <article className="card kpi">
            <h3>Tim sedang cuti</h3>
            <b>{summary.team_on_leave.length}</b>
            <span>Hari ini</span>
            <Users className="watermark" size={54} />
          </article>
          <article className="card kpi">
            <h3>Hari libur berikutnya</h3>
            <b>{holidays[0] ? formatDate(holidays[0].date) : '—'}</b>
            <span>{holidays[0]?.name ?? 'Belum ada data'}</span>
            <CalendarDays className="watermark" size={54} />
          </article>
        </div>

        <section className="card panel">
          <div className="panel__head">
            <h2>Sedang cuti</h2>
            <Link to="/app/calendar" className="hint">Lihat kalender</Link>
          </div>
          <div className="list-soft">
            {summary.team_on_leave.map((person, index) => (
              <article key={`${person.name}-${index}`}>
                <strong>{person.name}</strong>
                <span className="badge badge--sky">s.d. {person.until}</span>
              </article>
            ))}
            {summary.team_on_leave.length === 0 && <p className="hint">Tidak ada yang sedang cuti.</p>}
          </div>
        </section>
      </div>
    )
  Clock3,
  Users,
} from 'lucide-react'

import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import {
  formatDate,
  greeting,
} from '../lib/format'


export default function Dashboard() {
  const { user } = useAuth()

  const [employees, setEmployees] = useState([])
  const [holidays, setHolidays] = useState([])
  const [showCalendar, setShowCalendar] = useState(false)

  const [summary, setSummary] = useState({
    team_on_leave: [],
    pending_count: 0,
    monthly_request: [],
    remaining_leave: 0,
  })


  useEffect(() => {
    loadDashboard()
  }, [])


  async function loadDashboard() {
    try {
      const [
        employeeRes,
        summaryRes,
        holidayRes,
      ] = await Promise.all([
        api.get('/employees'),
        api.get('/dashboard/summary'),
        api.get('/holidays'),
      ])

      setEmployees(employeeRes.data)
      setSummary(summaryRes.data)
      setHolidays(holidayRes.data)

    } catch (error) {
      console.error(error)
    }
  }


  const nextHoliday = holidays[0]


  const chartData =
    summary.monthly_request || []


  const maxChart =
    Math.max(...chartData, 1)


  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ]

  return (
    <div>

      <div className="page-head">
        <div>

          <h1>
            {greeting()}, {user.name.split(' ')[0]}.
          </h1>

          <p>
            Berikut ringkasan aktivitas cuti organisasi hari ini.
          </p>

        </div>
      </div>



      <div className="kpi-grid">


        <article className="card kpi">
          <h3>Sisa cuti tahunan</h3>
          <b>{remaining} hari</b>
          <span>dari {annual?.days ?? 0} hari kuota</span>
          <Plane className="watermark" size={54} />

          <h3>
            Total karyawan
          </h3>

          <b>
            {employees.length}
          </b>

          <span>
            Karyawan aktif
          </span>

          <Users
            className="watermark"
            size={54}
          />

        </article>




        <article className="card kpi">
          <h3>Menunggu persetujuan</h3>
          <b>{summary.pending_count}</b>
          <span>perlu tinjauan atasan / HR</span>
          <Clock3 className="watermark" size={54} />

          <h3>
            Menunggu persetujuan
          </h3>

          <b>
            {summary.pending_count}
          </b>

          <span>
            Perlu keputusan HR
          </span>

          <Clock3
            className="watermark"
            size={54}
          />

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

          <h3>
            Tim sedang cuti
          </h3>

          <b>
            {summary.team_on_leave.length}
          </b>

          <span>
            Karyawan aktif cuti hari ini
          </span>

          <Users
            className="watermark"
            size={54}
          />

        </article>




        <article
          className="card kpi"
          onClick={() => setShowCalendar(true)}
          style={{
            cursor: 'pointer',
          }}
        >

          <h3>
            Hari libur berikutnya
          </h3>


          <b>
            {
              nextHoliday
                ? formatDate(nextHoliday.date)
                : '—'
            }
          </b>


          <span>
            {
              nextHoliday?.name ??
              'Belum ada data'
            }
          </span>


          <CalendarDays
            className="watermark"
            size={54}
          />

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
                  <th>Jenis</th>
                  <th>Periode</th>
                  <th>Hari</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((row) => (
                  <tr key={row.id}>
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
                    <td colSpan={4} className="empty">
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
        <section className="card panel">
  <div className="panel__head">
    <h2>Grafik pengajuan cuti</h2>
  </div>

  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 300,
      padding: '30px 8px 8px',
    }}
  >
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        padding: '60px 6px 0',
        borderBottom: '1px solid #e6eef8',
      }}
    >
      {chartData.map((value, index) => {
        const barHeight =
          value === 0 ? 8 : Math.max((value / maxChart) * 200, 24)

        return (
          <div
            key={index}
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              height: '100%',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 56,
                height: `${barHeight}px`,
                borderRadius: '12px 12px 6px 6px',
                background:
                  value === 0
                    ? '#d8eefc'
                    : 'linear-gradient(180deg, #43b7ff 0%, #8ed8ff 100%)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: value === 0 ? 0 : 8,
                color: '#0b5c8f',
                fontSize: 12,
                fontWeight: 700,
                transition: 'all .25s ease',
              }}
            >
              {value > 0 ? value : ''}
            </div>
          </div>
        )
      })}
    </div>

    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '8px 6px 0',
      }}
    >
      {months.map((month, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--muted)',
            lineHeight: 1.2,
          }}
        >
          {month}
        </div>
      ))}
    </div>
  </div>
</section>






        <section className="card panel">


          <div className="panel__head">

            <h2>
              Sedang cuti
            </h2>

          </div>



          <div className="list-soft">


            {
              summary.team_on_leave.map(
                (person, index) => (

                  <article
                    key={`${person.name}-${index}`}
                  >

                    <div>

                      <strong>
                        {person.name}
                      </strong>


                      <div className="hint">
                        {person.type}
                      </div>


                    </div>


                    <span className="badge badge--sky">
                      s.d. {person.until}
                    </span>


                  </article>

                )
              )
            }



            {
              summary.team_on_leave.length === 0 && (

                <p className="hint">
                  Tidak ada yang sedang cuti.
                </p>

              )
            }


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
      {
        showCalendar && (

          <div
            onClick={() => setShowCalendar(false)}

            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.35)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >


            <section
              className="card panel"

              onClick={(e) => e.stopPropagation()}

              style={{
                width: 420,
              }}
            >


              <div className="panel__head">

                <h2>
                  Kalender Hari Libur
                </h2>

              </div>



              {
                holidays.map((item) => (

                  <div
                    key={item.id}

                    className="notice"

                    style={{
                      marginBottom: 10,
                    }}
                  >

                    <strong>
                      {formatDate(item.date)}
                    </strong>


                    <div>
                      {item.name}
                    </div>


                  </div>

                ))
              }


            </section>


          </div>

        )
      }

    </div>
  )
}