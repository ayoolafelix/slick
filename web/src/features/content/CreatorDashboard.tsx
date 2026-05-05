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
        const portableRecords = listPortableShares(wallet.publicKey!.toBase58()).map(
          (share) => share.record,
        )
        const data = runtimeConfig.supabaseConfigured
          ? await listCreatorContent(wallet.publicKey!.toBase58())
          : []

        if (!cancelled) {
          setRecords(mergeContentRecords(portableRecords, data))
        }

        const allIds = [...portableRecords, ...data].map((record) => record.id)
        const purchaseData = runtimeConfig.supabaseConfigured
          ? await listPurchasesForContentIds(allIds)
          : []
        const localPurchases = listLocalPurchasesForContentIds(allIds)

        if (!cancelled) {
          setPurchases(mergePurchases(purchaseData, localPurchases))
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load creator content.',
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
  const portableShareMap = new Map(
    listPortableShares(wallet.publicKey?.toBase58()).map((share) => [
      share.record.id,
      share.shareUrl,
    ]),
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!wallet.publicKey) {
      setError('Connect Phantom before creating content.')
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
          : 'Unable to create a new content record.'

      if (shouldOfferPortableMode(message) && !file) {
        try {
          const portableRecord = buildPortableContentRecord({
            ...baseInput,
            contentHash: baseInput.contentHash || `portable-${Date.now()}`,
          })
          const portableUrl = buildPortableShareUrl(portableRecord)
          savePortableShare({
            record: portableRecord,
            shareUrl: portableUrl,
          })

          setRecords((current) => mergeContentRecords([portableRecord], current))
          setLastCreatedRecord(portableRecord)
          setForm(initialForm)
          setFile(null)
          setSuccess(portableUrl)
          setWarning(
            'Supabase is still missing the monetization tables, so this drop was packaged as a portable demo link. NFT-backed access will still reopen anywhere because ownership is checked on-chain.',
          )
          setError(null)
          return
        } catch (portableError) {
          setError(
            portableError instanceof Error
              ? portableError.message
              : 'Portable demo mode could not package this link.',
          )
          return
        }
      }

      if (shouldOfferPortableMode(message) && file) {
        setError(
          'Supabase is not ready for private-file uploads yet. Remove the file for a portable text demo, or apply the Supabase migrations first.',
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
        <h1>Set the price. Ship the link. Let money move on unlock.</h1>
        <p>
          This is the compressed control center for the next 48 hours: create the paid
          content, choose whether access is wallet-only or NFT-backed, and generate a QR
          code that makes the live demo feel instant on mobile.
        </p>

        <div className="metric-row">
          <article className="metric">
            <span>Total earned</span>
            <strong>{formatSol(totalEarnedLamports)}</strong>
            <small>{formatUsdEstimate(totalEarnedLamports, solPriceUsd) || 'USD quote loading'}</small>
          </article>
          <article className="metric">
            <span>Total buyers</span>
            <strong>{uniqueBuyerCount}</strong>
            <small>{wallet.publicKey ? 'Unique purchasing wallets' : 'Connect to load stats'}</small>
          </article>
          <article className="metric">
            <span>Access passes</span>
            <strong>{mintedPassCount}</strong>
            <small>{runtimeConfig.solanaNetwork} access NFTs minted</small>
          </article>
        </div>

        {!runtimeConfig.supabaseConfigured ? (
          <div className="notice warning">
            Supabase env is missing. The studio can still create portable text-only demo links,
            but private-file uploads and hosted purchase records need{' '}
            <span className="inline-code">VITE_SUPABASE_URL</span> plus a client key.
          </div>
        ) : null}

        {!runtimeConfig.programConfigured ? (
          <div className="notice warning">
            The frontend still creates the off-chain record, but the on-chain PDA will stay
            blank until you replace the placeholder{' '}
            <span className="inline-code">VITE_MONETIZATION_PROGRAM_ID</span>.
          </div>
        ) : null}

        {runtimeConfig.programConfigured ? (
          <div className="notice">
            The current contract keeps the on-chain layer intentionally thin: one content PDA
            per creator, direct SOL transfer, and optional NFT access passes layered on top for
            the wow moment.
          </div>
        ) : null}
      </section>

      <section className="composer-card">
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Token-gated teardown of my growth stack"
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
              placeholder="Tell the consumer what they are buying."
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
                placeholder="This is what non-paying viewers can read."
              />
            </div>

            <div className="field-group">
              <label htmlFor="body">Unlocked body</label>
              <textarea
                id="body"
                value={form.bodyMarkdown}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bodyMarkdown: event.target.value }))
                }
                placeholder="Paste text content here for the fastest Week 1 demo."
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
                  : 'SOL settles fastest. USD reference loads when the market quote returns.'}
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
                <span>Fastest path. Buyer pays once and unlocks immediately.</span>
              </button>
              <button
                className={`choice-card ${form.accessModel === 'nft' ? 'selected' : ''}`}
                onClick={() => setForm((current) => ({ ...current, accessModel: 'nft' }))}
                type="button"
              >
                <strong>Transferable access pass</strong>
                <span>Buyer mints a wallet-held NFT after payment. Great for the demo story.</span>
              </button>
            </div>
          </div>

          <div className="helper">
            Use inline text for the fastest unlock demo. Add a file when you are ready to
            show signed URLs and private storage as part of the creator story.
          </div>

          {error ? <div className="notice error">{error}</div> : null}
          {warning ? <div className="notice warning">{warning}</div> : null}
          {success ? (
            <div className="notice">
              Shareable link created:
              <br />
              <span className="inline-code">{success}</span>
            </div>
          ) : null}

          <div className="hero-actions">
            <button className="button button-primary" disabled={submitting} type="submit">
              {submitting ? 'Publishing link...' : 'Create monetized link'}
            </button>
            <Link className="button button-secondary" to="/">
              Back to overview
            </Link>
          </div>
        </form>
      </section>

      {success && lastCreatedRecord ? (
        <QRCreatorCard title={lastCreatedRecord.title} url={success} />
      ) : null}

      <section className="content-panel">
        <div className="section-label">Creator records</div>
        <h2>Your monetized drops</h2>
        <p className="viewer-copy">
          Each row becomes a shareable paywall. QR is the room-friendly entry point. Access
          pass is the technical flex. The live demo only needs one flow that never breaks.
        </p>

        {loadingRecords ? <div className="empty-state">Loading creator content...</div> : null}

        {!loadingRecords && visibleRecords.length === 0 ? (
          <div className="empty-state">
            No content has been created yet. Publish one record to start testing the paywall.
          </div>
        ) : null}

        <div className="record-list">
          {visibleRecords.map((record) => (
            <article className="record-card" key={record.id}>
              <header>
                <div>
                  <h3>{record.title}</h3>
                  <p>{record.description || 'No description yet.'}</p>
                </div>
                <Link
                  className="button button-secondary"
                  to={
                    portableShareMap.get(record.id)?.replace(window.location.origin, '') ||
                    `/view/${record.id}`
                  }
                >
                  Open viewer
                </Link>
              </header>

              <div className="record-meta">
                <span>{formatSol(record.price_lamports)}</span>
                <span>{record.access_model === 'nft' ? 'NFT access pass' : 'Direct unlock'}</span>
                <span className="mono">{record.id}</span>
              </div>

              <QRCreatorCard
                title={record.title}
                url={portableShareMap.get(record.id) || `${window.location.origin}/view/${record.id}`}
              />
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
