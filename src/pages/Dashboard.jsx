import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, Plane, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  DEPT_LEAVE,
  HOLIDAYS,
  LEAVE_REQUESTS,
  LEAVE_TYPES,
  MONTHLY_TREND,
  TEAM_ON_LEAVE,
} from '../data/mock'
import { formatDate, greeting, initials, statusLabel } from '../lib/format'

export default function Dashboard() {
  const { user } = useAuth()
  const remaining = LEAVE_TYPES[0].days - LEAVE_TYPES[0].used
  const pending = LEAVE_REQUESTS.filter((item) => item.status === 'pending').length
  const maxDept = Math.max(...DEPT_LEAVE.map((d) => d.value))
  const maxTrend = Math.max(...MONTHLY_TREND)

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
          <span>dari {LEAVE_TYPES[0].days} hari kuota</span>
          <Plane className="watermark" size={54} />
        </article>
        <article className="card kpi">
          <h3>Menunggu persetujuan</h3>
          <b>{pending}</b>
          <span>perlu tinjauan atasan / HR</span>
          <Clock3 className="watermark" size={54} />
        </article>
        <article className="card kpi">
          <h3>Tim sedang cuti</h3>
          <b>{TEAM_ON_LEAVE.length}</b>
          <span>terlihat di kalender hari ini</span>
          <Users className="watermark" size={54} />
        </article>
        <article className="card kpi">
          <h3>Hari libur berikutnya</h3>
          <b>17 Agu</b>
          <span>{HOLIDAYS[0].name}</span>
          <CalendarDays className="watermark" size={54} />
        </article>
      </div>

      <div className="dash-grid">
        <section className="card panel">
          <div className="panel__head">
            <h2>Permohonan terbaru</h2>
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
                {LEAVE_REQUESTS.slice(0, 5).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="person">
                        <span className="avatar">{initials(row.employee)}</span>
                        <span>
                          <strong>{row.employee}</strong>
                          <span>{row.department}</span>
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
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 16 }}>
          <section className="card panel">
            <div className="panel__head">
              <h2>Utilisasi per departemen</h2>
            </div>
            <div className="bars">
              {DEPT_LEAVE.map((dept) => (
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
          <section className="card panel">
            <div className="panel__head">
              <h2>Sedang cuti</h2>
            </div>
            <div className="list-soft">
              {TEAM_ON_LEAVE.map((person) => (
                <article key={person.name}>
                  <div>
                    <strong>{person.name}</strong>
                    <div className="hint">{person.type}</div>
                  </div>
                  <span className="badge badge--sky">s.d. {person.until}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="dash-grid" style={{ marginTop: 16 }}>
        <section className="card panel">
          <div className="panel__head">
            <h2>Tren pengajuan 2026</h2>
            <span className="hint">Jan – Agu</span>
          </div>
          <div className="spark">
            {MONTHLY_TREND.map((value, index) => (
              <i
                key={index}
                style={{ height: value ? `${(value / maxTrend) * 100}%` : '8%' }}
                title={`Bulan ${index + 1}: ${value}`}
              />
            ))}
          </div>
        </section>
        <section className="card panel">
          <div className="panel__head">
            <h2>Hari libur nasional</h2>
          </div>
          <div className="list-soft">
            {HOLIDAYS.map((item) => (
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
