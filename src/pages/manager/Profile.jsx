import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { initials } from '../../lib/format'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { push } = useToast()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    location: user.location,
  })

  useEffect(() => {
    api
      .get('/leave-types')
      .then((res) => setLeaveTypes(res.data))
      .catch(() => push('Gagal memuat saldo cuti.', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await updateUser(form)
      push('Profil diperbarui.')
    } catch {
      push('Gagal menyimpan profil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Profil</h1>
          <p>Identitas kerja dan saldo cuti Anda.</p>
        </div>
      </div>

      <div className="form-grid">
        {/* ---- Kartu profil bergaya badge: avatar besar overlap di atas kartu ---- */}
        <section
          className="card panel"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <div
            style={{
              padding: '28px 28px 0',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <span
              className="avatar avatar--lg"
              style={{
                width: 76,
                height: 76,
                fontSize: '1.4rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                boxShadow: '0 0 0 4px var(--card-bg, #fff)',
              }}
            >
              {initials(user.name)}
            </span>
            <div style={{ marginTop: 12 }}>
              <strong style={{ fontSize: '1.2rem', display: 'block' }}>{user.name}</strong>
              <span style={{ opacity: 0.7 }}>
                {user.title} · {user.department}
              </span>
            </div>
            <hr
              style={{
                border: 'none',
                borderTop: '1px solid currentColor',
                opacity: 0.12,
                margin: '22px 0 0',
              }}
            />
          </div>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, padding: '22px 28px 28px' }}>
            <div className="field">
              <label>Nama</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={user.email} disabled />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Telepon</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Lokasi</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving} style={{ justifySelf: 'start' }}>
              {saving ? 'Menyimpan…' : 'Simpan perubahan'}
            </button>
          </form>
        </section>

        <aside style={{ display: 'grid', gap: 16 }}>
          <section className="card panel">
            <h2 style={{ fontSize: '1.05rem' }}>Identitas</h2>
            <div className="list-soft" style={{ marginTop: 14 }}>
              <article>
                <span>ID karyawan</span>
                <strong>{user.employeeId}</strong>
              </article>
              <article>
                <span>Bergabung</span>
                <strong>{user.joinDate}</strong>
              </article>
              <article>
                <span>Peran</span>
                <strong>{user.role.toUpperCase()}</strong>
              </article>
            </div>
          </section>

          {/* ---- Saldo cuti: tetap bar, tapi label & angka digabung di atas track ---- */}
          <section className="card panel">
            <h2 style={{ fontSize: '1.05rem', marginBottom: 14 }}>Saldo cuti</h2>
            {leaveTypes.length === 0 ? (
              <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>Belum ada data saldo cuti.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {leaveTypes.map((type) => {
                  const remaining = type.days - type.used
                  const pct = type.days ? Math.max(0, (remaining / type.days) * 100) : 0
                  return (
                    <div key={type.id}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem',
                          marginBottom: 6,
                        }}
                      >
                        <span>{type.name.replace('Cuti ', '')}</span>
                        <b>{remaining} hari</b>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}