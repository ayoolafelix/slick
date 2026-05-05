import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import type { ContentRecord } from './types'
import { fetchContentById } from './data'
import { decodePortableContent } from './portable'
import { useContentPurchase } from './useContentPurchase'
import {
  explorerAddressUrl,
  explorerTxUrl,
  formatSol,
  formatUsdEstimate,
  shortenAddress,
} from '../../lib/solana'
import { runtimeConfig } from '../../lib/config'
import { useSolPrice } from '../../lib/useSolPrice'

const demoContentId = 'demo-content-id'
const demoContent: ContentRecord = {
  id: demoContentId,
  creator_wallet: '11111111111111111111111111111111',
  title: 'Programmable monetization demo drop',
  description:
    'A sample unlock flow that lets you inspect the hosted experience before the backend project is fully provisioned.',
  preview_text:
    'This demo preview stays public so anyone can inspect the paywall shell, wallet hooks, and unlock UX without touching live records.',
  body_markdown:
    'Week 1 ships the thin edge of the wedge: a creator publishes an asset, a buyer pays once, and the app swaps the preview for the full experience. The live Supabase project still needs the SQL migration before public records can be written.',
  storage_bucket: null,
  storage_path: null,
  content_hash: 'demo-content-hash',
  chain_content_pda: null,
  price_lamports: 250_000_000,
  access_model: 'nft',
  created_at: '2026-04-27T00:00:00.000Z',
}

export function ContentViewer() {
  const { contentId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const wallet = useWallet()
  const solPriceUsd = useSolPrice()
  const [content, setContent] = useState<ContentRecord | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const {
    accessPass,
    error: purchaseError,
    mintAccessPass,
    paymentSignature,
    purchase,
    signedUrl,
    state,
    warning,
  } = useContentPurchase(content)
  const isDemoRoute = contentId === demoContentId
  const portablePayload = searchParams.get('payload')
  const isPortableRoute = Boolean(portablePayload)

  useEffect(() => {
    let cancelled = false

    async function loadContent() {
      if (portablePayload) {
        const portableRecord = decodePortableContent(portablePayload)
        setContent(portableRecord)
        setLoadError(
          portableRecord ? null : 'This portable link is invalid or was truncated in transit.',
        )
        setLoading(false)
        return
      }

      if (isDemoRoute) {
        setContent(demoContent)
        setLoadError(null)
        setLoading(false)
        return
      }

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
  }, [contentId, isDemoRoute, portablePayload])

  return (
    <main className="page">
      <section className="page-header">
        <div className="eyebrow">Consumer viewer</div>
        <h1>Open the link. Pay in SOL. Keep the unlock.</h1>
        <p>
          This route is the buyer story in one screen: fetch the content, price it in SOL,
          complete the payment, and optionally mint a transferable access pass that another
          wallet can later use to unlock the same drop.
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
                  <small>
                    {formatUsdEstimate(content.price_lamports, solPriceUsd) || 'USD quote loading'}
                  </small>
                </article>
                <article className="metric">
                  <span>Wallet</span>
                  <strong>{wallet.connected ? 'Connected' : 'Not connected'}</strong>
                  <small>{wallet.publicKey ? shortenAddress(wallet.publicKey.toBase58()) : 'Phantom or Backpack'}</small>
                </article>
                <article className="metric">
                  <span>Unlock model</span>
                  <strong>{content.access_model === 'nft' ? 'Access pass' : 'Direct unlock'}</strong>
                  <small>{runtimeConfig.solanaNetwork}</small>
                </article>
              </div>

              {isDemoRoute ? (
                <div className="notice">
                  This demo route is powered by sample content so the hosted app stays explorable
                  while the real Supabase tables and storage policies are being applied.
                </div>
              ) : null}

              {isPortableRoute ? (
                <div className="notice">
                  This drop was packaged directly into the URL so the demo can stay shareable
                  before hosted Supabase tables are live. NFT-backed access still verifies from
                  the chain after payment.
                </div>
              ) : null}

              {state !== 'unlocked' ? (
                <div className="viewer-lock">
                  <h3>Preview</h3>
                  <p className="viewer-copy">
                    {content.preview_text || 'No preview text has been added yet.'}
                  </p>

                  {purchaseError ? <div className="notice error">{purchaseError}</div> : null}
                  {warning ? <div className="notice warning">{warning}</div> : null}

                  {content.access_model === 'nft' ? (
                    <div className="helper">
                      After payment, this drop mints a transferable access pass to the buyer
                      wallet. Whoever holds that NFT can unlock the content later.
                    </div>
                  ) : null}

                  {isDemoRoute ? (
                    <div className="hero-actions">
                      <span className="mini-note">
                        The live payment button will activate after the hosted Supabase schema and
                        devnet program are available.
                      </span>
                    </div>
                  ) : (
                    <div className="hero-actions">
                      <button
                        className="button button-primary"
                        disabled={!wallet.connected || state === 'paying' || state === 'minting'}
                        onClick={purchase}
                      >
                        {state === 'paying'
                          ? 'Confirming payment...'
                          : state === 'minting'
                            ? 'Minting access pass...'
                          : `Pay ${formatSol(content.price_lamports)}`}
                      </button>
                      {!wallet.connected ? (
                        <span className="mini-note">
                          Connect Phantom before attempting payment.
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : (
                <div className="viewer-unlocked">
                  <h3>Unlocked content</h3>
                  {warning ? <div className="notice warning">{warning}</div> : null}
                  <p className="viewer-copy">
                    {content.body_markdown || 'No inline body was stored for this item.'}
                  </p>

                  <div className="unlock-meta">
                    {paymentSignature ? (
                      <a
                        className="button button-secondary"
                        href={explorerTxUrl(paymentSignature)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View payment on Explorer
                      </a>
                    ) : null}
                    <a
                      className="button button-secondary"
                      href={explorerAddressUrl(content.creator_wallet)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View creator wallet
                    </a>
                  </div>

                  {content.access_model === 'nft' ? (
                    <div className="access-pass-card">
                      <div>
                        <div className="section-label">Access pass</div>
                        <h3>
                          {accessPass ? 'Transferable access is live.' : 'Mint the access pass.'}
                        </h3>
                        <p className="viewer-copy">
                          {accessPass
                            ? 'This wallet holds the NFT-backed unlock. Transfer it and the new holder gets access.'
                            : 'Payment already succeeded. Minting the pass turns this unlock into a transferable Solana asset.'}
                        </p>
                      </div>

                      {accessPass ? (
                        <div className="config-grid">
                          <div className="helper">
                            Mint: <span className="inline-code">{accessPass.mintAddress}</span>
                          </div>
                          <a
                            className="button button-secondary"
                            href={explorerAddressUrl(accessPass.mintAddress)}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View NFT mint
                          </a>
                        </div>
                      ) : (
                        <div className="hero-actions">
                          <button className="button button-primary" onClick={mintAccessPass}>
                            Mint access pass
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

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
          <h2>What this route proves in the 48-hour version</h2>
          <ul className="feature-list">
            <li>Metadata lookup is keyed by shareable UUID, not wallet state.</li>
            <li>Portable links keep the live demo moving even while backend migrations are pending.</li>
            <li>Payment confirmation unlocks immediately, even if off-chain bookkeeping lags.</li>
            <li>NFT-backed drops can be reopened by any wallet that holds the access pass.</li>
            <li>Explorer links make the demo resilient if a judge asks for verification.</li>
          </ul>

          <div className="config-grid">
            <div className="helper">
              Route: <span className="inline-code">/view/{contentId || ':contentId'}</span>
            </div>
            <div className="helper">
              Wallet: <span className="inline-code">{wallet.publicKey?.toBase58() || 'Not connected'}</span>
            </div>
            <div className="helper">
              {content?.access_model === 'nft'
                ? 'This unlock can be transferred by moving the access pass NFT.'
                : 'This unlock is tied to the original buyer purchase record.'}
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
