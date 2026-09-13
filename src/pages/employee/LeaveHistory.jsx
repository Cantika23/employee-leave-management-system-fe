import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatDate, initials, statusLabel } from '../../lib/format'
import { Clock3, ScrollText, CheckCircle2, XCircle, ClipboardList } from 'lucide-react'
import Logo from '../../components/Logo'

const TYPE_FILTERS = [
  { id: 'all', label: 'Semua Jenis' },
  { id: 'Cuti Tahunan', label: 'Cuti Tahunan' },
  { id: 'Sakit', label: 'Sakit' },
  { id: 'Izin', label: 'Izin' },
]

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua Status' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'rejected', label: 'Ditolak' },
]

const MONTHS = [
  { id: 'all', label: 'Semua Bulan' },
  { id: '01', label: 'Januari' },
  { id: '02', label: 'Februari' },
  { id: '03', label: 'Maret' },
  { id: '04', label: 'April' },
  { id: '05', label: 'Mei' },
  { id: '06', label: 'Juni' },
  { id: '07', label: 'Juli' },
  { id: '08', label: 'Agustus' },
  { id: '09', label: 'September' },
  { id: '10', label: 'Oktober' },
  { id: '11', label: 'November' },
  { id: '12', label: 'Desember' },
]

// --- Info perusahaan untuk kop surat, sesuaikan dengan data asli ---
const COMPANY = {
  name: 'PT MITRA TRANSFORMASI DIGITAL',
  address: 'Jl. Tanjung Barat, Kec. Jagakarsa, Kota Adm. Jakarta Selatan, Prov. DKI Jakarta',
  contact: 'Telp: (021) 555-0192  ·  Email: hr@mitral.co.id ',
}

const ROMAN_MONTHS = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']

// --- helper: judul & teks surat sesuai jenis pengajuan ---
function letterTitle(type) {
  switch (type) {
    case 'Cuti Tahunan':
      return 'SURAT PERMOHONAN CUTI TAHUNAN'
    case 'Sakit':
      return 'SURAT PERMOHONAN IZIN SAKIT'
    case 'Izin':
      return 'SURAT PERMOHONAN IZIN'
    default:
      return 'SURAT PERMOHONAN CUTI / IZIN'
  }
}

function letterBodyLabel(type) {
  switch (type) {
    case 'Cuti Tahunan':
      return 'cuti tahunan'
    case 'Sakit':
      return 'izin tidak masuk kerja dikarenakan sakit'
    case 'Izin':
      return 'izin tidak masuk kerja'
    default:
      return 'cuti/izin'
  }
}

function typeCode(type) {
  switch (type) {
    case 'Cuti Tahunan': return 'CT'
    case 'Sakit': return 'SK'
    case 'Izin': return 'IZ'
    default: return 'UM'
  }
}

// --- kode role untuk nomor surat.
// Disesuaikan dengan role yang dipakai di form Data Karyawan:
// 'employee' | 'manager' | 'hr'
function roleCode(role) {
  switch ((role || '').toLowerCase()) {
    case 'hr':
      return 'HR'
    case 'manager':
      return 'MN'
    case 'employee':
    default:
      return 'EM'
  }
}

// --- nomor surat otomatis, mis: 014/EM-CT/IX/2026 (employee ajukan cuti tahunan)
// atau 014/HR-SK/IX/2026 (HR ajukan izin sakit), dst.
// Prefix role diambil dari data pengajuan itu sendiri kalau ada,
// atau dicocokkan lewat nama ke data /employees.
function letterNumber(row, roleByName, fallbackName) {
  const date = new Date(row.submitted)
  const roman = ROMAN_MONTHS[date.getMonth()] || 'I'
  const year = date.getFullYear()
  const seq = String(row.id).replace(/\D/g, '').padStart(3, '0') || '001'

  const nameKey = (row.employee || fallbackName || '')
    .trim()
    .toLowerCase()

  const role =
    row.role ||
    row.employee_role ||
    row.employee?.role ||
    roleByName[nameKey]

  return `${seq}/${roleCode(role)}-${typeCode(row.type)}/${roman}/${year}`
}

// --- ambil Nomor Induk Pegawai dari data request.
// Urutan prioritas:
// 1) row.nip                -> kalau backend leave-requests langsung sertakan nip
// 2) row.employee_nip       -> kalau nama field-nya beda
// 3) row.employee?.nip      -> kalau backend kirim object employee ter-nested
// 4) nipByName[nama]        -> dicocokkan manual dari data /employees berdasar nama
// 5) row.id                 -> fallback terakhir kalau memang belum ada NIP sama sekali
function employeeNip(row, nipByName, fallbackName) {
  const nameKey = (row.employee || fallbackName || '')
    .trim()
    .toLowerCase()

  return (
    row.nip ||
    row.employee_nip ||
    row.employee?.nip ||
    nipByName[nameKey] ||
    row.id
  )
}

// --- warna aksen kecil per status, dipakai untuk kartu ringkasan ---
const STATUS_ACCENT = {
  pending: { bg: '#fff7e6', fg: '#b8720a', ring: '#f5d896' },
  approved: { bg: '#e9f7ef', fg: '#1c7a4d', ring: '#a9e3c4' },
  rejected: { bg: '#fdecec', fg: '#c23434', ring: '#f3b7b7' },
}

export default function LeaveHistory() {

  const { user } = useAuth()
  const { push } = useToast()

  const [requests, setRequests] = useState([])
  const [employeesList, setEmployeesList] = useState([])
  const [loading, setLoading] = useState(true)

  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [monthFilter, setMonthFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')

  const [query, setQuery] = useState('')

  // --- state untuk surat yang akan dicetak ---
  const [letterRow, setLetterRow] = useState(null)

  // begitu letterRow terisi, langsung trigger dialog cetak
  useEffect(() => {
    if (!letterRow) return

    const timer = setTimeout(() => {
      window.print()
    }, 50)

    function handleAfterPrint() {
      setLetterRow(null)
    }

    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [letterRow])

  useEffect(() => {
    api
      .get('/leave-requests')
      .then((res) => {
        setRequests(res.data)
      })
      .catch(() => {
        push('Gagal memuat riwayat cuti.', 'error')
      })
      .finally(() => {
        setLoading(false)
      })

    // ambil juga data karyawan, dipakai untuk mencocokkan NIP & role
    // berdasarkan nama, karena /leave-requests belum menyertakan nip/role.
    api
      .get('/employees')
      .then((res) => {
        setEmployeesList(res.data)
      })
      .catch(() => {
        // diamkan saja kalau gagal; surat akan fallback ke ID request / role default
      })

  }, [])

  // peta nama karyawan (lowercase) -> nip, untuk lookup cepat
  const nipByName = useMemo(() => {
    const map = {}
    employeesList.forEach((emp) => {
      if (emp.name) {
        map[emp.name.trim().toLowerCase()] = emp.nip || emp.id
      }
    })
    return map
  }, [employeesList])

  // peta nama karyawan (lowercase) -> role, dipakai untuk kode nomor surat
  const roleByName = useMemo(() => {
    const map = {}
    employeesList.forEach((emp) => {
      if (emp.name) {
        map[emp.name.trim().toLowerCase()] = emp.role
      }
    })
    return map
  }, [employeesList])

  const years = useMemo(() => {
    const yearsList = []
    for (
      let year = 2026;
      year <= 2030;
      year++
    ) {
      yearsList.push(
        year.toString()
      )
    }
    return yearsList
  }, [])

  // Filter diterapkan langsung setiap kali salah satu dropdown/pencarian
  // berubah, tanpa perlu tombol "Cari" terpisah.
  const rows = useMemo(() => {
    let result = requests.filter((item) => {
      const date = new Date(item.submitted)
      const matchType =
        typeFilter === 'all' ||
        item.type === typeFilter
      const matchStatus =
        statusFilter === 'all' ||
        item.status === statusFilter
      const matchMonth =
        monthFilter === 'all' ||
        String(date.getMonth() + 1)
          .padStart(2, '0') === monthFilter
      const matchYear =
        yearFilter === 'all' ||
        String(date.getFullYear()) === yearFilter
      return (
        matchType &&
        matchStatus &&
        matchMonth &&
        matchYear
      )
    })

    if (query.trim()) {
      result = result.filter((item) =>
        `${item.employee || user.name}
        ${item.id}
        ${item.type}`
          .toLowerCase()
          .includes(
            query.toLowerCase()
          )
      )
    }
    return result

  }, [
    requests,
    typeFilter,
    statusFilter,
    monthFilter,
    yearFilter,
    query,
    user.name
  ])

  // --- ringkasan status, dihitung dari seluruh data (bukan hasil filter) ---
  const summary = useMemo(() => {
    const base = { total: requests.length, pending: 0, approved: 0, rejected: 0 }
    requests.forEach((item) => {
      if (base[item.status] !== undefined) base[item.status] += 1
    })
    return base
  }, [requests])

  const filterActive =
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    monthFilter !== 'all' ||
    yearFilter !== 'all' ||
    query.trim() !== ''

    return (
    <div>

      <div className="page-head">
        <div>
          <h3>
            Riwayat cuti
          </h3>

          <p>
            Kelola dan pantau informasi pengajuan cuti
          </p>
        </div>
      </div>

      {/* --- Kartu ringkasan status --- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <SummaryCard
          icon={<ClipboardList size={18} />}
          label="Total Pengajuan"
          value={summary.total}
          tone={{ bg: '#eef2ff', fg: '#3b4dcc', ring: '#c7cffa' }}
        />
        <SummaryCard
          icon={<Clock3 size={18} />}
          label="Menunggu"
          value={summary.pending}
          tone={STATUS_ACCENT.pending}
        />
        <SummaryCard
          icon={<CheckCircle2 size={18} />}
          label="Disetujui"
          value={summary.approved}
          tone={STATUS_ACCENT.approved}
        />
        <SummaryCard
          icon={<XCircle size={18} />}
          label="Ditolak"
          value={summary.rejected}
          tone={STATUS_ACCENT.rejected}
        />
      </div>

      <section
        className="card panel"
        style={{
          padding:18,
          borderRadius:18,
          marginBottom:18,
        }}
      >

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'end',
            marginBottom: 14,
          }}
        >
          <div style={{ flex: '1 1 150px' }}>

            <label
              style={{
                display:'block',
                fontSize:'0.72rem',
                color:'var(--muted)',
                marginBottom:5,
              }}
            >
              Jenis Pengajuan
            </label>

            <select
              value={typeFilter}
              onChange={(e)=>
                setTypeFilter(e.target.value)
              }
              style={{
                width:'100%',
                padding:'10px 12px',
                borderRadius:12,
                border:'1px solid #dbe7f3',
                background:'#fff',
              }}
            >

              {
                TYPE_FILTERS.map((item)=>(

                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.label}
                  </option>

                ))
              }

            </select>

          </div>

          <div style={{ flex: '1 1 150px' }}>

            <label
              style={{
                display:'block',
                fontSize:'0.72rem',
                color:'var(--muted)',
                marginBottom:5,
              }}
            >
              Status Pengajuan
            </label>

            <select
              value={statusFilter}
              onChange={(e)=>
                setStatusFilter(e.target.value)
              }
              style={{
                width:'100%',
                padding:'10px 12px',
                borderRadius:12,
                border:'1px solid #dbe7f3',
                background:'#fff',
              }}
            >

              {
                STATUS_FILTERS.map((item)=>(

                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.label}
                  </option>

                ))
              }

            </select>

          </div>

          <div style={{ flex: '1 1 150px' }}>

            <label
              style={{
                display:'block',
                fontSize:'0.72rem',
                color:'var(--muted)',
                marginBottom:5,
              }}
            >
              Bulan
            </label>

            <select
              value={monthFilter}
              onChange={(e)=>
                setMonthFilter(e.target.value)
              }
              style={{
                width:'100%',
                padding:'10px 12px',
                borderRadius:12,
                border:'1px solid #dbe7f3',
                background:'#fff',
              }}
            >

              {
                MONTHS.map((item)=>(

                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.label}
                  </option>

                ))
              }

            </select>

          </div>

          <div style={{ flex: '1 1 150px' }}>

            <label
              style={{
                display:'block',
                fontSize:'0.72rem',
                color:'var(--muted)',
                marginBottom:5,
              }}
            >
              Tahun
            </label>

            <select
              value={yearFilter}
              onChange={(e)=>
                setYearFilter(e.target.value)
              }
              style={{
                width:'100%',
                padding:'10px 12px',
                borderRadius:12,
                border:'1px solid #dbe7f3',
                background:'#fff',
              }}
            >

              <option value="all">
                Semua Tahun
              </option>

              {
                years.map((year)=>(

                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>

                ))
              }

            </select>

          </div>
        </div>

        {
          filterActive && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px dashed #dbe7f3',
                fontSize: '0.78rem',
                color: 'var(--muted)',
              }}
            >
              Menampilkan <strong style={{ color: '#0f172a' }}>{rows.length}</strong> dari {requests.length} pengajuan
            </div>
          )
        }
      </section>

      <section className="card panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Karyawan</th>
                <th>Jenis</th>
                <th>Periode</th>
                <th>Diajukan</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {
                loading && (
                  <tr>
                    <td colSpan={7}>
                      <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                        Memuat riwayat cuti...
                      </div>
                    </td>
                  </tr>
                )
              }
              {
                !loading && rows.map((row)=>{
                  const name = row.employee || user.name
                  return (
                  <tr key={row.id}>
                    <td><b style={{ color: '#0f172a' }}>#{row.id}</b></td>
                    <td>
                      <div className="person">
                        <span
                          className="avatar"
                          style={{
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            width:36,
                            height:36,
                            borderRadius:'50%',
                            flexShrink:0,
                          }}
                        >
                          {initials(name)}
                        </span>
                        <span>
                          <strong>{name}</strong>
                          <span>{row.department || row.reason}</span>
                        </span>
                      </div>
                    </td>
                    <td>{row.type}</td>
                    <td>
                      {formatDate(row.from)}
                      {' – '}
                      {formatDate(row.to)}
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                        {row.days} hari kerja
                      </div>
                    </td>
                    <td>{formatDate(row.submitted)}</td>
                    <td>
                      <span className={`badge badge--${row.status}`}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          type="button"
                          title="Cetak surat permohonan"
                          onClick={() => setLetterRow(row)}
                          style={{
                            display:'inline-flex',
                            alignItems:'center',
                            justifyContent:'center',
                            gap: 6,
                            width:36,
                            height:36,
                            borderRadius:10,
                            border:'1px solid #dbe7f3',
                            background:'#fff',
                            cursor:'pointer',
                            color: '#2f6fed',
                            transition: 'background 120ms ease, border-color 120ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#eef4ff'
                            e.currentTarget.style.borderColor = '#bcd3fb'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff'
                            e.currentTarget.style.borderColor = '#dbe7f3'
                          }}
                        >
                          <ScrollText size={20}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              }
            </tbody>
          </table>
          {
            !loading &&
            rows.length===0 &&
            (
              <div
                className="empty"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '40px 0',
                  color: 'var(--muted)',
                }}
              >
                <ClipboardList size={28} style={{ opacity: 0.5 }} />
                <div style={{ fontWeight: 600, color: '#334155' }}>Tidak Ada Pengajuan</div>
                <div style={{ fontSize: '0.82rem' }}>Coba ubah untuk melihat data lainnya.</div>
              </div>
            )
          }
        </div>
      </section>

      {
        letterRow && (
              /* KERTAS SURAT — tersembunyi di layar, cuma tampil saat dialog cetak */
              <div
                className="surat-print"
                style={{
                  padding:'42px 48px',
                  fontFamily:'"Times New Roman", "Liberation Serif", Georgia, serif',
                  color:'#111827',
                  lineHeight:1.7,
                  fontSize:'14px',
                  background:'#fff',
                }}
              >
                {/* KOP SURAT */}
                <div style={{
                  display:'flex',
                  alignItems:'center',
                  gap:12,
                  paddingBottom:12,
                }}>
                  <Logo size={46} />

                  <div>
                    <div style={{
                      fontWeight:700,
                      fontSize:'1.15rem',
                      letterSpacing:0.4,
                      color:'#0f172a',
                    }}>
                      {COMPANY.name}
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'#374151' }}>
                      {COMPANY.address}
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'#374151' }}>
                      {COMPANY.contact}
                    </div>
                  </div>
                </div>

                {/* garis kop: tebal + tipis, khas kop surat resmi */}
                <div style={{ borderTop:'3px solid #0f172a', marginBottom:2 }} />
                <div style={{ borderTop:'1px solid #0f172a', marginBottom:22 }} />

                {/* judul surat */}
                <div style={{ textAlign:'center', marginBottom:22 }}>
                  <div style={{
                    fontWeight:700,
                    fontSize:'1.05rem',
                    letterSpacing:0.6,
                    textDecoration:'underline',
                  }}>
                    {letterTitle(letterRow.type)}
                  </div>
                  <div style={{ fontSize:'0.85rem', color:'#374151', marginTop:2 }}>
                    Nomor: {letterNumber(letterRow, roleByName, user.name)}
                  </div>
                </div>

                {/* tujuan */}
                <div style={{ marginBottom:16 }}>
                  Yth.<br/>
                  HRD/Pimpinan PT Mitra Transformasi Digital<br/>
                  di tempat
                </div>

                <p style={{ marginBottom:14, textAlign:'justify' }}>
                  Dengan hormat, yang bertanda tangan di bawah ini:
                </p>

                <table style={{ marginBottom:16, borderCollapse:'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding:'2px 12px 2px 0', verticalAlign:'top', width:170 }}>Nama Lengkap</td>
                      <td style={{ padding:'2px 8px', verticalAlign:'top' }}>:</td>
                      <td style={{ padding:'2px 0', verticalAlign:'top' }}>{letterRow.employee || user.name}</td>
                    </tr>
                    <tr>
                      <td style={{ padding:'2px 12px 2px 0', verticalAlign:'top' }}>Jabatan / Departemen</td>
                      <td style={{ padding:'2px 8px', verticalAlign:'top' }}>:</td>
                      <td style={{ padding:'2px 0', verticalAlign:'top' }}>{letterRow.department || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding:'2px 12px 2px 0', verticalAlign:'top' }}>Nomor Induk Pegawai</td>
                      <td style={{ padding:'2px 8px', verticalAlign:'top' }}>:</td>
                      <td style={{ padding:'2px 0', verticalAlign:'top' }}>{employeeNip(letterRow, nipByName, user.name)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* paragraf alasan digabung jadi satu, tanpa box */}
                <p style={{ marginBottom:28, textAlign:'justify', textIndent:'2.5em' }}>
                  Dengan ini mengajukan permohonan <strong>{letterBodyLabel(letterRow.type)}</strong>{' '}
                  selama <strong>{letterRow.days} ({letterRow.days} hari)</strong> hari kerja,
                  terhitung mulai tanggal <strong>{formatDate(letterRow.from)}</strong> sampai
                  dengan <strong>{formatDate(letterRow.to)}</strong>, dengan alasan sebagai
                  berikut: {letterRow.reason || '-'}.
                </p>

                <p style={{ marginBottom:32, textAlign:'justify', textIndent:'2.5em' }}>
                  Demikian surat permohonan ini saya sampaikan. Besar harapan saya agar
                  permohonan ini dapat disetujui. Atas perhatian dan kebijaksanaan
                  Bapak/Ibu, saya ucapkan terima kasih.
                </p>

                {/* tanda tangan — dipindah ke kanan */}
                <div style={{
                  display:'flex',
                  justifyContent:'flex-end',
                  marginBottom:8,
                }}>

                  <div style={{ textAlign:'center', width:220 }}>
                    <div>Jakarta, {formatDate(letterRow.submitted)}</div>
                    <div style={{ color:'#6b7280', fontSize:'0.8rem' }}>Hormat saya, Pemohon</div>
                    <div style={{ height:64 }} />
                    <div style={{ borderTop:'1px solid #0f172a', paddingTop:4 }}>
                      {letterRow.employee || user.name}
                    </div>
                  </div>
                </div>
              </div>
        )
      }

      <style>{`
        .table tbody tr {
          transition: background 120ms ease;
        }
        .table tbody tr:hover {
          background: #f8fafc;
        }
        .table tbody tr:nth-child(even) {
          background: #fbfcfe;
        }
        .table tbody tr:nth-child(even):hover {
          background: #f8fafc;
        }
        .surat-print, .surat-print * {
          font-family: "Times New Roman", "Liberation Serif", Georgia, serif !important;
        }
        /* sembunyi di layar biasa, cuma muncul saat dialog cetak dipanggil */
        .surat-print {
          display: none;
        }
        @media print {
          body * { visibility: hidden; }
          .surat-print {
            display: block !important;
            visibility: visible;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
          .surat-print * { visibility: visible; }
        }
      `}</style>
    </div>
  )
}

// --- kartu ringkasan kecil untuk header halaman ---
function SummaryCard({ icon, label, value, tone }) {
  return (
    <div
      className="card panel"
      style={{
        padding: '16px 18px',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tone.bg,
          color: tone.fg,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  )
}