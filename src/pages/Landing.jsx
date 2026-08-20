import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Users2,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { FEATURES } from '../data/mock'

export default function Landing() {
  return (
    <div className="landing">
      <Navbar />
      <main>
        <section className="container hero">
          <div>
            <div className="eyebrow">
              <Sparkles size={14} />
              Sistem cuti korporat yang tenang dan presisi
            </div>
            <h1>
              Kelola cuti karyawan dengan <em>kejelasan yang elegan.</em>
            </h1>
            <p className="hero__lead">
              Aether Leave menyatukan pengajuan, persetujuan, kalender tim, dan laporan dalam satu
              pengalaman biru langit yang rapi — siap dipakai HR, atasan, dan seluruh karyawan.
            </p>
            <div className="hero__actions">
              <Link to="/register" className="btn btn-primary">
                Mulai sekarang <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn btn-outline">
                Masuk ke workspace
              </Link>
            </div>
            <div className="hero__meta">
              <div>
                <strong>12 hari</strong>
                kuota terpantau otomatis
              </div>
              <div>
                <strong>3 peran</strong>
                karyawan, atasan, HR
              </div>
              <div>
                <strong>1 layar</strong>
                untuk seluruh alur cuti
              </div>
            </div>
          </div>

          <div className="hero-panel">
            <article className="hero-card">
              <div className="hero-card__top">
                <div>
                  <div className="hint">Saldo cuti tahunan</div>
                  <h3>Andini Prameswari</h3>
                </div>
                <span className="badge badge--sky">Produk</span>
              </div>
              <div className="ring">
                <span>
                  7
                  <br />
                  hari
                </span>
              </div>
              <div className="balance-list">
                <div className="balance-row">
                  <span>Cuti tahunan</span>
                  <b>7 / 12</b>
                </div>
                <div className="balance-row">
                  <span>Cuti sakit</span>
                  <b>10 / 12</b>
                </div>
                <div className="balance-row">
                  <span>Cuti khusus</span>
                  <b>4 / 5</b>
                </div>
              </div>
            </article>
            <div className="float-card float-card--right">
              <span className="badge badge--approved">Disetujui</span>
              <p style={{ marginTop: 8, fontWeight: 700 }}>Cuti 24–26 Agustus</p>
              <p className="hint">3 hari kerja · atasan telah meninjau</p>
            </div>
            <div className="float-card float-card--left">
              <p className="hint">Tim sedang cuti</p>
              <p style={{ fontWeight: 800, marginTop: 4 }}>2 orang hari ini</p>
              <p className="hint">Kalender tetap seimbang</p>
            </div>
          </div>
        </section>

        <section className="container logo-strip">
          Dipercaya tim people, finance, dan technology
          <ul>
            <li>Nimbus Corp</li>
            <li>Auraline</li>
            <li>Skyward</li>
            <li>Mitra Prima</li>
            <li>Northbay</li>
          </ul>
        </section>

        <section className="section" id="fitur">
          <div className="container">
            <div className="section__head">
              <h2>Dirancang untuk terasa ringan, bekerja secara ketat.</h2>
              <p>
                Setiap layar dibuat untuk pengambilan keputusan yang cepat: sisa kuota, bentrok
                kalender, dan jejak persetujuan selalu terlihat.
              </p>
            </div>
            <div className="bento">
              {FEATURES.map((feature, index) => (
                <article className="card" key={feature.title}>
                  <div className="icon-blob">
                    {index === 0 && <ClipboardList size={18} />}
                    {index === 1 && <ShieldCheck size={18} />}
                    {index === 2 && <CalendarCheck2 size={18} />}
                    {index === 3 && <CheckCircle2 size={18} />}
                    {index === 4 && <Sparkles size={18} />}
                    {index === 5 && <Users2 size={18} />}
                  </div>
                  <h3>{feature.title}</h3>
                  <p className="hint">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="alur" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section__head">
              <h2>Empat langkah. Tanpa kebingungan.</h2>
              <p>Dari niat cuti hingga tercatat di kalender tim, semuanya mengalir dalam satu ritme.</p>
            </div>
            <div className="steps">
              {[
                ['01', 'Ajukan', 'Pilih jenis cuti, tanggal, dan alasan. Sistem menghitung hari kerja.'],
                ['02', 'Tinjau', 'Atasan melihat dampak ke tim, sisa kuota, dan riwayat singkat.'],
                ['03', 'Putuskan', 'Setujui atau tolak dengan catatan. Karyawan mendapat kejelasan.'],
                ['04', 'Tercatat', 'Saldo terbarui, kalender terisi, laporan bergerak otomatis.'],
              ].map(([no, title, body]) => (
                <article className="card step" key={no}>
                  <b>{no}</b>
                  <h3>{title}</h3>
                  <p className="hint">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="peran" style={{ paddingTop: 0 }}>
          <div className="container preview">
            <div>
              <div className="section__head">
                <h2>Workspace yang terasa mahal, tanpa kerumitan.</h2>
                <p>
                  Dashboard biru langit dengan hierarki visual yang tenang: angka penting di depan,
                  detail siap saat dibutuhkan.
                </p>
              </div>
              <div className="roles">
                <article className="card role">
                  <h3>Karyawan</h3>
                  <p className="hint">Ajukan cuti, pantau status, dan jaga sisa kuota.</p>
                  <ul>
                    <li>Formulir 60 detik</li>
                    <li>Riwayat transparan</li>
                    <li>Saldo real-time</li>
                  </ul>
                </article>
                <article className="card role">
                  <h3>Atasan</h3>
                  <p className="hint">Tinjau dampak tim sebelum memberi keputusan.</p>
                  <ul>
                    <li>Antrian persetujuan</li>
                    <li>Kalender skuad</li>
                    <li>Catatan keputusan</li>
                  </ul>
                </article>
                <article className="card role">
                  <h3>HR</h3>
                  <p className="hint">Tata kelola kuota, karyawan, dan laporan eksekutif.</p>
                  <ul>
                    <li>Direktori karyawan</li>
                    <li>Kebijakan cuti</li>
                    <li>Analitik bulanan</li>
                  </ul>
                </article>
              </div>
            </div>
            <div className="preview-frame">
              <div className="preview-screen">
                <div className="preview-bar">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <div className="preview-body">
                  <div className="preview-side">
                    <div className="skel" />
                    <div className="skel" style={{ marginTop: 16, width: '80%' }} />
                    <div className="skel" style={{ marginTop: 10, width: '70%' }} />
                    <div className="skel" style={{ marginTop: 10, width: '75%' }} />
                  </div>
                  <div className="preview-main">
                    <div className="skel" style={{ width: '40%', height: 14 }} />
                    <div className="skel" style={{ height: 54 }} />
                    <div className="skel" style={{ height: 54 }} />
                    <div className="skel" style={{ height: 72 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section__head">
              <h2>Dipakai orang yang menuntut kejelasan.</h2>
            </div>
            <div className="quotes">
              {[
                ['“Akhirnya cuti tidak lagi hidup di spreadsheet yang saling bentrok.”', 'Rina A.', 'Head of People'],
                ['“Persetujuan jadi keputusan, bukan obrolan panjang di chat.”', 'Dimas P.', 'Engineering Manager'],
                ['“Tampilannya tenang, tapi datanya lengkap. Itu yang kami butuhkan.”', 'Maya K.', 'Finance Controller'],
              ].map(([quote, name, title]) => (
                <article className="card quote" key={name}>
                  <p>{quote}</p>
                  <p style={{ marginTop: 18, fontWeight: 800 }}>{name}</p>
                  <p className="hint">{title}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="faq" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section__head">
              <h2>Pertanyaan yang sering muncul</h2>
            </div>
            <div className="faq">
              <details open>
                <summary>Apakah template ini sudah mencakup alur HR lengkap?</summary>
                <p>Ya. Landing, login, dashboard, pengajuan, riwayat, kalender, persetujuan, karyawan, laporan, pengaturan, dan profil sudah tersedia sebagai fondasi produk.</p>
              </details>
              <details>
                <summary>Bagaimana cara mencoba peran yang berbeda?</summary>
                <p>Gunakan akun demo di halaman masuk: HR, atasan, atau karyawan. Setiap peran menampilkan menu yang relevan.</p>
              </details>
              <details>
                <summary>Apakah tampilannya siap untuk merek korporat?</summary>
                <p>Palet biru langit dan putih, tipografi Plus Jakarta Sans, dan hierarki visual yang tenang dirancang khusus untuk kesan profesional.</p>
              </details>
            </div>
            <div className="cta-banner" style={{ marginTop: 36 }}>
              <div>
                <h2>Siap menata cuti perusahaan Anda?</h2>
                <p>Masuk ke workspace demo dan rasakan alurnya dalam hitungan menit.</p>
              </div>
              <Link to="/login" className="btn btn-primary">
                Buka dashboard demo
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
