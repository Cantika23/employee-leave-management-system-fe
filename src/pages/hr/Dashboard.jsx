import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock3,
  Users,
} from 'lucide-react'

import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import {
  formatDate,
  greeting,
} from '../../lib/format'


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