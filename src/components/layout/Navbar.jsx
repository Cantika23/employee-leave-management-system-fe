import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from '../components/Logo'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="nav">
      <div className="nav__inner">
        <Logo showText />
        <nav className="nav__links">
          <a href="#fitur">Fitur</a>
          <a href="#alur">Alur kerja</a>
          <a href="#peran">Peran</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="nav__cta">
          <Link to="/login" className="btn btn-primary">
            Masuk
          </Link>
        </div>
        <button className="nav__toggle" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="mobile-menu">
          <a href="#fitur" onClick={() => setOpen(false)}>Fitur</a>
          <a href="#alur" onClick={() => setOpen(false)}>Alur kerja</a>
          <a href="#peran" onClick={() => setOpen(false)}>Peran</a>
          <Link to="/login" className="btn btn-primary">Masuk</Link>
        </div>
      )}
    </header>
  )
}
