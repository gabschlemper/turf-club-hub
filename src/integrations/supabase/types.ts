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
      athletes: {
        Row: {
          birth_date: string
          category: Database["public"]["Enums"]["athlete_category"]
          club_id: string
          created_at: string
          deleted_at: string | null
          email: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          birth_date: string
          category?: Database["public"]["Enums"]["athlete_category"]
          club_id: string
          created_at?: string
          deleted_at?: string | null
          email: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          birth_date?: string
          category?: Database["public"]["Enums"]["athlete_category"]
          club_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athletes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          athlete_id: string
          club_id: string
          created_at: string
          deleted_at: string | null
          event_id: string
          id: string
          marked_at: string | null
          marked_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          athlete_id: string
          club_id: string
          created_at?: string
          deleted_at?: string | null
          event_id: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          athlete_id?: string
          club_id?: string
          created_at?: string
          deleted_at?: string | null
          event_id?: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendances_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clubs: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          amount: number
          athlete_id: string
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          due_date: string
          id: string
          paid_amount: number | null
          paid_at: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          athlete_id: string
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          due_date: string
          id?: string
          paid_amount?: number | null
          paid_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          athlete_id?: string
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          due_date?: string
          id?: string
          paid_amount?: number | null
          paid_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          end_datetime: string
          event_type: Database["public"]["Enums"]["event_type"]
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          location: string
          name: string
          start_datetime: string
          training_type: Database["public"]["Enums"]["training_type"] | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_datetime: string
          event_type: Database["public"]["Enums"]["event_type"]
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          location: string
          name: string
          start_datetime: string
          training_type?: Database["public"]["Enums"]["training_type"] | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_datetime?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          location?: string
          name?: string
          start_datetime?: string
          training_type?: Database["public"]["Enums"]["training_type"] | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rotation_duties: {
        Row: {
          athlete1_id: string
          athlete2_id: string
          athlete3_id: string | null
          club_id: string
          created_at: string
          deleted_at: string | null
          duty_date: string
          id: string
          updated_at: string
        }
        Insert: {
          athlete1_id: string
          athlete2_id: string
          athlete3_id?: string | null
          club_id: string
          created_at?: string
          deleted_at?: string | null
          duty_date: string
          id?: string
          updated_at?: string
        }
        Update: {
          athlete1_id?: string
          athlete2_id?: string
          athlete3_id?: string | null
          club_id?: string
          created_at?: string
          deleted_at?: string | null
          duty_date?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotation_duties_athlete1_id_fkey"
            columns: ["athlete1_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_duties_athlete2_id_fkey"
            columns: ["athlete2_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_duties_athlete3_id_fkey"
            columns: ["athlete3_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_duties_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_confirmations: {
        Row: {
          athlete_id: string
          club_id: string
          confirmed_at: string
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["confirmation_status"]
          updated_at: string
        }
        Insert: {
          athlete_id: string
          club_id: string
          confirmed_at?: string
          created_at?: string
          event_id: string
          id?: string
          status: Database["public"]["Enums"]["confirmation_status"]
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          club_id?: string
          confirmed_at?: string
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["confirmation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_confirmations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_confirmations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_confirmations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          club_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_athlete_email_exists: {
        Args: { p_email: string }
        Returns: boolean
      }
      get_user_club_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      soft_delete: {
        Args: { p_record_id: string; p_table_name: string }
        Returns: boolean
      }
      soft_delete_athlete: { Args: { p_athlete_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "athlete" | "club_admin" | "super_admin" | "coach"
      athlete_category: "GF" | "SC" | "OE"
      attendance_status: "present" | "absent" | "justified"
      audit_action:
        | "INSERT"
        | "UPDATE"
        | "DELETE"
        | "SOFT_DELETE"
        | "LOGIN"
        | "LOGOUT"
        | "SIGNUP"
        | "PASSWORD_RESET"
        | "PASSWORD_CHANGE"
      confirmation_status: "confirmed" | "declined"
      event_type: "championship" | "training" | "social"
      gender_type: "male" | "female" | "both"
      training_type: "principal" | "extra"
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
      app_role: ["admin", "athlete", "club_admin", "super_admin", "coach"],
      athlete_category: ["GF", "SC", "OE"],
      attendance_status: ["present", "absent", "justified"],
      audit_action: [
        "INSERT",
        "UPDATE",
        "DELETE",
        "SOFT_DELETE",
        "LOGIN",
        "LOGOUT",
        "SIGNUP",
        "PASSWORD_RESET",
        "PASSWORD_CHANGE",
      ],
      confirmation_status: ["confirmed", "declined"],
      event_type: ["championship", "training", "social"],
      gender_type: ["male", "female", "both"],
      training_type: ["principal", "extra"],
    },
  },
} as const
