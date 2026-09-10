import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { initials } from '../../lib/format'

// Satu aksen netral yang mengikuti warna primer tombol yang sudah ada di app,
// bukan warna per-role, biar tidak ada kombinasi warna yang norak.
const ACCENT = 'var(--primary, #2563eb)'

function EyeIcon({ off }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <>
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

function CheckItem({ ok, children }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: '0.8rem',
        opacity: ok ? 0.85 : 0.5,
        transition: 'opacity 0.15s ease',
      }}
    >
      <span
        style={{
          width: 15,
          height: 15,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: `1.5px solid currentColor`,
          background: ok ? 'currentColor' : 'transparent',
        }}
      >
        {ok && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--card-bg, #fff)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {children}
    </li>
  )
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { push } = useToast()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('info') // 'info' | 'security'
  const [showPw, setShowPw] = useState(false)
  const [showPwConfirm, setShowPwConfirm] = useState(false)

  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    location: user.location,
  })

  const [security, setSecurity] = useState({
    password: '',
    passwordConfirmation: '',
  })

  const accent = ACCENT

  useEffect(() => {
    api
      .get('/leave-types')
      .then((res) => setLeaveTypes(res.data))
      .catch(() => push('Gagal memuat saldo cuti.', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pwTouched = security.password.length > 0 || security.passwordConfirmation.length > 0
  const pwLongEnough = security.password.length >= 6
  const pwMatches = pwTouched && security.password.length > 0 && security.password === security.passwordConfirmation
  const pwValid = !pwTouched || (pwLongEnough && pwMatches)

  async function onSubmit(event) {
    event.preventDefault()

    if (!pwValid) {
      setTab('security')
      push('Periksa kembali kata sandi baru Anda.', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = { ...form }
      if (pwTouched) {
        payload.password = security.password
        payload.passwordConfirmation = security.passwordConfirmation
      }

      await updateUser(payload)
      setSecurity({ password: '', passwordConfirmation: '' })
      push(pwTouched ? 'Profil dan kata sandi diperbarui.' : 'Profil diperbarui.')
    } catch {
      push('Gagal menyimpan profil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-head">

      </div>

      <div className="form-grid">
        <section className="card panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '28px 28px 0', textAlign: 'center', position: 'relative' }}>
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
                boxShadow: `0 0 0 4px var(--card-bg, #fff), 0 0 0 6px ${accent}33`,
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

            {/* ---- Tab switch: Informasi / Keamanan ---- */}
            <div
              style={{
                display: 'inline-flex',
                gap: 4,
                marginTop: 20,
                padding: 3,
                borderRadius: 999,
                background: 'rgba(127,127,127,0.12)',
              }}
            >
              {[
                { key: 'info', label: 'Informasi' },
                { key: 'security', label: 'Keamanan' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    padding: '7px 16px',
                    borderRadius: 999,
                    fontSize: '0.85rem',
                    fontWeight: tab === t.key ? 600 : 500,
                    background: tab === t.key ? accent : 'transparent',
                    color: tab === t.key ? '#fff' : 'inherit',
                    opacity: tab === t.key ? 1 : 0.65,
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid currentColor',
                opacity: 0.12,
                margin: '20px 0 0',
              }}
            />
          </div>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, padding: '22px 28px 28px' }}>
            {tab === 'info' && (
              <>
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
              </>
            )}

            {tab === 'security' && (
              <>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                  Kosongkan jika Anda tidak ingin mengubah kata sandi.
                </p>

                <div className="grid-2">
                  <div className="field">
                    <label>Kata sandi baru</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={security.password}
                        onChange={(e) => setSecurity({ ...security, password: e.target.value })}
                        style={{ paddingRight: 40 }}
                        placeholder="••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          opacity: 0.55,
                          padding: 0,
                        }}
                      >
                        <EyeIcon off={showPw} />
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label>Konfirmasi kata sandi</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPwConfirm ? 'text' : 'password'}
                        value={security.passwordConfirmation}
                        onChange={(e) => setSecurity({ ...security, passwordConfirmation: e.target.value })}
                        style={{ paddingRight: 40 }}
                        placeholder="••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwConfirm((s) => !s)}
                        aria-label={showPwConfirm ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          opacity: 0.55,
                          padding: 0,
                        }}
                      >
                        <EyeIcon off={showPwConfirm} />
                      </button>
                    </div>
                  </div>
                </div>

                {pwTouched && (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                    <CheckItem ok={pwLongEnough}>Minimal 6 karakter</CheckItem>
                    <CheckItem ok={pwMatches}>Konfirmasi kata sandi cocok</CheckItem>
                  </ul>
                )}
              </>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving || !pwValid}
              style={{ justifySelf: 'start' }}
            >
              {saving ? 'Menyimpan…' : 'Simpan perubahan'}
            </button>
          </form>
        </section>

        <aside style={{ display: 'grid', gap: 16 }}>
          <section className="card panel">
            <h2 style={{ fontSize: '1.05rem' }}>Identitas</h2>
            <div className="list-soft" style={{ marginTop: 14 }}>
              <article>
                <span>NIP</span>
                <strong>{user.employeeId}</strong>
              </article>
              <article>
                <span>Bergabung</span>
                <strong>{user.joinDate}</strong>
              </article>
              <article>
                <span>Role</span>
                <strong style={{ color: accent }}>{user.role.toUpperCase()}</strong>
              </article>
            </div>
          </section>

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