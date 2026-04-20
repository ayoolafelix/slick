export type Database = {
  public: {
    Tables: {
      content: {
        Row: {
          id: string
          creator_wallet: string
          title: string
          description: string | null
          preview_text: string | null
          body_markdown: string | null
          storage_bucket: string | null
          storage_path: string | null
          content_hash: string
          chain_content_pda: string | null
          price_lamports: number
          created_at: string
        }
        Insert: {
          id?: string
          creator_wallet: string
          title: string
          description?: string | null
          preview_text?: string | null
          body_markdown?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          content_hash: string
          chain_content_pda?: string | null
          price_lamports: number
          created_at?: string
        }
        Update: {
          creator_wallet?: string
          title?: string
          description?: string | null
          preview_text?: string | null
          body_markdown?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          content_hash?: string
          chain_content_pda?: string | null
          price_lamports?: number
          created_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          id: string
          content_id: string
          buyer_pubkey: string
          tx_sig: string
          confirmed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          buyer_pubkey: string
          tx_sig: string
          confirmed_at?: string
          created_at?: string
        }
        Update: {
          content_id?: string
          buyer_pubkey?: string
          tx_sig?: string
          confirmed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'purchases_content_id_fkey'
            columns: ['content_id']
            isOneToOne: false
            referencedRelation: 'content'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
