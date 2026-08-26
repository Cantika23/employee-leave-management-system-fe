import { useState } from 'react'

/**
 * Logo component — place your logo image at:
 *   public/images/logo.png
 * or
 *   src/assets/logo.png
 *
 * Falls back to text brandmark if image is missing.
 */
export default function Logo({ size = 40, showText = true, textColor = 'var(--leave-navy, #132a43)', className = '' }) {
  const [imgError, setImgError] = useState(false)

  // Try public folder first (easiest for user to drop logo into)
  const logoSrc = '/images/logo.png'

  return (
    <div className={`logo-wrap ${className}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {!imgError ? (
        <img
          src={logoSrc}
          alt="Logo"
          className="logo-img"
          width={size}
          height={size}
          style={{ width: size, height: size, borderRadius: 10 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="logo-fallback"
          style={{ width: size, height: size, fontSize: size * 0.38 }}
          aria-hidden
        >
          ML
        </div>
      )}
      {showText && (
        <span
          style={{
            fontWeight: 800,
            fontSize: size * 0.42,
            color: textColor,
            letterSpacing: '-0.4px',
            lineHeight: 1.15,
          }}
        >
          MITRAL
          <br />
          <span style={{ fontWeight: 600, fontSize: '0.72em', opacity: 0.75 }}>Employee Leave</span>
        </span>
      )}
    </div>
  )
}