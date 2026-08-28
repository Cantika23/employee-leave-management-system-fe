import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  FilePlus2,
  History,
  Plane,
  XCircle,
} from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import {
  formatDate,
  greeting,
  statusLabel,
} from '../../lib/format'

export default function EmployeeDashboard() {
  const { user } = useAuth()

  const [leaveTypes, setLeaveTypes] = useState([])
  const [requests, setRequests] = useState([])

  useEffect(() => {
    api
      .get('/leave-types')
      .then((res) => {
        setLeaveTypes(res.data)
      })
      .catch(() => {
        setLeaveTypes([])
      })

    api
      .get('/leave-requests')
      .then((res) => {
        setRequests(res.data)
      })
      .catch(() => {
        setRequests([])
      })
  }, [])

  /*
   * Cari cuti tahunan berdasarkan slug.
   * Jangan pakai t.id === 'annual'
   * karena id biasanya berupa angka dari database.
   */
  const annual = leaveTypes.find(
    (item) =>
      item.slug === 'annual' ||
      item.name?.toLowerCase() === 'cuti tahunan',
  )

  /*
   * Ambil sisa cuti.
   *
   * Prioritas:
   * 1. remaining
   * 2. allocated - used
   * 3. days - used
   */
  const remaining = annual
    ? annual.remaining ??
      Math.max(
        0,
        (annual.allocated ?? annual.days ?? 0) -
          (annual.used ?? 0),
      )
    : 0

  /*
   * Ambil total kuota cuti.
   */
  const totalLeave = annual
    ? annual.allocated ??
      annual.days ??
      0
    : 0

  const active = requests.filter(
    (item) => item.status === 'pending',
  ).length

  const approved = requests.filter(
    (item) => item.status === 'approved',
  ).length

  const rejected = requests.filter(
    (item) => item.status === 'rejected',
  ).length

  const recent = requests.slice(0, 5)

  return (
    <div>
      <div
        className="page-head"
        style={{
          marginBottom: 24,
        }}
      >
        <div>
          <h1>
            {greeting()}, {user.name.split(' ')[0]}.
          </h1>

          <p>
            Berikut ringkasan pengajuan cuti/izin/sakit Anda.
          </p>
        </div>

        <Link
          to="/app/leave/apply"
          className="btn btn-primary"
        >
          Ajukan cuti
        </Link>
      </div>

      <div
        className="kpi-grid"
        style={{
          marginBottom: 24,
        }}
      >
        <article className="card kpi">
          <h3>Sisa cuti</h3>

          <b>{remaining} hari</b>

          <span>
            dari {totalLeave} hari kuota
          </span>

          <Plane
            className="watermark"
            size={54}
          />
        </article>

        <article className="card kpi">
          <h3>Pengajuan aktif</h3>

          <b>{active}</b>

          <span>
            menunggu keputusan
          </span>

          <Clock3
            className="watermark"
            size={54}
          />
        </article>

        <article className="card kpi">
          <h3>Pengajuan disetujui</h3>

          <b>{approved}</b>

          <span>
            sepanjang tahun ini
          </span>

          <CheckCircle2
            className="watermark"
            size={54}
          />
        </article>

        <article className="card kpi">
          <h3>Pengajuan ditolak</h3>

          <b>{rejected}</b>

          <span>
            sepanjang tahun ini
          </span>

          <XCircle
            className="watermark"
            size={54}
          />
        </article>
      </div>

      <section
        className="card panel"
        style={{
          marginBottom: 24,
        }}
      >
        <div
          className="panel__head"
          style={{
            marginBottom: 12,
          }}
        >
          <h2>
            Pengajuan terbaru
          </h2>

          <Link
            to="/app/leave/history"
            className="hint"
          >
            Lihat semua
          </Link>
        </div>

        <div
          className="list-soft"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {recent.map((row) => {
            const StatusIcon =
              row.status === 'approved'
                ? CheckCircle2
                : row.status === 'rejected'
                  ? XCircle
                  : Clock3

            return (
              <Link
                to="/app/leave/history"
                key={row.id}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <article
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'space-between',
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span
                      className={`status-dot status-dot--${row.status}`}
                    >
                      <StatusIcon
                        size={16}
                      />
                    </span>

                    <div>
                      <strong>
                        {row.type}
                      </strong>

                      <div className="hint">
                        {formatDate(row.from)}
                        {' – '}
                        {formatDate(row.to)}
                        {' · '}
                        {row.days} hari
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span
                      className={`badge badge--${row.status}`}
                    >
                      {statusLabel(row.status)}
                    </span>

                    <ChevronRight
                      size={16}
                      className="hint"
                    />
                  </div>
                </article>
              </Link>
            )
          })}

          {recent.length === 0 && (
            <p className="hint">
              Belum ada pengajuan.
            </p>
          )}
        </div>
      </section>

      <div
        className="dash-grid"
        style={{
          marginTop: 16,
        }}
      >
        <Link
          to="/app/leave/apply"
          className="card panel shortcut-card"
        >
          <FilePlus2 size={22} />

          <div>
            <strong>
              Ajukan Cuti/Izin/Sakit
            </strong>

            <div className="hint">
              Buat pengajuan baru
            </div>
          </div>
        </Link>

        <Link
          to="/app/leave/history"
          className="card panel shortcut-card"
        >
          <History size={22} />

          <div>
            <strong>
              Riwayat Pengajuan
            </strong>

            <div className="hint">
              Lihat riwayat pengajuan
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}