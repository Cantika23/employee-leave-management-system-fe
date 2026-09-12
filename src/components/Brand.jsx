import { Link } from 'react-router-dom'
import mitralLogo from '../assets/mitral.png'

export default function Brand({
  to = '/',
  invert = false,
  wordmark = true,
}) {

  return (
    <Link
      to={to}
      className={`brand ${invert ? 'brand--invert' : ''}`}
      aria-label="MITRAL Employee Leave"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 10,
        width: '100%',
        textDecoration: 'none',
      }}
    >

      {/* Logo MITRAL */}
      <img
        src={mitralLogo}
        alt="MITRAL Logo"
        style={{
          width: 112,
          height: 48,
          objectFit: 'contain',
        }}
      />

    </Link>
  )
}