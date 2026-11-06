// Generated from the live Supabase schema (supabase gen types, 2026-11-06),
// trimmed to the tables Tint Notes reads. Regenerate from the SnapTip repo:
//   npx supabase gen types typescript --linked --schema public
// then re-run the trim (keep only installer_* / profiles / vehicle_catalog).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      installer_note_difficulty: {
        Row: {
          back_glass: number | null
          id: string
          note_id: string
          overall: number | null
          quarter_glass: number | null
          rollups: number | null
          sunroof: number | null
          windshield: number | null
        }
        Insert: {
          back_glass?: number | null
          id?: string
          note_id: string
          overall?: number | null
          quarter_glass?: number | null
          rollups?: number | null
          sunroof?: number | null
          windshield?: number | null
        }
        Update: {
          back_glass?: number | null
          id?: string
          note_id?: string
          overall?: number | null
          quarter_glass?: number | null
          rollups?: number | null
          sunroof?: number | null
          windshield?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "installer_note_difficulty_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "installer_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      installer_note_media: {
        Row: {
          created_at: string
          id: string
          note_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "installer_note_media_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "installer_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      installer_note_ppf_difficulty: {
        Row: {
          doors: number | null
          fender: number | null
          front_bumper: number | null
          hood: number | null
          id: string
          note_id: string
          overall: number | null
          quarter_panels: number | null
          rear_bumper: number | null
          roof: number | null
          trunk_lid: number | null
        }
        Insert: {
          doors?: number | null
          fender?: number | null
          front_bumper?: number | null
          hood?: number | null
          id?: string
          note_id: string
          overall?: number | null
          quarter_panels?: number | null
          rear_bumper?: number | null
          roof?: number | null
          trunk_lid?: number | null
        }
        Update: {
          doors?: number | null
          fender?: number | null
          front_bumper?: number | null
          hood?: number | null
          id?: string
          note_id?: string
          overall?: number | null
          quarter_panels?: number | null
          rear_bumper?: number | null
          roof?: number | null
          trunk_lid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "installer_note_ppf_difficulty_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "installer_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      installer_note_ratings: {
        Row: {
          created_at: string
          id: string
          note_id: string
          review: string
          stars: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          review?: string
          stars: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          review?: string
          stars?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installer_note_ratings_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "installer_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installer_note_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installer_note_reports: {
        Row: {
          created_at: string
          id: string
          note_id: string
          reason: string | null
          reported_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          reason?: string | null
          reported_by: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          reason?: string | null
          reported_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "installer_note_reports_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "installer_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installer_note_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installer_notes: {
        Row: {
          common_problems: string | null
          created_at: string
          facebook_url: string | null
          general_tips: string
          group_id: string
          id: string
          note_type: string
          status: string
          tools_needed: string | null
          trim_package: string | null
          updated_at: string
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          common_problems?: string | null
          created_at?: string
          facebook_url?: string | null
          general_tips: string
          group_id: string
          id?: string
          note_type?: string
          status?: string
          tools_needed?: string | null
          trim_package?: string | null
          updated_at?: string
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          common_problems?: string | null
          created_at?: string
          facebook_url?: string | null
          general_tips?: string
          group_id?: string
          id?: string
          note_type?: string
          status?: string
          tools_needed?: string | null
          trim_package?: string | null
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installer_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installer_notification_preferences: {
        Row: {
          email: boolean
          id: string
          in_app: boolean
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          email?: boolean
          id?: string
          in_app?: boolean
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          email?: boolean
          id?: string
          in_app?: boolean
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      installer_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installer_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installer_rating_reports: {
        Row: {
          created_at: string
          id: string
          rating_id: string
          reason: string
          reason_detail: string | null
          reported_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating_id: string
          reason: string
          reason_detail?: string | null
          reported_by: string
        }
        Update: {
          created_at?: string
          id?: string
          rating_id?: string
          reason?: string
          reason_detail?: string | null
          reported_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "installer_rating_reports_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "installer_note_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installer_rating_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          avg_rating: number
          contributor_score: number
          created_at: string
          full_name: string | null
          id: string
          installer_role: string
          notes_count: number
          phone: string | null
          plan: string
          signup_domain: string
          suspended_until: string | null
          suspension_reason: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          avg_rating?: number
          contributor_score?: number
          created_at?: string
          full_name?: string | null
          id: string
          installer_role?: string
          notes_count?: number
          phone?: string | null
          plan?: string
          signup_domain?: string
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          avg_rating?: number
          contributor_score?: number
          created_at?: string
          full_name?: string | null
          id?: string
          installer_role?: string
          notes_count?: number
          phone?: string | null
          plan?: string
          signup_domain?: string
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      vehicle_catalog: {
        Row: {
          body_type: string
          body_type_alt: string
          created_at: string
          generation: number
          group_id: string | null
          id: string
          include_front_2: boolean | null
          make: string
          model: string
          updated_at: string
          year: number
        }
        Insert: {
          body_type: string
          body_type_alt: string
          created_at?: string
          generation?: number
          group_id?: string | null
          id?: string
          include_front_2?: boolean | null
          make: string
          model: string
          updated_at?: string
          year: number
        }
        Update: {
          body_type?: string
          body_type_alt?: string
          created_at?: string
          generation?: number
          group_id?: string | null
          id?: string
          include_front_2?: boolean | null
          make?: string
          model?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type Tables = Database['public']['Tables'];
export type Row<T extends keyof Tables> = Tables[T]['Row'];
export type Insert<T extends keyof Tables> = Tables[T]['Insert'];
export type Update<T extends keyof Tables> = Tables[T]['Update'];
