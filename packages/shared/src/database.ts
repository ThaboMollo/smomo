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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      booking_requests: {
        Row: {
          address: string | null
          booking_mode: Database["public"]["Enums"]["booking_mode"]
          budget_max: number | null
          budget_min: number | null
          category: Database["public"]["Enums"]["service_category"]
          city: string | null
          client_consented_to_portfolio: boolean
          client_id: string
          created_at: string
          description: string | null
          expires_at: string
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          location: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          target_practitioner_id: string | null
        }
        Insert: {
          address?: string | null
          booking_mode: Database["public"]["Enums"]["booking_mode"]
          budget_max?: number | null
          budget_min?: number | null
          category: Database["public"]["Enums"]["service_category"]
          city?: string | null
          client_consented_to_portfolio?: boolean
          client_id: string
          created_at?: string
          description?: string | null
          expires_at: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          location?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          target_practitioner_id?: string | null
        }
        Update: {
          address?: string | null
          booking_mode?: Database["public"]["Enums"]["booking_mode"]
          budget_max?: number | null
          budget_min?: number | null
          category?: Database["public"]["Enums"]["service_category"]
          city?: string | null
          client_consented_to_portfolio?: boolean
          client_id?: string
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          location?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          target_practitioner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_target_practitioner_id_fkey"
            columns: ["target_practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          booking_mode: Database["public"]["Enums"]["booking_mode"]
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          category: Database["public"]["Enums"]["service_category"]
          client_consented_to_portfolio: boolean
          client_id: string
          completed_at: string | null
          created_at: string
          deposit_amount_zar: number | null
          final_price_zar: number
          id: string
          in_progress_at: string | null
          lat: number | null
          lng: number | null
          location: string | null
          offer_id: string | null
          practitioner_id: string
          request_id: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          address?: string | null
          booking_mode: Database["public"]["Enums"]["booking_mode"]
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category: Database["public"]["Enums"]["service_category"]
          client_consented_to_portfolio?: boolean
          client_id: string
          completed_at?: string | null
          created_at?: string
          deposit_amount_zar?: number | null
          final_price_zar: number
          id?: string
          in_progress_at?: string | null
          lat?: number | null
          lng?: number | null
          location?: string
          offer_id?: string | null
          practitioner_id: string
          request_id?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          address?: string | null
          booking_mode?: Database["public"]["Enums"]["booking_mode"]
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category?: Database["public"]["Enums"]["service_category"]
          client_consented_to_portfolio?: boolean
          client_id?: string
          completed_at?: string | null
          created_at?: string
          deposit_amount_zar?: number | null
          final_price_zar?: number
          id?: string
          in_progress_at?: string | null
          lat?: number | null
          lng?: number | null
          location?: string
          offer_id?: string | null
          practitioner_id?: string
          request_id?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "request_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      device_push_tokens: {
        Row: {
          created_at: string
          expo_push_token: string
          id: string
          platform: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expo_push_token: string
          id?: string
          platform?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expo_push_token?: string
          id?: string
          platform?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_zar: number
          booking_id: string
          created_at: string
          dispute_reason: string | null
          id: string
          marked_paid_at: string | null
          method: string
          payee_id: string
          payer_id: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          payshap_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_zar: number
          booking_id: string
          created_at?: string
          dispute_reason?: string | null
          id?: string
          marked_paid_at?: string | null
          method?: string
          payee_id: string
          payer_id: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          payshap_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_zar?: number
          booking_id?: string
          created_at?: string
          dispute_reason?: string | null
          id?: string
          marked_paid_at?: string | null
          method?: string
          payee_id?: string
          payer_id?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          payshap_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          booking_id: string | null
          caption: string | null
          category: Database["public"]["Enums"]["service_category"] | null
          created_at: string
          id: string
          image_url: string
          is_public: boolean
          practitioner_id: string
          source: string
        }
        Insert: {
          booking_id?: string | null
          caption?: string | null
          category?: Database["public"]["Enums"]["service_category"] | null
          created_at?: string
          id?: string
          image_url: string
          is_public?: boolean
          practitioner_id: string
          source?: string
        }
        Update: {
          booking_id?: string | null
          caption?: string | null
          category?: Database["public"]["Enums"]["service_category"] | null
          created_at?: string
          id?: string
          image_url?: string
          is_public?: boolean
          practitioner_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_booking_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_categories: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          practitioner_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          practitioner_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          practitioner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_categories_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioner_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_categories_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_payout: {
        Row: {
          payshap_proxy: string | null
          practitioner_id: string
          updated_at: string
        }
        Insert: {
          payshap_proxy?: string | null
          practitioner_id: string
          updated_at?: string
        }
        Update: {
          payshap_proxy?: string | null
          practitioner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_payout_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: true
            referencedRelation: "practitioner_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_payout_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: true
            referencedRelation: "practitioner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_profiles: {
        Row: {
          base_address: string | null
          base_lat: number | null
          base_lng: number | null
          base_location: string | null
          bio: string | null
          business_name: string | null
          city: string | null
          created_at: string
          deposit_percentage: number | null
          id: string
          is_online: boolean
          jobs_done: number
          rating: number | null
          rating_count: number
          requires_deposit: boolean
          service_mode: Database["public"]["Enums"]["service_mode"]
          slug: string | null
          travel_radius_km: number
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          years_experience: number | null
        }
        Insert: {
          base_address?: string | null
          base_lat?: number | null
          base_lng?: number | null
          base_location?: string
          bio?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          deposit_percentage?: number | null
          id: string
          is_online?: boolean
          jobs_done?: number
          rating?: number | null
          rating_count?: number
          requires_deposit?: boolean
          service_mode?: Database["public"]["Enums"]["service_mode"]
          slug?: string | null
          travel_radius_km?: number
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          years_experience?: number | null
        }
        Update: {
          base_address?: string | null
          base_lat?: number | null
          base_lng?: number | null
          base_location?: string
          bio?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          deposit_percentage?: number | null
          id?: string
          is_online?: boolean
          jobs_done?: number
          rating?: number | null
          rating_count?: number
          requires_deposit?: boolean
          service_mode?: Database["public"]["Enums"]["service_mode"]
          slug?: string | null
          travel_radius_km?: number
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_socials: {
        Row: {
          created_at: string
          handle: string
          platform: Database["public"]["Enums"]["social_platform"]
          practitioner_id: string
        }
        Insert: {
          created_at?: string
          handle: string
          platform: Database["public"]["Enums"]["social_platform"]
          practitioner_id: string
        }
        Update: {
          created_at?: string
          handle?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          practitioner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_socials_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioner_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_socials_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_verification_events: {
        Row: {
          created_at: string
          decided_by: string
          from_status: Database["public"]["Enums"]["verification_status"]
          id: string
          note: string | null
          practitioner_id: string
          to_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          decided_by: string
          from_status: Database["public"]["Enums"]["verification_status"]
          id?: string
          note?: string | null
          practitioner_id: string
          to_status: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          decided_by?: string
          from_status?: Database["public"]["Enums"]["verification_status"]
          id?: string
          note?: string | null
          practitioner_id?: string
          to_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_verification_events_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_verification_events_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioner_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_verification_events_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_contact: {
        Row: {
          home_address: string | null
          phone: string | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          home_address?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          home_address?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_contact_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_rating: number | null
          client_rating_count: number
          created_at: string
          first_name: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          is_practitioner: boolean
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          client_rating?: number | null
          client_rating_count?: number
          created_at?: string
          first_name?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
          is_practitioner?: boolean
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          client_rating?: number | null
          client_rating_count?: number
          created_at?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          is_practitioner?: boolean
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          booking_id: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolution: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolution?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolution?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      request_offers: {
        Row: {
          created_at: string
          id: string
          message: string | null
          offered_price_zar: number
          practitioner_id: string
          request_id: string
          status: Database["public"]["Enums"]["offer_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          offered_price_zar: number
          practitioner_id: string
          request_id: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          offered_price_zar?: number
          practitioner_id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_offers_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          direction: Database["public"]["Enums"]["review_direction"]
          id: string
          proof_image_url: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["review_direction"]
          id?: string
          proof_image_url?: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["review_direction"]
          id?: string
          proof_image_url?: string | null
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          indicative_price_zar: number | null
          is_active: boolean
          practitioner_id: string
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          indicative_price_zar?: number | null
          is_active?: boolean
          practitioner_id: string
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          indicative_price_zar?: number | null
          is_active?: boolean
          practitioner_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          practitioner_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          practitioner_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          practitioner_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_identity: {
        Row: {
          created_at: string
          id_citizenship: string | null
          id_country: string | null
          id_dob: string | null
          id_gender: string | null
          id_number: string
          id_type: Database["public"]["Enums"]["id_type"]
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id_citizenship?: string | null
          id_country?: string | null
          id_dob?: string | null
          id_gender?: string | null
          id_number: string
          id_type: Database["public"]["Enums"]["id_type"]
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id_citizenship?: string | null
          id_country?: string | null
          id_dob?: string | null
          id_gender?: string | null
          id_number?: string
          id_type?: Database["public"]["Enums"]["id_type"]
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_identity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      practitioner_directory: {
        Row: {
          avatar_url: string | null
          base_address: string | null
          base_lat: number | null
          base_lng: number | null
          bio: string | null
          business_name: string | null
          categories: Database["public"]["Enums"]["service_category"][] | null
          created_at: string | null
          deposit_percentage: number | null
          full_name: string | null
          id: string | null
          is_online: boolean | null
          jobs_done: number | null
          min_price: number | null
          rating: number | null
          rating_count: number | null
          requires_deposit: boolean | null
          service_mode: Database["public"]["Enums"]["service_mode"] | null
          slug: string | null
          socials: Json | null
          travel_radius_km: number | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          years_experience: number | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_offer: { Args: { p_offer_id: string }; Returns: string }
      booking_counterparty_contact: {
        Args: { p_booking_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          phone: string
          user_id: string
        }[]
      }
      complete_booking: {
        Args: {
          p_booking_id: string
          p_comment?: string
          p_proof_image_url: string
          p_rating: number
        }
        Returns: undefined
      }
      create_request: {
        Args: {
          p_address?: string
          p_booking_mode: Database["public"]["Enums"]["booking_mode"]
          p_budget_max?: number
          p_budget_min?: number
          p_category: Database["public"]["Enums"]["service_category"]
          p_city?: string
          p_consent?: boolean
          p_description?: string
          p_expires_minutes?: number
          p_image_url?: string
          p_lat?: number
          p_lng?: number
          p_scheduled_at?: string
          p_target?: string
        }
        Returns: string
      }
      feed_requests_for_practitioner: {
        Args: { p_studio_radius_km?: number }
        Returns: {
          booking_mode: Database["public"]["Enums"]["booking_mode"]
          budget_max: number
          budget_min: number
          category: Database["public"]["Enums"]["service_category"]
          city: string
          client_id: string
          client_name: string
          client_rating: number
          created_at: string
          description: string
          distance_km: number
          expires_at: string
          has_offered: boolean
          image_url: string
          request_id: string
          scheduled_at: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      make_offer: {
        Args: { p_message?: string; p_price: number; p_request_id: string }
        Returns: string
      }
      mark_payment_paid: {
        Args: { p_payment_id: string; p_reference: string }
        Returns: undefined
      }
      resolve_dispute: {
        Args: {
          p_payment_id: string
          p_resolve_as: Database["public"]["Enums"]["payment_status"]
        }
        Returns: undefined
      }
      resolve_report: {
        Args: {
          p_report_id: string
          p_resolution?: string
          p_status: Database["public"]["Enums"]["report_status"]
        }
        Returns: undefined
      }
      save_business_profile: {
        Args: {
          p_bio?: string
          p_business_name: string
          p_categories: Database["public"]["Enums"]["service_category"][]
          p_deposit_percentage?: number
          p_facebook?: string
          p_instagram?: string
          p_requires_deposit: boolean
          p_service_mode: Database["public"]["Enums"]["service_mode"]
          p_tiktok?: string
          p_travel_radius_km: number
          p_x_handle?: string
          p_years_experience?: number
        }
        Returns: undefined
      }
      search_providers: {
        Args: {
          p_category?: Database["public"]["Enums"]["service_category"]
          p_city?: string
          p_lat?: number
          p_lng?: number
          p_max_km?: number
          p_mode?: Database["public"]["Enums"]["booking_mode"]
        }
        Returns: {
          avatar_url: string
          business_name: string
          categories: Database["public"]["Enums"]["service_category"][]
          distance_km: number
          id: string
          is_online: boolean
          jobs_done: number
          lat: number
          lng: number
          min_price: number
          rating: number
          rating_count: number
          service_mode: Database["public"]["Enums"]["service_mode"]
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
      }
      set_practitioner_location: {
        Args: {
          p_address?: string
          p_city?: string
          p_lat?: number
          p_lng?: number
        }
        Returns: undefined
      }
      set_practitioner_payout: {
        Args: { p_payshap_proxy: string }
        Returns: undefined
      }
      set_practitioner_verification: {
        Args: {
          p_note?: string
          p_practitioner_id: string
          p_status: Database["public"]["Enums"]["verification_status"]
        }
        Returns: undefined
      }
      set_profile_contact: {
        Args: {
          p_home_address?: string
          p_phone?: string
          p_whatsapp_number?: string
        }
        Returns: undefined
      }
      slugify: { Args: { txt: string }; Returns: string }
      validate_sa_id: { Args: { p_id: string }; Returns: Json }
      verify_payment: {
        Args: {
          p_dispute_reason?: string
          p_payment_id: string
          p_verified: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      booking_mode: "studio" | "mobile"
      booking_status: "confirmed" | "in_progress" | "completed" | "cancelled"
      id_type: "sa_id" | "passport"
      offer_status: "pending" | "accepted" | "rejected" | "withdrawn"
      payment_status: "pending" | "verified" | "rejected" | "disputed"
      payment_type: "deposit" | "balance" | "full"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      request_status: "open" | "matched" | "expired" | "cancelled"
      review_direction: "c2p" | "p2c"
      service_category:
        | "beautician"
        | "hairdresser"
        | "makeup_artist"
        | "nail_technician"
        | "tattoo_artist"
      service_mode: "studio" | "mobile" | "both"
      social_platform: "instagram" | "facebook" | "tiktok" | "x"
      subscription_status: "trialing" | "active" | "past_due" | "canceled"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      booking_mode: ["studio", "mobile"],
      booking_status: ["confirmed", "in_progress", "completed", "cancelled"],
      id_type: ["sa_id", "passport"],
      offer_status: ["pending", "accepted", "rejected", "withdrawn"],
      payment_status: ["pending", "verified", "rejected", "disputed"],
      payment_type: ["deposit", "balance", "full"],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      request_status: ["open", "matched", "expired", "cancelled"],
      review_direction: ["c2p", "p2c"],
      service_category: [
        "beautician",
        "hairdresser",
        "makeup_artist",
        "nail_technician",
        "tattoo_artist",
      ],
      service_mode: ["studio", "mobile", "both"],
      social_platform: ["instagram", "facebook", "tiktok", "x"],
      subscription_status: ["trialing", "active", "past_due", "canceled"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
