import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import type { ContentRecord } from './types'
import { fetchContentById } from './data'
import { useContentPurchase } from './useContentPurchase'
import { formatSol, shortenAddress } from '../../lib/solana'
import { runtimeConfig } from '../../lib/config'

export function ContentViewer() {
  const { contentId = '' } = useParams()
  const wallet = useWallet()
  const [content, setContent] = useState<ContentRecord | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { error: purchaseError, purchase, signedUrl, state } = useContentPurchase(content)

  useEffect(() => {
    let cancelled = false

    async function loadContent() {
      try {
        setLoading(true)
        const record = await fetchContentById(contentId)
        if (!cancelled) {
          setContent(record)
          setLoadError(record ? null : 'No content exists for this ID yet.')
        }
      } catch (caughtError) {
        if (!cancelled) {
          setLoadError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load content metadata.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadContent()

    return () => {
      cancelled = true
    }
  }, [contentId])

  return (
    <main className="page">
      <section className="page-header">
        <div className="eyebrow">Consumer viewer</div>
        <h1>Open the link, pay once, unlock instantly.</h1>
        <p>
          This route is the shared link experience. It loads metadata from Supabase, checks
          whether the connected wallet has already paid, and only reveals the full content
          after the purchase is confirmed.
        </p>
      </section>

      <section className="viewer-grid">
        <article className="viewer-card">
          {loading ? <div className="empty-state">Loading content metadata...</div> : null}

          {!loading && loadError ? <div className="notice error">{loadError}</div> : null}

          {!loading && content ? (
            <>
              <div className="viewer-topline">
                <div className={`tag ${state === 'unlocked' ? 'unlocked' : 'locked'}`}>
                  {state === 'unlocked' ? 'Unlocked' : 'Locked'}
                </div>
                <span className="mini-note">
                  Creator {shortenAddress(content.creator_wallet)}
                </span>
              </div>

              <div>
                <h2>{content.title}</h2>
                <p className="viewer-copy">
                  {content.description || 'No description was added for this content.'}
                </p>
              </div>

              <div className="metric-row">
                <article className="metric">
                  <span>Price</span>
                  <strong>{formatSol(content.price_lamports)}</strong>
                </article>
                <article className="metric">
                  <span>Wallet</span>
                  <strong>{wallet.connected ? 'Connected' : 'Not connected'}</strong>
                </article>
                <article className="metric">
                  <span>Program ID</span>
                  <strong>{runtimeConfig.programConfigured ? 'Configured' : 'Placeholder'}</strong>
                </article>
              </div>

              {state !== 'unlocked' ? (
                <div className="viewer-lock">
                  <h3>Preview</h3>
                  <p className="viewer-copy">
                    {content.preview_text || 'No preview text has been added yet.'}
                  </p>

                  {purchaseError ? <div className="notice error">{purchaseError}</div> : null}

                  <div className="hero-actions">
                    <button
                      className="button button-primary"
                      disabled={!wallet.connected || state === 'paying'}
                      onClick={purchase}
                    >
                      {state === 'paying' ? 'Confirming payment...' : `Pay ${formatSol(content.price_lamports)}`}
                    </button>
                    {!wallet.connected ? (
                      <span className="mini-note">
                        Connect Phantom before attempting payment.
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="viewer-unlocked">
                  <h3>Unlocked content</h3>
                  <p className="viewer-copy">
                    {content.body_markdown || 'No inline body was stored for this item.'}
                  </p>

                  {signedUrl ? (
                    <a
                      className="button button-secondary"
                      href={signedUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open private file
                    </a>
                  ) : null}
                </div>
              )}
            </>
          ) : null}
        </article>

        <aside className="content-panel">
          <div className="section-label">Viewer checklist</div>
          <h2>What this route proves in Week 1</h2>
          <ul className="feature-list">
            <li>Metadata lookup is keyed by shareable UUID, not wallet state.</li>
            <li>Purchase status is resolved per wallet before rendering unlocked content.</li>
            <li>Payment confirmation lands in Supabase for a stable demo-ready unlock flow.</li>
            <li>If a real program ID is configured, payment routes through `purchaseContent`.</li>
          </ul>

          <div className="config-grid">
            <div className="helper">
              Route: <span className="inline-code">/view/{contentId || ':contentId'}</span>
            </div>
            <div className="helper">
              Wallet: <span className="inline-code">{wallet.publicKey?.toBase58() || 'Not connected'}</span>
            </div>
            <div className="helper">
              Explorer confirmation is handled by the connected wallet transaction flow.
            </div>
          </div>

          <Link className="button button-secondary" to="/creator">
            Back to creator studio
          </Link>
        </aside>
      </section>
    </main>
  )
}
