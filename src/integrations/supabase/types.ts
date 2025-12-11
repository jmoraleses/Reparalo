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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          last_message_at: string | null
          solicitud_id: string | null
          workshop_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          last_message_at?: string | null
          solicitud_id?: string | null
          workshop_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          last_message_at?: string | null
          solicitud_id?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      counter_offers: {
        Row: {
          amount: number
          created_at: string
          id: string
          message: string | null
          offer_id: string
          proposed_by: string
          solicitud_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          message?: string | null
          offer_id: string
          proposed_by: string
          solicitud_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          message?: string | null
          offer_id?: string
          proposed_by?: string
          solicitud_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "counter_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "ofertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_offers_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ofertas: {
        Row: {
          created_at: string
          diagnosis_cost: number
          estimated_cost_max: number
          estimated_cost_min: number
          estimated_days: number
          final_quote: number | null
          id: string
          message: string | null
          solicitud_id: string
          status: Database["public"]["Enums"]["offer_status"]
          transport_cost: number
          updated_at: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          diagnosis_cost: number
          estimated_cost_max: number
          estimated_cost_min: number
          estimated_days: number
          final_quote?: number | null
          id?: string
          message?: string | null
          solicitud_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          transport_cost: number
          updated_at?: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          diagnosis_cost?: number
          estimated_cost_max?: number
          estimated_cost_min?: number
          estimated_days?: number
          final_quote?: number | null
          id?: string
          message?: string | null
          solicitud_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          transport_cost?: number
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_workshop: boolean
          updated_at: string
          user_id: string
          workshop_city: string | null
          workshop_description: string | null
          workshop_name: string | null
          workshop_rating: number | null
          workshop_reviews_count: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_workshop?: boolean
          updated_at?: string
          user_id: string
          workshop_city?: string | null
          workshop_description?: string | null
          workshop_name?: string | null
          workshop_rating?: number | null
          workshop_reviews_count?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_workshop?: boolean
          updated_at?: string
          user_id?: string
          workshop_city?: string | null
          workshop_description?: string | null
          workshop_name?: string | null
          workshop_rating?: number | null
          workshop_reviews_count?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
          solicitud_id: string
          workshop_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          solicitud_id: string
          workshop_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          solicitud_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: true
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_status_history: {
        Row: {
          created_at: string
          id: string
          location: string | null
          notes: string | null
          shipment_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          shipment_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          shipment_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_status_history_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          created_at: string
          destination_city: string
          destination_name: string
          estimated_delivery: string | null
          id: string
          origin_city: string
          origin_name: string
          solicitud_id: string
          status: string
          tracking_number: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_city: string
          destination_name: string
          estimated_delivery?: string | null
          id?: string
          origin_city: string
          origin_name: string
          solicitud_id: string
          status?: string
          tracking_number: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_city?: string
          destination_name?: string
          estimated_delivery?: string | null
          id?: string
          origin_city?: string
          origin_name?: string
          solicitud_id?: string
          status?: string
          tracking_number?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes: {
        Row: {
          city: string
          counter_offer_count: number | null
          created_at: string
          device_brand: string
          device_model: string
          device_type: string
          diagnosis_paid: boolean | null
          final_quote_paid: boolean | null
          id: string
          images: string[] | null
          problem_category: string | null
          problem_description: string
          selected_offer_id: string | null
          status: Database["public"]["Enums"]["repair_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          counter_offer_count?: number | null
          created_at?: string
          device_brand: string
          device_model: string
          device_type: string
          diagnosis_paid?: boolean | null
          final_quote_paid?: boolean | null
          id?: string
          images?: string[] | null
          problem_category?: string | null
          problem_description: string
          selected_offer_id?: string | null
          status?: Database["public"]["Enums"]["repair_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          counter_offer_count?: number | null
          created_at?: string
          device_brand?: string
          device_model?: string
          device_type?: string
          diagnosis_paid?: boolean | null
          final_quote_paid?: boolean | null
          id?: string
          images?: string[] | null
          problem_category?: string | null
          problem_description?: string
          selected_offer_id?: string | null
          status?: Database["public"]["Enums"]["repair_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_verified_workshop: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "customer" | "workshop"
      offer_status: "pendiente" | "aceptada" | "rechazada"
      repair_status:
        | "esperando_ofertas"
        | "oferta_seleccionada"
        | "en_camino_taller"
        | "diagnostico"
        | "presupuesto_final"
        | "negociando"
        | "en_reparacion"
        | "reparado"
        | "en_camino_cliente"
        | "completado"
        | "cancelado"
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
    Enums: {
      app_role: ["customer", "workshop"],
      offer_status: ["pendiente", "aceptada", "rechazada"],
      repair_status: [
        "esperando_ofertas",
        "oferta_seleccionada",
        "en_camino_taller",
        "diagnostico",
        "presupuesto_final",
        "negociando",
        "en_reparacion",
        "reparado",
        "en_camino_cliente",
        "completado",
        "cancelado",
      ],
    },
  },
} as const
