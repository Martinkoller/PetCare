// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
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
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      appointment_templates: {
        Row: {
          created_at: string | null
          default_duration_days: number | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          services: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_duration_days?: number | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          services?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_duration_days?: number | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          services?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'appointment_templates_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          date: string
          duration: number
          id: string
          notes: string | null
          organization_id: string | null
          pet_id: string
          price: number
          professional_id: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          duration?: number
          id?: string
          notes?: string | null
          organization_id?: string | null
          pet_id: string
          price?: number
          professional_id?: string | null
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          duration?: number
          id?: string
          notes?: string | null
          organization_id?: string | null
          pet_id?: string
          price?: number
          professional_id?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_pet_id_fkey'
            columns: ['pet_id']
            isOneToOne: false
            referencedRelation: 'pets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      boarding_services: {
        Row: {
          batch_id: string | null
          boarding_id: string | null
          created_at: string | null
          id: string
          name: string
          organization_id: string | null
          product_id: string | null
          quantity: number
          service_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          batch_id?: string | null
          boarding_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          organization_id?: string | null
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          batch_id?: string | null
          boarding_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'boarding_services_boarding_id_fkey'
            columns: ['boarding_id']
            isOneToOne: false
            referencedRelation: 'boardings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'boarding_services_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'boarding_services_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      boardings: {
        Row: {
          actual_check_in: string | null
          actual_check_out: string | null
          belongings: string | null
          check_in: string
          check_out: string
          created_at: string | null
          daily_rate: number | null
          id: string
          kennel_number: string | null
          observations: string | null
          organization_id: string | null
          pet_id: string
          service_id: string | null
          signature: string | null
          special_instructions: string | null
          status: string
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          actual_check_in?: string | null
          actual_check_out?: string | null
          belongings?: string | null
          check_in: string
          check_out: string
          created_at?: string | null
          daily_rate?: number | null
          id?: string
          kennel_number?: string | null
          observations?: string | null
          organization_id?: string | null
          pet_id: string
          service_id?: string | null
          signature?: string | null
          special_instructions?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_check_in?: string | null
          actual_check_out?: string | null
          belongings?: string | null
          check_in?: string
          check_out?: string
          created_at?: string | null
          daily_rate?: number | null
          id?: string
          kennel_number?: string | null
          observations?: string | null
          organization_id?: string | null
          pet_id?: string
          service_id?: string | null
          signature?: string | null
          special_instructions?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'boardings_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          joined_at: string | null
          name: string
          organization_id: string | null
          phone: string | null
          updated_at: string | null
          whatsapp_enabled: boolean | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          joined_at?: string | null
          name: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          joined_at?: string | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'clients_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pets: {
        Row: {
          age: number | null
          breed: string | null
          client_id: string
          created_at: string | null
          gender: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string | null
          species: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          breed?: string | null
          client_id: string
          created_at?: string | null
          gender?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id?: string | null
          species: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          breed?: string | null
          client_id?: string
          created_at?: string | null
          gender?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string | null
          species?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'pets_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pets_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      pricing_rules: {
        Row: {
          active: boolean | null
          created_at: string | null
          days_of_week: Json | null
          end_date: string | null
          id: string
          modifier_type: string
          name: string
          organization_id: string | null
          start_date: string | null
          type: string
          value: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          days_of_week?: Json | null
          end_date?: string | null
          id?: string
          modifier_type: string
          name: string
          organization_id?: string | null
          start_date?: string | null
          type: string
          value: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          days_of_week?: Json | null
          end_date?: string | null
          id?: string
          modifier_type?: string
          name?: string
          organization_id?: string | null
          start_date?: string | null
          type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'pricing_rules_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          batches: Json | null
          category: string
          created_at: string | null
          description: string | null
          expiration_date: string | null
          id: string
          min_stock: number
          name: string
          organization_id: string | null
          price: number
          sku: string
          stock: number
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          batches?: Json | null
          category: string
          created_at?: string | null
          description?: string | null
          expiration_date?: string | null
          id?: string
          min_stock?: number
          name: string
          organization_id?: string | null
          price?: number
          sku: string
          stock?: number
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          batches?: Json | null
          category?: string
          created_at?: string | null
          description?: string | null
          expiration_date?: string | null
          id?: string
          min_stock?: number
          name?: string
          organization_id?: string | null
          price?: number
          sku?: string
          stock?: number
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'products_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          organization_id: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      service_catalog: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          access_token: string
          calendar_email: string | null
          created_at: string
          expires_at: number | null
          id: string
          provider: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_email?: string | null
          created_at?: string
          expires_at?: number | null
          id?: string
          provider: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_email?: string | null
          created_at?: string
          expires_at?: number | null
          id?: string
          provider?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_integrations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          dashboard_alerts: Json | null
          kanban_settings: Json | null
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_alerts?: Json | null
          kanban_settings?: Json | null
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_alerts?: Json | null
          kanban_settings?: Json | null
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_preferences_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
