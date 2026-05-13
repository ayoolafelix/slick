import { Link, Route, Routes } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { CreatorDashboard } from './features/content/CreatorDashboard'
import { featuredViewerPath } from './features/content/featured'
import { ContentViewer } from './features/content/ContentViewer'

function AppShell() {
  const productHighlights = [
    {
      label: 'Settlement',
      value: 'Instant SOL payment',
    },
    {
      label: 'Access',
      value: 'Wallet-held unlocks',
    },
    {
      label: 'Distribution',
      value: 'Share links and QR handoff',
    },
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">S</span>
          <div>
            <strong>Slick</strong>
            <span>Programmable monetization infrastructure on Solana</span>
          </div>
        </Link>

        <nav className="topnav">
          <Link to="/">Home</Link>
          <Link to="/creator">Creator Studio</Link>
          <Link to={featuredViewerPath}>Featured Release</Link>
        </nav>

        <WalletMultiButton className="wallet-button" />
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <main className="page">
              <section className="hero-panel">
                <div className="eyebrow">Wallet-native creator monetization</div>
                <h1>Sell digital access directly on Solana.</h1>
                <p className="lede">
                  Publish premium posts, gated files, and collectible access with instant
                  wallet payments, shareable links, QR distribution, and optional transferability.
                </p>

                <div className="hero-actions">
                  <Link className="button button-primary" to="/creator">
                    Start publishing
                  </Link>
                  <Link className="button button-secondary" to={featuredViewerPath}>
                    Open featured release
                  </Link>
                </div>
              </section>

              <section className="status-grid">
                {productHighlights.map((item) => (
                  <article className="status-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </section>

              <section className="split-grid">
                <article className="glass-card">
                  <div className="section-label">Creator workflow</div>
                  <h2>Publish once. Share anywhere.</h2>
                  <ul className="checklist">
                    <li>Create a release with pricing, preview copy, and full-access content.</li>
                    <li>Offer direct unlocks or a transferable access pass.</li>
                    <li>Share the release as a clean link or a mobile-ready QR code.</li>
                    <li>Track revenue and buyer activity from one creator workspace.</li>
                  </ul>
                </article>

                <article className="glass-card">
                  <div className="section-label">Access layer</div>
                  <h2>Turn payment into programmable ownership.</h2>
                  <p>
                    Slick combines direct wallet checkout with optional access passes, so paid
                    digital access can stay simple for one-time unlocks or become portable for
                    memberships, collector drops, and premium communities.
                  </p>
                </article>
              </section>

              <section className="timeline">
                <article>
                  <span>Publish</span>
                  <strong>Price a premium release</strong>
                  <p>Set a SOL price, write the preview, and define the full-access experience.</p>
                </article>
                <article>
                  <span>Distribute</span>
                  <strong>Share with links and QR</strong>
                  <p>Move smoothly from desktop creation to mobile discovery in a single scan.</p>
                </article>
                <article>
                  <span>Unlock</span>
                  <strong>Settle and grant access</strong>
                  <p>Let buyers pay from their wallet and reopen eligible releases through ownership.</p>
                </article>
              </section>
            </main>
          }
        />
        <Route path="/creator" element={<CreatorDashboard />} />
        <Route path="/view/:contentId" element={<ContentViewer />} />
      </Routes>
    </div>
  )
}

export default AppShell
