import { useId } from 'react'
import { Link } from 'react-router-dom'

export default function Brand({
  to = '/',
  invert = false,
  wordmark = true,
}) {
  const raw = useId().replace(/:/g, '')
  const gid = `sky-${raw}`

  return (
    <Link
      to={to}
      className={`brand ${invert ? 'brand--invert' : ''}`}
      aria-label="MITRAL Employee Leave"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        textDecoration: 'none',
      }}
    >
      {/* Logo */}
      <svg
        className="brand__mark"
        viewBox="0 0 40 40"
        aria-hidden="true"
        width="40"
        height="40"
      >
        <defs>
          <linearGradient
            id={gid}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="#3B82F6"
            />

            <stop
              offset="100%"
              stopColor="#2563EB"
            />
          </linearGradient>
        </defs>

        <rect
          width="40"
          height="40"
          rx="12"
          fill={`url(#${gid})`}
        />

        <text
          x="20"
          y="21"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize="16"
          fontWeight="700"
          fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
          letterSpacing="0.5"
        >
          ML
        </text>
      </svg>

      {/* Brand Name */}
      {wordmark && (
        <span
          className="brand__text"
          style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}
        >
          <strong
            className="brand__name"
            style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}
          >
            MITRAL
          </strong>

          <span
            className="brand__subtitle"
            style={{ fontSize: '10px', fontWeight: 500, color: '#2563EB', marginTop: '1px' }}
          >
            Employee Leave
          </span>
        </span>
      )}
    </Link>
  )
}