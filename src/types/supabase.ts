export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      budget_requests: {
        Row: {
          category: string
          created_at: string | null
          division_id: number | null
          id: number
          item_name: string
          price_unit: number
          qty: number
          rejection_reason: string | null
          status: string | null
          total: number | null
          unit: string
        }
        Insert: {
          category: string
          created_at?: string | null
          division_id?: number | null
          id?: number
          item_name: string
          price_unit: number
          qty: number
          rejection_reason?: string | null
          status?: string | null
          total?: number | null
          unit: string
        }
        Update: {
          category?: string
          created_at?: string | null
          division_id?: number | null
          id?: number
          item_name?: string
          price_unit?: number
          qty?: number
          rejection_reason?: string | null
          status?: string | null
          total?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_requests_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow: {
        Row: {
          created_at: string | null
          description: string | null
          gdrive_url: string | null
          id: number
          nominal: number
          source_target: string
          trans_date: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          gdrive_url?: string | null
          id?: number
          nominal: number
          source_target: string
          trans_date: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          gdrive_url?: string | null
          id?: number
          nominal?: number
          source_target?: string
          trans_date?: string
          type?: string | null
        }
        Relationships: []
      }
      divisions: {
        Row: {
          id: number
          is_locked: boolean | null
          name: string
        }
        Insert: {
          id?: number
          is_locked?: boolean | null
          name: string
        }
        Update: {
          id?: number
          is_locked?: boolean | null
          name?: string
        }
        Relationships: []
      }
      realization_proofs: {
        Row: {
          created_at: string | null
          gdrive_url: string
          id: number
          request_id: number | null
        }
        Insert: {
          created_at?: string | null
          gdrive_url: string
          id?: number
          request_id?: number | null
        }
        Update: {
          created_at?: string | null
          gdrive_url?: string
          id?: number
          request_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "realization_proofs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "budget_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          division_id: number | null
          email: string
          full_name: string
          id: string
          is_default_password: boolean | null
          mfa_token: string | null
          role: string | null
          token_created_at: string | null
        }
        Insert: {
          created_at?: string | null
          division_id?: number | null
          email: string
          full_name: string
          id?: string
          is_default_password?: boolean | null
          mfa_token?: string | null
          role?: string | null
          token_created_at?: string | null
        }
        Update: {
          created_at?: string | null
          division_id?: number | null
          email?: string
          full_name?: string
          id?: string
          is_default_password?: boolean | null
          mfa_token?: string | null
          role?: string | null
          token_created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_treasurer_token: {
        Args: { user_id: string }
        Returns: {
          token: string
          treasurer_name: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
