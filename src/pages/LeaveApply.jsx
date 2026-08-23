import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [attachment, setAttachment] = useState(null)
  const [form, setForm] = useState({
    type: 'annual',
    from: '2026-08-24',
    to: '2026-08-26',
    reason: '',
  })

  useEffect(() => {
    api
      .get('/leave-types')
      .then((res) => {
        setLeaveTypes(res.data)
        if (res.data.length) setForm((prev) => ({ ...prev, type: res.data[0].id }))
      })
      .catch(() => push('Gagal memuat jenis pengajuan.', 'error'))
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
      push('Pilih rentang tanggal yang valid.', 'error')
      return
    }
    if (days > remaining) {
      push('Durasi melebihi sisa kuota.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('leave_type', form.type)
      payload.append('start_date', form.from)
      payload.append('end_date', form.to)
      payload.append('reason', form.reason)
      if (attachment) payload.append('attachment', attachment)

      await api.post('/leave-requests', payload)
      push(`Pengajuan ${selected.name} berhasil dikirim.`)
      navigate('/app')
    } catch (err) {
      push(err.response?.data?.message || 'Gagal mengirim pengajuan.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div>
            <h1>Ajukan Pengajuan</h1>
            <p>Memuat data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Ajukan Pengajuan</h1>
          <p>Lengkapi jenis, tanggal, dan alasan pengajuan Anda.</p>
        </div>
      </div>

      <form className="card panel" onSubmit={onSubmit} style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <div className="field">
          <label htmlFor="type">Jenis Pengajuan</label>
          <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="from">Tanggal Mulai</label>
            <input
              id="from"
              type="date"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="to">Tanggal Selesai</label>
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
          <label htmlFor="attachment">Lampiran (Opsional)</label>
          <input
            id="attachment"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
          />
          <span className="hint">{attachment ? attachment.name : 'Tidak ada file dipilih'}</span>
        </div>
        <p className="notice">
          {days > 0 ? `${days} hari kerja · sisa kuota ${remaining} hari.` : 'Pilih rentang tanggal.'}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" type="button" onClick={() => navigate('/app')}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Mengirim...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  )
}