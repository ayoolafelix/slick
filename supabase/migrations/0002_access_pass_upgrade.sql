alter table public.content
add column if not exists access_model text not null default 'standard'
check (access_model in ('standard', 'nft'));

alter table public.purchases
add column if not exists access_nft_mint text;

alter table public.purchases
add column if not exists access_nft_tx_sig text;

create index if not exists purchases_content_id_idx on public.purchases (content_id);
create index if not exists purchases_buyer_pubkey_idx on public.purchases (buyer_pubkey);
create index if not exists purchases_access_nft_mint_idx on public.purchases (access_nft_mint);
