import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FilePlus2,
  History,
  Plane,
  X,
  XCircle,
} from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import {
  formatDate,
  greeting,
  statusLabel,
} from '../../lib/format'

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const AVATAR_PALETTE = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
]

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function avatarColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/*
 * Ubah rentang from..to jadi daftar key tanggal (YYYY-MM-DD),
 * dipakai untuk "menyebar" satu pengajuan cuti ke tiap hari
 * di dalam rentangnya pada kalender.
 */
function expandRangeKeys(from, to) {
  const keys = []
  const start = new Date(from)
  const end = new Date(to)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    keys.push(toKey(d))
  }

  return keys
}

/*
 * Modal kalender tim — dipanggil dari icon kalender di dashboard.
 * Fetch cuti tim dari GET /leave-requests/team
 * -> [{ id, user_name, type, from, to, status }, ...]
 * Sesuaikan path/field ini kalau beda dengan API kamu.
 * Kalau endpoint gagal/404, modal tetap jalan normal, cuma
 * tidak menampilkan marker cuti.
 */
function TeamCalendarModal({ onClose, currentUserName }) {
  const [loading, setLoading] = useState(true)
  const [teamLeaves, setTeamLeaves] = useState([])
  const [fallbackOnly, setFallbackOnly] = useState(false)
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await api.get('/leave-requests/team')
        if (!cancelled) setTeamLeaves(res.data)
      } catch {
        // Endpoint cuti tim belum tersedia di backend.
        // Fallback: minimal tampilkan cuti milik sendiri dulu,
        // supaya kalender tidak kosong total.
        try {
          const res = await api.get('/leave-requests')
          const own = (res.data || []).map((item) => ({
            ...item,
            user_name: item.user_name || currentUserName || 'Saya',
          }))
          if (!cancelled) {
            setTeamLeaves(own)
            setFallbackOnly(true)
          }
        } catch {
          if (!cancelled) setTeamLeaves([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [currentUserName])

  const eventsByDay = useMemo(() => {
    const map = {}

    teamLeaves
      .filter((item) => item.status === 'approved')
      .forEach((item) => {
        expandRangeKeys(item.from, item.to).forEach((key) => {
          map[key] = map[key] || []
          map[key].push(item)
        })
      })

    return map
  }, [teamLeaves])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const today = new Date()

  const cells = []
  for (let i = startOffset; i > 0; i -= 1) {
    cells.push({ date: new Date(year, month - 1, prevDays - i + 1), muted: true })
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ date: new Date(year, month, d), muted: false })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      muted: true,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          maxHeight: '85vh',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17 }}>Kalender Tim</h2>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: 4 }}
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="cal-head"
          style={{
            marginBottom: 8,
            flexShrink: 0,
          }}
        >
          <button
            className="icon-btn"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          <h2 style={{ fontSize: 14 }}>
            {MONTHS[month]} {year}
          </h2>

          <button
            className="icon-btn"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto' }}>
          {loading ? (
            <p className="hint">Memuat data cuti tim…</p>
          ) : (
            <>
              {fallbackOnly && (
                <p
                  className="hint"
                  style={{
                    marginBottom: 8,
                    padding: '6px 8px',
                    borderRadius: 8,
                    fontSize: 12,
                    background: 'rgba(217, 119, 6, 0.12)',
                    color: '#b45309',
                  }}
                >
                  Endpoint cuti tim belum tersedia — kalender ini baru
                  menampilkan cuti kamu sendiri.
                </p>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 3,
                }}
              >
                {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map((dow, i) => (
                  <div
                    key={i}
                    className="hint"
                    style={{
                      textAlign: 'center',
                      fontSize: 10,
                      paddingBottom: 4,
                    }}
                  >
                    {dow}
                  </div>
                ))}

                {cells.map((cell) => {
                  const key = toKey(cell.date)
                  const isToday = toKey(cell.date) === toKey(today)
                  const dayLeaves = eventsByDay[key] || []
                  const hasLeave = dayLeaves.length > 0
                  const visible = dayLeaves.slice(0, 3)
                  const hiddenCount = dayLeaves.length - visible.length

                  return (
                    <div
                      key={key + cell.muted}
                      title={
                        hasLeave
                          ? dayLeaves.map((item) => item.user_name).join(', ')
                          : undefined
                      }
                      style={{
                        aspectRatio: '1 / 1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        borderRadius: 8,
                        border: isToday
                          ? '1px solid #2563eb'
                          : '1px solid transparent',
                        opacity: cell.muted ? 0.35 : 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: hasLeave ? 700 : 400,
                          color: hasLeave ? '#2563eb' : 'inherit',
                        }}
                      >
                        {cell.date.getDate()}
                      </span>

                      {hasLeave && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {visible.map((item, i) => (
                            <span
                              key={item.id}
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: avatarColor(item.user_name),
                                color: '#fff',
                                fontSize: 6,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1.5px solid var(--card-bg, #fff)',
                                marginLeft: i === 0 ? 0 : -5,
                              }}
                            >
                              {initials(item.user_name)}
                            </span>
                          ))}

                          {hiddenCount > 0 && (
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: '#94a3b8',
                                color: '#fff',
                                fontSize: 6,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1.5px solid var(--card-bg, #fff)',
                                marginLeft: -5,
                              }}
                            >
                              +{hiddenCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EmployeeDashboard() {
  const { user } = useAuth()

  const [leaveTypes, setLeaveTypes] = useState([])
  const [requests, setRequests] = useState([])
  const [showTeamCalendar, setShowTeamCalendar] = useState(false)

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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => setShowTeamCalendar(true)}
            className="btn btn-ghost"
            aria-label="Kalender tim"
            title="Kalender tim"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              padding: 0,
            }}
          >
            <CalendarIcon size={20} />
          </button>

          <Link
            to="/app/leave/apply"
            className="btn btn-primary"
          >
            Ajukan cuti
          </Link>
        </div>
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

      {showTeamCalendar && (
        <TeamCalendarModal
          onClose={() => setShowTeamCalendar(false)}
          currentUserName={user.name}
        />
      )}
    </div>
  )
}