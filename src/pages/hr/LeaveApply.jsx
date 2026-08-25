import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import { BarChart3, Calendar, FileText, Pin, Stethoscope } from 'lucide-react'

function workdays(from, to) {
  if (!from || !to) return 0

  const start = new Date(from)
  const end = new Date(to)

  if (end < start) return 0

  let count = 0
  const cursor = new Date(start)

  while (cursor <= end) {
    const day = cursor.getDay()

    if (day !== 0 && day !== 6) {
      count += 1
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return count
}

export default function LeaveApply() {
  const { push } = useToast()

  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    type: 'annual',
    from: '2026-08-24',
    to: '2026-08-26',
    reason: '',
    handover: '',
  })

  useEffect(() => {
    api
      .get('/leave-types')
      .then((res) => {
        setLeaveTypes(res.data)

        if (res.data.length) {
          setForm((prev) => ({
            ...prev,
            type: res.data[0].id,
          }))
        }
      })
      .catch(() => push('Gagal memuat jenis cuti.', 'error'))
      .finally(() => setLoading(false))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const days = useMemo(
    () => workdays(form.from, form.to),
    [form.from, form.to]
  )

  const selected = leaveTypes.find(
    (item) => item.id === form.type
  )

  const remaining = selected
    ? selected.days - selected.used
    : 0

  async function onSubmit(event) {
    event.preventDefault()

    if (!selected) return

    if (days < 1) {
      push('Pilih rentang hari kerja yang valid.', 'error')
      return
    }

    if (days > remaining) {
      push('Durasi melebihi sisa kuota.', 'error')
      return
    }

    setSubmitting(true)

    try {
      await api.post('/leave-requests', {
        leave_type: form.type,
        start_date: form.from,
        end_date: form.to,
        reason: form.reason,
        handover: form.handover,
      })

      push(`Permohonan ${selected.name} ${days} hari telah dikirim.`)

      setForm((prev) => ({
        ...prev,
        reason: '',
        handover: '',
      }))

      const res = await api.get('/leave-types')
      setLeaveTypes(res.data)
    } catch (err) {
      push(
        err.response?.data?.message ||
          'Gagal mengirim permohonan.',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div>
            <h1>Pengajuan Cuti</h1>
            <p>Memuat data kuota...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <h1>Pengajuan cuti</h1>
          <p>
            Lengkapi tanggal dan alasan. Kuota serta hari kerja
            dihitung otomatis.
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        className="form-grid"
        style={{
          alignItems: 'start',
          gap: 18,
        }}
      >
        {/* Form */}
        <form
          className="card panel"
          onSubmit={onSubmit}
          style={{
            display: 'grid',
            gap: 16,
          }}
        >
          <div className="panel__head">
            <div>
              <h2>Detail pengajuan</h2>
              <p
                style={{
                  marginTop: 4,
                  color: 'var(--muted)',
                  fontSize: '0.8rem',
                }}
              >
                Isi informasi cuti yang ingin Anda ajukan.
              </p>
            </div>
          </div>

          {/* Jenis Cuti */}
          <div className="field">
            <label htmlFor="type">Jenis cuti</label>

            <select
              id="type"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value,
                })
              }
            >
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal */}
          <div className="field">
            <label>Tanggal cuti</label>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="from">Mulai</label>

                <input
                  id="from"
                  type="date"
                  value={form.from}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      from: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="to">Selesai</label>

                <input
                  id="to"
                  type="date"
                  value={form.to}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      to: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Alasan */}
          <div className="field">
            <label htmlFor="reason">Alasan</label>

            <textarea
              id="reason"
              placeholder="Tuliskan keperluan secara ringkas dan jelas."
              value={form.reason}
              onChange={(e) =>
                setForm({
                  ...form,
                  reason: e.target.value,
                })
              }
              required
            />
          </div>

          {/* Serah Terima */}
          <div className="field">
            <label htmlFor="handover">
              Serah terima pekerjaan
            </label>

            <textarea
              id="handover"
              placeholder="Siapa yang menggantikan, dan apa yang perlu dijaga."
              value={form.handover}
              onChange={(e) =>
                setForm({
                  ...form,
                  handover: e.target.value,
                })
              }
            />
          </div>

          {/* Submit */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: 4,
              borderTop: '1px solid var(--sky-100)',
            }}
          >
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? 'Mengirim...'
                : 'Kirim permohonan'}
            </button>
          </div>
        </form>

        {/* Sidebar */}
        <aside
          style={{
            display: 'grid',
            gap: 18,
          }}
        >
          {/* Ringkasan */}
          <section
            className="card panel"
            style={{
              padding: 12,
              borderRadius: 16,
            }}
          >
            <div className="panel__head">
              <div>
                <h2
                  style={{
                    fontSize: '0.95rem',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Pin size={15} /> Ringkasan
                </h2>

                <p
                  style={{
                    marginTop: 3,
                    color: 'var(--muted)',
                    fontSize: '0.7rem',
                  }}
                >
                  Preview pengajuan
                </p>
              </div>
            </div>


            <div
              style={{
                display: 'grid',
                gap: 6,
                marginTop: 10,
              }}
            >

              {/* Jenis Pengajuan */}
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 12,
                  background: '#eef7ff',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--muted)',
                  }}
                >
                  Jenis pengajuan
                </div>

                <div
                  style={{
                    marginTop: 3,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display:'flex',
                    alignItems:'center',
                    gap:6,
                  }}
                >
                  {selected?.name?.toLowerCase().includes('sakit') ? (
                    <Stethoscope size={14} />
                  ) : selected?.name?.toLowerCase().includes('izin') ? (
                    <FileText size={14} />
                  ) : (
                    <Calendar size={14} />
                  )}

                  {selected?.name || '-'}
                </div>
              </div>


              {/* Periode */}
              <div
                style={{
                  padding:'8px 10px',
                  borderRadius:12,
                  background:'#f8fafc',
                  border:'1px solid #e5edf5',
                }}
              >
                <div
                  style={{
                    fontSize:'0.65rem',
                    color:'var(--muted)',
                  }}
                >
                  Periode
                </div>

                <strong
                  style={{
                    fontSize:'0.78rem',
                    display:'block',
                    marginTop:3,
                  }}
                >
                  {form.from} - {form.to}
                </strong>
              </div>


              {/* Durasi */}
              <div
                style={{
                  padding:'8px 10px',
                  borderRadius:12,
                  background:'#ecfdf5',
                }}
              >
                <div
                  style={{
                    fontSize:'0.65rem',
                    color:'var(--muted)',
                  }}
                >
                  Durasi
                </div>

                <strong
                  style={{
                    fontSize:'0.85rem',
                    color:'#16a34a',
                  }}
                >
                  {days} hari kerja
                </strong>
              </div>


              {/* Alasan */}
              <div
                style={{
                  padding:'8px 10px',
                  borderRadius:12,
                  background:'#fff7ed',
                }}
              >
                <div
                  style={{
                    fontSize:'0.65rem',
                    color:'var(--muted)',
                  }}
                >
                  Alasan
                </div>

                <div
                  style={{
                    marginTop:3,
                    fontSize:'0.72rem',
                    lineHeight:1.3,
                  }}
                >
                  {form.reason || 'Belum diisi'}
                </div>
              </div>


              {/* Serah Terima */}
              <div
                style={{
                  padding:'8px 10px',
                  borderRadius:12,
                  background:'#f5f3ff',
                }}
              >
                <div
                  style={{
                    fontSize:'0.65rem',
                    color:'var(--muted)',
                  }}
                >
                  Serah terima pekerjaan
                </div>

                <div
                  style={{
                    marginTop:3,
                    fontSize:'0.72rem',
                    lineHeight:1.3,
                  }}
                >
                  {form.handover || 'Belum diisi'}
                </div>
              </div>

            </div>
          </section>

          {/* Kuota */}
          <section
            className="card panel"
            style={{
              padding: 12,
              borderRadius: 16,
            }}
          >
            <div className="panel__head" style={{ marginBottom: 8 }}>
              <div>
                <h2
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.9rem',
                    margin: 0,
                  }}
                >
                  <BarChart3 size={15} /> Kuota Anda
                </h2>

                <p
                  style={{
                    marginTop: 3,
                    color: 'var(--muted)',
                    fontSize: '0.68rem',
                  }}
                >
                  Sisa kuota yang tersedia.
                </p>
              </div>
            </div>


            <div
              style={{
                display: 'grid',
                gap: 6,
              }}
            >
              {leaveTypes.map((type, index) => {
                const remainingDays = type.days - type.used

                const percentage =
                  type.days > 0
                    ? (remainingDays / type.days) * 100
                    : 0

                const colors = [
                  '#2563eb',
                  '#16a34a',
                  '#f59e0b',
                  '#9333ea',
                ]

                const color = colors[index % colors.length]


                return (
                  <div
                    key={type.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 12,
                      background: '#f8fbff',
                      border: '1px solid #e6eef8',
                    }}
                  >

                    <div
                      style={{
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                      }}
                    >

                      <div>
                        <div
                          style={{
                            fontSize:'0.78rem',
                            fontWeight:700,
                          }}
                        >
                          {type.name.replace('Cuti ', '')}
                        </div>

                        <div
                          style={{
                            fontSize:'0.65rem',
                            color:'var(--muted)',
                            marginTop:2,
                          }}
                        >
                          {type.used}/{type.days} digunakan
                        </div>
                      </div>


                      <div
                        style={{
                          padding:'3px 9px',
                          borderRadius:999,
                          background:color,
                          color:'#fff',
                          fontSize:'0.68rem',
                          fontWeight:700,
                        }}
                      >
                        {remainingDays} hari
                      </div>

                    </div>


                    <div
                      style={{
                        marginTop:6,
                        height:4,
                        borderRadius:999,
                        background:'#dbe7f3',
                        overflow:'hidden',
                      }}
                    >
                      <div
                        style={{
                          width:`${percentage}%`,
                          height:'100%',
                          background:color,
                          borderRadius:999,
                        }}
                      />
                    </div>

                  </div>
                )
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}