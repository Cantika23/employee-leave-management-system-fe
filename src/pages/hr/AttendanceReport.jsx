import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import api from '../../api/axios';
import '../Attendance.css';
import logoMitral from '../../assets/mitral.png';

const ENDPOINT = '/attendance/recap';
const PER_PAGE = 10;
const statusUrl = (id) => `/attendance/${id}/status`;
const WORK_LABEL = { onsite: 'Onsite', wfh: 'WFH', remote: 'Remote' };

// Daftar departemen (disamakan dengan halaman lain)
const DEPARTMENTS = [
    'Technology',
    'People & Culture',
    'Customer Service',
    'Finance',
    'Marketing',
    'Human Resources',
    'Operations',
];

const STATUS = {
    present: { label: 'Hadir', cls: 'att-badge--present' },
    absent: { label: 'Tidak hadir', cls: 'att-badge--absent' },
    leave: { label: 'Cuti', cls: 'att-badge--leave' },
};

const MODES = [
    { key: 'day', label: 'Harian' },
    { key: 'week', label: 'Mingguan' },
    { key: 'month', label: 'Bulanan' },
    { key: 'year', label: 'Tahunan' },
];

/* ---------- helpers ---------- */
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const monthRange = () => {
    const n = new Date();
    return { from: ymd(new Date(n.getFullYear(), n.getMonth(), 1)), to: ymd(new Date(n.getFullYear(), n.getMonth() + 1, 0)) };
};

const formatTime = (t) => (t ? String(t).slice(0, 5) : '-');
const toDate = (s) => new Date(`${s}T00:00:00`);
const fmtDate = (s) => toDate(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const dayName = (s) => toDate(s).toLocaleDateString('id-ID', { weekday: 'long' });
const isWeekend = (s) => [0, 6].includes(toDate(s).getDay());
const monthName = (m) => new Date(2000, m, 1).toLocaleDateString('id-ID', { month: 'long' });

// "2026-W41" <-> tanggal
const isoWeekValue = (d) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const y = t.getUTCFullYear();
    const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
    return `${y}-W${pad(w)}`;
};
const weekValueToMonday = (v) => {
    const [y, w] = v.split('-W').map(Number);
    const jan4 = new Date(y, 0, 4);
    const mon = new Date(jan4);
    mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (w - 1) * 7);
    return mon;
};

const defaultPeriod = (mode) => {
    const n = new Date();
    if (mode === 'day') return ymd(n);
    if (mode === 'week') return isoWeekValue(n);
    if (mode === 'month') return `${n.getFullYear()}-${pad(n.getMonth() + 1)}`;
    return String(n.getFullYear());
};

// Rentang tanggal dari jenis rekap + nilai periode
const periodRange = (mode, value) => {
    if (mode === 'day') return { from: value, to: value };
    if (mode === 'week') {
        const mon = weekValueToMonday(value);
        const sun = new Date(mon);
        sun.setDate(sun.getDate() + 6);
        return { from: ymd(mon), to: ymd(sun) };
    }
    if (mode === 'month') {
        const [y, m] = value.split('-').map(Number);
        return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) };
    }
    return { from: `${value}-01-01`, to: `${value}-12-31` };
};

const periodTitle = (mode, value, r) => {
    if (mode === 'day') return fmtDate(value);
    if (mode === 'week') return `${fmtDate(r.from)} s/d ${fmtDate(r.to)}`;
    if (mode === 'month') {
        const [y, m] = value.split('-').map(Number);
        return `${monthName(m - 1)} ${y}`;
    }
    return `Tahun ${value}`;
};

const daysBetween = (from, to) => {
    const out = [];
    const d = toDate(from);
    const end = toDate(to);
    while (d <= end) {
        out.push(ymd(d));
        d.setDate(d.getDate() + 1);
    }
    return out;
};

const countStatus = (records) => {
    const c = { present: 0, absent: 0, leave: 0 };
    records.forEach((r) => {
        if (c[r.status] !== undefined) c[r.status] += 1;
    });
    return c;
};

// Persentase kehadiran untuk tampilan (format Indonesia: 85,5%)
const pctText = (n, tot) => (tot ? `${((n / tot) * 100).toFixed(1).replace('.', ',')}%` : '0,0%');

// Ambil SEMUA halaman dari endpoint recap
const fetchAll = async (params) => {
    const all = [];
    let summary = null;
    let departments = [];
    let current = 1;
    let last = 1;
    do {
        const { data } = await api.get(ENDPOINT, { params: { ...params, page: current, per_page: 100 } });
        all.push(...(data.data ?? []).map((r) => (r.status === 'late' ? { ...r, status: 'present' } : r)));
        if (current === 1) {
            summary = data.summary ?? null;
            departments = data.departments ?? [];
        }
        last = data.meta?.last_page ?? 1;
        current += 1;
    } while (current <= last);
    return { all, summary, departments };
};

/* ---------- gaya tabel rekap (ala lembar Excel) ---------- */
const TH = {
    border: '1px solid #bfdbfe',
    background: '#dbeafe',
    color: '#1e3a8a',
    padding: '8px 10px',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
    whiteSpace: 'nowrap',
};
const TD = { border: '1px solid #e2e8f0', padding: '6px 10px', fontSize: 13, whiteSpace: 'nowrap', textAlign: 'center' };
const C = { textAlign: 'center' };

// warna bubble status
const CHIP = {
    present: { solid: '#16a34a', tint: '#f0fdf4', text: '#15803d', border: '#86efac' },
    absent: { solid: '#ef4444', tint: '#fef2f2', text: '#b91c1c', border: '#fca5a5' },
    leave: { solid: '#3b82f6', tint: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
};

/* ---------- gaya Excel (disamakan dengan tampilan) ---------- */
const bd = (rgb) => ({
    top: { style: 'thin', color: { rgb } },
    bottom: { style: 'thin', color: { rgb } },
    left: { style: 'thin', color: { rgb } },
    right: { style: 'thin', color: { rgb } },
});

const XS = {
    title: {
        font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '1E3A8A' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'medium', color: { rgb: '2563EB' } } },
    },
    subtitle: {
        font: { name: 'Calibri', sz: 11, color: { rgb: '64748B' } },
        alignment: { horizontal: 'center', vertical: 'center' },
    },
    label: { font: { name: 'Calibri', sz: 11 }, alignment: { horizontal: 'left' } },
    value: { font: { name: 'Calibri', sz: 11, bold: true }, alignment: { horizontal: 'left' } },
    th: {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '1E3A8A' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: bd('BFDBFE'),
    },
    td: (fill, color, bold = false) => ({
        font: { name: 'Calibri', sz: 11, bold, color: color ? { rgb: color } : undefined },
        fill: { patternType: 'solid', fgColor: { rgb: fill } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: bd('E2E8F0'),
    }),
    total: {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '1E3A8A' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: bd('BFDBFE'),
    },
};

const XCHIP = {
    present: { tint: 'F0FDF4', text: '15803D' },
    absent: { tint: 'FEF2F2', text: 'B91C1C' },
    leave: { tint: 'EFF6FF', text: '1D4ED8' },
};

// z = format angka (mis. '0.0%'); xlsx-js-style membaca format dari style.numFmt
const cell = (v, s, z) => (z ? { v, t: 'n', z, s: { ...s, numFmt: z } } : { v, s });
const PCT = '0.0%';

/* ---------- cetak PDF (rekap matriks ala lembar absensi) ---------- */
const COMPANY = 'PT MITRA TRANSFORMASI DIGITAL';
const COMPANY_ADDR = 'Jl. Tanjung Barat, Kec. Jagakarsa, Kota Adm. Jakarta Selatan, Prov. DKI Jakarta';
const COMPANY_CONTACT = 'Telp: (021) 555-0192 · Email: hr@mitral.co.id';
const PRINT_MAX_DAYS = 31;
const CODE = { present: 'H', absent: 'A', leave: 'C' };

const esc = (v) =>
    String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const buildPrintHtml = ({ records, range, department, logo }) => {
    const days = daysBetween(range.from, range.to);

    // 1 baris per karyawan, kolom per tanggal
    const people = new Map();
    records.forEach((r) => {
        const key = r.employee_id ?? r.user_name;
        if (!people.has(key)) {
            people.set(key, {
                name: r.user_name ?? '-',
                nip: r.employee_id ?? '-',
                dept: r.department ?? '-',
                byDate: new Map(),
            });
        }
        people.get(key).byDate.set(r.date, r.status);
    });
    const list = [...people.values()].sort((a, b) => a.name.localeCompare(b.name, 'id'));

    const periodText = range.from === range.to ? fmtDate(range.from) : `${fmtDate(range.from)} s/d ${fmtDate(range.to)}`;
    const printed = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const totalCols = 4 + days.length + 3;

    const dayHead = days.map((d) => `<th class="d${isWeekend(d) ? ' we' : ''}">${Number(d.slice(8))}</th>`).join('');

    const body = list.length
        ? list.map((p, i) => {
            const cnt = { present: 0, absent: 0, leave: 0 };
            const cells = days.map((d) => {
                const st = p.byDate.get(d);
                if (st && cnt[st] !== undefined) cnt[st] += 1;
                const cls = [isWeekend(d) ? 'we' : '', st ? `s-${st}` : ''].filter(Boolean).join(' ');
                return `<td class="${cls}">${st ? CODE[st] ?? '' : ''}</td>`;
            }).join('');
            return `<tr><td>${i + 1}</td><td class="l">${esc(p.name)}</td><td>${esc(p.nip)}</td><td class="l">${esc(p.dept)}</td>${cells}<td class="tt">${cnt.present}</td><td class="tt">${cnt.absent}</td><td class="tt">${cnt.leave}</td></tr>`;
        }).join('')
        : `<tr><td colspan="${totalCols}" style="padding:14px">Tidak ada data absensi.</td></tr>`;

    return `<!doctype html>
<html lang="id"><head><meta charset="utf-8" />
<title>Rekap Absensi ${esc(periodText)}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  body { font-family: Calibri, Arial, sans-serif; color: #000; margin: 0; font-size: 11px;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .kop { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 0 4px 8px; font-family: 'Times New Roman', Times, serif; color: #1b2240; }
  .kop img { height: 56px; width: auto; flex: none; }
  .kop .t { text-align: left; }
  .kop .t h1 { margin: 0 0 6px; font-size: 20px; font-weight: 700; letter-spacing: .5px; color: #111827; }
  .kop .t p { margin: 3px 0 0; font-size: 12px; color: #1f2937; }
  .kop-line { height: 3px; border-top: 4px solid #1b2240; border-bottom: 1.5px solid #1b2240; margin-bottom: 4px; }
  h2 { text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 20px; font-weight: 700; margin: 14px 0 12px; text-decoration: underline; text-underline-offset: 3px; letter-spacing: 1px; color: #111827; }
  .info { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11.5px; }
  .info td { padding: 1px 6px 1px 0; }
  table.rekap { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .rekap th, .rekap td { border: 1px solid #a68a64; padding: 2px 1px; text-align: center; font-size: 9.5px; height: 17px; overflow: hidden; }
  .rekap th { background: #d9c3a5; color: #4a3222; font-weight: 700; border-color: #a68a64; }
  .rekap td.tt { background: #f3e9dc; color: #4a3222; font-weight: 700; }
  .rekap td.l { text-align: center; padding: 2px 4px; white-space: nowrap; text-overflow: ellipsis; }
  .rekap thead { display: table-header-group; }
  .rekap tr { page-break-inside: avoid; }
  .rekap th.we { background: #fecaca; color: #991b1b; }
  .rekap td.we { background: #fee2e2; }
  .rekap td.s-present { background: #bbf7d0; color: #166534; font-weight: 700; }
  .rekap td.s-absent { background: #ef4444; color: #fff; font-weight: 700; }
  .rekap td.s-leave { background: #bfdbfe; color: #1e40af; font-weight: 700; }
</style></head>
<body>
  <div class="kop">
    <img src="${esc(logo)}" alt="" />
    <div class="t">
      <h1>${esc(COMPANY)}</h1>
      <p>${esc(COMPANY_ADDR)}</p>
      <p>${esc(COMPANY_CONTACT)}</p>
    </div>
  </div>
  <div class="kop-line"></div>
  <h2>REKAP ABSENSI KARYAWAN</h2>
  <div class="info">
    <table><tbody>
      <tr><td>Departemen</td><td>:</td><td>${esc(department || 'Semua Departemen')}</td></tr>
      <tr><td>Periode</td><td>:</td><td>${esc(periodText)}</td></tr>
    </tbody></table>
    <table><tbody>
      <tr><td>Jumlah Karyawan</td><td>:</td><td>${list.length}</td></tr>
      <tr><td>Tanggal Cetak</td><td>:</td><td>${esc(printed)}</td></tr>
    </tbody></table>
  </div>

  <table class="rekap">
    <colgroup>
      <col style="width:7mm" /><col style="width:40mm" /><col style="width:24mm" /><col style="width:28mm" />
      ${days.map(() => '<col />').join('')}
      <col style="width:9mm" /><col style="width:9mm" /><col style="width:9mm" />
    </colgroup>
    <thead>
      <tr>
        <th rowspan="2">No</th><th rowspan="2">Nama</th><th rowspan="2">NIP</th><th rowspan="2">Departemen</th>
        <th colspan="${days.length}">Tanggal</th>
        <th colspan="3">TOTAL</th>
      </tr>
      <tr>${dayHead}<th>H</th><th>A</th><th>C</th></tr>
    </thead>
    <tbody>${body}</tbody>
  </table>


</body></html>`;
};

// Cetak lewat iframe tersembunyi -> dialog print -> "Simpan sebagai PDF"
const printHtml = (html) =>
    new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();

        const go = () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => {
                iframe.remove();
                resolve();
            }, 1000);
        };
        const img = doc.images[0];
        if (img && !img.complete) {
            img.onload = go;
            img.onerror = go;
        } else {
            go();
        }
    });

/* ---------- ikon kecil ---------- */
const ICONS = {
    users: (
        <>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
            <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" />
        </>
    ),
    check: <path d="M5 12l5 5L20 7" />,
    download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    x: <path d="M6 6l12 12M18 6L6 18" />,
    print: (
        <>
            <path d="M7 9V3h10v6" />
            <rect x="3" y="9" width="18" height="8" rx="2" />
            <path d="M7 14h10v7H7z" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
        </>
    ),
};

function Icon({ name, size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[name]}
        </svg>
    );
}

/* ---------- halaman ---------- */
export default function AttendanceReport() {
    // filter
    const [range, setRange] = useState(monthRange);
    const [department, setDepartment] = useState('');
    const [status, setStatus] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    // layar penuh "Lihat Data"
    const [emp, setEmp] = useState(null);
    const [mode, setMode] = useState('month');
    const [periodValue, setPeriodValue] = useState(() => defaultPeriod('month'));
    const [detail, setDetail] = useState({ records: [], loading: false, failed: false });
    const [savingId, setSavingId] = useState(null);
    const [saveError, setSaveError] = useState('');

    // data utama
    const [result, setResult] = useState({ records: [], summary: null, departments: [], loading: true, failed: false });

    useEffect(() => {
        const id = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(id);
    }, [searchInput]);

    useEffect(() => {
        if (!emp) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape' && savingId === null) setEmp(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [emp, savingId]);

    // Kunci scroll halaman di belakang saat tampilan penuh terbuka
    useEffect(() => {
        if (!emp) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [emp]);

    // Data utama
    useEffect(() => {
        let ignore = false;
        setResult((r) => ({ ...r, loading: true, failed: false }));

        fetchAll({
            from: range.from,
            to: range.to,
            department: department || undefined,
            status: status || undefined,
            search: search || undefined,
        })
            .then(({ all, summary, departments }) => {
                if (ignore) return;
                setResult({ records: all, summary, departments, loading: false, failed: false });
            })
            .catch(() => {
                if (ignore) return;
                setResult((r) => ({ ...r, records: [], loading: false, failed: true }));
            });

        return () => {
            ignore = true;
        };
    }, [range.from, range.to, department, status, search, reloadKey]);

    const periodR = useMemo(() => periodRange(mode, periodValue), [mode, periodValue]);

    // Data detail karyawan sesuai jenis rekap + periode
    useEffect(() => {
        if (!emp) return undefined;
        let ignore = false;
        setDetail({ records: [], loading: true, failed: false });

        fetchAll({
            from: periodR.from,
            to: periodR.to,
            search: emp.employee_id !== '-' ? emp.employee_id : emp.name,
        })
            .then(({ all }) => {
                if (ignore) return;
                const mine = all.filter((r) => (r.employee_id ?? r.user_name) === emp.key);
                setDetail({ records: mine, loading: false, failed: false });
            })
            .catch(() => {
                if (ignore) return;
                setDetail({ records: [], loading: false, failed: true });
            });

        return () => {
            ignore = true;
        };
    }, [emp, periodR.from, periodR.to]);

    // Tabel utama: 1 baris per data absensi (tampilan awal)
    const totalRecords = result.records.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
    const pageRows = result.records.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const startNo = (page - 1) * PER_PAGE;

    // Baris rekap harian (semua tanggal dalam periode)
    const dayRows = useMemo(() => {
        if (mode === 'year') return [];
        const byDate = new Map(detail.records.map((r) => [r.date, r]));
        return daysBetween(periodR.from, periodR.to).map((date) => ({ date, rec: byDate.get(date) }));
    }, [mode, detail.records, periodR]);

    // Baris rekap tahunan (12 bulan)
    const yearRows = useMemo(() => {
        if (mode !== 'year') return [];
        return Array.from({ length: 12 }, (_, m) => {
            const prefix = `${periodValue}-${pad(m + 1)}`;
            const recs = detail.records.filter((r) => r.date.startsWith(prefix));
            return { month: monthName(m), ...countStatus(recs), total: recs.length };
        });
    }, [mode, detail.records, periodValue]);

    const totals = useMemo(() => countStatus(detail.records), [detail.records]);

    const changeFilter = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    // Buka layar penuh rekap untuk karyawan dari baris yang diklik
    const openDetail = (r) => {
        setEmp({
            key: r.employee_id ?? r.user_name,
            name: r.user_name ?? '-',
            employee_id: r.employee_id ?? '-',
            department: r.department ?? '-',
        });
        setMode('month');
        setPeriodValue(defaultPeriod('month'));
        setSaveError('');
    };

    const changeMode = (m) => {
        setMode(m);
        setPeriodValue(defaultPeriod(m));
        setSaveError('');
    };

    // Klik bubble status -> langsung tersimpan
    const setRowStatus = async (rec, next) => {
        if (next === rec.status || savingId !== null) return;
        setSavingId(rec.id);
        setSaveError('');
        try {
            await api.patch(statusUrl(rec.id), { status: next });
            setDetail((d) => ({
                ...d,
                records: d.records.map((r) => (r.id === rec.id ? { ...r, status: next } : r)),
            }));
            setReloadKey((k) => k + 1);
        } catch (err) {
            setSaveError(err?.response?.data?.message || 'Status gagal diubah. Coba lagi.');
        } finally {
            setSavingId(null);
        }
    };

    // Export seluruh data di tabel utama (dengan styling)
    const exportExcel = () => {
        setExporting(true);
        setExportError('');
        try {
            const head = ['No', 'Nama', 'NIP', 'Departemen', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status'];
            const data = [
                head.map((h) => cell(h, XS.th)),
                ...result.records.map((r, i) => {
                    const bg = i % 2 ? 'F8FAFC' : 'FFFFFF';
                    const t = XS.td(bg);
                    return [
                        cell(i + 1, t),
                        cell(r.user_name ?? '-', { ...t, alignment: { horizontal: 'left', vertical: 'center' } }),
                        cell(r.employee_id ?? '-', t),
                        cell(r.department ?? '-', t),
                        cell(fmtDate(r.date), t),
                        cell(formatTime(r.check_in), t),
                        cell(formatTime(r.check_out), t),
                        cell(STATUS[r.status]?.label ?? r.status ?? '-', XS.td(bg, XCHIP[r.status]?.text, true)),
                    ];
                }),
            ];
            const sheet = XLSX.utils.aoa_to_sheet(data);
            sheet['!cols'] = [6, 26, 16, 18, 14, 12, 12, 14].map((wch) => ({ wch }));
            sheet['!rows'] = [{ hpt: 22 }];
            const book = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(book, sheet, 'Rekap Absensi');
            XLSX.writeFile(book, `rekap-absensi_${range.from}_${range.to}.xlsx`);
        } catch {
            setExportError('Export gagal. Coba lagi sebentar lagi.');
        } finally {
            setExporting(false);
        }
    };

    // Export rekap satu karyawan (sesuai periode di tampilan penuh)
    const exportEmployee = () => {
        const isYear = mode === 'year';
        const ncols = isYear ? 7 : 8;
        const pct = (n, tot) => (tot ? n / tot : 0);
        const rows = [];
        const merges = [];
        const blank = () => Array.from({ length: ncols }, () => cell('', undefined));
        const addMerge = (r, c1, c2) => merges.push({ s: { r, c: c1 }, e: { r, c: c2 } });

        // Kop
        const title = Array.from({ length: ncols }, () => cell('', XS.title));
        title[0] = cell('REKAP ABSENSI KARYAWAN', XS.title);
        rows.push(title);
        addMerge(rows.length - 1, 0, ncols - 1);

        const sub = blank();
        sub[0] = cell(`Periode ${periodTitle(mode, periodValue, periodR)}`, XS.subtitle);
        rows.push(sub);
        addMerge(rows.length - 1, 0, ncols - 1);
        rows.push(blank());

        // Identitas
        [['Nama', emp.name], ['NIP', emp.employee_id], ['Departemen', emp.department]].forEach(([k, v]) => {
            const r = blank();
            r[0] = cell(k, XS.label);
            r[2] = cell(`: ${v}`, XS.value);
            rows.push(r);
            addMerge(rows.length - 1, 0, 1);
            addMerge(rows.length - 1, 2, ncols - 1);
        });
        rows.push(blank());

        if (isYear) {
            // Tabel tahunan
            rows.push(['No', 'Bulan', 'Hadir', 'Tidak hadir', 'Cuti', 'Total', '% Hadir'].map((h) => cell(h, XS.th)));
            yearRows.forEach((r, i) => {
                const bg = i % 2 ? 'F8FAFC' : 'FFFFFF';
                rows.push([
                    cell(i + 1, XS.td(bg)),
                    cell(r.month, XS.td(bg)),
                    cell(r.present, XS.td(bg)),
                    cell(r.absent, XS.td(bg)),
                    cell(r.leave, XS.td(bg)),
                    cell(r.total, XS.td(bg, null, true)),
                    cell(pct(r.present, r.total), XS.td(bg, '15803D', true), PCT),
                ]);
            });
            rows.push([
                cell('TOTAL', XS.total),
                cell('', XS.total),
                cell(totals.present, XS.total),
                cell(totals.absent, XS.total),
                cell(totals.leave, XS.total),
                cell(detail.records.length, XS.total),
                cell(pct(totals.present, detail.records.length), XS.total, PCT),
            ]);
            addMerge(rows.length - 1, 0, 1);
        } else {
            // Tabel harian
            rows.push(
                ['No', 'Tanggal', 'Hari', 'Jam Masuk', 'Jam Pulang', 'Jenis Kerja', 'Lokasi', 'Status Kehadiran']
                    .map((h) => cell(h, XS.th))
            );
            dayRows.forEach(({ date, rec }, i) => {
                const weekend = isWeekend(date);
                const bg = weekend ? 'FEE2E2' : rec ? XCHIP[rec.status]?.tint ?? 'FFFFFF' : i % 2 ? 'F8FAFC' : 'FFFFFF';
                const fg = weekend && !rec ? 'DC2626' : null;
                const base = XS.td(bg, fg);
                const statusText = rec ? STATUS[rec.status]?.label ?? rec.status : weekend ? 'Libur' : '-';
                const statusStyle = rec ? XS.td(bg, XCHIP[rec.status]?.text, true) : base;
                rows.push([
                    cell(i + 1, base),
                    cell(fmtDate(date), base),
                    cell(dayName(date), base),
                    cell(rec ? formatTime(rec.check_in) : '-', base),
                    cell(rec ? formatTime(rec.check_out) : '-', base),
                    cell(rec ? WORK_LABEL[rec.work_type] ?? rec.work_type ?? '-' : '-', base),
                    cell(rec?.location || '-', base),
                    cell(statusText, statusStyle),
                ]);
            });

            // Ringkasan
            rows.push(blank());
            const sumHead = blank();
            sumHead[0] = cell('RINGKASAN', XS.th);
            sumHead[1] = cell('', XS.th);
            sumHead[2] = cell('', XS.th);
            rows.push(sumHead);
            addMerge(rows.length - 1, 0, 2);

            Object.entries(STATUS).forEach(([k, v]) => {
                const r = blank();
                r[0] = cell(v.label, XS.td('FFFFFF', XCHIP[k].text, true));
                r[1] = cell('', XS.td('FFFFFF'));
                r[2] = cell(totals[k], XS.td('FFFFFF', null, true));
                rows.push(r);
                addMerge(rows.length - 1, 0, 1);
            });

            const sumTot = blank();
            sumTot[0] = cell('TOTAL', XS.total);
            sumTot[1] = cell('', XS.total);
            sumTot[2] = cell(detail.records.length, XS.total);
            rows.push(sumTot);
            addMerge(rows.length - 1, 0, 1);

            const sumPct = blank();
            sumPct[0] = cell('Persentase Kehadiran', XS.total);
            sumPct[1] = cell('', XS.total);
            sumPct[2] = cell(pct(totals.present, detail.records.length), XS.total, PCT);
            rows.push(sumPct);
            addMerge(rows.length - 1, 0, 1);
        }

        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet['!merges'] = merges;
        sheet['!cols'] = (isYear ? [6, 16, 12, 14, 10, 10, 12] : [6, 15, 12, 12, 12, 14, 24, 18]).map((wch) => ({ wch }));
        sheet['!rows'] = [{ hpt: 26 }, { hpt: 18 }];

        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, sheet, 'Rekap');
        XLSX.writeFile(book, `rekap-${emp.employee_id}_${periodR.from}_${periodR.to}.xlsx`);
    };

    // Cetak rekap (tampilan awal) jadi PDF
    const printPdf = async () => {
        setExportError('');
        const n = daysBetween(range.from, range.to).length;
        if (n > PRINT_MAX_DAYS) {
            setExportError(`Cetak PDF maksimal ${PRINT_MAX_DAYS} hari. Persempit rentang tanggal dulu.`);
            return;
        }
        await printHtml(
            buildPrintHtml({
                records: result.records,
                range,
                department,
                logo: new URL(logoMitral, window.location.href).href,
            })
        );
    };

    const { summary, loading, failed } = result;

    const stats = [
        { key: 'total', label: 'Total Karyawan', value: summary?.total_employees, icon: 'users', tone: 'indigo' },
        { key: 'present', label: 'Hadir', value: (summary?.present ?? 0) + (summary?.late ?? 0), icon: 'check', tone: 'green' },
        { key: 'absent', label: 'Tidak Hadir', value: summary?.absent, icon: 'x', tone: 'red' },
    ];

    return (
        <div className="att">
            <div className="att-grid">
                {/* Kartu ringkasan */}
                <section className="att-card att-statscard att-wide" aria-label="Ringkasan absensi">
                    <div className="att-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        {stats.map((s) => (
                            <div
                                key={s.key}
                                className={`att-stat att-stat--${s.tone}`}
                                style={s.tone === 'indigo' ? { background: '#e8eefa' } : undefined}
                            >
                                <span className="att-stat__icon" style={s.tone === 'indigo' ? { color: '#2563eb' } : undefined}>
                                    <Icon name={s.icon} size={20} />
                                </span>
                                <div>
                                    <strong>{s.value ?? 0}</strong>
                                    <small>{s.label}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Filter + tabel */}
                <section className="att-card att-wide">
                    <div className="att-head">
                        <h4 className="att-title">
                            <Icon name="calendar" size={22} /> Data Absensi Karyawan
                        </h4>
                        <div className="att-filters" style={{ width: '100%' }}>
                            <div className="att-range">
                                <Icon name="calendar" size={16} />
                                <input
                                    type="date"
                                    aria-label="Dari tanggal"
                                    value={range.from}
                                    max={range.to}
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        setRange((r) => ({ ...r, from: e.target.value }));
                                        setPage(1);
                                    }}
                                />
                                <span>–</span>
                                <input
                                    type="date"
                                    aria-label="Sampai tanggal"
                                    value={range.to}
                                    min={range.from}
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        setRange((r) => ({ ...r, to: e.target.value }));
                                        setPage(1);
                                    }}
                                />
                            </div>

                            <select className="att-select" aria-label="Filter departemen" value={department}
                                onChange={(e) => changeFilter(setDepartment)(e.target.value)}>
                                <option value="">Semua Departemen</option>
                                {DEPARTMENTS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            <select className="att-select" aria-label="Filter status" value={status}
                                onChange={(e) => changeFilter(setStatus)(e.target.value)}>
                                <option value="">Semua Status</option>
                                {Object.entries(STATUS).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>

                            <input
                                type="search"
                                className="att-input"
                                style={{ width: 220 }}
                                placeholder="Cari nama / NIP..."
                                aria-label="Cari nama atau NIP"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />

                            {/* Grup tombol -> pojok kanan */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
                                <button
                                    type="button"
                                    className="att-btn att-btn--primary"
                                    style={{ fontSize: 14, padding: '9px 16px', gap: 8 }}
                                    disabled={exporting || loading || failed || result.records.length === 0}
                                    onClick={exportExcel}
                                >
                                    <Icon name="download" size={16} />
                                    {exporting ? 'Mengekspor...' : 'Export'}
                                </button>

                                <button
                                    type="button"
                                    className="att-btn att-btn--soft"
                                    style={{ fontSize: 14, padding: '9px 16px', gap: 8 }}
                                    disabled={loading || failed || result.records.length === 0}
                                    onClick={printPdf}
                                >
                                    <Icon name="print" size={16} />
                                    Cetak PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {exportError && (
                        <p className="att-error" role="alert" style={{ margin: '0 0 12px' }}>{exportError}</p>
                    )}

                    <div className="att-tablewrap">
                        <table className="att-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Nama</th>
                                    <th>NIP</th>
                                    <th>Departemen</th>
                                    <th>Tanggal</th>
                                    <th>Jam Masuk</th>
                                    <th>Jam Pulang</th>
                                    <th className="att-center">Status</th>
                                    <th className="att-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} className="att-empty">Memuat...</td></tr>
                                ) : failed ? (
                                    <tr>
                                        <td colSpan={9} className="att-empty">
                                            Data belum bisa dimuat. Cek endpoint {ENDPOINT} dan pastikan login sebagai HR.
                                        </td>
                                    </tr>
                                ) : pageRows.length === 0 ? (
                                    <tr><td colSpan={9} className="att-empty">Tidak ada data absensi untuk filter ini.</td></tr>
                                ) : (
                                    pageRows.map((r, i) => {
                                        const st = STATUS[r.status];
                                        return (
                                            <tr key={r.id}>
                                                <td>{startNo + i + 1}</td>
                                                <td>{r.user_name ?? '-'}</td>
                                                <td>{r.employee_id ?? '-'}</td>
                                                <td>{r.department ?? '-'}</td>
                                                <td>{fmtDate(r.date)}</td>
                                                <td>{formatTime(r.check_in)}</td>
                                                <td>{formatTime(r.check_out)}</td>
                                                <td className="att-center">
                                                    {st ? <span className={`att-badge ${st.cls}`}>{st.label}</span> : '-'}
                                                </td>
                                                <td className="att-center">
                                                    <button
                                                        type="button"
                                                        className="att-btn att-btn--soft"
                                                        style={{ fontSize: 13, padding: '6px 14px' }}
                                                        onClick={() => openDetail(r)}
                                                    >
                                                        Lihat Data
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalRecords > PER_PAGE && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                            <small style={{ color: 'var(--muted)' }}>
                                Halaman {page} dari {totalPages} · {totalRecords} data
                            </small>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" className="att-btn att-btn--soft" style={{ fontSize: 14, padding: '8px 16px' }}
                                    disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                    Sebelumnya
                                </button>
                                <button type="button" className="att-btn att-btn--soft" style={{ fontSize: 14, padding: '8px 16px' }}
                                    disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Tampilan penuh: lembar rekap absensi */}
            {emp && (
                <div
                    role="presentation"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'stretch',
                        justifyContent: 'stretch',
                        padding: 0,
                        background: '#eef2f9',
                    }}
                >
                    <div
                        className="att-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="att-detail-title"
                        style={{
                            width: '100%',
                            height: '100%',
                            maxHeight: '100vh',
                            padding: '24px 40px 32px',
                            background: '#eef2f9',
                            borderRadius: 0,
                            boxShadow: 'none',
                            border: 'none',
                            overflowY: 'auto',
                        }}
                    >
                        {/* Tombol kembali (atas) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                            <button
                                type="button"
                                className="att-btn att-btn--soft"
                                style={{ fontSize: 14, padding: '8px 16px' }}
                                disabled={savingId !== null}
                                onClick={() => setEmp(null)}
                            >
                                ← Kembali
                            </button>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #dbe4f3', borderTop: '5px solid #2563eb', borderRadius: 12, padding: '24px 28px', boxShadow: '0 4px 14px rgba(37,99,235,0.08)' }}>
                            {/* Kop */}
                            <div style={{ textAlign: 'center', borderBottom: '2px solid #2563eb', paddingBottom: 10, marginBottom: 16 }}>
                                <h3 id="att-detail-title" style={{ margin: 0, fontSize: 17, letterSpacing: 1, color: '#1e3a8a' }}>
                                    REKAP ABSENSI KARYAWAN
                                </h3>
                                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                                    Periode {periodTitle(mode, periodValue, periodR)}
                                </div>
                            </div>

                            {/* Identitas */}
                            <table style={{ fontSize: 13.5, marginBottom: 16, borderCollapse: 'collapse' }}>
                                <tbody>
                                    {[
                                        ['Nama', emp.name],
                                        ['NIP', emp.employee_id],
                                        ['Departemen', emp.department],
                                    ].map(([k, v]) => (
                                        <tr key={k}>
                                            <td style={{ padding: '2px 0', width: 110 }}>{k}</td>
                                            <td style={{ padding: '2px 8px 2px 0' }}>:</td>
                                            <td style={{ padding: '2px 0', fontWeight: 600 }}>{v}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pilih jenis rekap + periode */}
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                    Jenis rekap
                                    <select className="att-select" value={mode} onChange={(e) => changeMode(e.target.value)}>
                                        {MODES.map((m) => (
                                            <option key={m.key} value={m.key}>{m.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                    Periode
                                    {mode === 'year' ? (
                                        <input
                                            type="number"
                                            className="att-input"
                                            style={{ width: 100 }}
                                            min={2000}
                                            max={2100}
                                            value={periodValue}
                                            onChange={(e) => e.target.value && setPeriodValue(e.target.value)}
                                        />
                                    ) : (
                                        <input
                                            type={mode === 'day' ? 'date' : mode === 'week' ? 'week' : 'month'}
                                            className="att-input"
                                            value={periodValue}
                                            onChange={(e) => e.target.value && setPeriodValue(e.target.value)}
                                        />
                                    )}
                                </label>

                                <button
                                    type="button"
                                    className="att-btn att-btn--soft"
                                    style={{ fontSize: 13, padding: '8px 14px', marginLeft: 'auto', gap: 6 }}
                                    disabled={detail.loading || detail.failed}
                                    onClick={exportEmployee}
                                >
                                    <Icon name="download" size={14} /> Export
                                </button>
                            </div>

                            {saveError && (
                                <p className="att-error" role="alert" style={{ margin: '0 0 12px' }}>{saveError}</p>
                            )}

                            {/* Tabel rekap */}
                            <div style={{ overflowX: 'auto' }}>
                                {detail.loading ? (
                                    <p className="att-empty">Memuat...</p>
                                ) : detail.failed ? (
                                    <p className="att-empty">Data belum bisa dimuat.</p>
                                ) : mode === 'year' ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={TH}>No</th>
                                                <th style={TH}>Bulan</th>
                                                <th style={{ ...TH, ...C }}>Hadir</th>
                                                <th style={{ ...TH, ...C }}>Tidak hadir</th>
                                                <th style={{ ...TH, ...C }}>Cuti</th>
                                                <th style={{ ...TH, ...C }}>Total</th>
                                                <th style={{ ...TH, ...C }}>% Hadir</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {yearRows.map((r, i) => (
                                                <tr key={r.month}>
                                                    <td style={TD}>{i + 1}</td>
                                                    <td style={TD}>{r.month}</td>
                                                    <td style={{ ...TD, ...C }}>{r.present}</td>
                                                    <td style={{ ...TD, ...C }}>{r.absent}</td>
                                                    <td style={{ ...TD, ...C }}>{r.leave}</td>
                                                    <td style={{ ...TD, ...C, fontWeight: 600 }}>{r.total}</td>
                                                    <td style={{ ...TD, ...C, fontWeight: 600, color: '#15803d' }}>
                                                        {pctText(r.present, r.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr style={{ background: '#dbeafe', color: '#1e3a8a', fontWeight: 700 }}>
                                                <td style={TD} colSpan={2}>TOTAL</td>
                                                <td style={{ ...TD, ...C }}>{totals.present}</td>
                                                <td style={{ ...TD, ...C }}>{totals.absent}</td>
                                                <td style={{ ...TD, ...C }}>{totals.leave}</td>
                                                <td style={{ ...TD, ...C }}>{detail.records.length}</td>
                                                <td style={{ ...TD, ...C }}>{pctText(totals.present, detail.records.length)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={TH}>No</th>
                                                <th style={TH}>Tanggal</th>
                                                <th style={TH}>Hari</th>
                                                <th style={{ ...TH, ...C }}>Jam Masuk</th>
                                                <th style={{ ...TH, ...C }}>Jam Pulang</th>
                                                <th style={TH}>Jenis Kerja</th>
                                                <th style={TH}>Lokasi</th>
                                                <th style={TH}>Status Kehadiran</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dayRows.map(({ date, rec }, i) => {
                                                const weekend = isWeekend(date);
                                                const bg = weekend ? '#fee2e2' : rec ? CHIP[rec.status]?.tint ?? '#fff' : i % 2 ? '#f8fafc' : '#fff';
                                                return (
                                                    <tr key={date} style={{ background: bg, color: weekend && !rec ? '#dc2626' : undefined }}>
                                                        <td style={TD}>{i + 1}</td>
                                                        <td style={TD}>{fmtDate(date)}</td>
                                                        <td style={TD}>{dayName(date)}</td>
                                                        <td style={{ ...TD, ...C }}>{rec ? formatTime(rec.check_in) : '-'}</td>
                                                        <td style={{ ...TD, ...C }}>{rec ? formatTime(rec.check_out) : '-'}</td>
                                                        <td style={TD}>{rec ? WORK_LABEL[rec.work_type] ?? rec.work_type ?? '-' : '-'}</td>
                                                        <td style={TD}>{rec?.location || '-'}</td>
                                                        <td style={TD}>
                                                            {rec ? (
                                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                                    {Object.entries(STATUS).map(([k, v]) => {
                                                                        const active = rec.status === k;
                                                                        const col = CHIP[k];
                                                                        return (
                                                                            <button
                                                                                key={k}
                                                                                type="button"
                                                                                disabled={savingId !== null}
                                                                                onClick={() => setRowStatus(rec, k)}
                                                                                style={{
                                                                                    fontSize: 12.5,
                                                                                    fontWeight: 600,
                                                                                    padding: '3px 12px',
                                                                                    borderRadius: 999,
                                                                                    cursor: active || savingId !== null ? 'default' : 'pointer',
                                                                                    border: `1px solid ${active ? col.solid : col.border}`,
                                                                                    background: active ? col.solid : '#fff',
                                                                                    color: active ? '#fff' : col.text,
                                                                                    opacity: savingId === rec.id && !active ? 0.6 : 1,
                                                                                }}
                                                                            >
                                                                                {v.label}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : weekend ? (
                                                                'Libur'
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Tabel ringkasan */}
                            {!detail.loading && !detail.failed && mode !== 'year' && (
                                <div style={{ marginTop: 20, overflowX: 'auto' }}>
                                    <table style={{ borderCollapse: 'collapse', minWidth: 300 }}>
                                        <thead>
                                            <tr>
                                                <th style={TH} colSpan={2}>RINGKASAN</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(STATUS).map(([k, v]) => (
                                                <tr key={k}>
                                                    <td style={TD}>{v.label}</td>
                                                    <td style={{ ...TD, ...C, width: 90 }}>{totals[k]}</td>
                                                </tr>
                                            ))}
                                            <tr style={{ background: '#dbeafe', color: '#1e3a8a', fontWeight: 700 }}>
                                                <td style={TD}>TOTAL</td>
                                                <td style={{ ...TD, ...C }}>{detail.records.length}</td>
                                            </tr>
                                            <tr style={{ background: '#dbeafe', color: '#1e3a8a', fontWeight: 700 }}>
                                                <td style={TD}>Persentase Kehadiran</td>
                                                <td style={{ ...TD, ...C }}>{pctText(totals.present, detail.records.length)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}