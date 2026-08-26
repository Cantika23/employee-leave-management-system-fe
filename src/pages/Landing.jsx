import { Link } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  WalletCards,
  Menu,
  X,
  Plane,
  CircleCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import Logo from '../components/Logo'
import './landing.css'
import api from '../api/axios'

const leaveFeatures = [
  {
    icon: CalendarDays,
    title: 'Pengajuan Cuti',
    desc: 'Ajukan cuti secara online dengan periode dan alasan yang tercatat dalam sistem.',
  },
  {
    icon: UserCheck,
    title: 'Approval',
    desc: 'Pengajuan diteruskan kepada atasan untuk direview sesuai kewenangan.',
  },
  {
    icon: WalletCards,
    title: 'Saldo Cuti',
    desc: 'Pantau jumlah hak cuti, cuti terpakai, dan sisa cuti dengan lebih mudah.',
  },
  {
    icon: History,
    title: 'Riwayat Pengajuan',
    desc: 'Lihat seluruh pengajuan cuti beserta status dan detail prosesnya.',
  },
]

const leaveSteps = [
  {
    number: '01',
    title: 'Pilih periode',
    desc: 'Tentukan tanggal mulai dan selesai cuti.',
  },
  {
    number: '02',
    title: 'Kirim pengajuan',
    desc: 'Lengkapi alasan lalu kirim pengajuan.',
  },
  {
    number: '03',
    title: 'Review atasan',
    desc: 'Atasan memeriksa dan memberikan keputusan.',
  },
  {
    number: '04',
    title: 'Selesai',
    desc: 'Status pengajuan dapat dipantau melalui sistem.',
  },
]

/* =========================================================
   SCROLL REVEAL
========================================================= */

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
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px',
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

/* =========================================================
   LANDING
========================================================= */

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  /*
   * Data employee
   */
  const [employees, setEmployees] = useState([])

  /*
   * Data summary
   *
   * Struktur dibuat sama seperti Dashboard.
   */
  const [summary, setSummary] = useState({
    team_on_leave: [],
    pending_count: 0,
    monthly_request: [],
    remaining_leave: 0,
  })

  const pageRef = useRef(null)

  useScrollReveal(pageRef)

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [
          employeeRes,
          summaryRes,
        ] = await Promise.all([
          api.get('/employees'),
          api.get('/dashboard/summary'),
        ])

        /*
         * -----------------------------------------------------
         * EMPLOYEE
         * -----------------------------------------------------
         */

        const employeeData = Array.isArray(
          employeeRes.data
        )
          ? employeeRes.data
          : employeeRes.data?.data || []

        /*
         * -----------------------------------------------------
         * SUMMARY
         * -----------------------------------------------------
         *
         * Dashboard menggunakan:
         *
         * setSummary(summaryRes.data)
         *
         * Jadi kita juga mengikuti struktur tersebut.
         *
         * Tetapi dibuat fleksibel kalau response API
         * ternyata dibungkus dalam property "data".
         */

        const summaryData =
          summaryRes.data?.data &&
          typeof summaryRes.data.data === 'object'
            ? summaryRes.data.data
            : summaryRes.data

        /*
         * Pastikan team_on_leave selalu array.
         */

        const teamOnLeave = Array.isArray(
          summaryData?.team_on_leave
        )
          ? summaryData.team_on_leave
          : []

        /*
         * Simpan employee.
         */

        setEmployees(employeeData)

        /*
         * Simpan summary.
         */

        setSummary({
          ...summaryData,
          team_on_leave: teamOnLeave,
        })

        /*
         * DEBUG
         *
         * Bisa dilihat di F12 > Console.
         */

        console.log(
          'LANDING SUMMARY:',
          summaryData
        )

        console.log(
          'LANDING TEAM ON LEAVE:',
          teamOnLeave
        )

        console.log(
          'LANDING TEAM ON LEAVE COUNT:',
          teamOnLeave.length
        )

      } catch (error) {
        console.error(
          'Gagal mengambil data landing page:',
          error
        )

        console.error(
          'Status:',
          error.response?.status
        )

        console.error(
          'Response:',
          error.response?.data
        )

        /*
         * Jangan membuat angka palsu.
         *
         * Kalau API gagal, tetap 0.
         */

        setSummary({
          team_on_leave: [],
          pending_count: 0,
          monthly_request: [],
          remaining_leave: 0,
        })

        setEmployees([])
      }
    }

    loadLandingData()
  }, [])

  /* =========================================================
     NAVBAR SCROLL
  ========================================================= */

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8)
    }

    onScroll()

    window.addEventListener(
      'scroll',
      onScroll,
      {
        passive: true,
      }
    )

    return () => {
      window.removeEventListener(
        'scroll',
        onScroll
      )
    }
  }, [])

  /* =========================================================
     DATA HERO
  ========================================================= */

  const teamOnLeaveCount =
    Array.isArray(summary.team_on_leave)
      ? summary.team_on_leave.length
      : 0

  const totalEmployees =
    Array.isArray(employees)
      ? employees.length
      : 0

  return (
    <div
      className="landing landing-internal"
      ref={pageRef}
    >

      {/* =====================================================
          NAVBAR
      ===================================================== */}

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
          >

            <a
              href="#fitur"
              onClick={() => setMenuOpen(false)}
            >
              Fitur
            </a>

            <a
              href="#alur"
              onClick={() => setMenuOpen(false)}
            >
              Cara Kerja
            </a>

            <a
              href="#tentang"
              onClick={() => setMenuOpen(false)}
            >
              Tentang Sistem
            </a>

          </nav>

          <div className="landing-nav-actions">

            <Link
              to="/login"
              className="btn btn-primary btn-sm"
            >
              Masuk
              <ArrowRight size={15} />
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
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}

            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="landing-hero">

        <div className="container hero-grid">

          {/* LEFT */}

          <div className="hero-copy">

            <span className="hero-eyebrow">

              <CalendarDays size={14} />

              MITRAL · Employee Management

            </span>

            <h1>

              Employee
              <br />

              <span>
                Management System
              </span>

            </h1>

            <p>
              Sistem pengelolaan cuti karyawan yang membantu
              proses pengajuan, approval, pemantauan saldo,
              hingga riwayat cuti menjadi lebih mudah dan
              terorganisir.
            </p>

            <div className="hero-actions">

              <Link
                to="/login"
                className="btn btn-primary btn-lg"
              >
                Ajukan Cuti

                <ArrowRight size={18} />

              </Link>

            </div>

            <div className="hero-trust">

              <div className="trust-item">

                <CheckCircle2 size={16} />

                <span>
                  Pengajuan online
                </span>

              </div>

              <div className="trust-item">

                <CheckCircle2 size={16} />

                <span>
                  Approval terstruktur
                </span>

              </div>

              <div className="trust-item">

                <CheckCircle2 size={16} />

                <span>
                  Riwayat tersimpan
                </span>

              </div>

            </div>

          </div>


          {/* RIGHT */}

          <div className="hero-visual">

            <div className="leave-dashboard">

              {/* Dashboard top */}

              <div className="leave-dashboard-top">

                <div>

                  <span className="dashboard-label">
                    Leave Overview
                  </span>

                  <h3>
                    Pengelolaan Cuti
                  </h3>

                </div>

                <div className="dashboard-icon">

                  <CalendarDays size={20} />

                </div>

              </div>


              {/* Balance */}

              <div className="leave-balance">

                <div className="balance-main">

                  <span>
                    Tim sedang cuti
                  </span>

                  <strong>

                    {teamOnLeaveCount}

                    <small>
                      orang
                    </small>

                  </strong>

                </div>


                <div className="balance-ring">

                  <span>
                    {teamOnLeaveCount}
                  </span>

                  <small>
                    / {totalEmployees}
                  </small>

                </div>

              </div>


              {/* Statistics */}

              <div className="leave-stats">

                <div className="leave-stat">

                  <div className="stat-icon used">

                    <Plane size={16} />

                  </div>

                  <div>

                    <span>
                      Terpakai
                    </span>

                    <strong>
                      4 Hari
                    </strong>

                  </div>

                </div>


                <div className="leave-stat">

                  <div className="stat-icon pending">

                    <Clock3 size={16} />

                  </div>

                  <div>

                    <span>
                      Menunggu
                    </span>

                    <strong>
                      {summary.pending_count}
                      {' '}
                      Pengajuan
                    </strong>

                  </div>

                </div>

              </div>


              {/* Recent request */}

              <div className="recent-request">

                <div className="recent-heading">

                  <span>
                    Pengajuan terbaru
                  </span>

                  <span className="view-all">
                    Lihat semua
                  </span>

                </div>


                <div className="request-item">

                  <div className="request-icon">

                    <FileText size={17} />

                  </div>

                  <div className="request-content">

                    <strong>
                      Cuti Tahunan
                    </strong>

                    <span>
                      12 Sep – 13 Sep 2026
                    </span>

                  </div>

                  <span className="status-pending">
                    Menunggu
                  </span>

                </div>


                <div className="request-item">

                  <div className="request-icon success">

                    <CircleCheck size={17} />

                  </div>

                  <div className="request-content">

                    <strong>
                      Cuti Tahunan
                    </strong>

                    <span>
                      21 Agu – 22 Agu 2026
                    </span>

                  </div>

                  <span className="status-approved">
                    Disetujui
                  </span>

                </div>

              </div>

            </div>


            {/* Floating card */}

            <div className="leave-floating-card">

              <div className="floating-check">

                <CheckCircle2 size={18} />

              </div>

              <div>

                <strong>
                  Pengajuan disetujui
                </strong>

                <span>
                  Cuti kamu telah disetujui
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          QUICK BENEFIT
      ===================================================== */}

      <section className="leave-benefits">

        <div className="container">

          <div className="benefit-strip reveal">

            <div className="benefit-item">

              <div className="benefit-icon">

                <CalendarDays size={19} />

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


      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section
        id="fitur"
        className="landing-section"
      >

        <div className="container">

          <div className="section-head left reveal">

            <div>

              <span className="section-kicker">
                FITUR UTAMA
              </span>

              <h2>

                Sistem pengelolaan cuti
                <br />
                yang terstruktur.

              </h2>

            </div>

            <p>
              Memudahkan proses pengajuan, persetujuan,
              pemantauan saldo, serta riwayat cuti karyawan.
            </p>

          </div>


          <div className="feature-grid leave-feature-grid">

            {leaveFeatures.map(
              (item, index) => {

                const Icon = item.icon

                return (
                  <article
                    key={item.title}
                    className="leave-feature-card reveal"
                    style={{
                      transitionDelay:
                        `${index * 70}ms`,
                    }}
                  >

                    <div className="feature-number">
                      0{index + 1}
                    </div>

                    <div className="feature-icon">

                      <Icon size={21} />

                    </div>

                    <h3>
                      {item.title}
                    </h3>

                    <p>
                      {item.desc}
                    </p>

                    <span className="feature-arrow">

                      <ArrowRight size={16} />

                    </span>

                  </article>
                )
              }
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section
        id="tentang"
        className="leave-about"
      >

        <div className="container about-centered">

          <div className="about-centered-head reveal">

            <span className="section-kicker center">
              TENTANG SISTEM
            </span>

            <h2>
              Tentang Sistem
            </h2>

            <p>
              Aplikasi ini dipakai secara internal untuk
              menggantikan pengajuan cuti manual lewat chat
              atau kertas, sehingga seluruh proses tercatat
              rapi dan mudah ditelusuri kapan saja dibutuhkan.
            </p>

          </div>


          <div className="about-simple-grid">

            <div className="about-simple-card reveal">

              <h3>
                Tujuan
              </h3>

              <p>
                Menggantikan pengajuan cuti manual lewat chat
                atau kertas dengan satu alur digital, mulai
                dari pengajuan sampai rekap akhir bulan.
              </p>

            </div>


            <div
              className="about-simple-card reveal"
              style={{
                transitionDelay: '80ms',
              }}
            >

              <h3>
                Pengguna
              </h3>

              <p>
                Karyawan mengajukan cuti, Atasan Langsung
                menyetujui, sementara HR dan Administrator
                memantau serta mengelola data secara
                keseluruhan.
              </p>

            </div>


            <div
              className="about-simple-card reveal"
              style={{
                transitionDelay: '160ms',
              }}
            >

              <h3>
                Keamanan Akses
              </h3>

              <p>
                Masuk hanya dengan akun resmi perusahaan.
                Data cuti seorang karyawan hanya terlihat
                oleh dirinya sendiri dan pihak yang berwenang
                menyetujuinya.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          WORKFLOW
      ===================================================== */}

      <section
        id="alur"
        className="landing-section workflow-section"
      >

        <div className="container">

          <div className="section-head reveal">

            <span className="section-kicker">
              CARA KERJA
            </span>

            <h2>
              Dari pengajuan sampai selesai.
            </h2>

            <p>
              Proses cuti dibuat sederhana sehingga
              karyawan dapat mengajukan dan memantau
              status cuti dengan lebih mudah.
            </p>

          </div>


          <div className="leave-workflow">

            {leaveSteps.map(
              (step, index) => (

                <div
                  key={step.number}
                  className="workflow-item reveal"
                  style={{
                    transitionDelay:
                      `${index * 70}ms`,
                  }}
                >

                  <div className="workflow-top">

                    <span className="workflow-number">
                      {step.number}
                    </span>

                    {index !==
                      leaveSteps.length - 1 && (
                      <span className="workflow-line" />
                    )}

                  </div>

                  <h3>
                    {step.title}
                  </h3>

                  <p>
                    {step.desc}
                  </p>

                </div>

              )
            )}

          </div>


          {/* CTA */}

          <div className="leave-cta reveal">

            <div className="cta-content">

              <span className="cta-icon">

                <CalendarDays size={21} />

              </span>

              <div>

                <strong>
                  Siap mengajukan cuti?
                </strong>

                <p>
                  Masuk menggunakan akun resmi
                  yang telah diberikan Administrator.
                </p>

              </div>

            </div>

            <Link
              to="/login"
              className="btn btn-primary btn-lg"
            >

              Masuk ke sistem

              <ArrowRight size={18} />

            </Link>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="landing-footer">

        <div className="container landing-footer-inner">

          <div className="footer-brand">

            <Logo
              size={34}
              textColor="#ffffff"
            />

          </div>

          <div className="footer-right">

            <span>
              Internal Employee System
            </span>

            <span>
              © 2026 MITRAL
            </span>

          </div>

        </div>

      </footer>

    </div>
  )
}