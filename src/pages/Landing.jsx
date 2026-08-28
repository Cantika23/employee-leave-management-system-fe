import { Link } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  WalletCards,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Users,
  Zap,
  Bell,
  UserCog,
  Mail,
  MessageSquareWarning,
  FileClock,
} from 'lucide-react'

import { useEffect, useRef, useState } from 'react'

import Logo from '../components/Logo'
import './landing.css'
import api from '../api/axios'


// ======================================================
// FITUR
// ======================================================

const leaveFeatures = [
  {
    icon: CalendarDays,
    accent: 'blue',
    title: 'Pengajuan Cuti',
    desc: 'Ajukan cuti secara online dengan periode dan alasan yang tercatat dalam sistem.',
  },
  {
    icon: UserCheck,
    accent: 'green',
    title: 'Approval',
    desc: 'Pengajuan diteruskan kepada atasan untuk direview sesuai kewenangan.',
  },
  {
    icon: WalletCards,
    accent: 'amber',
    title: 'Kuota Cuti',
    desc: 'Pantau hak cuti, jumlah terpakai, dan sisa cuti secara lebih transparan.',
  },
  {
    icon: History,
    accent: 'navy',
    title: 'Riwayat Pengajuan',
    desc: 'Lihat seluruh pengajuan cuti beserta status dan detail prosesnya.',
  },
  {
    icon: Bell,
    accent: 'purple',
    title: 'Notifikasi Real-time',
    desc: 'Setiap perubahan status pengajuan langsung terpantau tanpa perlu menanyakan ke atasan.',
  },
  {
    icon: Users,
    accent: 'teal',
    title: 'Kalender Tim',
    desc: 'Lihat siapa saja yang sedang cuti agar jadwal dan koordinasi tim tetap rapi.',
  },
]


// ======================================================
// BEFORE / AFTER
// ======================================================

const beforePoints = [
  'Pengajuan dikirim lewat email, mudah tenggelam di inbox',
  'Approval bolak-balik lewat balasan email',
  'Sisa cuti dihitung manual dari histori email',
  'Rekap bulanan disusun ulang satu per satu',
]

const afterPoints = [
  'Semua pengajuan tersimpan rapi dalam sistem',
  'Approval terstruktur sesuai alur kewenangan',
  'Kuota cuti terpantau otomatis dan akurat',
  'Riwayat & rekap tersedia kapan pun dibutuhkan',
]


// ======================================================
// ROLE ACCESS
// ======================================================

const roleAccess = [
  {
    icon: Users,
    title: 'Karyawan',
    items: [
      'Mengajukan cuti sesuai sisa kuota',
      'Memantau status pengajuan secara real-time',
      'Melihat riwayat cuti pribadi',
    ],
  },
  {
    icon: UserCheck,
    title: 'Atasan',
    items: [
      'Meninjau pengajuan tim langsung',
      'Menyetujui atau menolak dengan catatan',
      'Melihat kalender cuti anggota tim',
    ],
  },
  {
    icon: WalletCards,
    title: 'HR',
    items: [
      'Mengelola kebijakan dan jenis cuti',
      'Memantau kuota seluruh karyawan',
      'Mengekspor rekap untuk kebutuhan payroll',
    ],
  },
  {
    icon: UserCog,
    title: 'Administrator',
    items: [
      'Mengatur akses dan peran pengguna',
      'Mengawasi seluruh alur persetujuan',
      'Menjaga konfigurasi sistem tetap sesuai',
    ],
  },
]


// ======================================================
// WORKFLOW
// ======================================================

const leaveSteps = [
  {
    number: '01',
    title: 'Pilih periode',
    desc: 'Tentukan tanggal mulai dan selesai cuti.',
  },
  {
    number: '02',
    title: 'Kirim pengajuan',
    desc: 'Lengkapi alasan kemudian kirim permohonan.',
  },
  {
    number: '03',
    title: 'Review atasan',
    desc: 'Atasan memeriksa dan memberikan keputusan.',
  },
  {
    number: '04',
    title: 'Selesai',
    desc: 'Pantau hasil pengajuan langsung melalui sistem.',
  },
]


// ======================================================
// FAQ
// ======================================================

const faqItems = [
  {
    q: 'Bagaimana cara mengajukan cuti di sistem ini?',
    a: 'Masuk ke akun Anda, pilih menu pengajuan cuti, tentukan periode dan alasan, lalu kirim. Pengajuan akan otomatis diteruskan ke atasan untuk direview.',
  },
  {
    q: 'Berapa lama proses persetujuan biasanya berlangsung?',
    a: 'Waktu persetujuan tergantung kebijakan masing-masing tim, namun setiap perubahan status akan langsung terlihat di riwayat pengajuan begitu atasan memberikan keputusan.',
  },
  {
    q: 'Apakah pengajuan yang sudah dikirim bisa dibatalkan?',
    a: 'Selama pengajuan masih berstatus menunggu, Anda dapat membatalkannya sendiri melalui halaman riwayat pengajuan.',
  },
  {
    q: 'Bagaimana jika kuota cuti saya terlihat tidak sesuai?',
    a: 'Kuota dihitung otomatis dari histori pengajuan yang disetujui. Jika ada selisih, hubungi HR agar dapat ditinjau dan disesuaikan.',
  },
  {
    q: 'Apakah data cuti saya aman dan hanya bisa diakses oleh pihak berwenang?',
    a: 'Akses data diatur berdasarkan peran pengguna. Karyawan hanya dapat melihat datanya sendiri, sementara atasan dan HR hanya dapat mengakses data sesuai kewenangan masing-masing.',
  },
]


// ======================================================
// SCROLL REVEAL
// ======================================================

function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    const targets = root.querySelectorAll('.reveal')

    if (
      !('IntersectionObserver' in window) ||
      targets.length === 0
    ) {
      targets.forEach((element) => {
        element.classList.add('is-visible')
      })

      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    targets.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [rootRef])
}


// ======================================================
// LANDING
// ======================================================

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeNav, setActiveNav] = useState('')
  const [openFaq, setOpenFaq] = useState(0)

  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const pageRef = useRef(null)

  useScrollReveal(pageRef)


  // ====================================================
  // NORMALISASI RESPONSE
  // ====================================================

  const normalizeArrayResponse = (response) => {
    if (!response) return []

    if (Array.isArray(response.data)) {
      return response.data
    }

    if (Array.isArray(response.data?.data)) {
      return response.data.data
    }

    return []
  }


  // ====================================================
  // AMBIL DATA LANDING
  // ====================================================

  useEffect(() => {
    let mounted = true

    async function loadLandingData() {
      try {
        setLoading(true)

        const response = await api.get(
          '/landing/leave-requests'
        )

        if (!mounted) return

        const data = normalizeArrayResponse(response)

        setLeaveRequests(data)
      } catch (error) {
        console.error(
          'ERROR LANDING LEAVE REQUEST:',
          error.response?.status,
          error.response?.data || error.message
        )

        if (mounted) {
          setLeaveRequests([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadLandingData()

    return () => {
      mounted = false
    }
  }, [])


  // ====================================================
  // NAVBAR SCROLL + ACTIVE SECTION
  // ====================================================

  useEffect(() => {
    const sectionIds = [
      'fitur',
      'peran',
      'alur',
      'faq',
    ]

    const handleScroll = () => {
      setScrolled(window.scrollY > 12)

      const navbar =
        document.querySelector('.landing-nav')

      const navbarHeight =
        navbar?.offsetHeight || 82

      const scrollPosition =
        window.scrollY + navbarHeight + 40

      let currentSection = ''

      sectionIds.forEach((id) => {
        const section =
          document.getElementById(id)

        if (!section) return

        if (
          scrollPosition >= section.offsetTop
        ) {
          currentSection = id
        }
      })

      setActiveNav(currentSection)
    }

    handleScroll()

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    )

    window.addEventListener(
      'resize',
      handleScroll
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      )

      window.removeEventListener(
        'resize',
        handleScroll
      )
    }
  }, [])


  // ====================================================
  // STATISTIK
  // ====================================================

  const totalEmployees = new Set(
    leaveRequests
      .map((item) => item?.user_id)
      .filter(Boolean)
  ).size


  const pendingCount = leaveRequests.filter(
    (item) =>
      String(
        item?.status || ''
      ).toLowerCase() === 'pending'
  ).length


  const approvedCount = leaveRequests.filter(
    (item) =>
      String(
        item?.status || ''
      ).toLowerCase() === 'approved'
  ).length


  // ====================================================
  // TANGGAL HARI INI
  // ====================================================

  const getTodayDate = () => {
    const now = new Date()

    const year = now.getFullYear()

    const month = String(
      now.getMonth() + 1
    ).padStart(2, '0')

    const day = String(
      now.getDate()
    ).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const today = getTodayDate()


  // ====================================================
  // SEDANG CUTI
  // ====================================================

  const teamOnLeave = leaveRequests.filter(
    (item) => {
      const status = String(
        item?.status || ''
      ).toLowerCase()

      if (status !== 'approved') {
        return false
      }

      if (!item?.start_date) {
        return false
      }

      const startDate = String(
        item.start_date
      ).slice(0, 10)

      const endDate = String(
        item.end_date || item.start_date
      ).slice(0, 10)

      return (
        startDate <= today &&
        endDate >= today
      )
    }
  )

  const teamOnLeaveCount = teamOnLeave.length


  // ====================================================
  // PENGAJUAN TERBARU
  // ====================================================

  const sortedLeaveRequests = [
    ...leaveRequests,
  ].sort((a, b) => {
    if (a?.created_at && b?.created_at) {
      return (
        new Date(b.created_at) -
        new Date(a.created_at)
      )
    }

    return (
      Number(b?.id || 0) -
      Number(a?.id || 0)
    )
  })

  const recentRequests =
    sortedLeaveRequests.slice(0, 3)


  // ====================================================
  // HELPERS
  // ====================================================

  const getLeaveName = (req) => {
    return (
      req?.user?.name ||
      req?.employee?.name ||
      req?.user_name ||
      req?.employee_name ||
      req?.employee ||
      req?.name ||
      `User #${req?.user_id || '-'}`
    )
  }


  const getLeaveType = (req) => {
    return (
      req?.leave_type?.name ||
      req?.leaveType?.name ||
      req?.leave_type_name ||
      req?.type ||
      'Cuti'
    )
  }


  const getInitials = (name) => {
    if (!name) return '?'

    const words = name.trim().split(' ')

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }

    return (
      words[0].charAt(0) +
      words[1].charAt(0)
    ).toUpperCase()
  }


  const getLeaveDate = (req) => {
    if (!req?.start_date) {
      return 'Tanggal tidak tersedia'
    }

    try {
      const start = new Date(
        `${String(req.start_date).slice(
          0,
          10
        )}T00:00:00`
      )

      const end = req.end_date
        ? new Date(
            `${String(req.end_date).slice(
              0,
              10
            )}T00:00:00`
          )
        : start

      const startText =
        start.toLocaleDateString(
          'id-ID',
          {
            day: '2-digit',
            month: 'short',
          }
        )

      const endText =
        end.toLocaleDateString(
          'id-ID',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }
        )

      return `${startText} - ${endText}`
    } catch {
      return `${req.start_date}`
    }
  }


  const getLeaveStatus = (req) => {
    const status = String(
      req?.status || 'pending'
    ).toLowerCase()

    const labels = {
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      cancelled: 'Dibatalkan',
    }

    return labels[status] || status
  }


  const toggleFaq = (index) => {
    setOpenFaq((current) => (current === index ? -1 : index))
  }


  const handleNavClick = (event, sectionId) => {
    event.preventDefault()

    const section =
      document.getElementById(sectionId)

    if (!section) return

    setActiveNav(sectionId)
    setMenuOpen(false)

    const navbar =
      document.querySelector('.landing-nav')

    const navbarHeight =
      navbar?.offsetHeight || 82

    const sectionTop =
      section.getBoundingClientRect().top +
      window.scrollY

    const targetPosition =
      sectionTop - navbarHeight - 20

    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: 'smooth',
    })

    window.history.replaceState(
      null,
      '',
      `#${sectionId}`
    )
  }


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div
      className="landing landing-internal"
      ref={pageRef}
    >

      {/* ================= NAVBAR ================= */}

      <header
        className={`landing-nav ${
          scrolled ? 'is-scrolled' : ''
        }`}
      >
        <div className="container landing-nav-inner">

          <Logo size={40} />

          <nav
            className={`landing-links ${
              menuOpen ? 'open' : ''
            }`}
            aria-label="Navigasi utama"
          >
            <a
              href="#fitur"
              className={
                activeNav === 'fitur'
                  ? 'active'
                  : ''
              }
              aria-current={
                activeNav === 'fitur'
                  ? 'page'
                  : undefined
              }
              onClick={(event) =>
                handleNavClick(event, 'fitur')
              }
            >
              Fitur
            </a>

            <a
              href="#alur"
              className={
                activeNav === 'alur'
                  ? 'active'
                  : ''
              }
              aria-current={
                activeNav === 'alur'
                  ? 'page'
                  : undefined
              }
              onClick={(event) =>
                handleNavClick(event, 'alur')
              }
            >
              Cara Kerja
            </a>

            <a
              href="#peran"
              className={
                activeNav === 'peran'
                  ? 'active'
                  : ''
              }
              aria-current={
                activeNav === 'peran'
                  ? 'page'
                  : undefined
              }
              onClick={(event) =>
                handleNavClick(event, 'peran')
              }
            >
              Hak Akses
            </a>

            <a
              href="#faq"
              className={
                activeNav === 'faq'
                  ? 'active'
                  : ''
              }
              aria-current={
                activeNav === 'faq'
                  ? 'page'
                  : undefined
              }
              onClick={(event) =>
                handleNavClick(event, 'faq')
              }
            >
              FAQ
            </a>
          </nav>

          <div className="landing-nav-actions">

            <Link
              to="/login"
              className="btn btn-primary btn-sm"
            >
              Masuk Sistem
            </Link>

            <button
              type="button"
              className="landing-menu-btn"
              onClick={() =>
                setMenuOpen(
                  (value) => !value
                )
              }
              aria-label="Toggle navigation"
            >
              {menuOpen ? (
                <X size={21} />
              ) : (
                <Menu size={21} />
              )}
            </button>

          </div>

        </div>
      </header>


      {/* ================= HERO ================= */}

      <section className="landing-hero">

        <div className="container hero-grid">

          <div className="hero-copy">

            <span className="hero-eyebrow">
              <Sparkles size={14} />
              MITRAL · Employee Leave
            </span>

            <h1>
              Employee
              <br />
              Management<span> System </span>
            </h1>

            <p>
              Sistem pengelolaan cuti karyawan
              yang membantu proses pengajuan,
              approval, pemantauan cuti,
              hingga riwayat cuti menjadi
              lebih mudah dan terorganisir.
            </p>

            <div className="hero-actions">

              <Link
                to="/login"
                className="btn btn-primary btn-lg"
              >
                Ajukan Cuti
                <ArrowRight size={17} />
              </Link>

            </div>

          </div>

          {/* HERO DASHBOARD */}

          <div className="hero-visual">

            <span className="orbital-dot dot-one" />
            <span className="orbital-dot dot-two" />
            <span className="orbital-dot dot-three" />

            <div className="leave-dashboard">

              <div className="dashboard-header">

                <div className="dashboard-header-left">

                  <span className="live-badge">
                    <span className="pulse-dot" />
                    Live
                  </span>

                  <h3>
                    Leave Overview
                  </h3>

                </div>

                <div className="header-icon">
                  <CalendarDays size={18} />
                </div>

              </div>


              <div className="dashboard-body">

                <div className="dashboard-stats">

                  <div className="dashboard-stat-card">

                    <Users
                      size={14}
                      className="stat-icon-mini"
                    />

                    <strong>
                      {loading
                        ? '...'
                        : totalEmployees}
                    </strong>

                    <span>
                      Karyawan
                    </span>

                  </div>


                  <div className="dashboard-stat-card">

                    <CalendarDays
                      size={14}
                      className="stat-icon-mini"
                    />

                    <strong>
                      {loading
                        ? '...'
                        : teamOnLeaveCount}
                    </strong>

                    <span>
                      Sedang Cuti
                    </span>

                  </div>


                  <div className="dashboard-stat-card pending">

                    <Clock3
                      size={14}
                      className="stat-icon-mini"
                    />

                    <strong>
                      {loading
                        ? '...'
                        : pendingCount}
                    </strong>

                    <span>
                      Menunggu
                    </span>

                  </div>


                  <div className="dashboard-stat-card approved">

                    <CheckCircle2
                      size={14}
                      className="stat-icon-mini"
                    />

                    <strong>
                      {loading
                        ? '...'
                        : approvedCount}
                    </strong>

                    <span>
                      Disetujui
                    </span>

                  </div>

                </div>


                <div className="dashboard-recent">

                  <div className="recent-header">

                    <span>
                      Pengajuan Terbaru
                    </span>

                    <span className="view-link">
                      Lihat semua
                      <ChevronRight size={12} />
                    </span>

                  </div>


                  {loading ? (

                    <div className="request-row">

                      <div className="req-avatar">
                        ...
                      </div>

                      <div className="req-info">
                        <strong>
                          Memuat data
                        </strong>

                        <span>
                          Mengambil pengajuan
                        </span>
                      </div>

                    </div>

                  ) : recentRequests.length > 0 ? (

                    recentRequests.map((req) => {

                      const status = String(
                        req?.status || ''
                      ).toLowerCase()

                      const isApproved =
                        status === 'approved'

                      const isPending =
                        status === 'pending'

                      return (

                        <div
                          className="request-row"
                          key={
                            req?.id ||
                            req?.code
                          }
                        >

                          <div
                            className={`req-avatar ${
                              isApproved
                                ? 'approved'
                                : isPending
                                ? 'pending'
                                : ''
                            }`}
                          >
                            {getInitials(
                              getLeaveName(req)
                            )}
                          </div>

                          <div className="req-info">

                            <strong>
                              {getLeaveName(req)}
                            </strong>

                            <span>
                              {getLeaveType(req)}
                              {' · '}
                              {getLeaveDate(req)}
                            </span>

                          </div>

                          <span
                            className={`req-status ${
                              isApproved
                                ? 'approved'
                                : isPending
                                ? 'pending'
                                : ''
                            }`}
                          >
                            {getLeaveStatus(req)}
                          </span>

                        </div>
                      )
                    })

                  ) : (

                    <div className="request-row">

                      <div className="req-avatar">
                        -
                      </div>

                      <div className="req-info">

                        <strong>
                          Belum ada pengajuan
                        </strong>

                        <span>
                          Data cuti akan muncul di sini
                        </span>

                      </div>

                    </div>

                  )}

                </div>

              </div>

            </div>


            <div className="leave-floating-card">

              <div className="floating-check">
                <CheckCircle2 size={17} />
              </div>

              <div className="card-text">

                <strong>
                  Pengajuan disetujui
                </strong>

                <span>
                  Status dapat dipantau secara langsung
                </span>

                <small>
                  <Clock3 size={10} />
                  Sistem cuti online
                </small>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= BENEFITS ================= */}

      <section className="leave-benefits">

        <div className="container">

          <div className="benefit-strip reveal">

            <div className="benefit-item">

              <div className="benefit-icon">
                <Zap size={19} />
              </div>

              <div>
                <strong>
                  Ajukan kapan saja
                </strong>

                <span>
                  Tidak perlu proses manual
                </span>
              </div>

            </div>


            <div className="benefit-divider" />


            <div className="benefit-item">

              <div className="benefit-icon">
                <Clock3 size={19} />
              </div>

              <div>
                <strong>
                  Status transparan
                </strong>

                <span>
                  Pantau proses pengajuan
                </span>
              </div>

            </div>


            <div className="benefit-divider" />


            <div className="benefit-item">

              <div className="benefit-icon">
                <ShieldCheck size={19} />
              </div>

              <div>
                <strong>
                  Akses terkontrol
                </strong>

                <span>
                  Sesuai role pengguna
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================= FEATURES ================= */}

      <section
        id="fitur"
        className="landing-section feature-section"
      >

        <div className="container">

          <div className="feature-heading reveal">

            <div className="feature-heading-left">

              <span className="section-kicker">
                FITUR UTAMA
              </span>

              <h2>
                Kelola pengajuan cuti,
                <br />
                jadi lebih mudah.
              </h2>

            </div>


            <div className="feature-heading-right">

              <p>
                Kelola pengajuan, persetujuan,
                kuota, dan riwayat cuti dalam
                satu alur kerja yang lebih
                sederhana dan transparan.
              </p>

            </div>

          </div>


          <div className="feature-grid">

            {leaveFeatures.map((item, index) => {

              const Icon = item.icon

              return (

                <article
                  key={item.title}
                  className={`feature-card accent-${item.accent} reveal`}
                  style={{
                    transitionDelay: `${index * 60}ms`,
                  }}
                >

                  <div className="feature-card-icon">
                    <Icon size={20} />
                  </div>

                  <h3>
                    {item.title}
                  </h3>

                  <p>
                    {item.desc}
                  </p>

                </article>
              )
            })}

          </div>

        </div>

      </section>


      {/* ================= ROLE ACCESS ================= */}

      <section
        id="peran"
        className="role-section"
      >

        <div className="container">

          <div className="role-heading reveal">

            <span className="section-kicker">
              HAK AKSES
            </span>

            <h2>
              Satu sistem,
              <br />
              peran yang jelas untuk semua.
            </h2>

            <p>
              Karyawan, atasan, HR, dan
              administrator memiliki akses
              sesuai kebutuhan dan kewenangan
              masing-masing.
            </p>

          </div>


          <div className="role-grid">

            {roleAccess.map((role, index) => {

              const Icon = role.icon

              return (

                <article
                  key={role.title}
                  className="role-card reveal"
                  style={{
                    transitionDelay: `${index * 80}ms`,
                  }}
                >

                  <div className="role-icon">
                    <Icon size={21} />
                  </div>

                  <h3>
                    {role.title}
                  </h3>

                  <ul>
                    {role.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                </article>
              )
            })}

          </div>

        </div>

      </section>


      {/* ================= WORKFLOW ================= */}

      <section
        id="alur"
        className="landing-section workflow-section"
      >

        <div className="container">

          <div className="workflow-heading reveal">

            <span className="section-kicker">
                CARA KERJA
              </span>

              <h2>
                Proses pengajuan cuti,
                <br />
                dalam empat langkah mudah.
              </h2>
            <p>
              Pengajuan cuti dibuat singkat
              tanpa menghilangkan proses
              persetujuan dan pencatatan.
            </p>

          </div>


          <div className="leave-workflow">

            {leaveSteps.map(
              (step, index) => (

                <article
                  key={step.number}
                  className="workflow-item reveal"
                  style={{
                    transitionDelay:
                      `${index * 80}ms`,
                  }}
                >

                  <div className="workflow-number">
                    {step.number}
                  </div>

                  <div className="workflow-line" />

                  <h3>
                    {step.title}
                  </h3>

                  <p>
                    {step.desc}
                  </p>

                </article>
              )
            )}

          </div>


          <div className="leave-cta reveal">

            <div className="cta-left">

              <div className="cta-icon">
                <CalendarDays size={23} />
              </div>

              <div>

                <strong>
                  Siap mengajukan cuti?
                </strong>

                <p>
                  Masuk menggunakan akun resmi
                  perusahaan.
                </p>

              </div>

            </div>


            <Link
              to="/login"
              className="btn btn-primary btn-lg"
            >
              Masuk ke sistem
              <ArrowRight size={17} />
            </Link>

          </div>

        </div>

      </section>


      {/* ================= FAQ ================= */}

      <section
        id="faq"
        className="faq-section"
      >

        <div className="container faq-layout">

          <div className="faq-heading reveal">

            <span className="section-kicker">
              PERTANYAAN UMUM
            </span>

            <h2>
              Apakah ada yang
              <br />
              ingin ditanyakan?
            </h2>

            <p>
              Beberapa hal yang paling sering
              ditanyakan seputar penggunaan
              sistem cuti ini.
            </p>

          </div>


          <div className="faq-list reveal">

            {faqItems.map((item, index) => {

              const isOpen = openFaq === index

              return (

                <div
                  key={item.q}
                  className={`faq-item ${
                    isOpen ? 'is-open' : ''
                  }`}
                >

                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>

                    <span className="faq-question-icon">
                      <ChevronDown size={15} />
                    </span>
                  </button>

                  <div className="faq-answer">
                    <div className="faq-answer-inner">
                      <p>{item.a}</p>
                    </div>
                  </div>

                </div>
              )
            })}

          </div>

        </div>

      </section>


      {/* ================= FOOTER ================= */}

      <footer className="landing-footer">

        <div className="container">

          <div className="footer-top">

            <div className="footer-brand">

              <Logo
                size={35}
                textColor="#ffffff"
              />

            </div>

            <div className="footer-col">
              <h4>Produk</h4>
              <ul>
                <li><a href="#fitur">Fitur</a></li>
                <li><a href="#alur">Cara Kerja</a></li>
                <li><a href="#peran">Hak Akses</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Sistem</h4>
              <ul>
                <li>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={13} /> Keamanan Data
                  </span>
                </li>
                <li>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FileClock size={13} /> Riwayat Tersimpan
                  </span>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Bantuan</h4>
              <ul>
                <li><a href="#faq">FAQ</a></li>
                <li>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquareWarning size={13} /> Hubungi HR
                  </span>
                </li>
              </ul>
            </div>

          </div>

          <div className="landing-footer-inner">

            <div className="footer-right">

              <span>
                © 2026 MITRAL
              </span>

            </div>

          </div>

        </div>

      </footer>

    </div>
  )
}