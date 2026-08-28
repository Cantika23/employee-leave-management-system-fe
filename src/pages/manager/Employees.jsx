import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import { initials, statusLabel } from '../../lib/format'

const emptyForm = {
  name: '',
  email: '',
  role: 'employee',
  title: '',
  department: '',
  location: '',
  phone: '',
  join_date: '',
  leave: 29,
}

/* =========================
   DAFTAR DEPARTEMEN
========================= */

const DEPARTMENTS = [
  'Technology',
  'People & Culture',
  'Customer Service',
  'Finance',
  'Marketing',
  'Human Resources',
  'Operations',
]

export default function Employees() {
  const { push } = useToast()

  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const [employees, setEmployees] = useState([])

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [rowActionId, setRowActionId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    api
      .get('/employees')
      .then((res) => {
        setEmployees(res.data)
      })
      .catch(() => {
        push(
          'Gagal memuat direktori karyawan.',
          'error',
        )
      })
  }, [])

  /* =========================
     GABUNGKAN DEPARTEMEN
     DARI DATABASE + LIST DEFAULT
  ========================= */

  const departments = useMemo(() => {
    const employeeDepartments = employees
      .map((item) => item.dept)
      .filter(Boolean)

    return [
      'all',
      ...new Set([
        ...DEPARTMENTS,
        ...employeeDepartments,
      ]),
    ]
  }, [employees])

  /* =========================
     FILTER DATA
  ========================= */

  const rows = useMemo(() => {
    return employees
      .filter((item) => {
        if (dept === 'all') {
          return true
        }

        return item.dept === dept
      })
      .filter((item) => {
        const searchText = `
          ${item.name || ''}
          ${item.id || ''}
          ${item.title || ''}
          ${item.dept || ''}
          ${item.location || ''}
        `
          .toLowerCase()
          .trim()

        return searchText.includes(
          query.toLowerCase(),
        )
      })
  }, [employees, query, dept])

  /* =========================
     UPDATE FORM
  ========================= */

  const updateField = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  const updateLeave = (e) => {
    setForm((prev) => ({
      ...prev,
      leave:
        e.target.value === ''
          ? ''
          : Number(e.target.value),
    }))
  }

  /* =========================
     RESET FORM
  ========================= */

  const resetForm = () => {
    if (saving) return

    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  /* =========================
     TAMBAH KARYAWAN
  ========================= */

  const handleAddClick = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  /* =========================
     EDIT KARYAWAN
  ========================= */

  const handleEditClick = (row) => {
    setForm({
      name: row.name || '',
      email: row.email || '',
      role: row.role || 'employee',
      title: row.title || '',
      department: row.dept || '',
      location: row.location || '',
      phone: row.phone || '',
      join_date: row.join_date || '',
      leave: row.leave ?? 29,
    })

    setEditingId(row.id)
    setShowForm(true)
  }

  /* =========================
     SUBMIT FORM
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.department.trim()
    ) {
      push(
        'Nama, email, dan departemen wajib diisi.',
        'error',
      )
      return
    }

    setSaving(true)

    try {
      if (editingId) {
        const res = await api.put(
          `/employees/${editingId}`,
          form,
        )

        if (res.data && res.data.id) {
          setEmployees((prev) =>
            prev.map((item) =>
              item.id === editingId
                ? res.data
                : item,
            ),
          )
        } else {
          const refreshed = await api.get(
            '/employees',
          )

          setEmployees(refreshed.data)
        }

        push(
          'Data karyawan berhasil diperbarui.',
          'success',
        )
      } else {
        const res = await api.post(
          '/employees',
          form,
        )

        if (res.data && res.data.id) {
          setEmployees((prev) => [
            ...prev,
            res.data,
          ])
        } else {
          const refreshed = await api.get(
            '/employees',
          )

          setEmployees(refreshed.data)
        }

        push(
          'Karyawan berhasil ditambahkan.',
          'success',
        )
      }

      setForm(emptyForm)
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      push(
        err.response?.data?.message ||
          (editingId
            ? 'Gagal memperbarui karyawan.'
            : 'Gagal menambahkan karyawan.'),
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  /* =========================
     HAPUS KARYAWAN
  ========================= */

  const handleDeleteClick = (row) => {
    setDeleteTarget(row)
  }

  const confirmDelete = async () => {
    const row = deleteTarget

    if (!row) return

    setDeleteTarget(null)
    setRowActionId(row.id)

    try {
      await api.delete(
        `/employees/${row.id}`,
      )

      setEmployees((prev) =>
        prev.filter(
          (item) => item.id !== row.id,
        ),
      )

      push(
        'Karyawan berhasil dihapus.',
        'success',
      )

      if (editingId === row.id) {
        setForm(emptyForm)
        setEditingId(null)
        setShowForm(false)
      }
    } catch (err) {
      push(
        err.response?.data?.message ||
          'Gagal menghapus karyawan.',
        'error',
      )
    } finally {
      setRowActionId(null)
    }
  }

  return (
    <div>
      <style>{`
        /* =========================
           TOMBOL AKSI
        ========================= */

        .row-actions {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          white-space: nowrap;
        }

        .icon-btn {
          width: 42px;
          height: 42px;
          min-width: 42px;

          border: none;
          border-radius: 12px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .icon-btn svg {
          width: 20px;
          height: 20px;
          stroke-width: 2.2;
        }

        .icon-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .icon-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .icon-btn--edit {
          color: #2563eb;
          background: #eaf2ff;

          box-shadow:
            0 4px 10px
            rgba(37, 99, 235, 0.1);
        }

        .icon-btn--edit:hover:not(:disabled) {
          color: #ffffff;
          background: #2563eb;

          box-shadow:
            0 8px 18px
            rgba(37, 99, 235, 0.25);
        }

        .icon-btn--delete {
          color: #dc2626;
          background: #fff0f1;

          box-shadow:
            0 4px 10px
            rgba(220, 38, 38, 0.08);
        }

        .icon-btn--delete:hover:not(:disabled) {
          color: #ffffff;
          background: #dc2626;

          box-shadow:
            0 8px 18px
            rgba(220, 38, 38, 0.22);
        }

        /* =========================
           AVATAR KARYAWAN
        ========================= */

        .person {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .person .avatar {
          width: 42px;
          height: 42px;
          min-width: 42px;
          flex: 0 0 42px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 0;
          margin: 0;

          box-sizing: border-box;

          text-align: center;
          line-height: 1;

          font-size: 0.82rem;
          font-weight: 700;

          overflow: hidden;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #dbeafe,
              #c9efff
            );

          color: #315c7c;
        }

        .person > span:last-child {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }

        .person strong {
          line-height: 1.25;
          color: #334155;
        }

        .person span span {
          margin-top: 2px;
          line-height: 1.35;
        }

        /* =========================
           TOMBOL TAMBAH KARYAWAN
        ========================= */

        .add-employee-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          padding: 11px 18px;

          border: none;
          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #2f6fd6,
              #245ec4
            );

          color: #ffffff;

          font-size: 0.88rem;
          font-weight: 600;

          cursor: pointer;

          box-shadow:
            0 6px 16px
            rgba(37, 99, 235, 0.18);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .add-employee-btn span {
          width: 19px;
          height: 19px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border-radius: 6px;

          background:
            rgba(255, 255, 255, 0.16);

          font-size: 1.05rem;
          font-weight: 400;
          line-height: 1;
        }

        .add-employee-btn:hover {
          transform: translateY(-1px);

          box-shadow:
            0 8px 20px
            rgba(37, 99, 235, 0.25);
        }

        /* =========================
           TABLE
        ========================= */

        .table-wrap {
          overflow-x: auto;
        }

        .table th:last-child,
        .table td:last-child {
          white-space: nowrap;
          width: 1%;
        }

        /* =========================
           MODAL TAMBAH / EDIT
        ========================= */

        .employee-modal-overlay {
          position: fixed;
          inset: 0;

          z-index: 1100;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 24px;

          background:
            radial-gradient(
              circle at top right,
              rgba(37, 99, 235, 0.16),
              transparent 32%
            ),
            rgba(15, 23, 42, 0.48);

          backdrop-filter: blur(7px);

          animation:
            modalFadeIn
            0.2s
            ease;
        }

        .employee-modal {
          width: min(900px, 100%);
          max-height: calc(100vh - 48px);

          overflow-y: auto;

          background: #ffffff;

          border:
            1px solid
            rgba(219, 231, 243, 0.9);

          border-radius: 24px;

          box-shadow:
            0 28px 80px
            rgba(15, 23, 42, 0.28);

          animation:
            modalSlideUp
            0.25s
            ease;
        }

        .employee-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 24px 26px 20px;

          border-bottom:
            1px solid #eef2f7;
        }

        .employee-modal-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .employee-modal-icon {
          width: 48px;
          height: 48px;

          flex-shrink: 0;

          border-radius: 14px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #38bdf8
            );

          color: #ffffff;

          box-shadow:
            0 10px 24px
            rgba(37, 99, 235, 0.22);
        }

        .employee-modal-title h2 {
          margin: 0;

          font-size: 1.1rem;
          font-weight: 700;

          color: #1e293b;
        }

        .employee-modal-title p {
          margin: 4px 0 0;

          font-size: 0.82rem;

          color: #64748b;
        }

        .employee-modal-close {
          width: 38px;
          height: 38px;

          border: none;
          border-radius: 12px;

          background: #f1f5f9;
          color: #64748b;

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;

          transition: all 0.2s ease;
        }

        .employee-modal-close:hover:not(:disabled) {
          background: #e2e8f0;
          color: #1e293b;

          transform: rotate(90deg);
        }

        .employee-modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .employee-modal-body {
          padding: 24px 26px;
        }

        .employee-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .employee-field {
          display: flex;
          flex-direction: column;
        }

        .employee-field label {
          display: block;

          margin-bottom: 7px;

          font-size: 0.78rem;
          font-weight: 600;

          color: #475569;
        }

        .employee-field input,
        .employee-field select {
          width: 100%;

          padding: 12px 14px;

          border-radius: 12px;

          border:
            1px solid #dbe7f3;

          background: #f8fafc;

          color: #334155;

          outline: none;

          box-sizing: border-box;

          transition: all 0.2s ease;
        }

        .employee-field input::placeholder {
          color: #94a3b8;
        }

        .employee-field input:focus,
        .employee-field select:focus {
          border-color: #3b82f6;

          background: #ffffff;

          box-shadow:
            0 0 0 4px
            rgba(59, 130, 246, 0.1);
        }

        .employee-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;

          padding: 18px 26px 24px;

          border-top:
            1px solid #eef2f7;
        }

        .employee-btn-cancel {
          padding: 11px 18px;

          border: none;
          border-radius: 12px;

          background: #f1f5f9;
          color: #475569;

          font-weight: 600;

          cursor: pointer;

          transition: all 0.2s ease;
        }

        .employee-btn-cancel:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .employee-btn-save {
          padding: 11px 20px;

          border: none;
          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );

          color: #ffffff;

          font-weight: 600;

          cursor: pointer;

          box-shadow:
            0 8px 18px
            rgba(37, 99, 235, 0.2);

          transition: all 0.2s ease;
        }

        .employee-btn-save:hover:not(:disabled) {
          transform: translateY(-1px);

          box-shadow:
            0 12px 24px
            rgba(37, 99, 235, 0.28);
        }

        .employee-btn-save:disabled,
        .employee-btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* =========================
           MODAL HAPUS
        ========================= */

        .confirm-overlay {
          position: fixed;
          inset: 0;

          z-index: 1200;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 16px;

          background:
            rgba(15, 23, 42, 0.45);

          backdrop-filter: blur(5px);

          animation:
            modalFadeIn
            0.2s
            ease;
        }

        .confirm-card {
          position: relative;

          width: 100%;
          max-width: 390px;

          padding: 28px 24px 24px;

          background: #ffffff;

          border-radius: 22px;

          text-align: center;

          box-shadow:
            0 20px 50px
            rgba(15, 23, 42, 0.25);

          animation:
            modalSlideUp
            0.25s
            ease;
        }

        .confirm-close {
          position: absolute;

          top: 14px;
          right: 14px;

          width: 32px;
          height: 32px;

          border: none;
          border-radius: 10px;

          background: #f1f5f9;
          color: #9aa5b1;

          cursor: pointer;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          transition: all 0.2s ease;
        }

        .confirm-close:hover {
          background: #e2e8f0;
          color: #5b6b7c;
        }

        .confirm-icon {
          width: 58px;
          height: 58px;

          margin: 0 auto 16px;

          border-radius: 50%;

          background: #fdecec;
          color: #e11d48;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 1.4rem;
          font-weight: 700;
        }

        .confirm-title {
          margin-bottom: 7px;

          font-size: 1.1rem;
          font-weight: 700;

          color: #1f2937;
        }

        .confirm-subtitle {
          margin-bottom: 10px;

          font-size: 0.92rem;
          font-weight: 600;

          color: #374151;
        }

        .confirm-desc {
          margin-bottom: 22px;

          font-size: 0.85rem;
          line-height: 1.5;

          color: #6b7280;
        }

        .confirm-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .confirm-btn {
          flex: 1;

          padding: 11px 16px;

          border: none;
          border-radius: 12px;

          font-size: 0.9rem;
          font-weight: 600;

          cursor: pointer;

          transition: all 0.2s ease;
        }

        .confirm-btn--cancel {
          background: #f2f5f9;
          color: #374151;
        }

        .confirm-btn--cancel:hover {
          background: #e6ecf3;
        }

        .confirm-btn--danger {
          background: #e11d48;
          color: #ffffff;
        }

        .confirm-btn--danger:hover {
          background: #be123c;
        }

        /* =========================
           EMPTY STATE
        ========================= */

        .empty {
          padding: 30px;

          text-align: center;

          color: #94a3b8;
        }

        /* =========================
           ANIMASI
        ========================= */

        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform:
              translateY(20px)
              scale(0.98);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 700px) {
          .employee-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .employee-modal {
            width: 100%;
            max-height: 92vh;

            border-radius:
              24px 24px 0 0;
          }

          .employee-form-grid {
            grid-template-columns: 1fr;
          }

          .employee-modal-header,
          .employee-modal-body,
          .employee-modal-footer {
            padding-left: 18px;
            padding-right: 18px;
          }

          .employee-modal-footer {
            flex-direction: column-reverse;
          }

          .employee-btn-cancel,
          .employee-btn-save {
            width: 100%;
          }
        }
      `}</style>

      <div className="page-head">
        <div>
          <h1>Direktori karyawan</h1>

          <p>
            Pantau status kehadiran,
            sisa cuti, dan sebaran tim.
          </p>
        </div>

        <button
          type="button"
          className="add-employee-btn"
          onClick={handleAddClick}
        >
          <span>+</span>
          Tambah Karyawan
        </button>
      </div>

      {/* MODAL TAMBAH / EDIT */}
      {showForm && (
        <div
          className="employee-modal-overlay"
          onClick={resetForm}
        >
          <div
            className="employee-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="employee-modal-header">
              <div className="employee-modal-title">
                <div className="employee-modal-icon">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <circle
                      cx="9"
                      cy="7"
                      r="4"
                      stroke="currentColor"
                      strokeWidth="2"
                    />

                    <path
                      d="M19 8v6M16 11h6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <h2>
                    {editingId
                      ? 'Edit Data Karyawan'
                      : 'Tambah Karyawan Baru'}
                  </h2>

                  <p>
                    {editingId
                      ? 'Perbarui informasi karyawan.'
                      : 'Lengkapi data karyawan di bawah ini.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="employee-modal-close"
                onClick={resetForm}
                disabled={saving}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="employee-modal-body">
                <div className="employee-form-grid">
                  <div className="employee-field">
                    <label>Nama Lengkap</label>

                    <input
                      value={form.name}
                      onChange={updateField('name')}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div className="employee-field">
                    <label>Email</label>

                    <input
                      type="email"
                      value={form.email}
                      onChange={updateField('email')}
                      placeholder="nama@perusahaan.com"
                    />
                  </div>

                  <div className="employee-field">
                    <label>Role</label>

                    <select
                      value={form.role}
                      onChange={updateField('role')}
                    >
                      <option value="employee">
                        Employee
                      </option>

                      <option value="manager">
                        Manager
                      </option>

                      <option value="hr">
                        HR
                      </option>
                    </select>
                  </div>

                  <div className="employee-field">
                    <label>Jabatan</label>

                    <input
                      value={form.title}
                      onChange={updateField('title')}
                      placeholder="Contoh: Software Engineer"
                    />
                  </div>

                  <div className="employee-field">
                    <label>Departemen</label>

                    <select
                      value={form.department}
                      onChange={updateField('department')}
                    >
                      <option value="">
                        Pilih departemen
                      </option>

                      {departments
                        .filter((item) => item !== 'all')
                        .map((item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="employee-field">
                    <label>Lokasi</label>

                    <input
                      value={form.location}
                      onChange={updateField('location')}
                      placeholder="Contoh: Jakarta"
                    />
                  </div>

                  <div className="employee-field">
                    <label>Nomor Telepon</label>

                    <input
                      value={form.phone}
                      onChange={updateField('phone')}
                      placeholder="08xx-xxxx-xxxx"
                    />
                  </div>

                  <div className="employee-field">
                    <label>
                      Tanggal Bergabung
                    </label>

                    <input
                      type="date"
                      value={form.join_date}
                      onChange={updateField('join_date')}
                    />
                  </div>

                  <div className="employee-field">
                    <label>Sisa Cuti</label>

                    <input
                      type="number"
                      min="0"
                      value={form.leave}
                      onChange={updateLeave}
                      placeholder="Contoh: 29"
                    />
                  </div>
                </div>
              </div>

              <div className="employee-modal-footer">
                <button
                  type="button"
                  className="employee-btn-cancel"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="employee-btn-save"
                  disabled={saving}
                >
                  {saving
                    ? 'Menyimpan...'
                    : editingId
                      ? 'Simpan Perubahan'
                      : '+ Tambah Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILTER */}
      <section
        className="card panel"
        style={{
          padding: 16,
          borderRadius: 18,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                color: 'var(--muted)',
                marginBottom: 5,
              }}
            >
              Departemen
            </label>

            <select
              value={dept}
              onChange={(e) =>
                setDept(e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid #dbe7f3',
                background: '#fff',
              }}
            >
              {departments.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === 'all'
                    ? 'Semua Unit'
                    : item}
                </option>
              ))}
            </select>
          </div>

          <label className="search">
            <input
              placeholder="Cari karyawan..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
            />
          </label>
        </div>
      </section>

      {/* TABLE */}
      <section className="card panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>ID</th>
                <th>Departemen</th>
                <th>Lokasi</th>
                <th>Sisa Cuti</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const isBusy =
                  rowActionId === row.id

                return (
                  <tr key={row.id}>
                    <td>
                      <div className="person">
                        <span className="avatar">
                          {initials(row.name)}
                        </span>

                        <span>
                          <strong>
                            {row.name}
                          </strong>

                          <span>
                            {row.title}
                          </span>
                        </span>
                      </div>
                    </td>

                    <td>{row.id}</td>

                    <td>{row.dept}</td>

                    <td>{row.location}</td>

                    <td>
                      {row.leave ?? 29} hari
                    </td>

                    <td>
                      <span
                        className={`badge badge--${row.status}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>

                    <td>
                      <div className="row-actions">
                        {/* EDIT */}
                        <button
                          type="button"
                          className="icon-btn icon-btn--edit"
                          onClick={() =>
                            handleEditClick(row)
                          }
                          disabled={isBusy}
                          title="Edit"
                          aria-label="Edit"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 20h9"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <path
                              d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4Z"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        {/* HAPUS */}
                        <button
                          type="button"
                          className="icon-btn icon-btn--delete"
                          onClick={() =>
                            handleDeleteClick(row)
                          }
                          disabled={isBusy}
                          title="Hapus"
                          aria-label="Hapus"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M3 6h18"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <path
                              d="M8 6V4h8v2"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <path
                              d="M19 6l-1 14H6L5 6"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <path
                              d="M10 11v5"
                              stroke="currentColor"
                              strokeLinecap="round"
                            />

                            <path
                              d="M14 11v5"
                              stroke="currentColor"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="empty">
              Tidak ada data karyawan.
            </div>
          )}
        </div>
      </section>

      {/* MODAL HAPUS */}
      {deleteTarget && (
        <div
          className="confirm-overlay"
          onClick={() =>
            setDeleteTarget(null)
          }
        >
          <div
            className="confirm-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              type="button"
              className="confirm-close"
              onClick={() =>
                setDeleteTarget(null)
              }
              aria-label="Tutup"
            >
              ✕
            </button>

            <div className="confirm-icon">
              !
            </div>

            <div className="confirm-title">
              Hapus karyawan?
            </div>

            <div className="confirm-subtitle">
              Hapus &quot;{deleteTarget.name}&quot;?
            </div>

            <div className="confirm-desc">
              Data karyawan akan dihapus dan
              tindakan ini tidak bisa dibatalkan.
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn confirm-btn--cancel"
                onClick={() =>
                  setDeleteTarget(null)
                }
              >
                Batal
              </button>

              <button
                type="button"
                className="confirm-btn confirm-btn--danger"
                onClick={confirmDelete}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}