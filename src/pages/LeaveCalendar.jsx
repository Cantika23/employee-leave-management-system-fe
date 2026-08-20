import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HOLIDAYS, LEAVE_REQUESTS } from '../data/mock'

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

function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function LeaveCalendar() {
  const [cursor, setCursor] = useState(new Date(2026, 7, 1))
  const today = new Date(2026, 7, 20)

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const startOffset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevDays = new Date(year, month, 0).getDate()
    const list = []

    for (let i = startOffset; i > 0; i -= 1) {
      list.push({ date: new Date(year, month - 1, prevDays - i + 1), muted: true })
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push({ date: new Date(year, month, d), muted: false })
    }
    while (list.length % 7 !== 0) {
      const last = list[list.length - 1].date
      list.push({
        date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
        muted: true,
      })
    }
    return list
  }, [cursor])

  const eventsByDay = useMemo(() => {
    const map = {}
    LEAVE_REQUESTS.filter((item) => item.status !== 'rejected').forEach((item) => {
      const start = new Date(item.from)
      const end = new Date(item.to)
      const cursorDay = new Date(start)
      while (cursorDay <= end) {
        const key = toKey(cursorDay)
        map[key] = map[key] || []
        map[key].push(item)
        cursorDay.setDate(cursorDay.getDate() + 1)
      }
    })
    HOLIDAYS.forEach((holiday) => {
      map[holiday.date] = map[holiday.date] || []
      map[holiday.date].push({ employee: holiday.name, type: 'Libur' })
    })
    return map
  }, [])

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Kalender cuti</h1>
          <p>Lihat sebaran cuti tim dan hari libur dalam satu pandangan bulanan.</p>
        </div>
      </div>

      <section className="card panel">
        <div className="cal-head">
          <button
            className="icon-btn"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>
          <h2>
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <button
            className="icon-btn"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="cal-grid">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((dow) => (
            <div className="cal-dow" key={dow}>
              {dow}
            </div>
          ))}
          {cells.map((cell) => {
            const key = toKey(cell.date)
            const isToday = toKey(cell.date) === toKey(today)
            const events = eventsByDay[key] || []
            return (
              <div
                key={key + cell.muted}
                className={`cal-cell ${cell.muted ? 'is-muted' : ''} ${isToday ? 'is-today' : ''}`}
              >
                <b>{cell.date.getDate()}</b>
                {events.slice(0, 2).map((event, index) => (
                  <div className="cal-event" key={index}>
                    {event.employee.split(' ')[0]}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
