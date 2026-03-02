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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      offer_linkages: {
        Row: {
          annual_cost: number
          discount_weight_pct: number
          id: string
          is_active_default: boolean
          label: string
          offer_id: string
        }
        Insert: {
          annual_cost?: number
          discount_weight_pct?: number
          id?: string
          is_active_default?: boolean
          label: string
          offer_id: string
        }
        Update: {
          annual_cost?: number
          discount_weight_pct?: number
          id?: string
          is_active_default?: boolean
          label?: string
          offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_linkages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_mixed_periods: {
        Row: {
          fixed_tin: number | null
          from_year: number
          id: string
          offer_id: string
          spread_over_euribor: number | null
          to_year: number
        }
        Insert: {
          fixed_tin?: number | null
          from_year: number
          id?: string
          offer_id: string
          spread_over_euribor?: number | null
          to_year: number
        }
        Update: {
          fixed_tin?: number | null
          from_year?: number
          id?: string
          offer_id?: string
          spread_over_euribor?: number | null
          to_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_mixed_periods_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          advantages: string[]
          amortization_fee_pct: number
          bank_name: string
          base_tin: number
          considerations: string[]
          created_at: string
          estimated_tae: number
          euribor_rate: number | null
          id: string
          logo_color: string
          monthly_account_cost: number
          monthly_payment: number
          operation_id: string
          sort_order: number
          type: string
          upfront_costs: number
        }
        Insert: {
          advantages?: string[]
          amortization_fee_pct?: number
          bank_name: string
          base_tin?: number
          considerations?: string[]
          created_at?: string
          estimated_tae?: number
          euribor_rate?: number | null
          id?: string
          logo_color?: string
          monthly_account_cost?: number
          monthly_payment?: number
          operation_id: string
          sort_order?: number
          type?: string
          upfront_costs?: number
        }
        Update: {
          advantages?: string[]
          amortization_fee_pct?: number
          bank_name?: string
          base_tin?: number
          considerations?: string[]
          created_at?: string
          estimated_tae?: number
          euribor_rate?: number | null
          id?: string
          logo_color?: string
          monthly_account_cost?: number
          monthly_payment?: number
          operation_id?: string
          sort_order?: number
          type?: string
          upfront_costs?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["id"]
          },
        ]
      }
      operations: {
        Row: {
          appraisal_cost: number
          appraisal_value: number
          created_at: string
          created_by: string
          home_insurance_annual: number
          id: string
          is_published: boolean
          life_insurance_annual: number
          loan_amount: number
          purchase_price: number
          share_token: string | null
          term_years: number
        }
        Insert: {
          appraisal_cost?: number
          appraisal_value?: number
          created_at?: string
          created_by: string
          home_insurance_annual?: number
          id?: string
          is_published?: boolean
          life_insurance_annual?: number
          loan_amount?: number
          purchase_price?: number
          share_token?: string | null
          term_years?: number
        }
        Update: {
          appraisal_cost?: number
          appraisal_value?: number
          created_at?: string
          created_by?: string
          home_insurance_annual?: number
          id?: string
          is_published?: boolean
          life_insurance_annual?: number
          loan_amount?: number
          purchase_price?: number
          share_token?: string | null
          term_years?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_share_token: { Args: never; Returns: string }
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
