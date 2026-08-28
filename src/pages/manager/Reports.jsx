import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import { FileSpreadsheet, Printer, X } from 'lucide-react'

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

export default function Reports() {
  const { push } = useToast()
  const [data, setData] = useState(null)
  const [employees, setEmployees] = useState([])

  // state filter
  const [filterYear, setFilterYear] = useState('')
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
    const currentYear = new Date().getFullYear()
    const yearsRange = Array.from({ length: 8 }, (_, i) => String(currentYear - 3 + i))

    const yearsFromData = (data?.leave_requests ?? [])
      .map((item) => item.from?.slice(0, 4))
      .filter(Boolean)

    return [...new Set([...yearsRange, ...yearsFromData])].sort((a, b) => a - b)
  }, [data])

  // gabungan: daftar departemen tetap + departemen dari data karyawan (field "dept")
  // + departemen dari data cuti, biar semua departemen selalu muncul di filter
  const deptOptions = useMemo(() => {
    const fromEmployees = employees.map((emp) => emp.dept).filter(Boolean)
    const fromLeaves = (data?.leave_requests ?? []).map((item) => item.department).filter(Boolean)
    return [...new Set([...DEPARTMENTS, ...fromEmployees, ...fromLeaves])].sort()
  }, [employees, data])

  // data yang sudah difilter, dipakai untuk tabel & export
  const filteredRequests = useMemo(() => {
    if (!data?.leave_requests) return []
    return data.leave_requests.filter((item) => {
      const matchYear = filterYear ? item.from?.slice(0, 4) === filterYear : true
      const matchDept = filterDept ? item.department === filterDept : true
      const matchName = filterName
        ? item.employee?.toLowerCase().includes(filterName.toLowerCase())
        : true
      return matchYear && matchDept && matchName
    })
  }, [data, filterYear, filterDept, filterName])

  const isFiltering = filterYear || filterDept || filterName

  function resetFilters() {
    setFilterYear('')
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

  if (!data) {
    return (
      <div className="page-head">
        <div>
          <h1>Laporan Cuti</h1>
          <p>Memuat data...</p>
        </div>
      </div>
    )
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
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 18px 20px;
          margin-top: 18px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        }

        .filter-card__row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-end;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 170px;
        }

        .filter-field--grow {
          flex: 1;
          min-width: 220px;
        }

        .filter-field label {
          font-size: 0.76rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .filter-select,
        .filter-input {
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 0.86rem;
          background: #fff;
          color: #111827;
          height: 40px;
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
          padding: 9px 14px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #ef4444;
          background: #fff;
          color: #ef4444;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .filter-reset:hover { background: #fef2f2; }

        .filter-card__footer {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #e5e7eb;
          font-size: 0.82rem;
          color: #6b7280;
        }

        .filter-card__footer strong {
          color: #111827;
        }

        @media (max-width: 600px) {
          .report-actions { width: 100%; }
          .report-btn { flex: 1; }
          .filter-field { min-width: 0; flex: 1 1 100%; }
          .filter-reset { flex: 1 1 100%; justify-content: center; }
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
          <h1>Laporan Cuti</h1>
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

          <div className="filter-field filter-field--grow">
            <label htmlFor="filter-name">Nama Karyawan</label>
            <input
              id="filter-name"
              type="text"
              className="filter-input"
              placeholder="Cari nama karyawan..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>

          {isFiltering && (
            <button type="button" className="filter-reset" onClick={resetFilters}>
              <X size={14} />
              Reset Filter
            </button>
          )}
        </div>

        <div className="filter-card__footer">
          Menampilkan <strong>{filteredRequests.length}</strong> dari{' '}
          <strong>{data.leave_requests?.length ?? 0}</strong> data
        </div>
      </div>

      {/* Ringkasan */}
      <div className="kpi-grid" style={{ marginTop: 18 }}>
        <article className="card kpi">
          <h3>Total Pengajuan</h3>
          <b>{data.total}</b>
          <span>periode berjalan</span>
        </article>

        <article className="card kpi">
          <h3>Disetujui</h3>
          <b>{data.approved}</b>
          <span>pengajuan diterima</span>
        </article>

        <article className="card kpi">
          <h3>Menunggu</h3>
          <b>{data.pending}</b>
          <span>perlu keputusan</span>
        </article>

        <article className="card kpi">
          <h3>Ditolak</h3>
          <b>{data.rejected}</b>
          <span>pengajuan ditolak</span>
        </article>
      </div>

      {/* Tabel Laporan */}
      <section className="card panel" style={{ marginTop: 18 }}>
        <div className="panel__head">
          <h2>Rekap Data Pengajuan Cuti</h2>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Karyawan</th>
                <th>Departemen</th>
                <th>Jenis Cuti</th>
                <th>Periode</th>
                <th>Durasi</th>
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
                  <td>{row.from} - {row.to}</td>
                  <td>{row.days} hari</td>
                  <td>
                    <span className={`badge badge--${row.status}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredRequests.length && (
            <div className="empty">
              {isFiltering ? 'Tidak ada data yang cocok dengan filter.' : 'Belum ada data cuti.'}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}