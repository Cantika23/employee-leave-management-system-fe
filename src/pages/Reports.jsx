import { DEPT_LEAVE, LEAVE_REQUESTS, MONTHLY_TREND } from '../data/mock'

export default function Reports() {
  const approved = LEAVE_REQUESTS.filter((item) => item.status === 'approved').length
  const pending = LEAVE_REQUESTS.filter((item) => item.status === 'pending').length
  const rejected = LEAVE_REQUESTS.filter((item) => item.status === 'rejected').length
  const maxTrend = Math.max(...MONTHLY_TREND)
  const maxDept = Math.max(...DEPT_LEAVE.map((d) => d.value))

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Laporan & analitik</h1>
          <p>Ringkasan eksekutif untuk tinjauan people, finance, dan pimpinan unit.</p>
        </div>
        <button className="btn btn-outline" type="button">
          Unduh ringkasan
        </button>
      </div>

      <div className="kpi-grid">
        <article className="card kpi">
          <h3>Total permohonan</h3>
          <b>{LEAVE_REQUESTS.length}</b>
          <span>periode berjalan</span>
        </article>
        <article className="card kpi">
          <h3>Disetujui</h3>
          <b>{approved}</b>
          <span>siap diposting ke kalender</span>
        </article>
        <article className="card kpi">
          <h3>Menunggu</h3>
          <b>{pending}</b>
          <span>perlu keputusan</span>
        </article>
        <article className="card kpi">
          <h3>Ditolak</h3>
          <b>{rejected}</b>
          <span>dengan catatan penolakan</span>
        </article>
      </div>

      <div className="dash-grid">
        <section className="card panel">
          <div className="panel__head">
            <h2>Volume bulanan</h2>
          </div>
          <div className="spark">
            {MONTHLY_TREND.map((value, index) => (
              <i key={index} style={{ height: value ? `${(value / maxTrend) * 100}%` : '8%' }} />
            ))}
          </div>
        </section>
        <section className="card panel">
          <div className="panel__head">
            <h2>Hari cuti per unit</h2>
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
      </div>
    </div>
  )
}
