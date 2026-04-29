import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { createHash } from 'node:crypto'

const PROGRAM_ID = new PublicKey(
  process.env.MONETIZATION_PROGRAM_ID ||
    '6BCx8hhFWQHvq1ouZJ7NfaPUL8bFRSrRn7sxLSFopYeV',
)
const RPC_URL = process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899'
const connection = new Connection(RPC_URL, 'confirmed')

const CREATE_CONTENT_DISCRIMINATOR = Buffer.from([196, 78, 200, 14, 158, 190, 68, 223])
const PURCHASE_CONTENT_DISCRIMINATOR = Buffer.from([209, 29, 229, 53, 145, 17, 239, 11])
const CONTENT_ACCOUNT_DISCRIMINATOR = Buffer.from([189, 25, 152, 128, 54, 178, 15, 232])

function encodeU64(value) {
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64LE(BigInt(value))
  return buffer
}

function encodeString(value) {
  const bytes = Buffer.from(value, 'utf8')
  const length = Buffer.alloc(4)
  length.writeUInt32LE(bytes.length)
  return Buffer.concat([length, bytes])
}

function decodeContentAccount(buffer) {
  let offset = 0
  const discriminator = buffer.subarray(offset, offset + 8)
  offset += 8

  if (!discriminator.equals(CONTENT_ACCOUNT_DISCRIMINATOR)) {
    throw new Error('Unexpected account discriminator for content PDA.')
  }

  const creator = new PublicKey(buffer.subarray(offset, offset + 32))
  offset += 32

  const priceLamports = Number(buffer.readBigUInt64LE(offset))
  offset += 8

  const contentHashLength = buffer.readUInt32LE(offset)
  offset += 4

  const contentHash = buffer.subarray(offset, offset + contentHashLength).toString('utf8')
  offset += contentHashLength

  const createdAt = Number(buffer.readBigInt64LE(offset))
  offset += 8

  const bump = buffer.readUInt8(offset)

  return {
    bump,
    contentHash,
    createdAt,
    creator,
    priceLamports,
  }
}

async function airdrop(pubkey, sol) {
  const signature = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL)
  await connection.confirmTransaction(signature, 'confirmed')
}

async function main() {
  const creator = Keypair.generate()
  const buyer = Keypair.generate()
  const priceLamports = 0.25 * LAMPORTS_PER_SOL
  const contentHash = createHash('sha256')
    .update('slick local programmable monetization smoke test')
    .digest('hex')

  await airdrop(creator.publicKey, 5)
  await airdrop(buyer.publicKey, 5)

  const [contentAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('content'), creator.publicKey.toBuffer()],
    PROGRAM_ID,
  )

  const createInstruction = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: creator.publicKey, isSigner: true, isWritable: true },
      { pubkey: contentAccount, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      CREATE_CONTENT_DISCRIMINATOR,
      encodeU64(priceLamports),
      encodeString(contentHash),
    ]),
  })

  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(createInstruction),
    [creator],
    { commitment: 'confirmed' },
  )

  const contentAccountInfo = await connection.getAccountInfo(contentAccount, 'confirmed')
  if (!contentAccountInfo) {
    throw new Error('Expected the content PDA to exist after create_content.')
  }

  const decodedContentAccount = decodeContentAccount(contentAccountInfo.data)
  if (decodedContentAccount.priceLamports !== priceLamports) {
    throw new Error('Stored price does not match the published price.')
  }

  if (decodedContentAccount.contentHash !== contentHash) {
    throw new Error('Stored content hash does not match the published hash.')
  }

  const creatorBalanceBefore = await connection.getBalance(creator.publicKey, 'confirmed')
  const buyerBalanceBefore = await connection.getBalance(buyer.publicKey, 'confirmed')

  const purchaseInstruction = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: buyer.publicKey, isSigner: true, isWritable: true },
      { pubkey: creator.publicKey, isSigner: false, isWritable: true },
      { pubkey: contentAccount, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: PURCHASE_CONTENT_DISCRIMINATOR,
  })

  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(purchaseInstruction),
    [buyer],
    { commitment: 'confirmed' },
  )

  const creatorBalanceAfter = await connection.getBalance(creator.publicKey, 'confirmed')
  const buyerBalanceAfter = await connection.getBalance(buyer.publicKey, 'confirmed')
  const creatorDelta = creatorBalanceAfter - creatorBalanceBefore
  const buyerDelta = buyerBalanceBefore - buyerBalanceAfter

  if (creatorDelta !== priceLamports) {
    throw new Error(
      `Creator balance delta ${creatorDelta} did not match price ${priceLamports}.`,
    )
  }

  if (buyerDelta < priceLamports) {
    throw new Error(
      `Buyer balance delta ${buyerDelta} was less than the purchase price ${priceLamports}.`,
    )
  }

  console.log(
    JSON.stringify(
      {
        buyer: buyer.publicKey.toBase58(),
        buyerDelta,
        contentAccount: contentAccount.toBase58(),
        contentHash,
        creator: creator.publicKey.toBase58(),
        creatorDelta,
        priceLamports,
        programId: PROGRAM_ID.toBase58(),
        rpcUrl: RPC_URL,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
