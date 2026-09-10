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
  SlidersHorizontal,
} from 'lucide-react'

/* daftar departemen tetap, sama seperti di halaman Data Karyawan,
   biar semua departemen selalu muncul di filter walau belum ada
   pengajuan cuti maupun karyawan yang terdaftar di departemen itu */
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
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

// --- warna aksen kartu ringkasan, senada dengan halaman Riwayat Cuti ---
const KPI_TONES = {
  total: { bg: '#eef2ff', fg: '#3b4dcc' },
  approved: { bg: '#e9f7ef', fg: '#1c7a4d' },
  pending: { bg: '#fff7e6', fg: '#b8720a' },
  rejected: { bg: '#fdecec', fg: '#c23434' },
}

export default function Reports() {
  const { push } = useToast()
  const [data, setData] = useState(null)
  const [employees, setEmployees] = useState([])

  // state filter
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterName, setFilterName] = useState('')

  useEffect(() => {
    api
      .get('/reports')
      .then((res) => setData(res.data))
      .catch(() => push('Gagal memuat laporan.', 'error'))

    // ambil data karyawan untuk daftar departemen yang lengkap
    // (biar departemen yang belum ada pengajuan cutinya tetap muncul di filter)
    api
      .get('/employees')
      .then((res) => setEmployees(res.data?.employees ?? res.data ?? []))
      .catch(() => {
        // kalau endpoint /employees gagal/tidak ada, filter tetap jalan
        // dengan DEPARTMENTS + departemen yang muncul dari data cuti saja
        setEmployees([])
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // daftar tahun: beberapa tahun ke belakang s/d beberapa tahun ke depan
  // dari tahun sekarang, digabung dengan tahun yang benar-benar ada di data cuti
  const yearOptions = useMemo(() => {
    const yearsRange = Array.from(
      { length: 5 },
      (_, i) => String(2026 + i),
    )

    const yearsFromData = (data?.leave_requests ?? [])
      .map((item) => item.from?.slice(0, 4))
      .filter(Boolean)

    return [...new Set([...yearsRange, ...yearsFromData])].sort(
      (a, b) => a - b,
    )
  }, [data])

  // gabungan: daftar departemen tetap + departemen dari data karyawan (field "dept")
  // + departemen dari data cuti, biar semua departemen selalu muncul di filter
  const deptOptions = useMemo(() => {
    const fromEmployees = employees.map((emp) => emp.dept).filter(Boolean)
    const fromLeaves = (data?.leave_requests ?? []).map((item) => item.department).filter(Boolean)
    return [...new Set([...DEPARTMENTS, ...fromEmployees, ...fromLeaves])].sort()
  }, [employees, data])

  // daftar nama karyawan untuk dropdown filter, digabung dari data karyawan
  // dan dari data pengajuan cuti (jaga-jaga kalau ada nama yang tidak ada di /employees)
  const nameOptions = useMemo(() => {
    const fromEmployees = employees.map((emp) => emp.name).filter(Boolean)
    const fromLeaves = (data?.leave_requests ?? []).map((item) => item.employee).filter(Boolean)
    return [...new Set([...fromEmployees, ...fromLeaves])].sort()
  }, [employees, data])

  // data yang sudah difilter, dipakai untuk tabel & export
  const filteredRequests = useMemo(() => {
    if (!data?.leave_requests) return []
    return data.leave_requests.filter((item) => {
      const matchYear = filterYear ? item.from?.slice(0, 4) === filterYear : true
      const matchMonth = filterMonth
        ? new Date(item.from).getMonth() + 1 === Number(filterMonth)
        : true
      const matchDept = filterDept ? item.department === filterDept : true
      const matchName = filterName
        ? item.employee === filterName
        : true
      return matchYear && matchMonth && matchDept && matchName
    })
  }, [data, filterYear, filterMonth, filterDept, filterName])

  const isFiltering = filterYear || filterDept || filterName

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
      Status: item.status,
      'Tanggal Pengajuan': item.submitted,
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Cuti')
    XLSX.writeFile(workbook, 'Laporan-Cuti.xlsx')

    push('Laporan Excel berhasil diekspor.', 'success')
  }

  function printReport() {
    window.print()
  }

  return (
    <div>
      <style>{`
        .report-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .report-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .report-btn:hover { transform: translateY(-2px); }
        .report-btn:active { transform: translateY(0); }

        .report-btn--excel {
          background: linear-gradient(135deg, #16a34a, #15803d);
          box-shadow: 0 8px 18px rgba(22, 163, 74, 0.22);
        }
        .report-btn--excel:hover { box-shadow: 0 12px 24px rgba(22, 163, 74, 0.3); }

        .report-btn--print {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
        }
        .report-btn--print:hover { box-shadow: 0 12px 24px rgba(37, 99, 235, 0.3); }

        /* ===== Filter Card ===== */
        .filter-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px 22px;
          margin-top: 18px;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
          overflow: hidden;
        }

        .filter-card::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 4px;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
        }

        .filter-card__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.86rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 14px;
        }

        .filter-card__title svg {
          color: #2563eb;
        }

        .filter-card__row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: flex-end;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1 1 150px;
        }

        .filter-field label {
          font-size: 0.72rem;
          font-weight: 500;
          color: #94a3b8;
        }

        .filter-select,
        .filter-input {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #dbe7f3;
          font-size: 0.86rem;
          background: #fff;
          color: #111827;
          height: 40px;
          width: 100%;
          transition: border-color 120ms ease, box-shadow 120ms ease;
        }

        .filter-select:hover,
        .filter-input:hover {
          border-color: #b6cdf0;
        }

        .filter-select:focus,
        .filter-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .filter-reset {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid #dbe7f3;
          background: #f8fafc;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex: 0 0 auto;
          transition: background 120ms ease, border-color 120ms ease;
        }

        .filter-reset:hover { background: #eef2f7; border-color: #b6cdf0; }

        .filter-card__footer {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px dashed #dbe7f3;
          font-size: 0.78rem;
          color: #94a3b8;
        }

        .filter-card__footer strong {
          color: #0f172a;
        }

        /* ===== KPI ringkasan ===== */
        .report-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .report-kpi {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px 18px 22px;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
          overflow: hidden;
        }

        .report-kpi::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: var(--kpi-accent, #2563eb);
        }

        .report-kpi__icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .report-kpi__value {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }

        .report-kpi__label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6b7280;
          margin-top: 3px;
        }

        /* ===== Tabel ===== */
        .report-panel {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }

        .report-panel__head {
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
        }

        .report-panel__head h2 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }

        .report-table-wrap {
          overflow-x: auto;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.86rem;
        }

        .report-table thead th {
          text-align: left;
          padding: 12px 20px;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
          border-bottom: 2px solid #e2e8f0;
        }

        .report-table tbody td {
          padding: 13px 20px;
          border-bottom: 1px solid #eef2f6;
          color: #1f2937;
        }

        .report-table tbody tr {
          transition: background 120ms ease;
        }
        .report-table tbody tr:hover {
          background: #f1f5fb;
        }
        .report-table tbody tr:nth-child(even) {
          background: #fafbfd;
        }
        .report-table tbody tr:nth-child(even):hover {
          background: #f1f5fb;
        }

        .report-status {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: capitalize;
        }
        .report-status--approved { background: #e9f7ef; color: #1c7a4d; }
        .report-status--pending { background: #fff7e6; color: #b8720a; }
        .report-status--rejected { background: #fdecec; color: #c23434; }

        .report-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 48px 0;
          color: #6b7280;
        }

        @media (max-width: 900px) {
          .report-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 600px) {
          .report-actions { width: 100%; }
          .report-btn { flex: 1; }
          .filter-field { min-width: 0; flex: 1 1 100%; }
          .filter-reset { flex: 1 1 100%; justify-content: center; }
          .report-kpi-grid { grid-template-columns: 1fr; }
        }

        @media print {
          .report-actions,
          .filter-card,
          .page-head button {
            display: none !important;
          }
        }
      `}</style>

      <div className="page-head">
        <div>
          <h3>Laporan Cuti</h3>
          <p>Rekap seluruh pengajuan cuti karyawan.</p>
        </div>

        <div className="report-actions">
          <button type="button" className="report-btn report-btn--excel" onClick={exportExcel}>
            <FileSpreadsheet size={17} />
            Export Excel
          </button>

          <button type="button" className="report-btn report-btn--print" onClick={printReport}>
            <Printer size={17} />
            Cetak
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="filter-card">
        <div className="filter-card__title">

        </div>
        <div className="filter-card__row">
          <div className="filter-field">
            <label htmlFor="filter-year">Tahun</label>
            <select
              id="filter-year"
              className="filter-select"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">Semua Tahun</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="filter-month">Bulan</label>
            <select
              id="filter-month"
              className="filter-select"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">Semua Bulan</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="filter-dept">Departemen</label>
            <select
              id="filter-dept"
              className="filter-select"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="">Semua Departemen</option>
              {deptOptions.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="filter-name">Nama Karyawan</label>
            <select
              id="filter-name"
              className="filter-select"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            >
              <option value="">Semua Karyawan</option>
              {nameOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {isFiltering && (
            <button type="button" className="filter-reset" onClick={resetFilters}>
              <RotateCcw size={14} />
              Reset Filter
            </button>
          )}
        </div>

        <div className="filter-card__footer">
          Menampilkan <strong>{filteredRequests.length}</strong> dari{' '}
          <strong>{data?.leave_requests?.length ?? 0}</strong> data
        </div>
      </div>

      {/* Ringkasan */}
      <div className="report-kpi-grid" style={{ marginTop: 18 }}>
        <ReportKpi
          icon={<ClipboardList size={20} />}
          label="Total Pengajuan"
          value={data?.total ?? 0}
          accent="#2563eb"
          tone={KPI_TONES.total}
        />
        <ReportKpi
          icon={<CheckCircle2 size={20} />}
          label="Disetujui"
          value={data?.approved ?? 0}
          accent="#16a34a"
          tone={KPI_TONES.approved}
        />
        <ReportKpi
          icon={<Clock3 size={20} />}
          label="Menunggu"
          value={data?.pending ?? 0}
          accent="#d97706"
          tone={KPI_TONES.pending}
        />
        <ReportKpi
          icon={<XCircle size={20} />}
          label="Ditolak"
          value={data?.rejected ?? 0}
          accent="#dc2626"
          tone={KPI_TONES.rejected}
        />
      </div>

      {/* Tabel Laporan */}
      <section className="report-panel" style={{ marginTop: 18 }}>
        <div className="report-panel__head">
          <h2>Rekap Data Pengajuan Cuti</h2>
        </div>

        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Karyawan</th>
                <th>Departemen</th>
                <th>Jenis Cuti</th>
                <th>Periode</th>
                <th>Durasi</th>
                <th>Sisa Cuti</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td><strong>{row.employee}</strong></td>
                  <td>{row.department}</td>
                  <td>{row.type}</td>
                  <td>{row.from} – {row.to}</td>
                  <td>{row.days} hari</td>
                  <td>
                    {row.leave_balance ?? 0} hari
                  </td>
                  <td>
                    <span className={`report-status report-status--${row.status}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredRequests.length && (
            <div className="report-empty">
              <Inbox size={28} style={{ opacity: 0.5 }} />
              <div style={{ fontWeight: 600, color: '#334155' }}>
                {isFiltering ? 'Tidak ada data yang cocok dengan filter' : 'Belum ada data cuti'}
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                {isFiltering
                  ? 'Coba ubah atau reset filter untuk melihat data lainnya.'
                  : 'Data akan muncul di sini setelah ada pengajuan cuti.'}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// --- kartu ringkasan kecil untuk laporan ---
function ReportKpi({ icon, label, value, tone, accent }) {
  return (
    <div className="report-kpi" style={{ '--kpi-accent': accent }}>
      <div className="report-kpi__icon" style={{ background: tone.bg, color: tone.fg }}>
        {icon}
      </div>
      <div>
        <div className="report-kpi__value">{value}</div>
        <div className="report-kpi__label">{label}</div>
      </div>
    </div>
  )
}