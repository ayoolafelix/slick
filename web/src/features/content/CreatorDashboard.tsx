import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import type { ContentRecord } from './types'
import { createContentRecord, listCreatorContent } from './data'
import { runtimeConfig } from '../../lib/config'
import { digestContent, formatSol, toLamports } from '../../lib/solana'
import { registerContentOnChain } from '../../lib/monetizationProgram'

const initialForm = {
  title: '',
  description: '',
  previewText: '',
  bodyMarkdown: '',
  priceSol: '0.05',
}

export function CreatorDashboard() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [form, setForm] = useState(initialForm)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [records, setRecords] = useState<ContentRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)

  useEffect(() => {
    if (!wallet.publicKey || !runtimeConfig.supabaseConfigured) {
      return
    }

    let cancelled = false

    async function loadRecords() {
      try {
        setLoadingRecords(true)
        const data = await listCreatorContent(wallet.publicKey!.toBase58())
        if (!cancelled) {
          setRecords(data)
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

    try {
      setSubmitting(true)
      setError(null)
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

      const record = await createContentRecord({
        creatorWallet: wallet.publicKey.toBase58(),
        title: form.title,
        description: form.description,
        previewText: form.previewText,
        bodyMarkdown: form.bodyMarkdown,
        priceLamports,
        contentHash,
        chainContentPda,
        file,
      })

      setRecords((current) => [record, ...current])
      setForm(initialForm)
      setFile(null)
      setSuccess(`${window.location.origin}/view/${record.id}`)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to create a new content record.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="content-layout">
      <section className="page-header">
        <div className="eyebrow">Creator studio</div>
        <h1>Publish the asset, lock the price, generate the link.</h1>
        <p>
          The form below is the sprint-critical Week 1 flow. It creates the content
          metadata, stores the private payload in Supabase, and prepares the PDA that the
          on-chain program will own after deployment.
        </p>

        <div className="metric-row">
          <article className="metric">
            <span>Network</span>
            <strong>{runtimeConfig.solanaNetwork}</strong>
          </article>
          <article className="metric">
            <span>Wallet</span>
            <strong>{wallet.publicKey ? 'Connected' : 'Connect Phantom'}</strong>
          </article>
          <article className="metric">
            <span>Program</span>
            <strong>
              {runtimeConfig.programConfigured ? 'Ready for PDAs' : 'Waiting for deploy'}
            </strong>
          </article>
        </div>

        {!runtimeConfig.supabaseConfigured ? (
          <div className="notice warning">
            Add <span className="inline-code">VITE_SUPABASE_URL</span> and{' '}
            <span className="inline-code">VITE_SUPABASE_ANON_KEY</span> before trying to
            save creator content.
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
            This contract currently supports one on-chain content account per creator wallet.
            The first fully configured paid item is the sprint-safe path.
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

          <div className="helper">
            Use inline text for the fastest unlock demo. Add a file when you are ready to
            test private storage and signed URLs.
          </div>

          {error ? <div className="notice error">{error}</div> : null}
          {success ? (
            <div className="notice">
              Shareable link created:
              <br />
              <span className="inline-code">{success}</span>
            </div>
          ) : null}

          <div className="hero-actions">
            <button className="button button-primary" disabled={submitting} type="submit">
              {submitting ? 'Creating content...' : 'Create content link'}
            </button>
            <Link className="button button-secondary" to="/">
              Back to overview
            </Link>
          </div>
        </form>
      </section>

      <section className="content-panel">
        <div className="section-label">Creator records</div>
        <h2>Your recent monetized content</h2>
        <p className="viewer-copy">
          These rows are pulled from Supabase and represent the exact links your consumer
          view will load.
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
                <Link className="button button-secondary" to={`/view/${record.id}`}>
                  Open viewer
                </Link>
              </header>

              <div className="record-meta">
                <span>{formatSol(record.price_lamports)}</span>
                <span className="mono">{record.id}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
