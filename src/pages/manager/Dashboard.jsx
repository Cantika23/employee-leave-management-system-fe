import { useEffect, useMemo, useState } from 'react'
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plane,
  Users,
  X,
} from 'lucide-react'
// note: `useMemo` sudah di-import di baris pertama, dipakai baik oleh
// CalendarModal maupun komponen Dashbosrd di bawah

import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import {
  formatDate,
  greeting,
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

// Hari libur nasional 2026 sesuai SKB 3 Menteri (Kepmenag No. 1497/2025,
// Kepmenaker No. 2/2025, KepmenPANRB No. 5/2025) — 17 hari libur nasional.
// Dipakai sebagai sumber data "kalender nyata", bukan lagi dari API /holidays.
const NATIONAL_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi' },
  { date: '2026-01-16', name: 'Isra Mikraj Nabi Muhammad SAW' },
  { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili' },
  { date: '2026-03-19', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)' },
  { date: '2026-03-21', name: 'Hari Raya Idulfitri 1447 H' },
  { date: '2026-03-22', name: 'Hari Raya Idulfitri 1447 H' },
  { date: '2026-04-03', name: 'Wafat Yesus Kristus' },
  { date: '2026-04-05', name: 'Kebangkitan Yesus Kristus (Paskah)' },
  { date: '2026-05-01', name: 'Hari Buruh Internasional' },
  { date: '2026-05-14', name: 'Kenaikan Yesus Kristus' },
  { date: '2026-05-27', name: 'Hari Raya Iduladha 1447 H' },
  { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE' },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila' },
  { date: '2026-06-16', name: '1 Muharam Tahun Baru Islam 1448 H' },
  { date: '2026-08-17', name: 'Hari Proklamasi Kemerdekaan RI' },
  { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW' },
  { date: '2026-12-25', name: 'Hari Raya Natal' },
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
 * Modal kalender admin — menampilkan cuti tim dalam satu
 * grid bulanan, dengan navigasi bulan + gaya interaksi yang sama
 * dengan TeamCalendarModal di EmployeeDashboard (skeleton loading,
 * hover/active state, styling weekend, tombol "kembali ke hari ini",
 * ringkasan jumlah orang cuti per bulan).
 *
 * Fetch cuti tim dari GET /leave-requests/team. Kalau endpoint itu
 * belum ada di backend, fallback ke GET /leave-requests (biasanya
 * berisi semua pengajuan untuk role admin/HR). Kalau tetap gagal,
 * kalender tetap tampil normal, cuma tanpa marker cuti.
 */
function CalendarModal({ onClose }) {
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
        try {
          const res = await api.get('/leave-requests')
          if (!cancelled) {
            setTeamLeaves(res.data || [])
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
  }, [])

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
        .cal-daybtn {
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: background-color 120ms ease, border-color 120ms ease, transform 80ms ease;
        }
        .cal-daybtn:hover:not(.cal-daybtn--muted) {
          background-color: rgba(37, 99, 235, 0.08);
          border-color: rgba(37, 99, 235, 0.25);
        }
        .cal-daybtn:active:not(.cal-daybtn--muted) {
          transform: scale(0.96);
        }
        .cal-daybtn--selected {
          background-color: rgba(37, 99, 235, 0.14) !important;
          border-color: #2563eb !important;
        }
        .cal-daybtn--weekend {
          background-color: rgba(100, 116, 139, 0.05);
        }
        .cal-avatar {
          transition: transform 120ms ease;
        }
        .cal-avatar:hover {
          transform: translateY(-2px);
          z-index: 5;
        }
        .cal-navbtn {
          transition: background-color 120ms ease;
        }
        .cal-navbtn:hover {
          background-color: rgba(100, 116, 139, 0.12);
        }
        .cal-skel {
          background: linear-gradient(90deg, rgba(148,163,184,0.15) 25%, rgba(148,163,184,0.28) 37%, rgba(148,163,184,0.15) 63%);
          background-size: 400% 100%;
          animation: cal-shimmer 1.4s ease infinite;
          border-radius: 8px;
        }
        @keyframes cal-shimmer {
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
              className="cal-navbtn"
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
              className="cal-navbtn"
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
              Endpoint cuti tim khusus belum tersedia — kalender ini
              menampilkan data dari daftar pengajuan umum.
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
                <div key={i} className="cal-skel" style={{ aspectRatio: '1 / 1' }} />
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
                    'cal-daybtn',
                    cell.muted ? 'cal-daybtn--muted' : '',
                    isWeekend && !cell.muted ? 'cal-daybtn--weekend' : '',
                    isSelected ? 'cal-daybtn--selected' : '',
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
                              className="cal-avatar"
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
                              className="cal-avatar"
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

export default function Dashbosrd() {
  const { user } = useAuth()

  const [leaveTypes, setLeaveTypes] = useState([])
  const holidays = NATIONAL_HOLIDAYS_2026 // sumber: kalender hari libur nasional asli, bukan dari API
  const [showCalendar, setShowCalendar] = useState(false)
  const [hoverMonth, setHoverMonth] = useState(null) // di-set saat mouse di atas bar (desktop)
  const [pinnedMonth, setPinnedMonth] = useState(null) // di-set saat tap di layar sentuh (tanpa hover)
  const activeMonth = hoverMonth ?? pinnedMonth

  const [summary, setSummary] = useState({
    team_on_leave: [],
    pending_count: 0,
    monthly_request: [],
    monthly_by_department: [],
    remaining_leave: 0,
  })


  useEffect(() => {
    loadDashboard()
  }, [])


  async function loadDashboard() {
    try {
      const [
        summaryRes,
        leaveTypeRes,
      ] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/leave-types'),
      ])

      setSummary(summaryRes.data)
      setLeaveTypes(leaveTypeRes.data)

    } catch (error) {
      console.error(error)
    }
  }


  /*
   * Cari cuti tahunan berdasarkan slug (sama seperti di EmployeeDashboard).
   * Jangan pakai t.id === 'annual' karena id biasanya angka dari database.
   */
  const annual = leaveTypes.find(
    (item) =>
      item.slug === 'annual' ||
      item.name?.toLowerCase() === 'cuti tahunan',
  )

  const remainingLeave = annual
    ? annual.remaining ??
      Math.max(
        0,
        (annual.allocated ?? annual.days ?? 0) -
          (annual.used ?? 0),
      )
    : 0

  const totalLeave = annual
    ? annual.allocated ??
      annual.days ??
      0
    : 0

  const nextHoliday = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    return holidays
      .filter((item) => new Date(item.date) >= startOfToday)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0]
  }, [holidays])


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

  const currentYear = new Date().getFullYear()

  // Rincian per departemen untuk bulan yang sedang di-hover/tap. Diambil dari
  // summary.monthly_by_department[index], array berisi
  // { department, count } untuk bulan tsb. Kalau backend belum
  // mengirim field ini, tooltip akan bilang datanya belum tersedia
  // alih-alih diam-diam kosong.
  const departmentBreakdown = useMemo(() => {
    if (activeMonth === null) return null
    const raw = summary.monthly_by_department?.[activeMonth]
    if (!raw || raw.length === 0) return []
    const total = raw.reduce((sum, item) => sum + item.count, 0) || 1
    return [...raw]
      .sort((a, b) => b.count - a.count)
      .map((item) => ({ ...item, pct: (item.count / total) * 100 }))
  }, [activeMonth, summary.monthly_by_department])

  const hasDepartmentField = Array.isArray(summary.monthly_by_department) && summary.monthly_by_department.length > 0


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

        <button
          type="button"
          onClick={() => setShowCalendar(true)}
          className="btn btn-ghost"
          aria-label="Kalender"
          title="Kalender"
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
      </div>



      <div className="kpi-grid">


        <article className="card kpi">

          <h3>
            Sisa cuti
          </h3>

          <b>
            {remainingLeave} hari
          </b>

          <span>
            dari {totalLeave} hari kuota
          </span>

          <Plane
            className="watermark"
            size={54}
          />

        </article>




        <article className="card kpi">

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




        <article className="card kpi">

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
    <h2>Grafik pengajuan cuti</h2>
  </div>

  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 300,
      padding: '18px 8px 8px',
    }}
  >
    <div
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        padding: '60px 6px 0',
        borderBottom: '1px solid #e6eef8',
      }}
    >
      {/* ---- Tooltip mengambang, muncul saat hover/tap, mengikuti posisi bulan aktif ---- */}
      {activeMonth !== null && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: `${((activeMonth + 0.5) / 12) * 100}%`,
            top: 0,
            transform: 'translate(-50%, -100%)',
            marginTop: -8,
            zIndex: 5,
            width: 190,
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
            border: '1px solid #e6eef8',
            padding: '10px 12px',
            pointerEvents: 'none',
          }}
        >
          <strong style={{ fontSize: 12 }}>
            {MONTHS[activeMonth]} {currentYear}
          </strong>

          {!hasDepartmentField && (
            <p className="hint" style={{ margin: '6px 0 0', fontSize: 11 }}>
              Data per departemen belum tersedia dari server.
            </p>
          )}

          {hasDepartmentField && departmentBreakdown && departmentBreakdown.length === 0 && (
            <p className="hint" style={{ margin: '6px 0 0', fontSize: 11 }}>
              Tidak ada pengajuan cuti di bulan ini.
            </p>
          )}

          {hasDepartmentField && departmentBreakdown && departmentBreakdown.length > 0 && (
            <div style={{ marginTop: 6, display: 'grid', gap: 4 }}>
              {departmentBreakdown.map((item) => (
                <div
                  key={item.department}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: '#0b5c8f',
                  }}
                >
                  <span>{item.department}</span>
                  <b>{item.count} pengajuan</b>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {chartData.map((value, index) => {
        const barHeight =
          value === 0 ? 8 : Math.max((value / maxChart) * 200, 24)
        const isActive = activeMonth === index

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
            <button
              type="button"
              onMouseEnter={() => setHoverMonth(index)}
              onMouseLeave={() => setHoverMonth(null)}
              onFocus={() => setHoverMonth(index)}
              onBlur={() => setHoverMonth(null)}
              onClick={() => setPinnedMonth((prev) => (prev === index ? null : index))}
              aria-pressed={isActive}
              style={{
                width: '100%',
                maxWidth: 56,
                height: `${barHeight}px`,
                borderRadius: '12px 12px 6px 6px',
                border: isActive ? '2px solid #2563eb' : '2px solid transparent',
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
                cursor: 'pointer',
                opacity: isActive ? 1 : 0.92,
                transition: 'all .2s ease',
              }}
            >
              {value > 0 ? value : ''}
            </button>
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
            fontWeight: activeMonth === index ? 700 : 400,
            color: activeMonth === index ? '#2563eb' : 'var(--muted)',
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


      {showCalendar && (
        <CalendarModal
          onClose={() => setShowCalendar(false)}
        />
      )}


    </div>
  )
}