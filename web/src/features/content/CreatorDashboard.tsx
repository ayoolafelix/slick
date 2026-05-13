import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import type { AccessModel, ContentRecord, PurchaseRecord } from './types'
import {
  createContentRecord,
  listCreatorContent,
  listPurchasesForContentIds,
  shouldOfferPortableMode,
} from './data'
import {
  buildPortableContentRecord,
  buildPortableShareUrl,
  listLocalPurchasesForContentIds,
  listPortableShares,
  mergeContentRecords,
  savePortableShare,
} from './portable'
import { runtimeConfig } from '../../lib/config'
import { digestContent, formatSol, formatUsdEstimate, toLamports } from '../../lib/solana'
import { registerContentOnChain } from '../../lib/monetizationProgram'
import { useSolPrice } from '../../lib/useSolPrice'
import { QRCreatorCard } from './QRCreatorCard'

const initialForm = {
  title: '',
  description: '',
  previewText: '',
  bodyMarkdown: '',
  priceSol: '0.05',
  accessModel: 'nft' as AccessModel,
}

function mergePurchases(...groups: PurchaseRecord[][]) {
  const byBuyerAndContent = new Map<string, PurchaseRecord>()

  groups.flat().forEach((purchase) => {
    byBuyerAndContent.set(
      `${purchase.content_id}:${purchase.buyer_pubkey}`,
      purchase,
    )
  })

  return [...byBuyerAndContent.values()]
}

function formatCreatedDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function CreatorDashboard() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const solPriceUsd = useSolPrice()
  const [form, setForm] = useState(initialForm)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastCreatedRecord, setLastCreatedRecord] = useState<ContentRecord | null>(null)
  const [records, setRecords] = useState<ContentRecord[]>([])
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)

  useEffect(() => {
    if (!wallet.publicKey) {
      return
    }

    let cancelled = false

    async function loadRecords() {
      try {
        setLoadingRecords(true)
        const linkBasedRecords = listPortableShares(wallet.publicKey!.toBase58()).map(
          (share) => share.record,
        )
        const syncedRecords = runtimeConfig.supabaseConfigured
          ? await listCreatorContent(wallet.publicKey!.toBase58())
          : []

        if (!cancelled) {
          setRecords(mergeContentRecords(linkBasedRecords, syncedRecords))
        }

        const allIds = [...linkBasedRecords, ...syncedRecords].map((record) => record.id)
        const syncedPurchases = runtimeConfig.supabaseConfigured
          ? await listPurchasesForContentIds(allIds)
          : []
        const localPurchases = listLocalPurchasesForContentIds(allIds)

        if (!cancelled) {
          setPurchases(mergePurchases(syncedPurchases, localPurchases))
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load your releases.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingRecords(false)
        }
      }
    }

    loadRecords()

    return () => {
      cancelled = true
    }
  }, [wallet.publicKey])

  const visibleRecords = wallet.publicKey ? records : []
  const totalEarnedLamports = purchases.reduce((sum, purchase) => {
    const content = records.find((record) => record.id === purchase.content_id)
    return sum + (content?.price_lamports ?? 0)
  }, 0)
  const uniqueBuyerCount = new Set(purchases.map((purchase) => purchase.buyer_pubkey)).size
  const mintedPassCount = purchases.filter((purchase) => purchase.access_nft_mint).length
  const shareLinkMap = new Map(
    listPortableShares(wallet.publicKey?.toBase58()).map((share) => [
      share.record.id,
      share.shareUrl,
    ]),
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!wallet.publicKey) {
      setError('Connect a wallet before publishing.')
      return
    }

    const priceLamports = toLamports(form.priceSol)
    if (!Number.isFinite(priceLamports) || priceLamports <= 0) {
      setError('Enter a valid positive price in SOL.')
      return
    }

    const baseInput = {
      creatorWallet: wallet.publicKey.toBase58(),
      title: form.title,
      description: form.description,
      previewText: form.previewText,
      bodyMarkdown: form.bodyMarkdown,
      priceLamports,
      contentHash: '',
      chainContentPda: null as string | null,
      accessModel: form.accessModel,
    }

    try {
      setSubmitting(true)
      setError(null)
      setWarning(null)
      setSuccess(null)

      const contentHash = await digestContent(
        file ? await file.arrayBuffer() : form.bodyMarkdown || form.previewText,
      )
      const chainContentPda = runtimeConfig.programConfigured
        ? await registerContentOnChain({
            wallet,
            connection,
            creatorWallet: wallet.publicKey.toBase58(),
            priceLamports,
            contentHash,
          })
        : null

      baseInput.contentHash = contentHash
      baseInput.chainContentPda = chainContentPda

      const record = await createContentRecord({
        ...baseInput,
        file,
      })

      setRecords((current) => mergeContentRecords([record], current))
      setLastCreatedRecord(record)
      setForm(initialForm)
      setFile(null)
      setSuccess(`${window.location.origin}/view/${record.id}`)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to publish this release.'

      if (shouldOfferPortableMode(message) && !file) {
        try {
          const linkBasedRecord = buildPortableContentRecord({
            ...baseInput,
            contentHash: baseInput.contentHash || `portable-${Date.now()}`,
          })
          const shareUrl = buildPortableShareUrl(linkBasedRecord)
          savePortableShare({
            record: linkBasedRecord,
            shareUrl,
          })

          setRecords((current) => mergeContentRecords([linkBasedRecord], current))
          setLastCreatedRecord(linkBasedRecord)
          setForm(initialForm)
          setFile(null)
          setSuccess(shareUrl)
          setWarning(
            form.accessModel === 'nft'
              ? 'Share-ready link created. Buyers can unlock and hold access from the same wallet.'
              : 'Share-ready link created. Buyers can unlock instantly from the shared link.',
          )
          setError(null)
          return
        } catch (linkError) {
          setError(
            linkError instanceof Error
              ? linkError.message
              : 'Unable to package this release for sharing.',
          )
          return
        }
      }

      if (shouldOfferPortableMode(message) && file) {
        setError(
          'Private file delivery is not available for this release yet. Publish as text only or reconnect storage first.',
        )
        return
      }

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="content-layout">
      <section className="page-header">
        <div className="eyebrow">Creator studio</div>
        <h1>Create a premium release in minutes.</h1>
        <p>
          Set a price, choose the access model, publish text or gated files, and
          distribute through clean links and QR-ready sharing.
        </p>

        <div className="metric-row">
          <article className="metric">
            <span>Total earned</span>
            <strong>{formatSol(totalEarnedLamports)}</strong>
            <small>{formatUsdEstimate(totalEarnedLamports, solPriceUsd) || 'USD estimate loading'}</small>
          </article>
          <article className="metric">
            <span>Buyers</span>
            <strong>{uniqueBuyerCount}</strong>
            <small>{wallet.publicKey ? 'Unique purchasing wallets' : 'Connect to load activity'}</small>
          </article>
          <article className="metric">
            <span>Access passes</span>
            <strong>{mintedPassCount}</strong>
            <small>Issued to eligible buyers</small>
          </article>
        </div>
      </section>

      <section className="composer-card">
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Creator Revenue Playbook"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Summarize the value of this release in one clear sentence."
            />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="preview">Preview text</label>
              <textarea
                id="preview"
                value={form.previewText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, previewText: event.target.value }))
                }
                placeholder="What should non-buyers see before they unlock?"
              />
            </div>

            <div className="field-group">
              <label htmlFor="body">Full-access content</label>
              <textarea
                id="body"
                value={form.bodyMarkdown}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bodyMarkdown: event.target.value }))
                }
                placeholder="Write the premium content buyers receive after payment."
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="price">Price in SOL</label>
              <input
                id="price"
                type="number"
                min="0.001"
                step="0.001"
                value={form.priceSol}
                onChange={(event) =>
                  setForm((current) => ({ ...current, priceSol: event.target.value }))
                }
                required
              />
              <div className="helper">
                {formatUsdEstimate(toLamports(form.priceSol), solPriceUsd)
                  ? `Approx. ${formatUsdEstimate(toLamports(form.priceSol), solPriceUsd)}`
                  : 'Pricing reference updates automatically when the market quote returns.'}
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="file">Optional private file</label>
              <input
                id="file"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="field-group">
            <label>Access model</label>
            <div className="choice-grid">
              <button
                className={`choice-card ${form.accessModel === 'standard' ? 'selected' : ''}`}
                onClick={() => setForm((current) => ({ ...current, accessModel: 'standard' }))}
                type="button"
              >
                <strong>Direct unlock</strong>
                <span>Buy once and open instantly from the paying wallet.</span>
              </button>
              <button
                className={`choice-card ${form.accessModel === 'nft' ? 'selected' : ''}`}
                onClick={() => setForm((current) => ({ ...current, accessModel: 'nft' }))}
                type="button"
              >
                <strong>Transferable access pass</strong>
                <span>Issue a wallet-held pass after payment for portable access.</span>
              </button>
            </div>
          </div>

          <div className="helper">
            Inline content publishes fastest. Add a private file when you want gated downloads
            or deliverables behind the purchase link.
          </div>

          {error ? <div className="notice error">{error}</div> : null}
          {warning ? <div className="notice warning">{warning}</div> : null}
          {success ? (
            <div className="notice">
              Share link created:
              <br />
              <span className="inline-code">{success}</span>
            </div>
          ) : null}

          <div className="hero-actions">
            <button className="button button-primary" disabled={submitting} type="submit">
              {submitting ? 'Publishing...' : 'Publish release'}
            </button>
            <Link className="button button-secondary" to="/">
              Back home
            </Link>
          </div>
        </form>
      </section>

      {success && lastCreatedRecord ? (
        <QRCreatorCard title={lastCreatedRecord.title} url={success} />
      ) : null}

      <section className="content-panel">
        <div className="section-label">Published releases</div>
        <h2>Your catalog</h2>
        <p className="viewer-copy">
          Every release gets a dedicated access route, a share link, and mobile-ready QR distribution.
        </p>

        {loadingRecords ? <div className="empty-state">Loading releases...</div> : null}

        {!loadingRecords && visibleRecords.length === 0 ? (
          <div className="empty-state">
            Your first premium release will appear here once it is published.
          </div>
        ) : null}

        <div className="record-list">
          {visibleRecords.map((record) => (
            <article className="record-card" key={record.id}>
              <header>
                <div>
                  <h3>{record.title}</h3>
                  <p>{record.description || 'Premium content with wallet-based access.'}</p>
                </div>
                <Link
                  className="button button-secondary"
                  to={
                    shareLinkMap.get(record.id)?.replace(window.location.origin, '') ||
                    `/view/${record.id}`
                  }
                >
                  Open release
                </Link>
              </header>

              <div className="record-meta">
                <span>{formatSol(record.price_lamports)}</span>
                <span>{record.access_model === 'nft' ? 'Transferable access' : 'Direct unlock'}</span>
                <span>{formatCreatedDate(record.created_at)}</span>
              </div>

              <QRCreatorCard
                title={record.title}
                url={shareLinkMap.get(record.id) || `${window.location.origin}/view/${record.id}`}
              />
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
