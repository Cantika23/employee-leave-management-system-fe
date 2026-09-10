import mitralLogo from '../assets/mitral.png'

export default function Logo({
  size = 40,
  className = ''
}) {

  return (
    <div
      className={`logo-wrap ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center'
      }}
    >

      <img
        src={mitralLogo}
        alt="MITRAL Logo"
        style={{
          width: size * 4,
          height: size,
          objectFit: 'contain'
        }}
      />

    </div>
  )
}