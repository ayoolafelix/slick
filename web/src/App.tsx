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
                <div className="eyebrow">Week 1 foundation</div>
                <h1>A creator sets a price. A consumer pays in SOL. Content unlocks.</h1>
                <p className="lede">
                  This starter focuses on the only flow that matters in the first sprint:
                  upload content, set a price, share a link, pay, unlock.
                </p>

                <div className="hero-actions">
                  <Link className="button button-primary" to="/creator">
                    Start creator flow
                  </Link>
                  <Link className="button button-secondary" to={exampleViewerRoute}>
                    Open viewer shell
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
                  <h2>Ship the paywall before the wow feature.</h2>
                  <ul className="checklist">
                    <li>Creator stores metadata in Supabase and prepares the content PDA.</li>
                    <li>Viewer checks purchase status before revealing content.</li>
                    <li>Consumer pays directly on devnet while the program client is being wired.</li>
                    <li>Transaction signature lands in Supabase for instant unlock UX.</li>
                  </ul>
                </article>

                <article className="glass-card">
                  <div className="section-label">Configuration</div>
                  <h2>Use one env file to unblock the whole sprint.</h2>
                  <p>
                    The frontend is wired for devnet, Supabase, and a deployed Anchor program.
                    Keep those values centralized so the demo does not drift from the code.
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
                  <span>Day 1-2</span>
                  <strong>Wallet + Supabase foundation</strong>
                  <p>Connect Phantom, create tables, and prove content rows can be written.</p>
                </article>
                <article>
                  <span>Day 3-4</span>
                  <strong>Anchor program deploy</strong>
                  <p>Register creator pricing on devnet and persist the content PDA.</p>
                </article>
                <article>
                  <span>Day 5-7</span>
                  <strong>Pay and unlock loop</strong>
                  <p>Confirm the transaction, record the signature, and reveal the content.</p>
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
