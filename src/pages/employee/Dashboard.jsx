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
  Users,
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

const DOW = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg']

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
  const [selectedKey, setSelectedKey] = useState(null)
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
  const todayKey = toKey(today)

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

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  // Ringkasan: berapa orang unik yang punya cuti approved di bulan yang sedang dilihat
  const monthSummary = useMemo(() => {
    const names = new Set()
    let dayCount = 0
    Object.entries(eventsByDay).forEach(([key, items]) => {
      const [ky, km] = key.split('-').map(Number)
      if (ky === year && km - 1 === month) {
        dayCount += 1
        items.forEach((item) => names.add(item.user_name))
      }
    })
    return { people: names.size, days: dayCount }
  }, [eventsByDay, year, month])

  const selectedLeaves = selectedKey ? eventsByDay[selectedKey] || [] : []

  function goToday() {
    const d = new Date()
    d.setDate(1)
    setCursor(d)
    setSelectedKey(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <style>{`
        .tcal-daybtn {
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: background-color 120ms ease, border-color 120ms ease, transform 80ms ease;
        }
        .tcal-daybtn:hover:not(.tcal-daybtn--muted) {
          background-color: rgba(37, 99, 235, 0.08);
          border-color: rgba(37, 99, 235, 0.25);
        }
        .tcal-daybtn:active:not(.tcal-daybtn--muted) {
          transform: scale(0.96);
        }
        .tcal-daybtn--selected {
          background-color: rgba(37, 99, 235, 0.14) !important;
          border-color: #2563eb !important;
        }
        .tcal-daybtn--weekend {
          background-color: rgba(100, 116, 139, 0.05);
        }
        .tcal-avatar {
          transition: transform 120ms ease;
        }
        .tcal-avatar:hover {
          transform: translateY(-2px);
          z-index: 5;
        }
        .tcal-navbtn {
          transition: background-color 120ms ease;
        }
        .tcal-navbtn:hover {
          background-color: rgba(100, 116, 139, 0.12);
        }
        .tcal-skel {
          background: linear-gradient(90deg, rgba(148,163,184,0.15) 25%, rgba(148,163,184,0.28) 37%, rgba(148,163,184,0.15) 63%);
          background-size: 400% 100%;
          animation: tcal-shimmer 1.4s ease infinite;
          border-radius: 8px;
        }
        @keyframes tcal-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
      `}</style>

      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '88vh',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '18px 18px 14px',
            borderBottom: '1px solid rgba(100, 116, 139, 0.14)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CalendarIcon size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.3 }}>Kalender Tim</h2>
              <p className="hint" style={{ margin: '2px 0 0', fontSize: 12.5 }}>
                Lihat siapa saja yang sedang cuti
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: 4, flexShrink: 0 }}
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '14px 18px 18px', overflowY: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              className="tcal-navbtn"
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
              }
              aria-label="Bulan sebelumnya"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: '1px solid rgba(100, 116, 139, 0.2)',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={15} />
            </button>

            <button
              type="button"
              onClick={goToday}
              disabled={isCurrentMonth}
              style={{
                background: 'none',
                border: 'none',
                cursor: isCurrentMonth ? 'default' : 'pointer',
                textAlign: 'center',
                padding: 0,
              }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                {MONTHS[month]} {year}
              </div>
              {!isCurrentMonth && (
                <div style={{ fontSize: 11, color: '#2563eb', marginTop: 1 }}>
                  Kembali ke hari ini
                </div>
              )}
            </button>

            <button
              type="button"
              className="tcal-navbtn"
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
              }
              aria-label="Bulan berikutnya"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: '1px solid rgba(100, 116, 139, 0.2)',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {fallbackOnly && !loading && (
            <p
              className="hint"
              style={{
                marginBottom: 10,
                padding: '7px 9px',
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

          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
              }}
            >
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="tcal-skel" style={{ aspectRatio: '1 / 1' }} />
              ))}
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  marginBottom: 4,
                }}
              >
                {DOW.map((dow, i) => (
                  <div
                    key={i}
                    className="hint"
                    style={{
                      textAlign: 'center',
                      fontSize: 10.5,
                      fontWeight: 600,
                      paddingBottom: 6,
                      color: i >= 5 ? '#94a3b8' : undefined,
                    }}
                  >
                    {dow}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 3,
                }}
              >
                {cells.map((cell, idx) => {
                  const key = toKey(cell.date)
                  const isToday = key === todayKey
                  const isWeekend = idx % 7 >= 5
                  const dayLeaves = eventsByDay[key] || []
                  const hasLeave = dayLeaves.length > 0
                  const visible = dayLeaves.slice(0, 3)
                  const hiddenCount = dayLeaves.length - visible.length
                  const isSelected = selectedKey === key && hasLeave

                  const classNames = [
                    'tcal-daybtn',
                    cell.muted ? 'tcal-daybtn--muted' : '',
                    isWeekend && !cell.muted ? 'tcal-daybtn--weekend' : '',
                    isSelected ? 'tcal-daybtn--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <button
                      type="button"
                      key={key + cell.muted}
                      className={classNames}
                      disabled={!hasLeave}
                      onClick={() =>
                        setSelectedKey((prev) => (prev === key ? null : key))
                      }
                      style={{
                        aspectRatio: '1 / 1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        borderRadius: 9,
                        opacity: cell.muted ? 0.32 : 1,
                        ...(isToday
                          ? {
                              backgroundColor: '#2563eb',
                              borderColor: '#2563eb',
                            }
                          : {}),
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: hasLeave || isToday ? 700 : 500,
                          color: isToday
                            ? '#fff'
                            : hasLeave
                              ? '#2563eb'
                              : isWeekend
                                ? '#94a3b8'
                                : 'inherit',
                        }}
                      >
                        {cell.date.getDate()}
                      </span>

                      {hasLeave && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {visible.map((item, i) => (
                            <span
                              key={item.id}
                              className="tcal-avatar"
                              style={{
                                width: 15,
                                height: 15,
                                borderRadius: '50%',
                                background: avatarColor(item.user_name),
                                color: '#fff',
                                fontSize: 6,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: isToday
                                  ? '1.5px solid #2563eb'
                                  : '1.5px solid var(--card-bg, #fff)',
                                marginLeft: i === 0 ? 0 : -5,
                              }}
                            >
                              {initials(item.user_name)}
                            </span>
                          ))}

                          {hiddenCount > 0 && (
                            <span
                              className="tcal-avatar"
                              style={{
                                width: 15,
                                height: 15,
                                borderRadius: '50%',
                                background: '#94a3b8',
                                color: '#fff',
                                fontSize: 6,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: isToday
                                  ? '1.5px solid #2563eb'
                                  : '1.5px solid var(--card-bg, #fff)',
                                marginLeft: -5,
                              }}
                            >
                              +{hiddenCount}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedKey && selectedLeaves.length > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(37, 99, 235, 0.06)',
                    border: '1px solid rgba(37, 99, 235, 0.18)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                    {formatDate(selectedKey)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {selectedLeaves.map((item) => (
                      <div
                        key={item.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: avatarColor(item.user_name),
                            color: '#fff',
                            fontSize: 8,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {initials(item.user_name)}
                        </span>
                        <span style={{ fontSize: 12.5 }}>{item.user_name}</span>
                        <span className="hint" style={{ fontSize: 11.5, marginLeft: 'auto' }}>
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(100, 116, 139, 0.14)',
                }}
              >
                <Users size={14} className="hint" />
                <span className="hint" style={{ fontSize: 12 }}>
                  {monthSummary.people > 0
                    ? `${monthSummary.people} orang cuti di ${monthSummary.days} hari bulan ini`
                    : 'Belum ada cuti tercatat bulan ini'}
                </span>
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