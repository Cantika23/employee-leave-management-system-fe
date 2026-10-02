import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import {
  FileSpreadsheet,
  Printer,
  RotateCcw,
  ClipboardList,
  CheckCircle2,
  Clock3,
  XCircle,
  Inbox,
  Search,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react'

const PAGE_SIZE = 10

const DEPARTMENTS = [
  'Technology',
  'People & Culture',
  'Customer Service',
  'Finance',
  'Marketing',
  'Human Resources',
  'Operations',
]

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const STATUS_LABEL = {
  approved: 'Disetujui',
  pending: 'Menunggu',
  rejected: 'Ditolak',
}

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')

// format tanggal polos YYYY-MM-DD -> "5 Jan 2026" tanpa objek Date
// (menghindari bug timezone pada tanggal tanpa jam)
const formatDate = (value) => {
  if (!value) return '-'

  const [year, month, day] = String(value).slice(0, 10).split('-')
  const label = MONTHS[Number(month) - 1]

  if (!year || !label) return String(value)

  return `${Number(day)} ${label.slice(0, 3)} ${year}`
}

export default function Reports() {
  const { push } = useToast()
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [employees, setEmployees] = useState([])

  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterName, setFilterName] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api
      .get('/reports')
      .then((res) => setData(res.data))
      .catch(() => {
        setLoadError(true)
        setData({ leave_requests: [] })
        push('Gagal memuat laporan.', 'error')
      })

    api
      .get('/employees')
      .then((res) => setEmployees(res.data?.employees ?? res.data ?? []))
      .catch(() => setEmployees([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // tahun diambil dari data asli + tahun berjalan, terbaru dulu
  const yearOptions = useMemo(() => {
    const years = new Set([String(new Date().getFullYear())])

    ;(data?.leave_requests ?? []).forEach((item) => {
      const year = item.from?.slice(0, 4)
      if (year) years.add(year)
    })

    return [...years].sort((a, b) => Number(b) - Number(a))
  }, [data])

  const deptOptions = useMemo(() => {
    const fromEmployees = employees.map((emp) => emp.dept).filter(Boolean)
    const fromLeaves = (data?.leave_requests ?? [])
      .map((i) => i.department)
      .filter(Boolean)

    return [...new Set([...DEPARTMENTS, ...fromEmployees, ...fromLeaves])].sort()
  }, [employees, data])

  const nameOptions = useMemo(() => {
    const fromEmployees = employees.map((emp) => emp.name).filter(Boolean)
    const fromLeaves = (data?.leave_requests ?? [])
      .map((i) => i.employee)
      .filter(Boolean)

    return [...new Set([...fromEmployees, ...fromLeaves])].sort()
  }, [employees, data])

  const filteredRequests = useMemo(() => {
    if (!data?.leave_requests) return []

    return data.leave_requests.filter((item) => {
      const matchYear = filterYear ? item.from?.slice(0, 4) === filterYear : true
      const matchMonth = filterMonth
        ? Number(item.from?.slice(5, 7)) === Number(filterMonth)
        : true
      const matchDept = filterDept ? item.department === filterDept : true
      const matchName = filterName ? item.employee === filterName : true

      return matchYear && matchMonth && matchDept && matchName
    })
  }, [data, filterYear, filterMonth, filterDept, filterName])

  // ringkasan mengikuti hasil filter
  const summary = useMemo(() => {
    const count = (s) => filteredRequests.filter((r) => r.status === s).length

    return {
      total: filteredRequests.length,
      approved: count('approved'),
      pending: count('pending'),
      rejected: count('rejected'),
    }
  }, [filteredRequests])

  // pagination
  useEffect(() => {
    setPage(1)
  }, [filterYear, filterMonth, filterDept, filterName])

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pagedRequests = filteredRequests.slice(pageStart, pageStart + PAGE_SIZE)

  const isFiltering = Boolean(filterYear || filterMonth || filterDept || filterName)
  const isLoading = data === null

  function resetFilters() {
    setFilterYear('')
    setFilterMonth('')
    setFilterDept('')
    setFilterName('')
  }

  function exportExcel() {
    if (!filteredRequests.length) {
      push('Data laporan belum tersedia.', 'error')
      return
    }

    const rows = filteredRequests.map((item) => ({
      Nomor: item.id,
      Karyawan: item.employee,
      Departemen: item.department,
      'Jenis Cuti': item.type,
      Mulai: item.from,
      Selesai: item.to,
      Durasi: `${item.days} hari`,
      'Sisa Cuti': `${item.leave_balance ?? 0} hari`,
      Alasan: item.reason,
      Status: STATUS_LABEL[item.status] ?? item.status,
      'Tanggal Pengajuan': item.submitted,
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)

    // lebar kolom mengikuti isi terpanjang supaya langsung rapi saat dibuka
    const headers = Object.keys(rows[0])
    worksheet['!cols'] = headers.map((key) => ({
      wch: Math.min(
        40,
        Math.max(
          key.length,
          ...rows.map((row) => String(row[key] ?? '').length),
        ) + 2,
      ),
    }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Cuti')

    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(workbook, `Laporan-Cuti-${today}.xlsx`)

    push('Laporan Excel berhasil diekspor.', 'success')
  }

  return (
    <div className="rp">
      <style>{`
        .rp {
          --rp-surface: #ffffff;
          --rp-line: #e3eaf3;
          --rp-text: #1e293b;
          --rp-muted: #64748b;
          --rp-brand: #2563eb;
          --rp-brand-dark: #1d4ed8;
          --rp-brand-soft: #eaf2ff;
          color: var(--rp-text);
          -webkit-font-smoothing: antialiased;
        }

        /* ===== Header ===== */
        .rp-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .rp-head h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .rp-head p {
          margin: 4px 0 0;
          font-size: 0.9rem;
          color: var(--rp-muted);
        }
        .rp-actions { display: flex; gap: 8px; }

        .rp-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 14px;
          border-radius: 10px;
          font: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
        }
        .rp-btn:focus-visible,
        .rp-field select:focus-visible,
        .rp-reset:focus-visible,
        .rp-pager button:focus-visible {
          outline: 2px solid var(--rp-brand);
          outline-offset: 2px;
        }
        .rp-btn--primary {
          background: linear-gradient(135deg, #2f6fd6, #245ec4);
          border: 1px solid var(--rp-brand);
          color: #fff;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .rp-btn--primary:hover { background: var(--rp-brand-dark); }
        .rp-btn--ghost {
          background: var(--rp-surface);
          border: 1px solid var(--rp-line);
          color: #334155;
        }
        .rp-btn--ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

        /* ===== KPI ===== */
        .rp-kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 22px;
        }
        .rp-kpi {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          background: var(--rp-surface);
          border: 1px solid #edf1f7;
          border-radius: 18px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
        }
        .rp-kpi__icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .rp-kpi__label {
          font-size: 0.8rem;
          color: var(--rp-muted);
          font-weight: 500;
        }
        .rp-kpi__value {
          font-size: 1.6rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.15;
          font-variant-numeric: tabular-nums;
        }

        /* ===== Panel (filter + tabel) ===== */
        .rp-panel {
          margin-top: 18px;
          background: var(--rp-surface);
          border: 1px solid #edf1f7;
          border-radius: 18px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }
        .rp-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-end;
          padding: 16px 18px;
          border-bottom: 1px solid var(--rp-line);
        }
        .rp-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1 1 150px;
          min-width: 0;
        }
        .rp-field label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--rp-muted);
        }
        .rp-field select {
          height: 38px;
          padding: 0 34px 0 12px;
          border: 1px solid #dbe7f3;
          border-radius: 10px;
          background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
          appearance: none;
          font: inherit;
          font-size: 0.86rem;
          color: var(--rp-text);
          width: 100%;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .rp-field select:hover { border-color: #c3d3e6; }
        .rp-field select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
        }
        .rp-reset {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 12px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: var(--rp-brand);
          font: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .rp-reset:hover { background: var(--rp-brand-soft); }

        .rp-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          font-size: 0.82rem;
          color: var(--rp-muted);
          border-bottom: 1px solid var(--rp-line);
          background: #f8fafc;
        }
        .rp-meta strong { color: var(--rp-text); font-weight: 600; }

        /* ===== Tabel ===== */
        .rp-table-wrap { overflow-x: auto; }
        .rp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.87rem;
        }
        .rp-table thead th {
          text-align: left;
          padding: 11px 18px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--rp-muted);
          white-space: nowrap;
          background: #f8fafc;
          border-bottom: 1px solid var(--rp-line);
        }
        .rp-table tbody td {
          padding: 14px 18px;
          border-bottom: 1px solid #eef2f7;
          vertical-align: middle;
          white-space: nowrap;
        }
        .rp-table tbody tr:last-child td { border-bottom: none; }
        .rp-table tbody tr { transition: background 0.15s ease; }
        .rp-table tbody tr:hover { background: #f8fafc; }
        .rp-num { color: var(--rp-muted); font-variant-numeric: tabular-nums; }

        .rp-person { display: flex; align-items: center; gap: 12px; }
        .rp-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dbeafe, #c9efff);
          color: #315c7c;
          display: grid;
          place-items: center;
          font-size: 0.74rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .rp-person__name { font-weight: 600; color: #334155; }

        .rp-period {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #334155;
        }
        .rp-period svg { color: #94a3b8; }

        .rp-chip {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 8px;
          background: #f1f5f9;
          color: #334155;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .rp-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px 4px 8px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .rp-status::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .rp-status--approved { background: #e8f7ef; color: #15803d; }
        .rp-status--pending { background: #fff4e0; color: #b45309; }
        .rp-status--rejected { background: #fdecec; color: #b91c1c; }

        /* ===== Pagination ===== */
        .rp-pager {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-top: 1px solid var(--rp-line);
          font-size: 0.82rem;
          color: var(--rp-muted);
        }
        .rp-pager button {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #dbe7f3;
          background: #fff;
          color: #475569;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .rp-pager button:hover:not(:disabled) { background: #f1f5f9; }
        .rp-pager button:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ===== Loading & kosong ===== */
        .rp-skel {
          height: 14px;
          border-radius: 6px;
          min-width: 60px;
          background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%);
          background-size: 200% 100%;
          animation: rp-shimmer 1.2s infinite linear;
        }
        .rp-skel--avatar {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 50%;
        }
        @keyframes rp-shimmer { to { background-position: -200% 0; } }

        .rp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 56px 16px;
          text-align: center;
          color: var(--rp-muted);
          font-size: 0.85rem;
        }
        .rp-empty__icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: var(--rp-brand-soft);
          color: var(--rp-brand);
          display: grid;
          place-items: center;
          margin-bottom: 6px;
        }
        .rp-empty__icon--error { background: #fdecec; color: #b91c1c; }
        .rp-empty strong { color: var(--rp-text); font-size: 0.95rem; }

        @media (prefers-reduced-motion: reduce) {
          .rp-skel { animation: none; }
        }
        @media (max-width: 900px) {
          .rp-kpis { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .rp-kpis { grid-template-columns: 1fr; }
          .rp-actions { width: 100%; }
          .rp-btn { flex: 1; justify-content: center; }
          .rp-field { flex: 1 1 100%; }
          .rp-reset { width: 100%; justify-content: center; }
        }

        @media print {
          .rp-actions, .rp-toolbar, .rp-pager { display: none !important; }
          .rp-panel, .rp-kpi { border-color: #d1d5db; box-shadow: none; }
        }
      `}</style>

      {/* Header */}
      <div className="rp-head">
        <div>
          <h4>Laporan Cuti</h4>
          <p>Rekap seluruh pengajuan cuti karyawan.</p>
        </div>

        <div className="rp-actions">
          <button
            type="button"
            className="rp-btn rp-btn--primary"
            onClick={exportExcel}
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="rp-kpis">
        <Kpi icon={<ClipboardList size={20} />} label="Total pengajuan" value={isLoading ? '–' : summary.total} bg="#eaf2ff" fg="#2563eb" />
        <Kpi icon={<CheckCircle2 size={20} />} label="Disetujui" value={isLoading ? '–' : summary.approved} bg="#e8f7ef" fg="#15803d" />
        <Kpi icon={<Clock3 size={20} />} label="Menunggu" value={isLoading ? '–' : summary.pending} bg="#fff4e0" fg="#b45309" />
        <Kpi icon={<XCircle size={20} />} label="Ditolak" value={isLoading ? '–' : summary.rejected} bg="#fdecec" fg="#b91c1c" />
      </div>

      {/* Filter + Tabel */}
      <section className="rp-panel">
        <div className="rp-toolbar">
          <Field id="filter-year" label="Tahun" value={filterYear} onChange={setFilterYear} placeholder="Semua tahun">
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Field>

          <Field id="filter-month" label="Bulan" value={filterMonth} onChange={setFilterMonth} placeholder="Semua bulan">
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </Field>

          <Field id="filter-dept" label="Departemen" value={filterDept} onChange={setFilterDept} placeholder="Semua departemen">
            {deptOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Field>

          <Field id="filter-name" label="Karyawan" value={filterName} onChange={setFilterName} placeholder="Semua karyawan">
            {nameOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Field>

          {isFiltering && (
            <button type="button" className="rp-reset" onClick={resetFilters}>
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>

        <div className="rp-meta">
          <span>
            Menampilkan <strong>{pagedRequests.length}</strong> dari{' '}
            <strong>{filteredRequests.length}</strong> pengajuan
            {isFiltering && (
              <> (total {data?.leave_requests?.length ?? 0})</>
            )}
          </span>
        </div>

        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Karyawan</th>
                <th>Departemen</th>
                <th>Jenis cuti</th>
                <th>Periode</th>
                <th>Durasi</th>
                <th>Sisa cuti</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="rp-skel" style={{ width: 24 }} /></td>
                    <td>
                      <div className="rp-person">
                        <div className="rp-skel rp-skel--avatar" />
                        <div className="rp-skel" style={{ width: 110 }} />
                      </div>
                    </td>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}><div className="rp-skel" /></td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                pagedRequests.map((row, index) => (
                  <tr key={row.id}>
                    <td className="rp-num">{pageStart + index + 1}</td>
                    <td>
                      <div className="rp-person">
                        <div className="rp-avatar">{initials(row.employee)}</div>
                        <span className="rp-person__name">{row.employee}</span>
                      </div>
                    </td>
                    <td>{row.department}</td>
                    <td><span className="rp-chip">{row.type}</span></td>
                    <td>
                      <span className="rp-period">
                        <CalendarDays size={14} />
                        {formatDate(row.from)} – {formatDate(row.to)}
                      </span>
                    </td>
                    <td>{row.days} hari</td>
                    <td>{row.leave_balance ?? 0} hari</td>
                    <td>
                      <span className={`rp-status rp-status--${row.status}`}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {!isLoading && !filteredRequests.length && (
            <div className="rp-empty">
              <div
                className={`rp-empty__icon ${loadError ? 'rp-empty__icon--error' : ''}`}
              >
                {loadError ? (
                  <AlertTriangle size={24} />
                ) : isFiltering ? (
                  <Search size={24} />
                ) : (
                  <Inbox size={24} />
                )}
              </div>
              <strong>
                {loadError
                  ? 'Laporan gagal dimuat'
                  : isFiltering
                    ? 'Tidak ada data yang cocok'
                    : 'Belum ada data cuti'}
              </strong>
              <span>
                {loadError
                  ? 'Periksa koneksi lalu muat ulang halaman ini.'
                  : isFiltering
                    ? 'Ubah atau reset filter untuk melihat data lainnya.'
                    : 'Data akan muncul di sini setelah ada pengajuan cuti.'}
              </span>
            </div>
          )}
        </div>

        {!isLoading && filteredRequests.length > PAGE_SIZE && (
          <div className="rp-pager">
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
      </section>
    </div>
  )
}

function Field({ id, label, value, onChange, placeholder, children }) {
  return (
    <div className="rp-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {children}
      </select>
    </div>
  )
}

function Kpi({ icon, label, value, bg, fg }) {
  return (
    <div className="rp-kpi">
      <div className="rp-kpi__icon" style={{ background: bg, color: fg }}>
        {icon}
      </div>
      <div>
        <div className="rp-kpi__label">{label}</div>
        <div className="rp-kpi__value">{value}</div>
      </div>
    </div>
  )
}