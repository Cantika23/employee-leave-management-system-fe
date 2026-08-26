import { useId } from 'react'
import { Link } from 'react-router-dom'

export default function Brand({ to = '/', invert = false, wordmark = true }) {
  const raw = useId().replace(/:/g, '')
  const gid = `sky-${raw}`

  return (
    <Link to={to} className={`brand ${invert ? 'brand--invert' : ''}`} aria-label="Aether Leave">
      <svg className="brand__mark" viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="55%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill={`url(#${gid})`} />
        <path
          d="M8 25c4.2-8.4 8.2-12.5 12-12.5S27.8 16.6 32 25"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="20" cy="14.5" r="3.1" fill="#fff" />
      </svg>
      {wordmark && (
        <span className="brand__text">
          Employee<span>Leave</span>
        </span>
      )}
    </Link>
  )
}
