import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import type { ContentRecord } from './types'
import { fetchContentById } from './data'
import { featuredContent, featuredContentId } from './featured'
import { decodePortableContent } from './portable'
import { useContentPurchase } from './useContentPurchase'
import {
  explorerAddressUrl,
  explorerTxUrl,
  formatSol,
  formatUsdEstimate,
  shortenAddress,
} from '../../lib/solana'
import { useSolPrice } from '../../lib/useSolPrice'

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
    purchase: startPurchase,
    signedUrl,
    state,
    warning,
  } = useContentPurchase(content)
  const portablePayload = searchParams.get('payload')

  useEffect(() => {
    let cancelled = false

    async function loadContent() {
      if (portablePayload) {
        const portableRecord = decodePortableContent(portablePayload)
        setContent(portableRecord)
        setLoadError(portableRecord ? null : 'This release link could not be opened.')
        setLoading(false)
        return
      }

      if (contentId === featuredContentId) {
        setContent(featuredContent)
        setLoadError(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const record = await fetchContentById(contentId)
        if (!cancelled) {
          setContent(record)
          setLoadError(record ? null : 'This release could not be found.')
        }
      } catch (caughtError) {
        if (!cancelled) {
          setLoadError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load this release right now.',
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
  }, [contentId, portablePayload])

  return (
    <main className="page">
      <section className="page-header">
        <div className="eyebrow">Premium access</div>
        <h1>Unlock premium content with a wallet-native payment.</h1>
        <p>
          Connect a Solana wallet, confirm the purchase, and open the full release.
          Eligible drops can also issue a transferable access pass that stays with the holder.
        </p>
      </section>

      <section className="viewer-grid">
        <article className="viewer-card">
          {loading ? <div className="empty-state">Loading release...</div> : null}

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
                  {content.description || 'Premium content with wallet-based access.'}
                </p>
              </div>

              <div className="metric-row">
                <article className="metric">
                  <span>Price</span>
                  <strong>{formatSol(content.price_lamports)}</strong>
                  <small>
                    {formatUsdEstimate(content.price_lamports, solPriceUsd) || 'USD estimate loading'}
                  </small>
                </article>
                <article className="metric">
                  <span>Wallet</span>
                  <strong>{wallet.connected ? 'Connected' : 'Not connected'}</strong>
                  <small>
                    {wallet.publicKey
                      ? shortenAddress(wallet.publicKey.toBase58())
                      : 'Use Phantom or Backpack'}
                  </small>
                </article>
                <article className="metric">
                  <span>Access</span>
                  <strong>{content.access_model === 'nft' ? 'Transferable pass' : 'Direct unlock'}</strong>
                  <small>Settles on Solana</small>
                </article>
              </div>

              {state !== 'unlocked' ? (
                <div className="viewer-lock">
                  <h3>Preview</h3>
                  <p className="viewer-copy">
                    {content.preview_text || 'A preview is not available for this release.'}
                  </p>

                  {purchaseError ? <div className="notice error">{purchaseError}</div> : null}
                  {warning ? <div className="notice warning">{warning}</div> : null}

                  {content.access_model === 'nft' ? (
                    <div className="helper">
                      This release can issue an access pass after payment, so eligibility can
                      travel with the wallet that holds it.
                    </div>
                  ) : null}

                  <div className="hero-actions">
                    <button
                      className="button button-primary"
                      disabled={!wallet.connected || state === 'paying' || state === 'minting'}
                      onClick={startPurchase}
                    >
                      {state === 'paying'
                        ? 'Confirming payment...'
                        : state === 'minting'
                          ? 'Creating access pass...'
                          : `Pay ${formatSol(content.price_lamports)}`}
                    </button>
                    {!wallet.connected ? (
                      <span className="mini-note">
                        Connect a wallet to continue.
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="viewer-unlocked">
                  <h3>Full release</h3>
                  {warning ? <div className="notice warning">{warning}</div> : null}
                  <p className="viewer-copy">
                    {content.body_markdown || 'The release body is not available.'}
                  </p>

                  <div className="unlock-meta">
                    {paymentSignature ? (
                      <a
                        className="button button-secondary"
                        href={explorerTxUrl(paymentSignature)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View payment
                      </a>
                    ) : null}
                    <a
                      className="button button-secondary"
                      href={explorerAddressUrl(content.creator_wallet)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View creator
                    </a>
                  </div>

                  {content.access_model === 'nft' ? (
                    <div className="access-pass-card">
                      <div>
                        <div className="section-label">Access pass</div>
                        <h3>
                          {accessPass ? 'Access is now wallet-held.' : 'Create the access pass.'}
                        </h3>
                        <p className="viewer-copy">
                          {accessPass
                            ? 'This wallet now holds the transferable unlock for this release.'
                            : 'Minting the pass turns this purchase into a transferable access asset.'}
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
                            View access pass
                          </a>
                        </div>
                      ) : (
                        <div className="hero-actions">
                          <button className="button button-primary" onClick={mintAccessPass}>
                            Create access pass
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
          <div className="section-label">Access details</div>
          <h2>How unlocks work</h2>
          <ul className="feature-list">
            <li>Every release has a dedicated payment route and pricing state.</li>
            <li>Purchases unlock immediately after transaction confirmation.</li>
            <li>NFT-backed drops can be reopened by the wallet that holds the access pass.</li>
            <li>Explorer-backed verification stays available for every completed payment.</li>
          </ul>

          <div className="config-grid">
            <div className="helper">
              Release: <span className="inline-code">{content?.title || 'Loading'}</span>
            </div>
            <div className="helper">
              Buyer: <span className="inline-code">{wallet.publicKey?.toBase58() || 'Not connected'}</span>
            </div>
            <div className="helper">
              {paymentSignature || state === 'unlocked'
                ? 'Purchase recognized for this wallet.'
                : content?.access_model === 'nft'
                  ? 'Eligible wallets can reopen this release through pass ownership.'
                  : 'Access is granted after payment confirmation.'}
            </div>
          </div>

          <Link className="button button-secondary" to="/creator">
            Open creator studio
          </Link>
        </aside>
      </section>
    </main>
  )
}
