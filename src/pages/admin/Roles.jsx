import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, UserCog, X } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { initials } from '../../lib/format'

/* =========================
   META SETIAP ROLE
========================= */

const ROLE_META = [
  { key: 'admin', label: 'Admin', accent: '#7c3aed', bg: '#f3ecff' },
  { key: 'hr', label: 'HR', accent: '#0f5fd7', bg: '#eaf2ff' },
  { key: 'manager', label: 'Manager', accent: '#19a974', bg: '#e8f9f1' },
  { key: 'employee', label: 'Karyawan', accent: '#f39a35', bg: '#fff3e6' },
]

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  title: '',
  phone: '',
}

export default function Roles() {
  const { push } = useToast()
  const { user: currentUser } = useAuth()

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const [moveTarget, setMoveTarget] = useState(null)
  const [moveRole, setMoveRole] = useState('')
  const [moving, setMoving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [createdResult, setCreatedResult] = useState(null)

  /* =========================
     LOAD DATA
  ========================= */

  const loadEmployees = () => {
    setLoading(true)
    api
      .get('/employees')
      .then((res) => setEmployees(res.data))
      .catch(() => push('Gagal memuat daftar akun.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  /* =========================
     KELOMPOKKAN PER ROLE
  ========================= */

  const grouped = useMemo(() => {
    const map = { admin: [], hr: [], manager: [], employee: [] }

    employees.forEach((item) => {
      if (map[item.role]) {
        map[item.role].push(item)
      }
    })

    return map
  }, [employees])

  const filteredRows = useMemo(() => {
    if (filterRole === 'all') return employees
    return grouped[filterRole] || []
  }, [employees, grouped, filterRole])

  /* =========================
     FORM: TAMBAH AKUN
  ========================= */

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const openAddForm = (roleKey) => {
    setForm({ ...emptyForm, role: roleKey })
    setShowPassword(false)
    setShowForm(true)
  }

  const closeAddForm = () => {
    if (saving) return
    setForm(emptyForm)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim() || !form.email.trim()) {
      push('Nama dan email wajib diisi.', 'error')
      return
    }

    if (form.password.trim().length < 6) {
      push('Password minimal 6 karakter.', 'error')
      return
    }

    setSaving(true)

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        title: form.title,
        // Departemen belum ada kolom terpisah di form ini, jadi
        // dipetakan otomatis dari Jabatan (fallback "Umum" kalau
        // jabatan kosong) supaya tetap memenuhi data yang backend
        // butuhkan tanpa nanya dua hal yang mirip ke admin.
        department: form.title.trim() || 'Umum',
        phone: form.phone,
      }

      const res = await api.post('/employees', payload)
      const newAccount = res.data

      setCreatedResult({
        name: newAccount.name,
        email: newAccount.email,
        password: form.password,
      })

      setForm(emptyForm)
      setShowForm(false)
      loadEmployees()
    } catch (err) {
      push(
        err.response?.data?.message || 'Gagal menambahkan akun.',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  /* =========================
     PINDAH ROLE
  ========================= */

  const openMove = (row) => {
    setMoveTarget(row)
    setMoveRole(row.role)
  }

  const closeMove = () => {
    if (moving) return
    setMoveTarget(null)
    setMoveRole('')
  }

  const confirmMove = async () => {
    if (!moveTarget || moveRole === moveTarget.role) {
      closeMove()
      return
    }

    setMoving(true)

    try {
      await api.put(`/employees/${moveTarget.id}`, {
        name: moveTarget.name,
        email: moveTarget.email,
        role: moveRole,
        title: moveTarget.title,
        department: moveTarget.dept,
        location: moveTarget.location,
        phone: moveTarget.phone,
        join_date: moveTarget.join_date,
        leave: moveTarget.leave,
      })

      push(
        `${moveTarget.name} dipindahkan ke role ${
          ROLE_META.find((r) => r.key === moveRole)?.label
        }.`,
        'success',
      )

      closeMove()
      loadEmployees()
    } catch (err) {
      push(
        err.response?.data?.message || 'Gagal memindahkan role.',
        'error',
      )
      setMoving(false)
    }
  }

  /* =========================
     HAPUS AKUN
  ========================= */

  const openDelete = (row) => {
    setDeleteTarget(row)
  }

  const closeDelete = () => {
    if (deleting) return
    setDeleteTarget(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)

    try {
      await api.delete(`/employees/${deleteTarget.id}`)

      push(`${deleteTarget.name} berhasil dihapus.`, 'success')

      setEmployees((prev) =>
        prev.filter((item) => item.id !== deleteTarget.id),
      )
      setDeleteTarget(null)
    } catch (err) {
      push(
        err.response?.data?.message || 'Gagal menghapus akun.',
        'error',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <style>{`
        .roles-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .add-employee-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 18px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #2f6fd6, #245ec4);
          color: #ffffff;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.18);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .add-employee-btn span {
          width: 19px;
          height: 19px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.16);
          font-size: 1.05rem;
          font-weight: 400;
          line-height: 1;
        }

        .roles-tab {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--white);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--muted);
          cursor: pointer;
          transition: border-color 0.15s var(--ease), color 0.15s var(--ease), background 0.15s var(--ease);
        }

        .roles-tab:hover {
          border-color: var(--sky-300);
        }

        .roles-tab.is-active {
          color: #fff;
          border-color: transparent;
        }

        .roles-tab__dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .roles-tab__count {
          font-size: 0.72rem;
          opacity: 0.85;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .role-badge__dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .roles-move-btn {
          border: 1px solid var(--line);
          background: var(--white);
          color: var(--navy);
          font-size: 0.78rem;
          font-weight: 700;
          padding: 7px 12px;
          border-radius: 9px;
          cursor: pointer;
          transition: border-color 0.15s var(--ease), background 0.15s var(--ease);
        }

        .roles-move-btn:hover {
          border-color: var(--sky-300);
          background: var(--sky-50);
        }

        .roles-move-btn--danger {
          color: #dc2626;
          border-color: #fecaca;
        }

        .roles-move-btn--danger:hover {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .roles-move-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .roles-move-btn:disabled:hover {
          border-color: var(--line);
          background: var(--white);
        }

        .roles-empty-row td {
          text-align: center;
          padding: 28px 10px;
          color: var(--muted);
          font-size: 0.85rem;
        }

        .roles-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 16px;
        }

        .roles-modal {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .roles-modal__close {
          position: absolute;
          top: 14px;
          right: 14px;
          border: 0;
          background: transparent;
          cursor: pointer;
          color: var(--muted);
        }

        .roles-field {
          margin-bottom: 12px;
        }

        .roles-field label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--navy);
          margin-bottom: 4px;
        }

        .roles-field input,
        .roles-field select {
          width: 100%;
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid var(--line);
          font-size: 0.85rem;
        }

        .roles-modal__actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }

        .roles-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: 0;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .roles-btn--ghost {
          background: var(--sky-50);
          color: var(--navy);
        }

        .roles-btn--primary {
          background: var(--sky-500);
          color: #fff;
        }

        .roles-pass-box {
          margin: 12px 0;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px dashed #94a3b8;
          background: #f8fafc;
          font-family: monospace;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          letter-spacing: 1px;
        }
      `}</style>

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          Memuat daftar akun...
        </p>
      ) : (
        <>
          <div className="page-head">
            <div>
              <h1>Kelola Role</h1>
              <p>Kelompok akun per role &amp; tambah akun baru.</p>
            </div>

            <button
              type="button"
              className="add-employee-btn"
              onClick={() =>
                openAddForm(filterRole === 'all' ? 'employee' : filterRole)
              }
            >
              <span>+</span>
              Tambah Akun
            </button>
          </div>

          <div className="roles-toolbar">
            <button
              type="button"
              className={`roles-tab ${filterRole === 'all' ? 'is-active' : ''}`}
              style={
                filterRole === 'all'
                  ? { background: 'var(--navy)' }
                  : undefined
              }
              onClick={() => setFilterRole('all')}
            >
              Semua
              <span className="roles-tab__count">({employees.length})</span>
            </button>

            {ROLE_META.map((roleMeta) => {
              const count = (grouped[roleMeta.key] || []).length
              const active = filterRole === roleMeta.key

              return (
                <button
                  type="button"
                  key={roleMeta.key}
                  className={`roles-tab ${active ? 'is-active' : ''}`}
                  style={
                    active
                      ? { background: roleMeta.accent }
                      : { color: roleMeta.accent }
                  }
                  onClick={() => setFilterRole(roleMeta.key)}
                >
                  <span
                    className="roles-tab__dot"
                    style={!active ? { background: roleMeta.accent } : undefined}
                  />
                  {roleMeta.label}
                  <span className="roles-tab__count">({count})</span>
                </button>
              )
            })}
          </div>

          <section className="card panel">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Akun</th>
                    <th>Role</th>
                    <th>No. HP</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.length === 0 && (
                    <tr className="roles-empty-row">
                      <td colSpan={4}>Belum ada akun di role ini.</td>
                    </tr>
                  )}

                  {filteredRows.map((row) => {
                    const roleMeta = ROLE_META.find(
                      (r) => r.key === row.role,
                    )

                    return (
                      <tr key={row.id}>
                        <td>
                          <div className="person">
                            <span
                              className="avatar"
                              style={{
                                background: roleMeta?.accent,
                                color: '#fff',
                              }}
                            >
                              {initials(row.name)}
                            </span>

                            <span>
                              <strong>{row.name}</strong>
                              <span>{row.email}</span>
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className="badge role-badge"
                            style={{
                              background: roleMeta?.bg,
                              color: roleMeta?.accent,
                            }}
                          >
                            <span
                              className="role-badge__dot"
                              style={{ background: roleMeta?.accent }}
                            />
                            {roleMeta?.label}
                          </span>
                        </td>

                        <td>{row.phone || '-'}</td>

                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              className="roles-move-btn"
                              onClick={() => openMove(row)}
                            >
                              Pindahkan Role
                            </button>

                            <button
                              type="button"
                              className="roles-move-btn roles-move-btn--danger"
                              onClick={() => openDelete(row)}
                              disabled={row.id === currentUser?.employeeId}
                              title={
                                row.id === currentUser?.employeeId
                                  ? 'Tidak bisa menghapus akun sendiri'
                                  : 'Hapus akun'
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* MODAL TAMBAH AKUN */}
      {showForm && (
        <div className="roles-modal-overlay" onClick={closeAddForm}>
          <div
            className="roles-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="roles-modal__close"
              onClick={closeAddForm}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>

            <h3 style={{ marginTop: 0, marginBottom: 4 }}>
              Tambah Akun Baru
            </h3>
            <p
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: '0.8rem',
                color: 'var(--muted)',
              }}
            >
              Password yang kamu isi di sini akan jadi password login
              pertama akun ini. Pemilik akun bisa menggantinya sendiri
              lewat halaman Profil.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="roles-field">
                <label>Role</label>
                <select value={form.role} onChange={updateField('role')}>
                  {ROLE_META.map((r) => (
                    <option value={r.key} key={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="roles-field">
                <label>Nama Lengkap</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={updateField('name')}
                  placeholder="Nama karyawan"
                  required
                />
              </div>

              <div className="roles-field">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={updateField('email')}
                  placeholder="nama@perusahaan.com"
                  required
                />
              </div>

              <div className="roles-field">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={updateField('password')}
                    placeholder="Minimal 6 karakter"
                    style={{ paddingRight: 38 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      color: 'var(--muted)',
                      display: 'flex',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="roles-field">
                <label>Jabatan</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={updateField('title')}
                  placeholder="Cth: Staff Finance"
                />
              </div>

              <div className="roles-field">
                <label>No. HP</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={updateField('phone')}
                  placeholder="+62..."
                />
              </div>

              <div className="roles-modal__actions">
                <button
                  type="button"
                  className="roles-btn roles-btn--ghost"
                  onClick={closeAddForm}
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="roles-btn roles-btn--primary"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HASIL AKUN BARU + PASSWORD */}
      {createdResult && (
        <div
          className="roles-modal-overlay"
          onClick={() => setCreatedResult(null)}
        >
          <div
            className="roles-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: 'center' }}
          >
            <button
              type="button"
              className="roles-modal__close"
              onClick={() => setCreatedResult(null)}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>

            <UserCog
              size={28}
              style={{ color: 'var(--sky-500)', marginBottom: 8 }}
            />

            <h3 style={{ margin: '0 0 4px' }}>Akun berhasil dibuat</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>
              {createdResult.name} · {createdResult.email}
            </p>

            <p
              style={{
                margin: '14px 0 4px',
                fontSize: '0.78rem',
                color: 'var(--muted)',
              }}
            >
              Kata sandi awal (catat &amp; sampaikan manual, hanya
              tampil sekali):
            </p>
            <div className="roles-pass-box">{createdResult.password}</div>

            <div className="roles-modal__actions">
              <button
                type="button"
                className="roles-btn roles-btn--ghost"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(createdResult.password)
                    .then(() => push('Kata sandi disalin.', 'success'))
                    .catch(() => {})
                }}
              >
                Salin
              </button>
              <button
                type="button"
                className="roles-btn roles-btn--primary"
                onClick={() => setCreatedResult(null)}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PINDAH ROLE */}
      {moveTarget && (
        <div className="roles-modal-overlay" onClick={closeMove}>
          <div
            className="roles-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="roles-modal__close"
              onClick={closeMove}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>

            <h3 style={{ marginTop: 0, marginBottom: 4 }}>
              Pindahkan Role
            </h3>
            <p
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: '0.82rem',
                color: 'var(--muted)',
              }}
            >
              {moveTarget.name} ({moveTarget.email})
            </p>

            <div className="roles-field">
              <label>Role Baru</label>
              <select
                value={moveRole}
                onChange={(e) => setMoveRole(e.target.value)}
              >
                {ROLE_META.map((r) => (
                  <option value={r.key} key={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="roles-modal__actions">
              <button
                type="button"
                className="roles-btn roles-btn--ghost"
                onClick={closeMove}
                disabled={moving}
              >
                Batal
              </button>
              <button
                type="button"
                className="roles-btn roles-btn--primary"
                onClick={confirmMove}
                disabled={moving || moveRole === moveTarget.role}
              >
                {moving ? 'Memindahkan...' : 'Pindahkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS AKUN */}
      {deleteTarget && (
        <div className="roles-modal-overlay" onClick={closeDelete}>
          <div
            className="roles-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="roles-modal__close"
              onClick={closeDelete}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>

            <h3 style={{ marginTop: 0, marginBottom: 4 }}>
              Hapus akun ini?
            </h3>
            <p
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: '0.82rem',
                color: 'var(--muted)',
              }}
            >
              {deleteTarget.name} ({deleteTarget.email}) akan dihapus
              permanen dan tidak bisa dibatalkan.
            </p>

            <div className="roles-modal__actions">
              <button
                type="button"
                className="roles-btn roles-btn--ghost"
                onClick={closeDelete}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                type="button"
                className="roles-btn"
                style={{ background: '#dc2626', color: '#fff' }}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}