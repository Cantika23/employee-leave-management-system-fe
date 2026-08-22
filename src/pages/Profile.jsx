import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { initials } from '../lib/format'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { push } = useToast()
  const [leaveTypes, setLeaveTypes] = useState([])
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
    try {
      await updateUser(form)
      push('Profil diperbarui.')
    } catch {
      push('Gagal menyimpan profil.', 'error')
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
        <section className="card panel">
          <div className="person" style={{ marginBottom: 22 }}>
            <span className="avatar avatar--lg">{initials(user.name)}</span>
            <span>
              <strong style={{ fontSize: '1.2rem' }}>{user.name}</strong>
              <span>
                {user.title} · {user.department}
              </span>
            </span>
          </div>
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
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
            <button className="btn btn-primary" type="submit">
              Simpan perubahan
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
          <section className="card panel">
            <h2 style={{ fontSize: '1.05rem' }}>Saldo cuti</h2>
            <div className="bars" style={{ marginTop: 14 }}>
              {leaveTypes.map((type) => (
                <div className="bar-row" key={type.id}>
                  <span>{type.name.replace('Cuti ', '')}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${((type.days - type.used) / type.days) * 100}%` }}
                    />
                  </div>
                  <b>{type.days - type.used}</b>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
