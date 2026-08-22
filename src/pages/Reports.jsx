import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

export default function Reports() {
  const { push } = useToast()
  const [data, setData] = useState(null)

  useEffect(() => {
    api
      .get('/reports')
      .then((res) => setData(res.data))
      .catch(() => push('Gagal memuat laporan.', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!data) {
    return (
      <div className="page-head">
        <div>
          <h1>Laporan & analitik</h1>
          <p>Memuat data...</p>
        </div>
      </div>
    )
  }

  const maxTrend = Math.max(...data.monthly_trend, 1)
  const maxDept = Math.max(...data.dept_leave.map((d) => d.value), 1)

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
          <b>{data.total}</b>
          <span>periode berjalan</span>
        </article>
        <article className="card kpi">
          <h3>Disetujui</h3>
          <b>{data.approved}</b>
          <span>siap diposting ke kalender</span>
        </article>
        <article className="card kpi">
          <h3>Menunggu</h3>
          <b>{data.pending}</b>
          <span>perlu keputusan</span>
        </article>
        <article className="card kpi">
          <h3>Ditolak</h3>
          <b>{data.rejected}</b>
          <span>dengan catatan penolakan</span>
        </article>
      </div>

      <div className="dash-grid">
        <section className="card panel">
          <div className="panel__head">
            <h2>Volume bulanan</h2>
          </div>
          <div className="spark">
            {data.monthly_trend.map((value, index) => (
              <i key={index} style={{ height: value ? `${(value / maxTrend) * 100}%` : '8%' }} />
            ))}
          </div>
        </section>
        <section className="card panel">
          <div className="panel__head">
            <h2>Hari cuti per unit</h2>
          </div>
          <div className="bars">
            {data.dept_leave.map((dept) => (
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
