import { Link, Route, Routes } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useState } from 'react'
import { CreatorDashboard } from './features/content/CreatorDashboard'
import { ContentViewer } from './features/content/ContentViewer'
import { hasAppConfig, runtimeConfig } from './lib/config'

function AppShell() {
  const wallet = useWallet()
  const [copied, setCopied] = useState(false)
  const exampleViewerRoute = '/view/demo-content-id'
  const appHealth = [
    {
      label: 'Wallet',
      value: wallet.connected ? 'Connected' : 'Ready',
    },
    {
      label: 'Supabase',
      value: runtimeConfig.supabaseConfigured ? 'Configured' : 'Needs env',
    },
    {
      label: 'Program',
      value: runtimeConfig.programConfigured ? 'Configured' : 'Placeholder ID',
    },
  ]

  async function copyEnvChecklist() {
    await navigator.clipboard.writeText(
      'VITE_SOLANA_NETWORK=devnet\nVITE_MONETIZATION_PROGRAM_ID=\nVITE_SUPABASE_URL=\nVITE_SUPABASE_ANON_KEY=\nVITE_SUPABASE_PUBLISHABLE_KEY=\n',
    )
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

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
          <Link to="/">Overview</Link>
          <Link to="/creator">Creator Studio</Link>
          <Link to={exampleViewerRoute}>Viewer</Link>
        </nav>

        <WalletMultiButton className="wallet-button" />
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <main className="page">
              <section className="hero-panel">
                <div className="eyebrow">48-hour launch mode</div>
                <h1>A creator sets a price. A buyer pays. Access becomes programmable.</h1>
                <p className="lede">
                  The sprint plan is now compressed into one ruthless path: solid pay-to-unlock
                  core flow, NFT-backed access for the wow moment, QR handoff for the live demo,
                  and a product story that feels bigger than a single app.
                </p>

                <div className="hero-actions">
                  <Link className="button button-primary" to="/creator">
                    Launch creator flow
                  </Link>
                  <Link className="button button-secondary" to={exampleViewerRoute}>
                    Open buyer story
                  </Link>
                </div>
              </section>

              <section className="status-grid">
                {appHealth.map((item) => (
                  <article className="status-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </section>

              <section className="split-grid">
                <article className="glass-card">
                  <div className="section-label">Core flow</div>
                  <h2>Money moves the moment content unlocks.</h2>
                  <ul className="checklist">
                    <li>Creator publishes a paid link with optional private storage.</li>
                    <li>Buyer opens the route, connects a wallet, and pays in SOL.</li>
                    <li>Unlock survives partial backend lag because payment is treated as the source of truth.</li>
                    <li>The app surfaces Explorer verification so judges can see the transaction immediately.</li>
                  </ul>
                </article>

                <article className="glass-card">
                  <div className="section-label">Wow + edge</div>
                  <h2>Transferable access pass. Mobile QR handoff.</h2>
                  <p>
                    The differentiators are deliberately practical: NFT-backed access so the
                    unlock can move between wallets, and QR-based mobile entry so the demo can
                    jump from laptop to phone in one scan.
                  </p>
                  <div className="inline-actions">
                    <button className="button button-secondary" onClick={copyEnvChecklist}>
                      {copied ? 'Copied' : 'Copy env template'}
                    </button>
                    <span className="mini-note">
                      {hasAppConfig
                        ? 'Runtime config is loaded.'
                        : 'The UI still loads without envs, but persistence will be blocked.'}
                    </span>
                  </div>
                </article>
              </section>

              <section className="timeline">
                <article>
                  <span>Hour 0-12</span>
                  <strong>Core paywall stabilized</strong>
                  <p>Wallet, content creation, payment, unlock, and fallback paths all hold together.</p>
                </article>
                <article>
                  <span>Hour 12-30</span>
                  <strong>Access pass + QR moment</strong>
                  <p>NFT-backed unlock and mobile scan flow become the demo differentiators.</p>
                </article>
                <article>
                  <span>Hour 30-48</span>
                  <strong>Pitch packaging</strong>
                  <p>Copy, screenshots, deck story, demo script, and rehearsal assets get locked.</p>
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
