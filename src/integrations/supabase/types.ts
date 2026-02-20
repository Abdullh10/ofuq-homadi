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
      alert_settings: {
        Row: {
          class_gap_threshold: number | null
          consecutive_decline_weeks: number | null
          id: string
          max_negative_behaviors: number | null
          min_average: number | null
          updated_at: string
        }
        Insert: {
          class_gap_threshold?: number | null
          consecutive_decline_weeks?: number | null
          id?: string
          max_negative_behaviors?: number | null
          min_average?: number | null
          updated_at?: string
        }
        Update: {
          class_gap_threshold?: number | null
          consecutive_decline_weeks?: number | null
          id?: string
          max_negative_behaviors?: number | null
          min_average?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          severity: string
          student_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          severity?: string
          student_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      behaviors: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          student_id: string
          type: string
        }
        Insert: {
          created_at?: string
          date?: string
          description: string
          id?: string
          student_id: string
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "behaviors_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          class_interaction_score: number | null
          created_at: string
          exam_score: number | null
          homework_score: number | null
          id: string
          notes: string | null
          participation_score: number | null
          practical_score: number | null
          project_score: number | null
          student_id: string
          week_number: number
        }
        Insert: {
          class_interaction_score?: number | null
          created_at?: string
          exam_score?: number | null
          homework_score?: number | null
          id?: string
          notes?: string | null
          participation_score?: number | null
          practical_score?: number | null
          project_score?: number | null
          student_id: string
          week_number: number
        }
        Update: {
          class_interaction_score?: number | null
          created_at?: string
          exam_score?: number | null
          homework_score?: number | null
          id?: string
          notes?: string | null
          participation_score?: number | null
          practical_score?: number | null
          project_score?: number | null
          student_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          outcome: string | null
          student_id: string
          type: string
        }
        Insert: {
          created_at?: string
          date?: string
          description: string
          id?: string
          outcome?: string | null
          student_id: string
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          outcome?: string | null
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_meetings: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string
          recommendations: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          notes: string
          recommendations?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string
          recommendations?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_meetings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          grade: string
          id: string
          name: string
          notes: string | null
          photo_url: string | null
          section: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade?: string
          id?: string
          name: string
          notes?: string | null
          photo_url?: string | null
          section?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          name?: string
          notes?: string | null
          photo_url?: string | null
          section?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      treatment_plans: {
        Row: {
          academic_plan: Json | null
          behavioral_plan: Json | null
          case_analysis: string | null
          counselor_role: string | null
          created_at: string
          duration_weeks: number | null
          id: string
          parent_role: string | null
          status: string
          student_id: string
          success_indicators: Json | null
          target_improvement: number | null
          updated_at: string
        }
        Insert: {
          academic_plan?: Json | null
          behavioral_plan?: Json | null
          case_analysis?: string | null
          counselor_role?: string | null
          created_at?: string
          duration_weeks?: number | null
          id?: string
          parent_role?: string | null
          status?: string
          student_id: string
          success_indicators?: Json | null
          target_improvement?: number | null
          updated_at?: string
        }
        Update: {
          academic_plan?: Json | null
          behavioral_plan?: Json | null
          case_analysis?: string | null
          counselor_role?: string | null
          created_at?: string
          duration_weeks?: number | null
          id?: string
          parent_role?: string | null
          status?: string
          student_id?: string
          success_indicators?: Json | null
          target_improvement?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
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
