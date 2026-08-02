import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Regalarte'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background:
            'linear-gradient(135deg, #fdf6f0 0%, #f7e8d8 100%)',
          color: '#2a1a0e',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: 0.7,
            display: 'flex',
          }}
        >
          Regalarte · Solística
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1.05,
              display: 'flex',
            }}
          >
            Encontrá el regalo perfecto.
          </div>
          <div
            style={{
              fontSize: 36,
              opacity: 0.75,
              display: 'flex',
            }}
          >
            Ideas únicas para cada persona, ocasión y presupuesto.
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
