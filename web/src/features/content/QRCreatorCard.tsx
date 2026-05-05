import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

type QRCreatorCardProps = {
  title: string
  url: string
}

export function QRCreatorCard({ title, url }: QRCreatorCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    QRCode.toCanvas(canvasRef.current, url, {
      width: 240,
      margin: 1,
      color: {
        dark: '#06131d',
        light: '#f5fbfa',
      },
    }).catch(() => {
      // The surrounding UI still provides the raw link if QR generation fails.
    })
  }, [url])

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  function downloadQr() {
    if (!canvasRef.current) {
      return
    }

    const link = document.createElement('a')
    link.href = canvasRef.current.toDataURL('image/png')
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'slick'}-qr.png`
    link.click()
  }

  return (
    <div className="qr-card">
      <div>
        <div className="section-label">QR unlock</div>
        <h3>Scan to open the paywall on mobile.</h3>
        <p className="viewer-copy">
          This is the fastest live-demo move: show the creator screen on a laptop, scan with a
          phone, connect Phantom mobile, and let the unlock happen on-device.
        </p>
      </div>

      <div className="qr-grid">
        <canvas aria-label="Shareable content QR code" ref={canvasRef} />
        <div className="qr-actions">
          <button className="button button-primary" onClick={downloadQr} type="button">
            Download QR
          </button>
          <button className="button button-secondary" onClick={copyLink} type="button">
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <a className="button button-secondary" href={url} rel="noreferrer" target="_blank">
            Open link
          </a>
          <p className="mini-note">
            Wallet fallback: if Phantom mobile is not installed, the link still opens in any
            mobile browser for a narrated backup demo.
          </p>
        </div>
      </div>
    </div>
  )
}
