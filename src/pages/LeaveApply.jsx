import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

function workdays(from, to) {
  if (!from || !to) return 0
  const start = new Date(from)
  const end = new Date(to)
  if (end < start) return 0
  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) count += 1
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
        if (res.data.length) setForm((prev) => ({ ...prev, type: res.data[0].id }))
      })
      .catch(() => push('Gagal memuat jenis cuti.', 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const days = useMemo(() => workdays(form.from, form.to), [form.from, form.to])
  const selected = leaveTypes.find((item) => item.id === form.type)
  const remaining = selected ? selected.days - selected.used : 0

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
      setForm((prev) => ({ ...prev, reason: '', handover: '' }))
      // Refresh kuota terbaru setelah pengajuan.
      const res = await api.get('/leave-types')
      setLeaveTypes(res.data)
    } catch (err) {
      push(err.response?.data?.message || 'Gagal mengirim permohonan.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div>
            <h1>Ajukan cuti</h1>
            <p>Memuat data kuota...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Ajukan cuti</h1>
          <p>Lengkapi tanggal dan alasan. Kuota serta hari kerja dihitung otomatis.</p>
        </div>
      </div>

      <div className="form-grid">
        <form className="card panel" onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
          <div className="field">
            <label htmlFor="type">Jenis cuti</label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="from">Mulai</label>
              <input
                id="from"
                type="date"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="to">Selesai</label>
              <input
                id="to"
                type="date"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="reason">Alasan</label>
            <textarea
              id="reason"
              placeholder="Tuliskan keperluan secara ringkas dan jelas."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="handover">Serah terima pekerjaan</label>
            <textarea
              id="handover"
              placeholder="Siapa yang menggantikan, dan apa yang perlu dijaga."
              value={form.handover}
              onChange={(e) => setForm({ ...form, handover: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Mengirim...' : 'Kirim permohonan'}
          </button>
        </form>

        <aside style={{ display: 'grid', gap: 16 }}>
          <section className="card panel">
            <h2 style={{ fontSize: '1.05rem' }}>Ringkasan</h2>
            <div className="list-soft" style={{ marginTop: 14 }}>
              <article>
                <span>Jenis</span>
                <strong>{selected?.name}</strong>
              </article>
              <article>
                <span>Hari kerja</span>
                <strong>{days} hari</strong>
              </article>
              <article>
                <span>Sisa kuota</span>
                <strong>{remaining} hari</strong>
              </article>
            </div>
            <p className="notice" style={{ marginTop: 14 }}>
              Akhir pekan tidak dihitung. Atasan Anda akan meninjau dampak ke kalender tim.
            </p>
          </section>
          <section className="card panel">
            <h2 style={{ fontSize: '1.05rem' }}>Kuota Anda</h2>
            <div className="bars" style={{ marginTop: 14 }}>
              {leaveTypes.map((type) => (
                <div key={type.id}>
                  <div className="bar-row">
                    <span>{type.name.replace('Cuti ', '')}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${((type.days - type.used) / type.days) * 100}%` }}
                      />
                    </div>
                    <b>{type.days - type.used}</b>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
