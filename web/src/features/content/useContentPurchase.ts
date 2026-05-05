import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import type { ContentRecord } from './types'
import type { OwnedAccessPass } from '../../lib/accessPass'
import {
  attachAccessPassToPurchase,
  createSignedContentUrl,
  lookupPurchase,
  recordPurchase,
  shouldOfferPortableMode,
} from './data'
import {
  attachAccessPassToLocalPurchase,
  lookupLocalPurchase,
  rememberLocalPurchase,
} from './portable'
import { runtimeConfig } from '../../lib/config'
import { purchaseContentOnChain } from '../../lib/monetizationProgram'

type PurchaseState =
  | 'loading'
  | 'locked'
  | 'paying'
  | 'minting'
  | 'unlocked'
  | 'error'

export function useContentPurchase(content: ContentRecord | null) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [state, setState] = useState<PurchaseState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [paymentSignature, setPaymentSignature] = useState<string | null>(null)
  const [accessPass, setAccessPass] = useState<OwnedAccessPass | null>(null)
  const isDemoContent = content?.id === 'demo-content-id'

  async function loadSignedUrl(current: ContentRecord) {
    if (!current.storage_bucket || !current.storage_path) {
      setSignedUrl(null)
      return
    }

    const url = await createSignedContentUrl(current.storage_bucket, current.storage_path)
    setSignedUrl(url)
  }

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
        setWarning(null)
        setSignedUrl(null)
        setPaymentSignature(null)
        setAccessPass(null)
        return
      }

      if (!wallet.publicKey) {
        setState('locked')
        setError(null)
        setWarning(null)
        setSignedUrl(null)
        setPaymentSignature(null)
        setAccessPass(null)
        return
      }

      try {
        setState('loading')
        setWarning(null)

        const [remotePurchase, ownedPass] = await Promise.all([
          lookupPurchase(content.id, wallet.publicKey.toBase58()),
          content.access_model === 'nft'
            ? import('../../lib/accessPass').then(({ findOwnedAccessPass }) =>
                findOwnedAccessPass({
                  connection,
                  owner: wallet.publicKey!,
                  contentId: content.id,
                }),
              )
            : Promise.resolve(null),
        ])
        const purchase =
          remotePurchase ?? lookupLocalPurchase(content.id, wallet.publicKey.toBase58())

        if (cancelled) {
          return
        }

        setPaymentSignature(purchase?.tx_sig ?? null)
        setAccessPass(ownedPass)

        if (ownedPass) {
          await loadSignedUrl(content)
          if (!cancelled) {
            setState('unlocked')
            setError(null)
          }
          return
        }

        if (purchase && (content.access_model === 'standard' || !purchase.access_nft_mint)) {
          await loadSignedUrl(content)
          if (!cancelled) {
            setState('unlocked')
            setError(null)
          }
          return
        }

        setSignedUrl(null)
        setState('locked')
        setError(null)
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
  }, [connection, content, isDemoContent, wallet.publicKey])

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
      setWarning(null)

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

      setPaymentSignature(signature)
      rememberLocalPurchase({
        buyerPubkey: wallet.publicKey.toBase58(),
        contentId: content.id,
        txSig: signature,
      })

      let nextWarning: string | null = null

      try {
        await recordPurchase({
          buyerPubkey: wallet.publicKey.toBase58(),
          contentId: content.id,
          txSig: signature,
        })
      } catch (caughtError) {
        nextWarning =
          caughtError instanceof Error && shouldOfferPortableMode(caughtError.message)
            ? 'Payment was confirmed on-chain and cached in this browser. The hosted Supabase schema is still pending, so portable demo mode is carrying the persistence layer for now.'
            : caughtError instanceof Error
              ? `${caughtError.message} Payment still confirmed on-chain, so the current session is unlocked.`
            : 'Payment confirmed, but purchase persistence failed. The current session is still unlocked.'
      }

      let mintedPass: OwnedAccessPass | null = null

      if (content.access_model === 'nft') {
        setState('minting')

        try {
          const { mintAccessPass: mintNftAccessPass } = await import('../../lib/accessPass')
          const minted = await mintNftAccessPass({
            wallet,
            connection,
            content,
          })

          mintedPass = {
            mintAddress: minted.mintAddress,
            metadataUri: minted.metadataUri,
            name: minted.name,
            symbol: minted.symbol,
          }
          setAccessPass(mintedPass)
          attachAccessPassToLocalPurchase({
            contentId: content.id,
            buyerPubkey: wallet.publicKey.toBase58(),
            mintAddress: minted.mintAddress,
            mintTxSig: minted.txSig,
          })

          await attachAccessPassToPurchase({
            txSig: signature,
            mintAddress: minted.mintAddress,
            mintTxSig: minted.txSig,
          })
        } catch (caughtError) {
          nextWarning =
            caughtError instanceof Error
              ? `${caughtError.message} Payment still succeeded. You can retry minting the access pass from this screen.`
              : 'Payment succeeded, but the access pass mint failed. You can retry minting from this screen.'
        }
      }

      await loadSignedUrl(content)

      setWarning(nextWarning)
      setState('unlocked')
      setError(null)
    } catch (caughtError) {
      setState('error')
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The purchase could not be completed.',
      )
    }
  }

  async function mintAccessPass() {
    if (!content || content.access_model !== 'nft') {
      return
    }

    if (!wallet.publicKey) {
      setError('Connect a Solana wallet before minting an access pass.')
      setState('error')
      return
    }

    try {
      setState('minting')
      setError(null)

      const { mintAccessPass: mintNftAccessPass } = await import('../../lib/accessPass')
      const minted = await mintNftAccessPass({
        wallet,
        connection,
        content,
      })

      setAccessPass({
        mintAddress: minted.mintAddress,
        metadataUri: minted.metadataUri,
        name: minted.name,
        symbol: minted.symbol,
      })
      attachAccessPassToLocalPurchase({
        contentId: content.id,
        buyerPubkey: wallet.publicKey.toBase58(),
        mintAddress: minted.mintAddress,
        mintTxSig: minted.txSig,
      })

      if (paymentSignature) {
        await attachAccessPassToPurchase({
          txSig: paymentSignature,
          mintAddress: minted.mintAddress,
          mintTxSig: minted.txSig,
        })
      }

      await loadSignedUrl(content)
      setWarning(null)
      setState('unlocked')
    } catch (caughtError) {
      setWarning(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to mint the access pass right now.',
      )
      setState('unlocked')
    }
  }

  return {
    accessPass,
    error,
    mintAccessPass,
    paymentSignature,
    purchase,
    signedUrl,
    state,
    warning,
  }
}
