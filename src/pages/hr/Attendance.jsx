import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/axios'; // <- sesuaikan path ke file api.js kamu (yang pakai sessionStorage 'aether.token')
import '../Attendance.css';

// Path endpoint relatif terhadap baseURL di api.js (http://127.0.0.1:8000/api)
const ENDPOINT = {
    today: '/attendance', //                 GET  -> absensi hari ini
    history: '/attendance/history', //       GET  ?from=YYYY-MM-DD&to=YYYY-MM-DD
    checkIn: '/attendance/check-in', //      POST
    checkOut: '/attendance/check-out', //    POST
};

const WORK_TYPES = [
    { value: 'onsite', label: 'Onsite' },
    { value: 'wfh', label: 'WFH' },
    { value: 'remote', label: 'Remote' },
];
const WORK_LABEL = { onsite: 'Onsite', wfh: 'WFH', remote: 'Remote' };

// Jam masuk kantor, dipakai untuk menghitung keterlambatan
const WORK_START = '08:00';

// Lewat jam ini, absen pulang wajib disertai alasan (harus sama dengan backend)
const CHECK_OUT_LIMIT_HOUR = 17;

const CHECKOUT_REASONS = [
    { value: 'forgot', label: 'Lupa absen pulang' },
    { value: 'work_extension', label: 'Work Extension' },
];

// true kalau waktu sekarang sudah lewat 17:00:00
const isPastLimit = (d) =>
    d.getHours() > CHECK_OUT_LIMIT_HOUR ||
    (d.getHours() === CHECK_OUT_LIMIT_HOUR && (d.getMinutes() > 0 || d.getSeconds() > 0));

const STATUS = {
    present: { label: 'Hadir', cls: 'att-badge--present' },
    absent: { label: 'Tidak hadir', cls: 'att-badge--absent' },
    leave: { label: 'Cuti', cls: 'att-badge--leave' },
};

/* ---------- helpers ---------- */
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const monthRange = () => {
    const n = new Date();
    return { from: ymd(new Date(n.getFullYear(), n.getMonth(), 1)), to: ymd(new Date(n.getFullYear(), n.getMonth() + 1, 0)) };
};

// Terima "08:03:12" maupun format ISO/datetime
const formatTime = (t) => {
    if (!t) return '-';
    if (/^\d{2}:\d{2}/.test(t)) return t.slice(0, 5);
    const d = new Date(t);
    return isNaN(d) ? '-' : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toMinutes = (t) => {
    if (!t) return null;
    if (/^\d{2}:\d{2}/.test(t)) return Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const d = new Date(t);
    return isNaN(d) ? null : d.getHours() * 60 + d.getMinutes();
};

// Format singkat: "8j 53m"
const workDuration = (inT, outT) => {
    const a = toMinutes(inT);
    const b = toMinutes(outT);
    if (a == null || b == null || b < a) return '-';
    const m = b - a;
    return `${Math.floor(m / 60)}j ${pad(m % 60)}m`;
};

// Keterangan keterlambatan: pakai late_minutes dari server kalau ada, kalau tidak hitung dari jam masuk
const lateNote = (r) => {
    if (r.status !== 'present' || !r.check_in) return { text: '-', late: false };
    const m = r.late_minutes ?? toMinutes(r.check_in) - toMinutes(WORK_START);
    if (m > 0) {
        return { text: `Terlambat ${m < 60 ? `${m} menit` : `${Math.floor(m / 60)}j ${pad(m % 60)}m`}`, late: true };
    }
    if (r.was_late) return { text: 'Terlambat', late: true };
    return { text: 'Tepat waktu', late: false };
};

const fmtDate = (s) =>
    new Date(`${s}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDay = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long' });
const fmtLong = (d) =>
    d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const ICONS = {
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    x: <path d="M6 6l12 12M18 6L6 18" />,
    login: <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />,
    logout: <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18" />
        </>
    ),
    pin: (
        <>
            <path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
        </>
    ),
    doc: (
        <>
            <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h6M9 9h2" />
        </>
    ),
    list: (
        <>
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" />
        </>
    ),
    users: (
        <>
            <circle cx="9" cy="8" r="3.2" />
            <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
            <circle cx="17" cy="9" r="2.4" />
            <path d="M17 14.2c2.4 0 4 1.6 4 4.3" />
        </>
    ),
    fingerprint: (
        <>
            <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
            <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
            <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
            <path d="M2 12a10 10 0 0 1 18-6" />
            <path d="M2 16h.01" />
            <path d="M21.8 16c.2-2 .131-5.354 0-6" />
            <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
            <path d="M8.65 22c.21-.66.45-1.32.57-2" />
            <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
        </>
    ),
};

function Icon({ name, size = 18, strokeWidth = 2 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {ICONS[name]}
        </svg>
    );
}

// Ilustrasi pekerja + laptop (SVG inline, tanpa file gambar)
function HeroIllustration() {
    return (
        <svg className="att-illus" viewBox="0 0 320 200" aria-hidden="true">
            {/* latar */}
            <ellipse cx="170" cy="120" rx="130" ry="70" fill="#dbe8ff" opacity="0.7" />
            {/* tanaman kiri */}
            <g fill="#7fc8f0">
                <path d="M22 150c-10-24-6-46 6-58 4 24 2 42-6 58z" />
                <path d="M34 150c0-24 10-42 26-50-2 24-10 40-26 50z" />
            </g>
            <g fill="#4db3e6">
                <path d="M28 150c-4-18 0-34 10-44 0 18-2 32-10 44z" />
            </g>
            {/* tanaman kanan */}
            <g fill="#34c07a">
                <path d="M298 150c10-30 6-58-8-74-6 30-4 54 8 74z" />
                <path d="M284 150c-4-22 4-40 18-50 2 22-4 40-18 50z" />
            </g>
            <g fill="#1ea55f">
                <path d="M292 150c4-20 0-38-8-50-2 20 0 36 8 50z" />
            </g>
            {/* bubble jam */}
            <circle cx="122" cy="42" r="24" fill="#fff" stroke="#2f7bff" strokeWidth="4" />
            <path d="M122 28v15l8 5" fill="none" stroke="#2f7bff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* badan */}
            <path d="M168 152c-2-34 6-56 30-60h26c24 4 34 26 32 60z" fill="#2563eb" />
            <path d="M205 92l12 22 12-22z" fill="#fff" />
            {/* lanyard + id */}
            <path d="M205 92l12 40 12-40" fill="none" stroke="#1e3a8a" strokeWidth="3" />
            <rect x="209" y="128" width="16" height="22" rx="3" fill="#fff" />
            <rect x="215" y="134" width="4" height="8" rx="2" fill="#2563eb" />
            {/* leher + kepala */}
            <rect x="209" y="76" width="16" height="18" rx="6" fill="#f2a679" />
            <circle cx="217" cy="58" r="22" fill="#f8bb92" />
            <circle cx="208" cy="60" r="2" fill="#1b2a4a" />
            <circle cx="226" cy="60" r="2" fill="#1b2a4a" />
            <path d="M210 68q7 6 14 0" fill="none" stroke="#1b2a4a" strokeWidth="2" strokeLinecap="round" />
            {/* rambut */}
            <path d="M194 56c-2-20 14-32 32-28 14 3 22 14 18 30-6-10-14-14-24-14-12 0-20 4-26 12z" fill="#1d3b8f" />
            {/* tangan */}
            <path d="M176 140c-16 4-30 8-46 8l2 10c20 0 40-4 54-14z" fill="#f2a679" />
            {/* laptop (tampak belakang) */}
            <path d="M44 100l92-6 6 56H50z" fill="#14305f" />
            <circle cx="92" cy="124" r="4" fill="#fff" />
            {/* meja */}
            <rect x="0" y="150" width="320" height="6" rx="3" fill="#cfdcf3" />
        </svg>
    );
}

// Kolom tanggal dengan ikon kalender yang membuka date picker
function DateField({ label, value, min, max, onChange }) {
    const ref = useRef(null);
    const open = () => {
        const el = ref.current;
        if (!el) return;
        if (typeof el.showPicker === 'function') {
            try {
                el.showPicker();
                return;
            } catch {
                /* fallback di bawah */
            }
        }
        el.focus();
    };
    return (
        <span className="att-date">
            <button type="button" className="att-date__btn" onClick={open} aria-label={`Buka kalender ${label}`}>
                <Icon name="calendar" size={18} />
            </button>
            <input
                ref={ref}
                type="date"
                aria-label={label}
                value={value}
                min={min}
                max={max}
                onChange={(e) => e.target.value && onChange(e.target.value)}
            />
        </span>
    );
}

function useNow() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return now;
}

/* ---------- page ---------- */
export default function Attendance() {
    const now = useNow();

    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null); // { type, text, retry? }
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({ work_type: 'onsite', location: '' });
    const [showReason, setShowReason] = useState(false);
    const [reason, setReason] = useState({ checkout_reason: '', work_extension_note: '' });

    const [range, setRange] = useState(monthRange);
    const [statusFilter, setStatusFilter] = useState('all');
    const [history, setHistory] = useState({ rows: [], summary: null, failed: false, loading: true });

    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const fetchToday = useCallback(async () => {
        try {
            const { data } = await api.get(ENDPOINT.today);
            setAttendance(data.data ?? null);
        } catch (err) {
            const status = err.response?.status;
            if (status === 404) {
                // 404 = belum ada absensi hari ini, bukan error
                setAttendance(null);
            } else if (status === 401) {
                setMessage({ type: 'error', text: 'Sesi login berakhir. Silakan login ulang.' });
            } else {
                setMessage({ type: 'error', text: 'Gagal memuat data absensi.', retry: true });
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        setHistory((h) => ({ ...h, loading: true }));
        try {
            const { data } = await api.get(ENDPOINT.history, { params: range });
            // Status 'late' dari backend dianggap 'present' (status Terlambat sudah dihapus)
            const rows = (data.data ?? []).map((r) => (r.status === 'late' ? { ...r, status: 'present', was_late: true } : r));
            setHistory({ rows, summary: data.summary ?? null, failed: false, loading: false });
        } catch {
            setHistory({ rows: [], summary: null, failed: true, loading: false });
        }
    }, [range]);

    useEffect(() => {
        fetchToday();
    }, [fetchToday]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const run = async (request) => {
        setSubmitting(true);
        setMessage(null);
        setErrors({});
        try {
            const { data } = await request();
            setMessage({ type: 'success', text: data.message });
            await Promise.all([fetchToday(), fetchHistory()]);
            return true;
        } catch (err) {
            const res = err.response;
            if (res?.status === 422) {
                const flat = {};
                Object.entries(res.data.errors ?? {}).forEach(([k, v]) => (flat[k] = v[0]));
                setErrors(flat);
                // Server minta alasan (mis. jam di perangkat belum lewat 17:00) -> buka form alasan
                if (flat.checkout_reason) setShowReason(true);
            } else if (res?.status === 401) {
                setMessage({ type: 'error', text: 'Sesi login berakhir. Silakan login ulang.' });
            } else {
                setMessage({ type: 'error', text: res?.data?.message ?? 'Terjadi kesalahan. Coba lagi.' });
            }
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const checkIn = () =>
        run(() =>
            api.post(ENDPOINT.checkIn, {
                work_type: form.work_type,
                location: form.work_type === 'onsite' ? form.location : null,
            }),
        );
    // Sebelum 17:00 langsung absen pulang, setelah 17:00 tampilkan form alasan dulu
    const checkOut = () => {
        if (isPastLimit(new Date())) {
            setErrors({});
            setReason({ checkout_reason: '', work_extension_note: '' });
            setShowReason(true);
            return;
        }
        run(() => api.post(ENDPOINT.checkOut));
    };

    const closeReason = () => {
        if (submitting) return;
        setShowReason(false);
        setErrors({});
    };

    const submitReason = async () => {
        const ok = await run(() =>
            api.post(ENDPOINT.checkOut, {
                checkout_reason: reason.checkout_reason || null,
                work_extension_note: reason.checkout_reason === 'work_extension' ? reason.work_extension_note : null,
            }),
        );
        if (ok) setShowReason(false);
    };

    const hasIn = !!attendance?.check_in;
    const hasOut = !!attendance?.check_out;

    const pill = hasOut
        ? { text: 'Sudah pulang', cls: 'att-pill--done' }
        : hasIn
          ? { text: 'Dalam Jam Kerja', cls: '' }
          : { text: 'Belum absen', cls: 'att-pill--idle' };

    // Dihitung dari baris riwayat (status 'late' sudah digabung ke 'present'),
    // jadi angka Hadir selalu konsisten dengan tabel
    const summary = useMemo(() => {
        const count = (s) => history.rows.filter((r) => r.status === s).length;
        return {
            present: count('present'),
            absent: count('absent'),
        };
    }, [history]);

    const visibleRows = useMemo(
        () => (statusFilter === 'all' ? history.rows : history.rows.filter((r) => r.status === statusFilter)),
        [history.rows, statusFilter],
    );

    const stats = [
        { key: 'present', label: 'Hadir', value: summary.present, icon: 'users', tone: 'green' },
        { key: 'absent', label: 'Tidak Hadir', value: summary.absent, icon: 'x', tone: 'red' },
    ];

    return (
        <div className="att">
            <div className="att-grid">
                {/* Kartu jam + aksi */}
                <section className="att-card att-hero">
                    <div className="att-hero__top">
                        <div className="att-clock">
                            <p className="att-clock__date">{fmtLong(now)}</p>
                            <p className="att-clock__time">{now.toLocaleTimeString('en-GB')}</p>
                            <span className={`att-pill ${pill.cls}`}>{pill.text}</span>
                        </div>
                        <HeroIllustration />
                    </div>

                    <div className="att-form">
                        <div className="att-seg" role="radiogroup" aria-label="Jenis kerja">
                            {WORK_TYPES.map((w) => (
                                <label key={w.value}>
                                    <input
                                        type="radio"
                                        name="work_type"
                                        value={w.value}
                                        disabled={hasIn}
                                        checked={(hasIn ? attendance.work_type : form.work_type) === w.value}
                                        onChange={(e) => setField('work_type', e.target.value)}
                                    />
                                    <span>{w.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.work_type && <span className="att-error">{errors.work_type}</span>}

                        {!hasIn && form.work_type === 'onsite' && (
                            <>
                                <div className="att-field">
                                    <Icon name="pin" size={18} />
                                    <input
                                        type="text"
                                        className="att-input"
                                        placeholder="Lokasi: Jakarta"
                                        aria-label="Lokasi"
                                        value={form.location}
                                        onChange={(e) => setField('location', e.target.value)}
                                    />
                                </div>
                                {errors.location && <span className="att-error">{errors.location}</span>}
                            </>
                        )}

                        <div className="att-actions">
                            <button
                                type="button"
                                className="att-btn att-btn--primary"
                                onClick={checkIn}
                                disabled={loading || submitting || hasIn}
                            >
                                <span className="att-btn__icon">
                                    <Icon name="fingerprint" size={22} />
                                </span>
                                {submitting && !hasIn ? 'Menyimpan...' : 'Absen Masuk'}
                            </button>
                            <button
                                type="button"
                                className="att-btn att-btn--soft"
                                onClick={checkOut}
                                disabled={loading || submitting || !hasIn || hasOut}
                            >
                                <span className="att-btn__icon">
                                    <Icon name="fingerprint" size={22} />
                                </span>
                                {submitting && hasIn ? 'Menyimpan...' : 'Absen Pulang'}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div role="status" className={`att-alert att-alert--${message.type}`}>
                            <span>{message.text}</span>
                            {message.retry && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMessage(null);
                                        setLoading(true);
                                        fetchToday();
                                    }}
                                >
                                    Muat ulang
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {/* Status hari ini + ringkasan */}
                <div className="att-col">
                    <section className="att-card">
                        <div className="att-head">
                            <h2 className="att-title">
                                <Icon name="clock" size={22} /> Status Hari Ini
                            </h2>
                            <span className="att-chip">{fmtLong(now)}</span>
                        </div>
                        <dl className="att-rows">
                            <div className="att-row">
                                <span className="att-ico att-ico--green">
                                    <Icon name="login" size={16} />
                                </span>
                                <dt>Jam Masuk</dt>
                                <dd>{formatTime(attendance?.check_in)}</dd>
                            </div>
                            <div className="att-row">
                                <span className="att-ico att-ico--red">
                                    <Icon name="logout" size={16} />
                                </span>
                                <dt>Jam Pulang</dt>
                                <dd>{formatTime(attendance?.check_out)}</dd>
                            </div>
                            <div className="att-row">
                                <span className="att-ico att-ico--indigo">
                                    <Icon name="clock" size={16} />
                                </span>
                                <dt>Total Jam Kerja</dt>
                                <dd>{workDuration(attendance?.check_in, attendance?.check_out)}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="att-card att-statscard" aria-label="Ringkasan periode">
                        <div className="att-stats">
                            {stats.map((s) => (
                                <div key={s.key} className={`att-stat att-stat--${s.tone}`}>
                                    <span className="att-stat__icon">
                                        <Icon name={s.icon} size={22} />
                                    </span>
                                    <div>
                                        <strong>{s.value ?? 0}</strong>
                                        <small>{s.label}</small>
                                    </div>
                                    <span className="att-stat__deco">
                                        <Icon name="users" size={72} strokeWidth={1.6} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Riwayat */}
                <section className="att-card att-wide">
                    <div className="att-head">
                        <h3 className="att-title">
                            <Icon name="list" size={22} /> Riwayat Absensi
                        </h3>
                        <div className="att-filters">
                            <div className="att-range">
                                <DateField
                                    label="Dari tanggal"
                                    value={range.from}
                                    max={range.to}
                                    onChange={(v) => setRange((r) => ({ ...r, from: v }))}
                                />
                                <span>–</span>
                                <DateField
                                    label="Sampai tanggal"
                                    value={range.to}
                                    min={range.from}
                                    onChange={(v) => setRange((r) => ({ ...r, to: v }))}
                                />
                            </div>
                            <select
                                className="att-select"
                                aria-label="Filter status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Semua Status</option>
                                {Object.entries(STATUS).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="att-tablewrap">
                        <table className="att-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Tanggal</th>
                                    <th>Hari</th>
                                    <th>Jam Masuk</th>
                                    <th>Jam Pulang</th>
                                    <th>Total Jam</th>
                                    <th className="att-center">Status</th>
                                    <th className="att-center">Lokasi Kerja</th>
                                    <th className="att-center">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.loading ? (
                                    <tr>
                                        <td colSpan={9} className="att-empty">Memuat...</td>
                                    </tr>
                                ) : history.failed ? (
                                    <tr>
                                        <td colSpan={9} className="att-empty">
                                            Riwayat belum bisa dimuat. Cek endpoint {ENDPOINT.history}.
                                        </td>
                                    </tr>
                                ) : visibleRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="att-empty">
                                            <span className="att-empty__icon">
                                                <Icon name="doc" size={28} strokeWidth={1.6} />
                                            </span>
                                            <span className="att-empty__text">Belum ada data di periode ini.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    visibleRows.map((r, i) => {
                                        const st = STATUS[r.status];
                                        const isHoliday = r.status === 'holiday';
                                        const place = r.work_type ? (WORK_LABEL[r.work_type] ?? r.work_type) : '-';
                                        const note = lateNote(r);
                                        return (
                                            <tr key={r.id ?? r.date}>
                                                <td>{i + 1}</td>
                                                <td>{fmtDate(r.date)}</td>
                                                <td className={isHoliday ? 'att-day--off' : ''}>{fmtDay(r.date)}</td>
                                                <td>{formatTime(r.check_in)}</td>
                                                <td>{formatTime(r.check_out)}</td>
                                                <td>{workDuration(r.check_in, r.check_out)}</td>
                                                <td className="att-center">
                                                    {st ? (
                                                        <span className={`att-badge ${st.cls}`}>{st.label}</span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="att-center">{place}</td>
                                                <td className="att-center">
                                                    <span className={note.late ? 'att-note--late' : 'att-note--ok'}>
                                                        {note.text}
                                                    </span>
                                                    {r.checkout_reason === 'forgot' && (
                                                        <div className="att-extra">Lupa absen pulang</div>
                                                    )}
                                                    {r.checkout_reason === 'work_extension' && (
                                                        <div className="att-extra">
                                                            <strong>Work Extension:</strong> {r.work_extension_note}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Form alasan absen pulang setelah jam 17.00 */}
            {showReason && (
                <div className="att-modal" role="dialog" aria-modal="true" aria-labelledby="att-modal-title">
                    <div className="att-modal__backdrop" onClick={closeReason} />
                    <div className="att-modal__box">
                        <h3 id="att-modal-title" className="att-modal__title">
                            Absen Pulang Setelah Jam 17.00
                        </h3>
                        <p className="att-modal__desc">Pilih alasan kenapa kamu absen pulang setelah jam 17.00.</p>

                        <div className="att-reasons" role="radiogroup" aria-label="Alasan absen pulang">
                            {CHECKOUT_REASONS.map((r) => (
                                <label key={r.value} className="att-reason">
                                    <input
                                        type="radio"
                                        name="checkout_reason"
                                        value={r.value}
                                        checked={reason.checkout_reason === r.value}
                                        onChange={(e) => setReason((x) => ({ ...x, checkout_reason: e.target.value }))}
                                    />
                                    <span>{r.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.checkout_reason && <span className="att-error">{errors.checkout_reason}</span>}

                        {reason.checkout_reason === 'work_extension' && (
                            <>
                                <label className="att-modal__label" htmlFor="att-note">
                                    Kegiatan yang dikerjakan
                                </label>
                                <textarea
                                    id="att-note"
                                    className="att-textarea"
                                    rows={4}
                                    maxLength={1000}
                                    placeholder="Contoh: Menyelesaikan laporan bulanan"
                                    value={reason.work_extension_note}
                                    onChange={(e) => setReason((x) => ({ ...x, work_extension_note: e.target.value }))}
                                />
                                {errors.work_extension_note && (
                                    <span className="att-error">{errors.work_extension_note}</span>
                                )}
                            </>
                        )}

                        <div className="att-modal__actions">
                            <button type="button" className="att-btn att-btn--soft" onClick={closeReason} disabled={submitting}>
                                Batal
                            </button>
                            <button
                                type="button"
                                className="att-btn att-btn--primary"
                                onClick={submitReason}
                                disabled={submitting || !reason.checkout_reason}
                            >
                                {submitting ? 'Menyimpan...' : 'Kirim & Absen Pulang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}