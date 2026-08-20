import { useState } from 'react'
import { useToast } from '../context/ToastContext'

export default function Settings() {
  const { push } = useToast()
  const [toggles, setToggles] = useState({
    email: true,
    digest: true,
    clash: true,
    calendar: false,
  })

  function flip(key) {
    setToggles((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      push('Pengaturan disimpan.')
      return next
    })
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Pengaturan</h1>
          <p>Sesuaikan notifikasi dan kebijakan workspace.</p>
        </div>
      </div>

      <div className="form-grid">
        <section className="card panel">
          <h2 style={{ fontSize: '1.05rem' }}>Notifikasi</h2>
          <div className="settings-list">
            <div className="settings-row">
              <div>
                <strong>Email persetujuan</strong>
                <div className="hint">Kirim email saat ada permohonan baru atau keputusan.</div>
              </div>
              <Toggle on={toggles.email} onClick={() => flip('email')} />
            </div>
            <div className="settings-row">
              <div>
                <strong>Ringkasan mingguan</strong>
                <div className="hint">Rekap cuti tim setiap Senin pagi.</div>
              </div>
              <Toggle on={toggles.digest} onClick={() => flip('digest')} />
            </div>
            <div className="settings-row">
              <div>
                <strong>Peringatan bentrok</strong>
                <div className="hint">Tandai jika lebih dari 30% tim cuti di hari yang sama.</div>
              </div>
              <Toggle on={toggles.clash} onClick={() => flip('clash')} />
            </div>
            <div className="settings-row">
              <div>
                <strong>Sinkron kalender</strong>
                <div className="hint">Tampilkan cuti yang disetujui di kalender perusahaan.</div>
              </div>
              <Toggle on={toggles.calendar} onClick={() => flip('calendar')} />
            </div>
          </div>
        </section>

        <section className="card panel">
          <h2 style={{ fontSize: '1.05rem' }}>Kebijakan cuti</h2>
          <div className="list-soft" style={{ marginTop: 14 }}>
            <article>
              <span>Cuti tahunan</span>
              <strong>12 hari</strong>
            </article>
            <article>
              <span>Cuti sakit</span>
              <strong>12 hari</strong>
            </article>
            <article>
              <span>Carry over</span>
              <strong>Maks. 5 hari</strong>
            </article>
            <article>
              <span>Lead time</span>
              <strong>3 hari kerja</strong>
            </article>
          </div>
          <p className="notice" style={{ marginTop: 14 }}>
            Palet visual workspace: biru langit dan putih. Mode gelap tidak diaktifkan agar kesan
            korporat tetap bersih dan terang.
          </p>
        </section>
      </div>
    </div>
  )
}

function Toggle({ on, onClick }) {
  return (
    <button className={`toggle ${on ? 'is-on' : ''}`} onClick={onClick} type="button" aria-pressed={on}>
      <i />
    </button>
  )
}
