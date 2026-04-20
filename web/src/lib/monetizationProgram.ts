import {
  AnchorProvider,
  BN,
  Program,
  type Idl,
  setProvider,
} from '@coral-xyz/anchor'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, type Connection } from '@solana/web3.js'
import { runtimeConfig } from './config'
import type { ContentRecord } from '../features/content/types'

const contentAccountDiscriminator = [189, 25, 152, 128, 54, 178, 15, 232]
const createContentDiscriminator = [196, 78, 200, 14, 158, 190, 68, 223]
const purchaseContentDiscriminator = [209, 29, 229, 53, 145, 17, 239, 11]

function getIdl(): Idl {
  return {
    address: runtimeConfig.programId,
    metadata: {
      name: 'monetization_layer',
      version: '0.1.0',
      spec: '0.1.0',
      description: 'Programmable monetization layer on Solana',
    },
    instructions: [
      {
        name: 'createContent',
        discriminator: createContentDiscriminator,
        accounts: [
          {
            name: 'creator',
            writable: true,
            signer: true,
          },
          {
            name: 'contentAccount',
            writable: true,
            pda: {
              seeds: [
                {
                  kind: 'const',
                  value: [99, 111, 110, 116, 101, 110, 116],
                },
                {
                  kind: 'account',
                  path: 'creator',
                },
              ],
            },
          },
          {
            name: 'systemProgram',
            address: SystemProgram.programId.toBase58(),
          },
        ],
        args: [
          { name: 'priceLamports', type: 'u64' },
          { name: 'contentHash', type: 'string' },
        ],
      },
      {
        name: 'purchaseContent',
        discriminator: purchaseContentDiscriminator,
        accounts: [
          {
            name: 'buyer',
            writable: true,
            signer: true,
          },
          {
            name: 'creator',
            writable: true,
          },
          {
            name: 'contentAccount',
            pda: {
              seeds: [
                {
                  kind: 'const',
                  value: [99, 111, 110, 116, 101, 110, 116],
                },
                {
                  kind: 'account',
                  path: 'creator',
                },
              ],
            },
          },
          {
            name: 'systemProgram',
            address: SystemProgram.programId.toBase58(),
          },
        ],
        args: [],
      },
    ],
    accounts: [
      {
        name: 'contentAccount',
        discriminator: contentAccountDiscriminator,
      },
    ],
    types: [
      {
        name: 'contentAccount',
        type: {
          kind: 'struct',
          fields: [
            { name: 'creator', type: 'pubkey' },
            { name: 'priceLamports', type: 'u64' },
            { name: 'contentHash', type: 'string' },
            { name: 'createdAt', type: 'i64' },
            { name: 'bump', type: 'u8' },
          ],
        },
      },
    ],
    errors: [
      {
        code: 6000,
        name: 'insufficientFunds',
        msg: 'The buyer does not have enough SOL to complete the purchase.',
      },
      {
        code: 6001,
        name: 'contentAlreadyExists',
        msg: 'A content account already exists for this creator.',
      },
      {
        code: 6002,
        name: 'creatorMismatch',
        msg: 'The creator account does not match the stored content owner.',
      },
      {
        code: 6003,
        name: 'invalidContentHash',
        msg: 'The content hash must be between 1 and 64 characters.',
      },
      {
        code: 6004,
        name: 'invalidPrice',
        msg: 'The content price must be greater than zero lamports.',
      },
    ],
  }
}

function ensureWallet(wallet: WalletContextState) {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error('Connect a wallet that supports signing transactions first.')
  }

  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
  }
}

export function getMonetizationProgram(
  wallet: WalletContextState,
  connection: Connection,
) {
  if (!runtimeConfig.programConfigured) {
    return null
  }

  const anchorWallet = ensureWallet(wallet)
  const provider = new AnchorProvider(connection, anchorWallet, {
    commitment: 'confirmed',
  })
  setProvider(provider)
  return new Program(getIdl(), provider)
}

type ContentAccountSnapshot = {
  priceLamports: BN
  contentHash: string
}

type ProgramWithContentAccount = Program<Idl> & {
  account: {
    contentAccount: {
      fetchNullable(address: PublicKey): Promise<ContentAccountSnapshot | null>
    }
  }
}

export async function registerContentOnChain(params: {
  wallet: WalletContextState
  connection: Connection
  creatorWallet: string
  priceLamports: number
  contentHash: string
}) {
  const program = getMonetizationProgram(params.wallet, params.connection)
  if (!program) {
    return null
  }

  const contentProgram = program as ProgramWithContentAccount

  const creator = new PublicKey(params.creatorWallet)
  const [contentAccount] = PublicKey.findProgramAddressSync(
    [new TextEncoder().encode('content'), creator.toBytes()],
    contentProgram.programId,
  )

  const existingAccount =
    await contentProgram.account.contentAccount.fetchNullable(contentAccount)
  if (existingAccount) {
    if (
      existingAccount.priceLamports.toNumber() !== params.priceLamports ||
      existingAccount.contentHash !== params.contentHash
    ) {
      throw new Error(
        'The current on-chain program supports one content account per creator. Redeploy an upgraded program before publishing multiple distinct paid items from the same wallet.',
      )
    }

    return contentAccount.toBase58()
  }

  await contentProgram.methods
    .createContent(new BN(params.priceLamports), params.contentHash)
    .accounts({
      creator,
      contentAccount,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return contentAccount.toBase58()
}

export async function purchaseContentOnChain(params: {
  wallet: WalletContextState
  connection: Connection
  content: ContentRecord
}) {
  const program = getMonetizationProgram(params.wallet, params.connection)
  if (!program) {
    throw new Error('The monetization program ID is not configured yet.')
  }

  const creator = new PublicKey(params.content.creator_wallet)
  const contentAccount = new PublicKey(params.content.chain_content_pda || '')

  return program.methods
    .purchaseContent()
    .accounts({
      buyer: params.wallet.publicKey!,
      creator,
      contentAccount,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
}
