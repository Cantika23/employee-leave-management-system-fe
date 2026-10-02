import { useEffect, useMemo, useState } from 'react'
import {
  KeyRound,
  Users,
  Building2,
  Sun,
  UserPlus,
  Pencil,
  Trash2,
} from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
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
  // dikosongkan: kalau tidak diisi, backend otomatis pakai
  // ANNUAL_LEAVE_QUOTA (12 hari) — lihat EmployeeController::store
  leave: '',
  nip: '',
}

const PAGE_SIZE = 10

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

/* =========================
   DAFTAR BULAN (filter tanggal bergabung)
========================= */

const MONTHS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

/* =========================
   AVATAR: semua pakai satu warna biru yang sama
========================= */

const AVATAR_PALETTE = {
  bg: 'linear-gradient(135deg, #dbeafe, #c9efff)',
  fg: '#315c7c',
}

const avatarPalette = () => AVATAR_PALETTE

// pecah tanggal bergabung (YYYY-MM-DD dari backend) jadi
// { year, month, day } tanpa membuat objek Date (hindari
// masalah timezone untuk tanggal polos)
const splitJoinDate = (joinDate) => {
  if (!joinDate || typeof joinDate !== 'string') {
    return { year: null, month: null, day: null }
  }

  const [year, month, day] = joinDate.slice(0, 10).split('-')

  if (!year || !month) {
    return { year: null, month: null, day: null }
  }

  return { year, month, day }
}

const formatJoinDate = (joinDate) => {
  const { year, month, day } = splitJoinDate(joinDate)

  if (!year) return '-'

  const monthLabel = MONTHS.find((item) => item.value === month)?.label

  if (!monthLabel) return '-'

  return `${Number(day) || ''} ${monthLabel.slice(0, 3)} ${year}`.trim()
}

export default function Employees() {
  const { push } = useToast()
  const { user } = useAuth()

  // Hanya Administrator yang boleh mereset kata sandi akun
  // HR/Manager/karyawan lain.
  const isAdmin = user?.role === 'admin'

  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [rowActionId, setRowActionId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [resetResult, setResetResult] = useState(null)

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    setLoading(true)

    api
      .get('/employees')
      .then((res) => {
        setEmployees(res.data)
      })
      .catch(() => {
        push('Gagal memuat direktori karyawan.', 'error')
      })
      .finally(() => {
        setLoading(false)
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

    return ['all', ...new Set([...DEPARTMENTS, ...employeeDepartments])]
  }, [employees])

  /* =========================
     DAFTAR TAHUN
     Diambil dari data asli (leave_by_year + tanggal bergabung)
     ditambah tahun berjalan, urut terbaru dulu.
  ========================= */

  const availableYears = useMemo(() => {
    const years = new Set([String(new Date().getFullYear())])

    employees.forEach((item) => {
      Object.keys(item.leave_by_year || {}).forEach((y) => years.add(y))

      const { year } = splitJoinDate(item.join_date)

      if (year) years.add(year)
    })

    return [...years].sort((a, b) => Number(b) - Number(a))
  }, [employees])

  /* =========================
     STATISTIK RINGKAS
  ========================= */

  const stats = useMemo(() => {
    const total = employees.length

    const activeDepartments = new Set(
      employees.map((item) => item.dept).filter(Boolean),
    ).size

    const leaveValues = employees
      .map((item) => item.leave)
      .filter((value) => typeof value === 'number')

    const avgLeave = leaveValues.length
      ? Math.round(
          (leaveValues.reduce((sum, value) => sum + value, 0) /
            leaveValues.length) *
            10,
        ) / 10
      : 12

    const now = new Date()
    const recentJoins = employees.filter((item) => {
      if (!item.join_date) return false

      const joined = new Date(item.join_date)
      const days = (now - joined) / (1000 * 60 * 60 * 24)

      return days >= 0 && days <= 30
    }).length

    return { total, activeDepartments, avgLeave, recentJoins }
  }, [employees])

  /* =========================
     FILTER DATA
  ========================= */

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return employees
      .filter((item) => dept === 'all' || item.dept === dept)
      .filter(
        (item) =>
          employeeFilter === 'all' || String(item.id) === employeeFilter,
      )
      .filter(
        (item) =>
          monthFilter === 'all' ||
          splitJoinDate(item.join_date).month === monthFilter,
      )
      .filter((item) => {
        if (!keyword) return true

        const searchText = [
          item.name,
          item.nip,
          item.email,
          item.title,
          item.dept,
          item.location,
        ]
          .join(' ')
          .toLowerCase()

        return searchText.includes(keyword)
      })
  }, [employees, query, dept, employeeFilter, monthFilter])

  /* =========================
     PAGINATION
  ========================= */

  useEffect(() => {
    setPage(1)
  }, [query, dept, employeeFilter, monthFilter, yearFilter])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  /* =========================
     SISA CUTI
     Filter Tahun hanya mengubah nilai sisa cuti yang
     ditampilkan (dari leave_by_year), bukan menyaring baris.
     Kalau tahun itu belum punya data, anggap jatah penuh
     12 hari — sama seperti fallback formatEmployee() di backend.
  ========================= */

  const getYearLeave = (row) => {
    if (yearFilter === 'all') return row.leave ?? 12

    const byYear = row.leave_by_year || {}

    return byYear[yearFilter] ?? 12
  }

  const hasActiveFilters =
    query.trim() !== '' ||
    dept !== 'all' ||
    employeeFilter !== 'all' ||
    monthFilter !== 'all' ||
    yearFilter !== 'all'

  const resetFilters = () => {
    setQuery('')
    setDept('all')
    setEmployeeFilter('all')
    setMonthFilter('all')
    setYearFilter('all')
  }

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
      leave: e.target.value === '' ? '' : Number(e.target.value),
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
      // saat edit, tampilkan sisa cuti saat ini sebagai referensi;
      // admin boleh kosongkan lagi kalau tidak mau mengubahnya
      leave: row.leave ?? '',
      // backend (formatEmployee) mengirim field `nip`
      nip: row.nip || '',
    })

    setEditingId(row.id)
    setShowForm(true)
  }

  /* =========================
     HELPER: PESAN ERROR
     Laravel validation error ada di
     response.data.errors.<field>[0],
     bukan di response.data.message.
  ========================= */

  const extractErrorMessage = (err, fallback) => {
    const errors = err.response?.data?.errors

    if (errors) {
      const firstField = Object.keys(errors)[0]
      const firstMessage = errors[firstField]?.[0]

      if (firstMessage) {
        return firstMessage
      }
    }

    return err.response?.data?.message || fallback
  }

  /* =========================
     SUBMIT FORM
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim() || !form.email.trim() || !form.department.trim()) {
      push('Nama, email, dan departemen wajib diisi.', 'error')
      return
    }

    setSaving(true)

    try {
      // kirim nip hanya jika diisi, biar backend yang
      // auto-generate saat field ini kosong
      const payload = {
        ...form,
        nip: form.nip.trim() ? form.nip.trim() : null,
      }

      // kalau sisa cuti dikosongkan, jangan kirim field ini sama
      // sekali — backend otomatis pakai ANNUAL_LEAVE_QUOTA saat
      // tambah baru, dan tidak mengubah saldo saat edit
      if (form.leave === '') {
        delete payload.leave
      } else {
        payload.leave = Number(form.leave)
      }

      if (editingId) {
        const res = await api.put(`/employees/${editingId}`, payload)

        if (res.data && res.data.id) {
          setEmployees((prev) =>
            prev.map((item) => (item.id === editingId ? res.data : item)),
          )
        } else {
          const refreshed = await api.get('/employees')

          setEmployees(refreshed.data)
        }

        push('Data karyawan berhasil diperbarui.', 'success')
      } else {
        const res = await api.post('/employees', payload)

        if (res.data && res.data.id) {
          setEmployees((prev) => [...prev, res.data])
        } else {
          const refreshed = await api.get('/employees')

          setEmployees(refreshed.data)
        }

        push('Karyawan berhasil ditambahkan.', 'success')
      }

      setForm(emptyForm)
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      push(
        extractErrorMessage(
          err,
          editingId
            ? 'Gagal memperbarui karyawan.'
            : 'Gagal menambahkan karyawan.',
        ),
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
      await api.delete(`/employees/${row.id}`)

      setEmployees((prev) => prev.filter((item) => item.id !== row.id))

      push('Karyawan berhasil dihapus.', 'success')

      if (editingId === row.id) {
        setForm(emptyForm)
        setEditingId(null)
        setShowForm(false)
      }
    } catch (err) {
      push(extractErrorMessage(err, 'Gagal menghapus karyawan.'), 'error')
    } finally {
      setRowActionId(null)
    }
  }

  /* =========================
     RESET KATA SANDI (ADMIN)
  ========================= */

  const handleResetClick = (row) => {
    setResetTarget(row)
  }

  const confirmReset = async () => {
    const row = resetTarget

    if (!row) return

    setResetTarget(null)
    setRowActionId(row.id)

    try {
      const res = await api.post(`/employees/${row.id}/reset-password`)

      setResetResult({
        name: row.name,
        password: res.data.password,
      })
    } catch (err) {
      push(extractErrorMessage(err, 'Gagal mereset kata sandi.'), 'error')
    } finally {
      setRowActionId(null)
    }
  }

  return (
    <div>
      <style>{`
        /* ========== STAT CARDS ========== */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }
        .stat-card {
          padding: 18px 20px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #edf1f7;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .stat-card strong {
          font-size: 1.6rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.1;
        }
        .stat-card span {
          font-size: 0.8rem;
          color: #64748b;
        }
        .stat-card .stat-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .stat-card--blue .stat-icon { background: #eaf2ff; color: #2563eb; }
        .stat-card--green .stat-icon { background: #eafbf1; color: #15803d; }
        .stat-card--amber .stat-icon { background: #fef7e6; color: #b45309; }
        .stat-card--violet .stat-icon { background: #f3eeff; color: #6d28d9; }

        @media (max-width: 900px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .stat-grid { grid-template-columns: 1fr; }
        }

        /* ========== FILTER BAR ========== */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .filter-field label {
          display: block;
          font-size: 0.72rem;
          color: var(--muted, #64748b);
          margin-bottom: 5px;
        }
        .filter-field select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #dbe7f3;
          background: #fff;
          color: #334155;
        }
        .filter-bottom-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: end;
          margin-top: 12px;
        }
        .filter-reset {
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid #dbe7f3;
          background: #f8fafc;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .filter-reset:hover { background: #eef2f7; color: #1e293b; }

        @media (max-width: 900px) {
          .filter-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .filter-grid { grid-template-columns: 1fr; }
          .filter-bottom-row { grid-template-columns: 1fr; }
        }

        /* ========== TOMBOL AKSI ========== */
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
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .icon-btn svg { width: 20px; height: 20px; stroke-width: 2.2; }
        .icon-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .icon-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .icon-btn--edit {
          color: #2563eb;
          background: #eaf2ff;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.1);
        }
        .icon-btn--edit:hover:not(:disabled) {
          color: #ffffff;
          background: #2563eb;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.25);
        }
        .icon-btn--delete {
          color: #dc2626;
          background: #fff0f1;
          box-shadow: 0 4px 10px rgba(220, 38, 38, 0.08);
        }
        .icon-btn--delete:hover:not(:disabled) {
          color: #ffffff;
          background: #dc2626;
          box-shadow: 0 8px 18px rgba(220, 38, 38, 0.22);
        }
        .icon-btn--reset {
          color: #7c3aed;
          background: #f3ecff;
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.1);
        }
        .icon-btn--reset:hover:not(:disabled) {
          color: #ffffff;
          background: #7c3aed;
          box-shadow: 0 8px 18px rgba(124, 58, 237, 0.22);
        }

        /* ========== AVATAR KARYAWAN ========== */
        .person { display: flex; align-items: center; gap: 12px; }
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
        }
        .person > span:last-child {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .person strong { line-height: 1.25; color: #334155; }
        .person span span {
          margin-top: 2px;
          line-height: 1.35;
          color: #94a3b8;
          font-size: 0.8rem;
        }

        /* ========== TOMBOL TAMBAH KARYAWAN ========== */
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
        .add-employee-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
        }

        /* ========== TABLE ========== */
        .table-wrap { overflow-x: auto; }
        .table th:last-child,
        .table td:last-child { white-space: nowrap; width: 1%; }
        .table thead th {
          position: sticky;
          top: 0;
          background: #f8fafc;
          font-size: 0.74rem;
          text-transform: none;
          color: #64748b;
          z-index: 1;
        }
        .table tbody tr { transition: background 0.15s ease; }
        .table tbody tr:hover { background: #f8fafc; }
        .table-count {
          font-size: 0.8rem;
          color: #94a3b8;
          padding: 4px 2px 14px;
        }
        .empty { padding: 36px; text-align: center; color: #94a3b8; }

        /* ========== SKELETON LOADING ========== */
        .skeleton {
          height: 14px;
          min-width: 60px;
          border-radius: 6px;
          background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%);
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite;
        }
        .skeleton--avatar {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 50%;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* ========== PAGINATION ========== */
        .pager {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 4px 4px;
          font-size: 0.82rem;
          color: #64748b;
        }
        .pager button {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #dbe7f3;
          background: #fff;
          color: #475569;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .pager button:hover:not(:disabled) { background: #f1f5f9; }
        .pager button:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ========== MODAL TAMBAH / EDIT ========== */
        .employee-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.16), transparent 32%),
            rgba(15, 23, 42, 0.48);
          backdrop-filter: blur(7px);
          animation: modalFadeIn 0.2s ease;
        }
        .employee-modal {
          width: min(900px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          background: #ffffff;
          border: 1px solid rgba(219, 231, 243, 0.9);
          border-radius: 24px;
          box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
          animation: modalSlideUp 0.25s ease;
        }
        .employee-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 26px 20px;
          border-bottom: 1px solid #eef2f7;
        }
        .employee-modal-title { display: flex; align-items: center; gap: 14px; }
        .employee-modal-icon {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb, #38bdf8);
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
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
        .employee-modal-close:disabled { opacity: 0.5; cursor: not-allowed; }
        .employee-modal-body { padding: 24px 26px; }
        .employee-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .employee-field { display: flex; flex-direction: column; }
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
          border: 1px solid #dbe7f3;
          background: #f8fafc;
          color: #334155;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .employee-field input::placeholder { color: #94a3b8; }
        .employee-field input:focus,
        .employee-field select:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .employee-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 18px 26px 24px;
          border-top: 1px solid #eef2f7;
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
        .employee-btn-cancel:hover:not(:disabled) { background: #e2e8f0; }
        .employee-btn-save {
          padding: 11px 20px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2);
          transition: all 0.2s ease;
        }
        .employee-btn-save:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.28);
        }
        .employee-btn-save:disabled,
        .employee-btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ========== MODAL HAPUS / RESET ========== */
        .confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(5px);
          animation: modalFadeIn 0.2s ease;
        }
        .confirm-card {
          position: relative;
          width: 100%;
          max-width: 390px;
          padding: 28px 24px 24px;
          background: #ffffff;
          border-radius: 22px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
          animation: modalSlideUp 0.25s ease;
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
        .confirm-close:hover { background: #e2e8f0; color: #5b6b7c; }
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
        .confirm-actions { display: flex; gap: 10px; justify-content: center; }
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
        .confirm-btn--cancel { background: #f2f5f9; color: #374151; }
        .confirm-btn--cancel:hover { background: #e6ecf3; }
        .confirm-btn--danger { background: #e11d48; color: #ffffff; }
        .confirm-btn--danger:hover { background: #be123c; }

        .password-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 4px 0 16px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px dashed #94a3b8;
          background: #f8fafc;
          font-family: monospace;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 1px;
          word-break: break-all;
        }

        /* ========== ANIMASI ========== */
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 700px) {
          .employee-modal-overlay { align-items: flex-end; padding: 0; }
          .employee-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
          }
          .employee-form-grid { grid-template-columns: 1fr; }
          .employee-modal-header,
          .employee-modal-body,
          .employee-modal-footer {
            padding-left: 18px;
            padding-right: 18px;
          }
          .employee-modal-footer { flex-direction: column-reverse; }
          .employee-btn-cancel,
          .employee-btn-save { width: 100%; }
        }
      `}</style>

      <div className="page-head">
        <div>
          <h3>Direktori karyawan</h3>

          <p>Pantau status kehadiran, sisa cuti, dan sebaran tim.</p>
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

      {/* RINGKASAN */}
      <div className="stat-grid">
        <div className="stat-card stat-card--blue">
          <div className="stat-icon">
            <Users size={18} />
          </div>
          <strong>{loading ? '–' : stats.total}</strong>
          <span>Total karyawan</span>
        </div>

        <div className="stat-card stat-card--violet">
          <div className="stat-icon">
            <Building2 size={18} />
          </div>
          <strong>{loading ? '–' : stats.activeDepartments}</strong>
          <span>Departemen aktif</span>
        </div>

        <div className="stat-card stat-card--amber">
          <div className="stat-icon">
            <Sun size={18} />
          </div>
          <strong>{loading ? '–' : `${stats.avgLeave} hari`}</strong>
          <span>Rata-rata sisa cuti</span>
        </div>

        <div className="stat-card stat-card--green">
          <div className="stat-icon">
            <UserPlus size={18} />
          </div>
          <strong>{loading ? '–' : stats.recentJoins}</strong>
          <span>Bergabung 30 hari terakhir</span>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT */}
      {showForm && (
        <div className="employee-modal-overlay" onClick={resetForm}>
          <div
            className="employee-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="employee-modal-header">
              <div className="employee-modal-title">
                <div className="employee-modal-icon">
                  <UserPlus size={22} />
                </div>

                <div>
                  <h2>
                    {editingId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
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
                    <label>NIP (opsional)</label>

                    <input
                      value={form.nip}
                      onChange={updateField('nip')}
                      placeholder="Kosongkan untuk generate otomatis"
                    />
                  </div>

                  <div className="employee-field">
                    <label>Role</label>

                    <select value={form.role} onChange={updateField('role')}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
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
                      <option value="">Pilih departemen</option>

                      {departments
                        .filter((item) => item !== 'all')
                        .map((item) => (
                          <option key={item} value={item}>
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
                    <label>Tanggal Bergabung</label>

                    <input
                      type="date"
                      value={form.join_date}
                      onChange={updateField('join_date')}
                    />
                  </div>

                  <div className="employee-field">
                    <label>Sisa Cuti (opsional)</label>

                    <input
                      type="number"
                      min="0"
                      value={form.leave}
                      onChange={updateLeave}
                      placeholder="Otomatis 12 hari jika dikosongkan"
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
        <div className="filter-grid">
          <div className="filter-field">
            <label>Departemen</label>

            <select value={dept} onChange={(e) => setDept(e.target.value)}>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item === 'all' ? 'Semua Unit' : item}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Karyawan</label>

            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
            >
              <option value="all">Semua Karyawan</option>

              {employees.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Bulan Bergabung</label>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="all">Semua Bulan</option>

              {MONTHS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Tahun Cuti</label>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">Semua Tahun</option>

              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-bottom-row">
          <label className="search">
            <input
              placeholder="Cari nama, NIP, email, jabatan, atau lokasi..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              className="filter-reset"
              onClick={resetFilters}
            >
              Reset Filter
            </button>
          )}
        </div>
      </section>

      {/* TABLE */}
      <section className="card panel">
        <div className="table-wrap">
          {!loading && (
            <div className="table-count">
              Menampilkan {pagedRows.length} dari {rows.length} karyawan
              {rows.length !== employees.length &&
                ` (total ${employees.length})`}
            </div>
          )}

          <table className="table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>NIP</th>
                <th>Departemen</th>
                <th>Lokasi</th>
                <th>Bergabung</th>
                <th>Sisa Cuti</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td>
                      <div className="person">
                        <div className="skeleton skeleton--avatar" />
                        <div className="skeleton" style={{ width: 120 }} />
                      </div>
                    </td>

                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j}>
                        <div className="skeleton" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading &&
                pagedRows.map((row) => {
                  const isBusy = rowActionId === row.id
                  const palette = avatarPalette(row.name)

                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="person">
                          <span
                            className="avatar"
                            style={{
                              background: palette.bg,
                              color: palette.fg,
                            }}
                          >
                            {initials(row.name)}
                          </span>

                          <span>
                            <strong>{row.name}</strong>

                            <span>{row.title}</span>
                          </span>
                        </div>
                      </td>

                      <td>{row.nip || row.id}</td>

                      <td>{row.dept}</td>

                      <td>{row.location}</td>

                      <td>{formatJoinDate(row.join_date)}</td>

                      <td>{getYearLeave(row)} hari</td>

                      <td>
                        <span className={`badge badge--${row.status}`}>
                          {statusLabel(row.status)}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          {/* RESET KATA SANDI (khusus Admin) */}
                          {isAdmin && (
                            <button
                              type="button"
                              className="icon-btn icon-btn--reset"
                              onClick={() => handleResetClick(row)}
                              disabled={isBusy}
                              title="Reset Kata Sandi"
                              aria-label="Reset Kata Sandi"
                            >
                              <KeyRound size={16} />
                            </button>
                          )}

                          {/* EDIT */}
                          <button
                            type="button"
                            className="icon-btn icon-btn--edit"
                            onClick={() => handleEditClick(row)}
                            disabled={isBusy}
                            title="Edit"
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </button>

                          {/* HAPUS */}
                          <button
                            type="button"
                            className="icon-btn icon-btn--delete"
                            onClick={() => handleDeleteClick(row)}
                            disabled={isBusy}
                            title="Hapus"
                            aria-label="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>

          {!loading && rows.length === 0 && (
            <div className="empty">
              {hasActiveFilters
                ? 'Tidak ada karyawan yang cocok dengan filter ini.'
                : 'Tidak ada data karyawan.'}
            </div>
          )}

          {!loading && rows.length > PAGE_SIZE && (
            <div className="pager">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                ‹ Sebelumnya
              </button>

              <span>
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Berikutnya ›
              </button>
            </div>
          )}
        </div>
      </section>

      {/* MODAL HAPUS */}
      {deleteTarget && (
        <div
          className="confirm-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="confirm-close"
              onClick={() => setDeleteTarget(null)}
              aria-label="Tutup"
            >
              ✕
            </button>

            <div className="confirm-icon">!</div>

            <div className="confirm-title">Hapus karyawan?</div>

            <div className="confirm-subtitle">
              Hapus &quot;{deleteTarget.name}&quot;?
            </div>

            <div className="confirm-desc">
              Data karyawan akan dihapus dan tindakan ini tidak bisa
              dibatalkan.
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn confirm-btn--cancel"
                onClick={() => setDeleteTarget(null)}
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

      {/* MODAL KONFIRMASI RESET KATA SANDI */}
      {resetTarget && (
        <div
          className="confirm-overlay"
          onClick={() => setResetTarget(null)}
        >
          <div
            className="confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="confirm-close"
              onClick={() => setResetTarget(null)}
              aria-label="Tutup"
            >
              ✕
            </button>

            <div className="confirm-icon">
              <KeyRound size={20} />
            </div>

            <div className="confirm-title">Reset kata sandi?</div>

            <div className="confirm-subtitle">
              Reset kata sandi &quot;{resetTarget.name}&quot;?
            </div>

            <div className="confirm-desc">
              Kata sandi lama akan diganti dengan kata sandi default.
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn confirm-btn--cancel"
                onClick={() => setResetTarget(null)}
              >
                Batal
              </button>

              <button
                type="button"
                className="confirm-btn confirm-btn--danger"
                onClick={confirmReset}
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HASIL KATA SANDI BARU */}
      {resetResult && (
        <div
          className="confirm-overlay"
          onClick={() => setResetResult(null)}
        >
          <div
            className="confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="confirm-close"
              onClick={() => setResetResult(null)}
              aria-label="Tutup"
            >
              ✕
            </button>

            <div className="confirm-icon">
              <KeyRound size={20} />
            </div>

            <div className="confirm-title">Kata sandi baru dibuat</div>

            <div className="confirm-subtitle">
              Untuk &quot;{resetResult.name}&quot;
            </div>

            <div className="confirm-desc">
              Catat &amp; sampaikan kata sandi ini secara manual — kata sandi
              ini hanya ditampilkan sekali dan tidak bisa dilihat lagi setelah
              ditutup.
            </div>

            <div className="password-box">{resetResult.password}</div>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn confirm-btn--cancel"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(resetResult.password)
                    .then(() => push('Kata sandi disalin.', 'success'))
                    .catch(() => {})
                }}
              >
                Salin
              </button>

              <button
                type="button"
                className="confirm-btn confirm-btn--danger"
                onClick={() => setResetResult(null)}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}