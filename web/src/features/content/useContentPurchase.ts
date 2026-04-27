import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import type { ContentRecord } from './types'
import { runtimeConfig } from '../../lib/config'
import { createSignedContentUrl, lookupPurchase, recordPurchase } from './data'
import { purchaseContentOnChain } from '../../lib/monetizationProgram'

type PurchaseState = 'loading' | 'locked' | 'paying' | 'unlocked' | 'error'

export function useContentPurchase(content: ContentRecord | null) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [state, setState] = useState<PurchaseState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const isDemoContent = content?.id === 'demo-content-id'

  useEffect(() => {
    let cancelled = false

    async function syncPurchase() {
      if (!content) {
        setState('error')
        setError('This content record could not be found.')
        return
      }

      if (isDemoContent) {
        setState('locked')
        setError(null)
        setSignedUrl(null)
        return
      }

      if (!wallet.publicKey) {
        setState('locked')
        setError(null)
        setSignedUrl(null)
        return
      }

      try {
        setState('loading')
        const purchase = await lookupPurchase(content.id, wallet.publicKey.toBase58())

        if (!purchase) {
          if (!cancelled) {
            setState('locked')
            setSignedUrl(null)
          }
          return
        }

        if (content.storage_bucket && content.storage_path) {
          const url = await createSignedContentUrl(
            content.storage_bucket,
            content.storage_path,
          )
          if (!cancelled) {
            setSignedUrl(url)
          }
        }

        if (!cancelled) {
          setState('unlocked')
          setError(null)
        }
      } catch (caughtError) {
        if (!cancelled) {
          setState('error')
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to look up purchase state.',
          )
        }
      }
    }

    syncPurchase()

    return () => {
      cancelled = true
    }
  }, [content, isDemoContent, wallet.publicKey])

  async function purchase() {
    if (!content) {
      setState('error')
      setError('No content is loaded for this route.')
      return
    }

    if (isDemoContent) {
      setState('locked')
      setError('The demo route is read-only until the hosted Supabase schema is applied.')
      return
    }

    if (!wallet.publicKey || !wallet.sendTransaction) {
      setState('error')
      setError('Connect a Solana wallet before attempting payment.')
      return
    }

    const buyer = wallet.publicKey

    try {
      setState('paying')
      setError(null)

      const signature =
        runtimeConfig.programConfigured && content.chain_content_pda
          ? await purchaseContentOnChain({
              wallet,
              connection,
              content,
            })
          : await (async () => {
              const fallbackConnection = new Connection(
                runtimeConfig.rpcEndpoint,
                'confirmed',
              )
              const transaction = new Transaction().add(
                SystemProgram.transfer({
                  fromPubkey: buyer,
                  toPubkey: new PublicKey(content.creator_wallet),
                  lamports: content.price_lamports,
                }),
              )

              const fallbackSignature = await wallet.sendTransaction(
                transaction,
                fallbackConnection,
              )
              await fallbackConnection.confirmTransaction(fallbackSignature, 'confirmed')
              return fallbackSignature
            })()

      await recordPurchase({
        buyerPubkey: wallet.publicKey.toBase58(),
        contentId: content.id,
        txSig: signature,
      })

      if (content.storage_bucket && content.storage_path) {
        const url = await createSignedContentUrl(
          content.storage_bucket,
          content.storage_path,
        )
        setSignedUrl(url)
      }

      setState('unlocked')
    } catch (caughtError) {
      setState('error')
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The purchase could not be completed.',
      )
    }
  }

  return {
    error,
    purchase,
    signedUrl,
    state,
  }
}
