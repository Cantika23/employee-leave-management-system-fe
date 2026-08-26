import Brand from '../Brand'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Brand />
          <p>Platform cuti karyawan yang dirancang untuk organisasi yang menghargai kejelasan, ketenangan, dan tata kelola yang rapi.</p>
        </div>
        <div>
          <h4>Produk</h4>
          <a href="#fitur">Fitur</a>
          <a href="#alur">Alur kerja</a>
          <a href="#peran">Peran pengguna</a>
        </div>
        <div>
          <h4>Perusahaan</h4>
          <a href="#faq">FAQ</a>
          <a href="mailto:yuki.t@example.com">Kontak</a>
          <Linkish>Keamanan</Linkish>
        </div>
        <div>
          <h4>Akses</h4>
          <a href="/login">Masuk</a>
          <a href="/register">Buat akun</a>
          <a href="/app">Dashboard</a>
        </div>
      </div>
      <div className="container footer__copy">© {new Date().getFullYear()} MITRAL. Seluruh hak dilindungi.</div>
    </footer>
  )
}

function Linkish({ children }) {
  return <p>{children}</p>
}
