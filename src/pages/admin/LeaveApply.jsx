import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartPulse, Plane, ScrollText, ShieldCheck, Sparkles } from 'lucide-react'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'

const TYPE_STYLE = {
  annual: { icon: Plane, color: '#0EA5E9', soft: '#e6f5fd' },
  sick: { icon: HeartPulse, color: '#f43f5e', soft: '#fdecef' },
  izin: { icon: ScrollText, color: '#f59e0b', soft: '#fef3e2' },
}
const DEFAULT_STYLE = { icon: Sparkles, color: '#8b5cf6', soft: '#f2edfd' }

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

function todayString() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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
    from: 'Pilih tanggal mulai',
    to: 'Pilih tanggal selesai',
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
  const minFrom = todayString()

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

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'flex-start',
          width: '100%',
          maxWidth: 1140,
          margin: '0 auto',
        }}
      >
        <form
          className="card panel"
          onSubmit={onSubmit}
          style={{ display: 'grid', gap: 16, flex: '2 1 420px', minWidth: 0, maxWidth: 720 }}
        >
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
                min={minFrom}
                onChange={(e) => {
                  const value = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    from: value,
                    to: prev.to && prev.to < value ? value : prev.to,
                  }))
                }}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="to">Tanggal Selesai</label>
              <input
                id="to"
                type="date"
                value={form.to}
                min={form.from || minFrom}
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
          <p
            className="notice"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: days > 0 ? '#eef7ff' : undefined,
              border: days > 0 ? '1px solid #cfe8fb' : undefined,
              color: days > 0 ? '#0c4a6e' : undefined,
            }}
          >
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

        <aside
          className="card panel"
          style={{
            display: 'grid',
            gap: 20,
            alignSelf: 'start',
            padding: 24,
            borderRadius: 18,
            background: '#ffffff',
            border: '1px solid #eef1f4',
            boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.08)',
            flex: '1 1 320px',
            minWidth: 280,
            maxWidth: 380,
          }}
        >
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#0EA5E9',
                textTransform: 'uppercase',
              }}
            >
              Kuota Anda
            </span>
            <h3 style={{ margin: '4px 0 0', fontSize: 17 }}>Ringkasan Kuota</h3>
            <p className="hint" style={{ margin: '2px 0 0', fontSize: 12.5 }}>
              Sisa cuti per jenis, tahun ini
            </p>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {leaveTypes.map((item) => {
              const left = item.days - item.used
              const pct = item.days ? Math.min(100, Math.round((left / item.days) * 100)) : 0
              const isActive = item.id === form.type
              const low = item.days > 0 && left <= 2
              const style = TYPE_STYLE[item.id] || DEFAULT_STYLE
              const Icon = style.icon
              const barColor = low ? '#dc2626' : style.color

              return (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px 12px 16px',
                    borderRadius: 14,
                    background: isActive ? style.soft : '#fbfbfc',
                    outline: isActive ? `1.5px solid ${style.color}55` : '1px solid #eef0f3',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 3,
                      borderRadius: 4,
                      background: barColor,
                    }}
                  />
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: style.soft,
                      color: style.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{item.name}</span>
                      <span style={{ fontSize: 12, color: low ? '#dc2626' : '#8a94a1', whiteSpace: 'nowrap' }}>
                        <b style={{ color: low ? '#dc2626' : '#1f2937', fontSize: 13 }}>{left}</b> / {item.days} hari
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: '#eef0f3', overflow: 'hidden', marginTop: 7 }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: barColor,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            {leaveTypes.length === 0 && <p className="hint">Belum ada data kuota.</p>}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: '12px 14px',
              borderRadius: 12,
              background: '#f8fafc',
            }}
          >
            <ShieldCheck size={16} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 1 }} />
            <p className="hint" style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
              Pengajuan yang melebihi sisa kuota akan otomatis ditolak sistem.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}