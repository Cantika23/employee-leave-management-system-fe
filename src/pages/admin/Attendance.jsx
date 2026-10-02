import { useCallback, useEffect, useMemo, useState } from 'react';
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

const STATUS = {
    present: { label: 'Hadir', cls: 'att-badge--present' },
    late: { label: 'Terlambat', cls: 'att-badge--late' },
    absent: { label: 'Tidak hadir', cls: 'att-badge--absent' },
    leave: { label: 'Cuti', cls: 'att-badge--leave' },
    holiday: { label: 'Libur', cls: 'att-badge--holiday' },
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
    check: <path d="M5 12l5 5L20 7" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    login: <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />,
    logout: <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18" />
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
            setHistory({ rows: data.data ?? [], summary: data.summary ?? null, failed: false, loading: false });
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
        } catch (err) {
            const res = err.response;
            if (res?.status === 422) {
                const flat = {};
                Object.entries(res.data.errors ?? {}).forEach(([k, v]) => (flat[k] = v[0]));
                setErrors(flat);
            } else if (res?.status === 401) {
                setMessage({ type: 'error', text: 'Sesi login berakhir. Silakan login ulang.' });
            } else {
                setMessage({ type: 'error', text: res?.data?.message ?? 'Terjadi kesalahan. Coba lagi.' });
            }
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
    const checkOut = () => run(() => api.post(ENDPOINT.checkOut));

    const hasIn = !!attendance?.check_in;
    const hasOut = !!attendance?.check_out;

    const pill = hasOut
        ? { text: 'Sudah pulang', cls: 'att-pill--done' }
        : hasIn
          ? { text: 'Dalam Jam Kerja', cls: '' }
          : { text: 'Belum absen', cls: 'att-pill--idle' };

    // Pakai ringkasan dari server kalau ada, kalau tidak hitung dari baris riwayat
    const summary = useMemo(() => {
        const count = (s) => history.rows.filter((r) => r.status === s).length;
        const fallback = {
            present: count('present'),
            late: count('late'),
            absent: count('absent'),
        };
        return { ...fallback, ...(history.summary ?? {}) };
    }, [history]);

    const visibleRows = useMemo(
        () => (statusFilter === 'all' ? history.rows : history.rows.filter((r) => r.status === statusFilter)),
        [history.rows, statusFilter],
    );

    const stats = [
        { key: 'present', label: 'Hadir', value: summary.present, icon: 'users', tone: 'green' },
        { key: 'late', label: 'Terlambat', value: summary.late, icon: 'clock', tone: 'amber' },
        { key: 'absent', label: 'Tidak Hadir', value: summary.absent, icon: 'x', tone: 'red' },
    ];

    return (
        <div className="att">

            <div className="att-grid">
                {/* Kartu sapaan + jam + aksi */}
                <section className="att-card att-hero">

                    <div className="att-clock">
                        <p className="att-clock__date">{fmtLong(now)}</p>
                        <p className="att-clock__time">{now.toLocaleTimeString('en-GB')}</p>
                        <span className={`att-pill ${pill.cls}`}>{pill.text}</span>
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
                                <input
                                    type="text"
                                    className="att-input"
                                    placeholder="Lokasi: Jakarta"
                                    value={form.location}
                                    onChange={(e) => setField('location', e.target.value)}
                                />
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
                                    <Icon name="fingerprint" size={20} />
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
                                    <Icon name="fingerprint" size={20} />
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
                        {hasIn && (
                            <p className="att-meta">
                                {WORK_LABEL[attendance.work_type]}
                                {attendance.location ? ` · ${attendance.location}` : ''}
                            </p>
                        )}
                    </section>

                    <section className="att-card att-statscard" aria-label="Ringkasan periode">
                        <div className="att-stats">
                            {stats.map((s) => (
                                <div key={s.key} className={`att-stat att-stat--${s.tone}`}>
                                    <span className="att-stat__icon">
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
                </div>

                {/* Riwayat */}
                <section className="att-card att-wide">
                    <div className="att-head">
                        <h3 className="att-title">
                            <Icon name="calendar" size={22} /> Riwayat Absensi
                        </h3>
                        <div className="att-filters">
                            <div className="att-range">
                                <Icon name="calendar" size={16} />
                                <input
                                    type="date"
                                    aria-label="Dari tanggal"
                                    value={range.from}
                                    max={range.to}
                                    onChange={(e) => e.target.value && setRange((r) => ({ ...r, from: e.target.value }))}
                                />
                                <span>–</span>
                                <input
                                    type="date"
                                    aria-label="Sampai tanggal"
                                    value={range.to}
                                    min={range.from}
                                    onChange={(e) => e.target.value && setRange((r) => ({ ...r, to: e.target.value }))}
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
                                    <th className="att-center">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.loading ? (
                                    <tr>
                                        <td colSpan={8} className="att-empty">Memuat...</td>
                                    </tr>
                                ) : history.failed ? (
                                    <tr>
                                        <td colSpan={8} className="att-empty">
                                            Riwayat belum bisa dimuat. Cek endpoint {ENDPOINT.history}.
                                        </td>
                                    </tr>
                                ) : visibleRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="att-empty">Belum ada data di periode ini.</td>
                                    </tr>
                                ) : (
                                    visibleRows.map((r, i) => {
                                        const st = STATUS[r.status];
                                        const isHoliday = r.status === 'holiday';
                                        // Keterangan: jenis kerja (Onsite/WFH/Remote), kalau tidak ada pakai catatan server / nama hari libur
                                        const note = r.work_type
                                            ? (WORK_LABEL[r.work_type] ?? r.work_type)
                                            : (r.note ?? r.keterangan ?? (isHoliday ? `Hari ${fmtDay(r.date)}` : '-'));
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
                                                <td className="att-center">{note || '-'}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}