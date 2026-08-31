import { useEffect, useMemo, useState } from 'react'
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
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
 * Modal kalender admin — gabungan hari libur + cuti tim dalam satu
 * grid bulanan, dengan navigasi bulan seperti kalender tim di
 * dashboard karyawan.
 *
 * - Hari libur: titik oranye di bawah angka tanggal.
 * - Cuti karyawan (status approved): avatar inisial bertumpuk.
 *
 * Fetch cuti tim dari GET /leave-requests/team. Kalau endpoint itu
 * belum ada di backend, fallback ke GET /leave-requests (biasanya
 * berisi semua pengajuan untuk role admin/HR). Kalau tetap gagal,
 * kalender tetap tampil normal, cuma tanpa marker cuti.
 */
function CalendarModal({ onClose, holidays }) {
  const [loading, setLoading] = useState(true)
  const [teamLeaves, setTeamLeaves] = useState([])
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await api.get('/leave-requests/team')
        if (!cancelled) setTeamLeaves(res.data)
      } catch {
        try {
          const res = await api.get('/leave-requests')
          if (!cancelled) setTeamLeaves(res.data || [])
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

  const holidaysByDay = useMemo(() => {
    const map = {}
    ;(holidays || []).forEach((item) => {
      const key = toKey(new Date(item.date))
      map[key] = item
    })
    return map
  }, [holidays])

  const leavesByDay = useMemo(() => {
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

  const selectedHoliday = selectedDay ? holidaysByDay[toKey(selectedDay)] : null
  const selectedLeaves = selectedDay ? leavesByDay[toKey(selectedDay)] || [] : []

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
          maxWidth: 420,
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
          <h2 style={{ margin: 0, fontSize: 17 }}>Kalender</h2>

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
          style={{ marginBottom: 8, flexShrink: 0 }}
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

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 10,
            fontSize: 11,
            color: 'var(--muted)',
            flexShrink: 0,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'inline-block',
              }}
            />
            Hari libur
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#2563eb',
                display: 'inline-block',
              }}
            />
            Karyawan cuti
          </span>
        </div>

        <div style={{ overflowY: 'auto' }}>
          {loading ? (
            <p className="hint">Memuat data kalender…</p>
          ) : (
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
                  style={{ textAlign: 'center', fontSize: 10, paddingBottom: 4 }}
                >
                  {dow}
                </div>
              ))}

              {cells.map((cell) => {
                const key = toKey(cell.date)
                const isToday = key === toKey(today)
                const isSelected = selectedDay && key === toKey(selectedDay)
                const holiday = holidaysByDay[key]
                const dayLeaves = leavesByDay[key] || []
                const hasLeave = dayLeaves.length > 0
                const visible = dayLeaves.slice(0, 3)
                const hiddenCount = dayLeaves.length - visible.length

                return (
                  <button
                    type="button"
                    key={key + cell.muted}
                    onClick={() => setSelectedDay(cell.date)}
                    title={
                      holiday
                        ? holiday.name
                        : hasLeave
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
                      background: isSelected
                        ? 'rgba(37, 99, 235, 0.08)'
                        : holiday
                          ? 'rgba(245, 158, 11, 0.08)'
                          : 'transparent',
                      opacity: cell.muted ? 0.35 : 1,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: hasLeave || holiday ? 700 : 400,
                        color: holiday
                          ? '#b45309'
                          : hasLeave
                            ? '#2563eb'
                            : 'inherit',
                      }}
                    >
                      {cell.date.getDate()}
                    </span>

                    {(hasLeave || holiday) && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {holiday && (
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#f59e0b',
                              marginRight: hasLeave ? 3 : 0,
                            }}
                          />
                        )}

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
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selectedDay && (selectedHoliday || selectedLeaves.length > 0) && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid #e6eef8',
              flexShrink: 0,
            }}
          >
            <strong style={{ fontSize: 13 }}>
              {formatDate(toKey(selectedDay))}
            </strong>

            {selectedHoliday && (
              <div className="notice" style={{ marginTop: 8 }}>
                {selectedHoliday.name}
              </div>
            )}

            {selectedLeaves.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {selectedLeaves.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
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
                        }}
                      >
                        {initials(item.user_name)}
                      </span>
                      {item.user_name}
                    </span>

                    <span className="hint">{item.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashbosrd() {
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


      {showCalendar && (
        <CalendarModal
          onClose={() => setShowCalendar(false)}
          holidays={holidays}
        />
      )}


    </div>
  )
}