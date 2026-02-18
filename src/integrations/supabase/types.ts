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
      academic_years: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          is_current: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          is_current?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_current?: boolean
          created_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          batch_id: string
          date: string
          id: string
          marked_at: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          batch_id: string
          date?: string
          id?: string
          marked_at?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          batch_id?: string
          date?: string
          id?: string
          marked_at?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
      }
      batches: {
        Row: {
          academic_year_id: string | null
          capacity: number | null
          course_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          schedule: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["student_status"]
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          capacity?: number | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          schedule?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          capacity?: number | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          schedule?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          batch_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          meeting_link: string | null
          room: string | null
          start_time: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          meeting_link?: string | null
          room?: string | null
          start_time: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          meeting_link?: string | null
          room?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          base_fee: number | null
          created_at: string
          description: string | null
          duration_weeks: number | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          base_fee?: number | null
          created_at?: string
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          base_fee?: number | null
          created_at?: string
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          end_date: string | null
          event_type: string
          batch_id: string | null
          academic_year_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          end_date?: string | null
          event_type?: string
          batch_id?: string | null
          academic_year_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          end_date?: string | null
          event_type?: string
          batch_id?: string | null
          academic_year_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          exam_id: string
          graded_at: string
          id: string
          is_absent: boolean
          marks_obtained: number
          remarks: string | null
          student_id: string
        }
        Insert: {
          exam_id: string
          graded_at?: string
          id?: string
          is_absent?: boolean
          marks_obtained?: number
          remarks?: string | null
          student_id: string
        }
        Update: {
          exam_id?: string
          graded_at?: string
          id?: string
          is_absent?: boolean
          marks_obtained?: number
          remarks?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          batch_id: string | null
          created_at: string
          duration_minutes: number | null
          exam_date: string | null
          exam_type: string | null
          id: string
          instructions: string | null
          passing_marks: number | null
          status: string | null
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          exam_date?: string | null
          exam_type?: string | null
          id?: string
          instructions?: string | null
          passing_marks?: number | null
          status?: string | null
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          exam_date?: string | null
          exam_type?: string | null
          id?: string
          instructions?: string | null
          passing_marks?: number | null
          status?: string | null
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_templates: {
        Row: {
          id: string
          name: string
          course_id: string | null
          amount: number
          frequency: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          course_id?: string | null
          amount: number
          frequency?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          course_id?: string | null
          amount?: number
          frequency?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_templates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          amount: number
          batch_id: string | null
          created_at: string
          description: string | null
          discount: number | null
          due_date: string
          id: string
          late_fee: number | null
          paid_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          receipt_number: string | null
          status: Database["public"]["Enums"]["fee_status"]
          student_id: string
          transaction_ref: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          batch_id?: string | null
          created_at?: string
          description?: string | null
          discount?: number | null
          due_date: string
          id?: string
          late_fee?: number | null
          paid_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["fee_status"]
          student_id: string
          transaction_ref?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          batch_id?: string | null
          created_at?: string
          description?: string | null
          discount?: number | null
          due_date?: string
          id?: string
          late_fee?: number | null
          paid_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["fee_status"]
          student_id?: string
          transaction_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          message_type: string | null
          read: boolean | null
          recipient_id: string | null
          recipient_type: string
          scheduled_at: string | null
          sender_id: string | null
          sent_at: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          message_type?: string | null
          read?: boolean | null
          recipient_id?: string | null
          recipient_type: string
          scheduled_at?: string | null
          sender_id?: string | null
          sent_at?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          message_type?: string | null
          read?: boolean | null
          recipient_id?: string | null
          recipient_type?: string
          scheduled_at?: string | null
          sender_id?: string | null
          sent_at?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          id: string
          read: boolean | null
          title: string
          type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean | null
          title: string
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parent_students: {
        Row: {
          id: string
          parent_id: string
          student_id: string
        }
        Insert: {
          id?: string
          parent_id: string
          student_id: string
        }
        Update: {
          id?: string
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          occupation: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          occupation?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          occupation?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          resource: string
          can_read: boolean
          can_create: boolean
          can_update: boolean
          can_delete: boolean
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          resource: string
          can_read?: boolean
          can_create?: boolean
          can_update?: boolean
          can_delete?: boolean
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          resource?: string
          can_read?: boolean
          can_create?: boolean
          can_update?: boolean
          can_delete?: boolean
        }
        Relationships: []
      }
      student_batches: {
        Row: {
          batch_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          batch_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          batch_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_batches_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_batches_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          id: string
          student_id: string
          document_type: string
          file_url: string
          file_name: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          student_id: string
          document_type: string
          file_url: string
          file_name?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          document_type?: string
          file_url?: string
          file_name?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          joined_at: string
          notes: string | null
          phone: string | null
          profile_photo: string | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          phone?: string | null
          profile_photo?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          phone?: string | null
          profile_photo?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: []
      }
      teacher_documents: {
        Row: {
          id: string
          teacher_id: string
          document_type: string
          file_url: string
          file_name: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          document_type: string
          file_url: string
          file_name?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          document_type?: string
          file_url?: string
          file_name?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_documents_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          experience_yrs: number | null
          full_name: string
          gender: string | null
          id: string
          notes: string | null
          phone: string | null
          profile_photo: string | null
          qualification: string | null
          salary: number | null
          status: Database["public"]["Enums"]["student_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          experience_yrs?: number | null
          full_name: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          profile_photo?: string | null
          qualification?: string | null
          salary?: number | null
          status?: Database["public"]["Enums"]["student_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          experience_yrs?: number | null
          full_name?: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          profile_photo?: string | null
          qualification?: string | null
          salary?: number | null
          status?: Database["public"]["Enums"]["student_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          avatar_url: string | null
          phone: string | null
          teacher_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          avatar_url?: string | null
          phone?: string | null
          teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          avatar_url?: string | null
          phone?: string | null
          teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_student_summary: {
        Row: {
          id: string | null
          full_name: string | null
          email: string | null
          phone: string | null
          status: string | null
          joined_at: string | null
          gender: string | null
          date_of_birth: string | null
          batch_count: number | null
          parent_count: number | null
          pending_fees: number | null
          overdue_fees: number | null
          paid_fees: number | null
        }
        Relationships: []
      }
      v_batch_summary: {
        Row: {
          id: string | null
          name: string | null
          status: string | null
          start_date: string | null
          end_date: string | null
          schedule: string | null
          capacity: number | null
          course_name: string | null
          teacher_name: string | null
          student_count: number | null
          schedule_count: number | null
        }
        Relationships: []
      }
      v_fee_summary: {
        Row: {
          id: string | null
          amount: number | null
          due_date: string | null
          paid_date: string | null
          status: string | null
          description: string | null
          payment_method: string | null
          transaction_ref: string | null
          receipt_number: string | null
          discount: number | null
          late_fee: number | null
          created_at: string | null
          student_name: string | null
          student_email: string | null
          student_phone: string | null
          batch_name: string | null
        }
        Relationships: []
      }
      v_attendance_summary: {
        Row: {
          batch_id: string | null
          batch_name: string | null
          date: string | null
          total: number | null
          present: number | null
          absent: number | null
          late: number | null
          attendance_pct: number | null
        }
        Relationships: []
      }
      v_exam_results: {
        Row: {
          id: string | null
          marks_obtained: number | null
          is_absent: boolean | null
          remarks: string | null
          graded_at: string | null
          exam_title: string | null
          total_marks: number | null
          exam_date: string | null
          exam_type: string | null
          exam_status: string | null
          batch_name: string | null
          student_name: string | null
          student_email: string | null
          percentage: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_dashboard_metrics: { Args: Record<PropertyKey, never>; Returns: Json }
      get_attendance_report: {
        Args: {
          p_batch_id?: string
          p_from_date?: string
          p_to_date?: string
        }
        Returns: Json
      }
      get_fee_report: {
        Args: {
          p_from_date?: string
          p_to_date?: string
        }
        Returns: Json
      }
      get_exam_performance: {
        Args: { p_exam_id: string }
        Returns: Json
      }
      mark_overdue_fees: { Args: Record<PropertyKey, never>; Returns: void }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late"
      exam_status: "upcoming" | "ongoing" | "completed" | "cancelled"
      exam_type: "MCQ" | "written" | "practical" | "oral" | "online" | "mock"
      fee_status: "paid" | "pending" | "overdue"
      message_type: "general" | "class-update" | "schedule-change" | "exam-announcement" | "fee-reminder" | "emergency"
      notification_type: "system" | "fee" | "exam" | "attendance" | "message" | "enrollment"
      payment_method: "cash" | "bank_transfer" | "upi" | "cheque" | "card" | "other"
      recipient_type: "student" | "parent" | "teacher" | "batch" | "all-students" | "all-parents" | "all-teachers"
      student_status: "active" | "inactive" | "alumni"
      user_role: "super_admin" | "management_admin" | "academic_coordinator" | "teacher" | "finance_manager" | "support_staff"
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
      attendance_status: ["present", "absent", "late"],
      exam_status: ["upcoming", "ongoing", "completed", "cancelled"],
      exam_type: ["MCQ", "written", "practical", "oral", "online", "mock"],
      fee_status: ["paid", "pending", "overdue"],
      message_type: ["general", "class-update", "schedule-change", "exam-announcement", "fee-reminder", "emergency"],
      notification_type: ["system", "fee", "exam", "attendance", "message", "enrollment"],
      payment_method: ["cash", "bank_transfer", "upi", "cheque", "card", "other"],
      recipient_type: ["student", "parent", "teacher", "batch", "all-students", "all-parents", "all-teachers"],
      student_status: ["active", "inactive", "alumni"],
      user_role: ["super_admin", "management_admin", "academic_coordinator", "teacher", "finance_manager", "support_staff"],
    },
  },
} as const
