import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../../api/axios';
import '../Attendance.css';

// Endpoint (relatif terhadap baseURL di api/axios.js)
const ENDPOINT = '/attendance/recap';
const PER_PAGE = 10;
const statusUrl = (id) => `/attendance/${id}/status`;
const WORK_LABEL = { onsite: 'Onsite', wfh: 'WFH', remote: 'Remote' };

const STATUS = {
    present: { label: 'Hadir', cls: 'att-badge--present' },
    late: { label: 'Terlambat', cls: 'att-badge--late' },
    absent: { label: 'Tidak hadir', cls: 'att-badge--absent' },
    leave: { label: 'Cuti', cls: 'att-badge--leave' },
};

/* ---------- helpers ---------- */
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Default: 1 bulan berjalan
const monthRange = () => {
    const n = new Date();
    return { from: ymd(new Date(n.getFullYear(), n.getMonth(), 1)), to: ymd(new Date(n.getFullYear(), n.getMonth() + 1, 0)) };
};

const formatTime = (t) => (t ? String(t).slice(0, 5) : '-');
const fmtDate = (s) =>
    new Date(`${s}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

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
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
        </>
    ),
};

function Icon({ name, size = 18 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
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
    const [searchInput, setSearchInput] = useState(''); // yang diketik
    const [search, setSearch] = useState(''); // yang dikirim ke server (setelah jeda)
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');
    const [reloadKey, setReloadKey] = useState(0); // naikkan untuk memuat ulang data

    // modal detail + ubah status
    const [selected, setSelected] = useState(null); // baris yang dibuka
    const [draftStatus, setDraftStatus] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // hasil dari server
    const [result, setResult] = useState({
        rows: [],
        meta: null,
        summary: null,
        departments: [],
        loading: true,
        failed: false,
    });

    // Jeda 400ms setelah berhenti mengetik, supaya tidak request tiap huruf
    useEffect(() => {
        const id = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(id);
    }, [searchInput]);

    // Tekan Esc untuk menutup modal
    useEffect(() => {
        if (!selected) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape' && !saving) setSelected(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selected, saving]);

    // Ambil data tiap filter / halaman berubah
    useEffect(() => {
        let ignore = false;
        setResult((r) => ({ ...r, loading: true, failed: false }));

        api.get(ENDPOINT, {
            params: {
                from: range.from,
                to: range.to,
                department: department || undefined,
                status: status || undefined,
                search: search || undefined,
                page,
                per_page: PER_PAGE,
            },
        })
            .then(({ data }) => {
                if (ignore) return;
                setResult({
                    rows: data.data ?? [],
                    meta: data.meta ?? null,
                    summary: data.summary ?? null,
                    departments: data.departments ?? [],
                    loading: false,
                    failed: false,
                });
            })
            .catch(() => {
                if (ignore) return;
                setResult((r) => ({ ...r, rows: [], meta: null, loading: false, failed: true }));
            });

        return () => {
            ignore = true;
        };
    }, [range.from, range.to, department, status, search, page, reloadKey]);

    // Ganti filter -> balik ke halaman 1
    const changeFilter = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    const openDetail = (row) => {
        setSelected(row);
        setDraftStatus(row.status);
        setSaveError('');
    };

    const saveStatus = async () => {
        if (!selected || draftStatus === selected.status) return;
        setSaving(true);
        setSaveError('');
        try {
            await api.patch(statusUrl(selected.id), { status: draftStatus });
            setSelected(null);
            setReloadKey((k) => k + 1); // muat ulang tabel + kartu ringkasan
        } catch (err) {
            setSaveError(err?.response?.data?.message || 'Status gagal diubah. Coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    // Export Excel (.xlsx): ambil SEMUA halaman sesuai filter yang sedang aktif
    const exportExcel = async () => {
        setExporting(true);
        setExportError('');
        try {
            const all = [];
            let current = 1;
            let last = 1;
            do {
                const { data } = await api.get(ENDPOINT, {
                    params: {
                        from: range.from,
                        to: range.to,
                        department: department || undefined,
                        status: status || undefined,
                        search: search || undefined,
                        page: current,
                        per_page: 100,
                    },
                });
                all.push(...(data.data ?? []));
                last = data.meta?.last_page ?? 1;
                current += 1;
            } while (current <= last);

            // Baris pertama = judul kolom, sama persis dengan tabel di halaman
            const sheetRows = [
                ['No', 'Nama', 'NIP', 'Departemen', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status'],
                ...all.map((r, i) => [
                    i + 1,
                    r.user_name ?? '-',
                    r.employee_id ?? '-',
                    r.department ?? '-',
                    fmtDate(r.date),
                    formatTime(r.check_in),
                    formatTime(r.check_out),
                    STATUS[r.status]?.label ?? r.status ?? '-',
                ]),
            ];

            const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
            sheet['!cols'] = [{ wch: 5 }, { wch: 26 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];

            const book = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(book, sheet, 'Rekap Absensi');
            XLSX.writeFile(book, `rekap-absensi_${range.from}_${range.to}.xlsx`);
        } catch {
            setExportError('Export gagal. Coba lagi sebentar lagi.');
        } finally {
            setExporting(false);
        }
    };

    const { rows, meta, summary, departments, loading, failed } = result;
    const startNo = meta ? (meta.current_page - 1) * meta.per_page : 0;

    const stats = [
        { key: 'total', label: 'Total Karyawan', value: summary?.total_employees, icon: 'users', tone: 'indigo' },
        { key: 'present', label: 'Hadir', value: summary?.present, icon: 'check', tone: 'green' },
        { key: 'late', label: 'Terlambat', value: summary?.late, icon: 'clock', tone: 'amber' },
        { key: 'absent', label: 'Tidak Hadir', value: summary?.absent, icon: 'x', tone: 'red' },
    ];

    return (
        <div className="att">
            <div className="att-grid">
                {/* Kartu ringkasan */}
                <section className="att-card att-statscard att-wide" aria-label="Ringkasan absensi">
                    <div className="att-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        {stats.map((s) => (
                            <div
                                key={s.key}
                                className={`att-stat att-stat--${s.tone}`}
                                // tone "indigo" belum ada di Attendance.css, jadi warnanya diatur di sini
                                style={s.tone === 'indigo' ? { background: '#e8eefa' } : undefined}
                            >
                                <span
                                    className="att-stat__icon"
                                    style={s.tone === 'indigo' ? { color: '#2563eb' } : undefined}
                                >
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
                        <h3 className="att-title">
                            <Icon name="calendar" size={22} /> Data Absensi Karyawan
                        </h3>
                        <div className="att-filters">
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

                            <select
                                className="att-select"
                                aria-label="Filter departemen"
                                value={department}
                                onChange={(e) => changeFilter(setDepartment)(e.target.value)}
                            >
                                <option value="">Semua Departemen</option>
                                {departments.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="att-select"
                                aria-label="Filter status"
                                value={status}
                                onChange={(e) => changeFilter(setStatus)(e.target.value)}
                            >
                                <option value="">Semua Status</option>
                                {Object.entries(STATUS).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v.label}
                                    </option>
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

                            <button
                                type="button"
                                className="att-btn att-btn--primary"
                                style={{ fontSize: 14, padding: '9px 16px', gap: 8 }}
                                disabled={exporting || loading || failed || rows.length === 0}
                                onClick={exportExcel}
                            >
                                <Icon name="download" size={16} />
                                {exporting ? 'Mengekspor...' : 'Export'}
                            </button>
                        </div>
                    </div>

                    {exportError && (
                        <p className="att-error" role="alert" style={{ margin: '0 0 12px' }}>
                            {exportError}
                        </p>
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
                                    <tr>
                                        <td colSpan={9} className="att-empty">Memuat...</td>
                                    </tr>
                                ) : failed ? (
                                    <tr>
                                        <td colSpan={9} className="att-empty">
                                            Data belum bisa dimuat. Cek endpoint {ENDPOINT} dan pastikan login sebagai HR.
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="att-empty">Tidak ada data absensi untuk filter ini.</td>
                                    </tr>
                                ) : (
                                    rows.map((r, i) => {
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
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                marginTop: 16,
                                flexWrap: 'wrap',
                            }}
                        >
                            <small style={{ color: 'var(--muted)' }}>
                                Halaman {meta.current_page} dari {meta.last_page} · {meta.total} data
                            </small>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    type="button"
                                    className="att-btn att-btn--soft"
                                    style={{ fontSize: 14, padding: '8px 16px' }}
                                    disabled={meta.current_page <= 1 || loading}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    type="button"
                                    className="att-btn att-btn--soft"
                                    style={{ fontSize: 14, padding: '8px 16px' }}
                                    disabled={meta.current_page >= meta.last_page || loading}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Modal detail + ubah status */}
            {selected && (
                <div
                    role="presentation"
                    onClick={() => !saving && setSelected(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                        background: 'rgba(15, 23, 42, 0.45)',
                    }}
                >
                    <div
                        className="att-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="att-detail-title"
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 'min(460px, 100%)', padding: 24, maxHeight: '90vh', overflowY: 'auto' }}
                    >
                        <h3 id="att-detail-title" className="att-title" style={{ marginBottom: 16 }}>
                            Detail Absensi
                        </h3>

                        <dl
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px 16px',
                                margin: '0 0 20px',
                            }}
                        >
                            {[
                                ['Nama', selected.user_name ?? '-'],
                                ['NIP', selected.employee_id ?? '-'],
                                ['Departemen', selected.department ?? '-'],
                                ['Tanggal', fmtDate(selected.date)],
                                ['Jam Masuk', formatTime(selected.check_in)],
                                ['Jam Pulang', formatTime(selected.check_out)],
                                ['Jenis Kerja', WORK_LABEL[selected.work_type] ?? selected.work_type ?? '-'],
                                ['Lokasi', selected.location || '-'],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <dt style={{ fontSize: 12.5, color: 'var(--muted)' }}>{label}</dt>
                                    <dd style={{ margin: 0, fontWeight: 600 }}>{value}</dd>
                                </div>
                            ))}
                        </dl>

                        <label
                            htmlFor="att-detail-status"
                            style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginBottom: 6 }}
                        >
                            Ubah status
                        </label>
                        <select
                            id="att-detail-status"
                            className="att-select"
                            style={{ width: '100%' }}
                            value={draftStatus}
                            disabled={saving}
                            onChange={(e) => setDraftStatus(e.target.value)}
                        >
                            {Object.entries(STATUS).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v.label}
                                </option>
                            ))}
                        </select>

                        {saveError && (
                            <p className="att-error" role="alert" style={{ marginTop: 10 }}>
                                {saveError}
                            </p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                            <button
                                type="button"
                                className="att-btn att-btn--soft"
                                style={{ fontSize: 14, padding: '9px 18px' }}
                                disabled={saving}
                                onClick={() => setSelected(null)}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                className="att-btn att-btn--primary"
                                style={{ fontSize: 14, padding: '9px 18px' }}
                                disabled={saving || draftStatus === selected.status}
                                onClick={saveStatus}
                            >
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
