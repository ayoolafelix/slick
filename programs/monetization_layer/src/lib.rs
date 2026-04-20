use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("6BCx8hhFWQHvq1ouZJ7NfaPUL8bFRSrRn7sxLSFopYeV");

#[program]
pub mod monetization_layer {
    use super::*;

    pub fn create_content(
        ctx: Context<CreateContent>,
        price_lamports: u64,
        content_hash: String,
    ) -> Result<()> {
        require!(price_lamports > 0, MonetizationError::InvalidPrice);
        require!(
            !content_hash.is_empty()
                && content_hash.len() <= ContentAccount::MAX_CONTENT_HASH_LENGTH,
            MonetizationError::InvalidContentHash
        );

        let content_account = &mut ctx.accounts.content_account;
        content_account.creator = ctx.accounts.creator.key();
        content_account.price_lamports = price_lamports;
        content_account.content_hash = content_hash.clone();
        content_account.created_at = Clock::get()?.unix_timestamp;
        content_account.bump = ctx.bumps.content_account;

        emit!(ContentCreated {
            creator: content_account.creator,
            price_lamports,
            content_hash,
        });

        Ok(())
    }

    pub fn purchase_content(ctx: Context<PurchaseContent>) -> Result<()> {
        require!(
            ctx.accounts.buyer.lamports() >= ctx.accounts.content_account.price_lamports,
            MonetizationError::InsufficientFunds
        );

        let transfer_accounts = Transfer {
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.creator.to_account_info(),
        };

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                transfer_accounts,
            ),
            ctx.accounts.content_account.price_lamports,
        )?;

        emit!(ContentPurchased {
            buyer: ctx.accounts.buyer.key(),
            creator: ctx.accounts.creator.key(),
            price_lamports: ctx.accounts.content_account.price_lamports,
            content_hash: ctx.accounts.content_account.content_hash.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(price_lamports: u64, content_hash: String)]
pub struct CreateContent<'info> {
    // Creator funds the PDA account and owns the priced content record.
    #[account(mut)]
    pub creator: Signer<'info>,
    // Store one starter content account per creator to keep Week 1 simple.
    #[account(
        init,
        payer = creator,
        space = 8 + ContentAccount::INIT_SPACE,
        seeds = [b"content", creator.key().as_ref()],
        bump
    )]
    pub content_account: Account<'info, ContentAccount>,
    // Required for account allocation and rent payment.
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseContent<'info> {
    // Buyer signs and sends the SOL payment.
    #[account(mut)]
    pub buyer: Signer<'info>,
    // Creator must match the content account's stored owner.
    #[account(mut, address = content_account.creator @ MonetizationError::CreatorMismatch)]
    pub creator: SystemAccount<'info>,
    // Read the priced content record from the creator PDA.
    #[account(
        seeds = [b"content", creator.key().as_ref()],
        bump = content_account.bump
    )]
    pub content_account: Account<'info, ContentAccount>,
    // Required for the native SOL transfer CPI.
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ContentAccount {
    pub creator: Pubkey,
    pub price_lamports: u64,
    pub content_hash: String,
    pub created_at: i64,
    pub bump: u8,
}

impl ContentAccount {
    pub const MAX_CONTENT_HASH_LENGTH: usize = 64;
    pub const INIT_SPACE: usize = 32 + 8 + 4 + Self::MAX_CONTENT_HASH_LENGTH + 8 + 1;
}

#[event]
pub struct ContentCreated {
    pub creator: Pubkey,
    pub price_lamports: u64,
    pub content_hash: String,
}

#[event]
pub struct ContentPurchased {
    pub buyer: Pubkey,
    pub creator: Pubkey,
    pub price_lamports: u64,
    pub content_hash: String,
    pub timestamp: i64,
}

#[error_code]
pub enum MonetizationError {
    #[msg("The buyer does not have enough SOL to complete the purchase.")]
    InsufficientFunds,
    #[msg("A content account already exists for this creator.")]
    ContentAlreadyExists,
    #[msg("The creator account does not match the stored content owner.")]
    CreatorMismatch,
    #[msg("The content hash must be between 1 and 64 characters.")]
    InvalidContentHash,
    #[msg("The content price must be greater than zero lamports.")]
    InvalidPrice,
}
