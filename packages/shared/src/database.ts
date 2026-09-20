export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
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
          client_consented_to_portfolio: boolean
          client_id: string
          created_at: string
          description: string | null
          expires_at: string
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          location: unknown
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
          client_consented_to_portfolio?: boolean
          client_id: string
          created_at?: string
          description?: string | null
          expires_at: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          location: unknown
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
          client_consented_to_portfolio?: boolean
          client_id?: string
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          location?: unknown
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          target_practitioner_id?: string | null
        }
        Relationships: []
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
          location: unknown
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
          location?: unknown
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
          location?: unknown
          offer_id?: string | null
          practitioner_id?: string
          request_id?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      practitioner_profiles: {
        Row: {
          base_address: string | null
          base_lat: number | null
          base_lng: number | null
          base_location: unknown
          bio: string | null
          business_name: string | null
          categories: Database["public"]["Enums"]["service_category"][]
          created_at: string
          deposit_percentage: number | null
          facebook: string | null
          id: string
          instagram: string | null
          is_online: boolean
          jobs_done: number
          payshap_proxy: string | null
          rating: number | null
          tiktok: string | null
          x_handle: string | null
          rating_count: number
          requires_deposit: boolean
          slug: string | null
          service_mode: Database["public"]["Enums"]["service_mode"]
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
          base_location?: unknown
          bio?: string | null
          business_name?: string | null
          categories?: Database["public"]["Enums"]["service_category"][]
          created_at?: string
          deposit_percentage?: number | null
          facebook?: string | null
          id: string
          instagram?: string | null
          is_online?: boolean
          jobs_done?: number
          payshap_proxy?: string | null
          rating?: number | null
          tiktok?: string | null
          x_handle?: string | null
          rating_count?: number
          requires_deposit?: boolean
          slug?: string | null
          service_mode?: Database["public"]["Enums"]["service_mode"]
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
          base_location?: unknown
          bio?: string | null
          business_name?: string | null
          categories?: Database["public"]["Enums"]["service_category"][]
          created_at?: string
          deposit_percentage?: number | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_online?: boolean
          jobs_done?: number
          payshap_proxy?: string | null
          rating?: number | null
          tiktok?: string | null
          x_handle?: string | null
          rating_count?: number
          requires_deposit?: boolean
          slug?: string | null
          service_mode?: Database["public"]["Enums"]["service_mode"]
          travel_radius_km?: number
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_rating: number | null
          client_rating_count: number
          created_at: string
          first_name: string | null
          full_name: string | null
          home_address: string | null
          id: string
          is_admin: boolean
          is_practitioner: boolean
          last_name: string | null
          phone: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          client_rating?: number | null
          client_rating_count?: number
          created_at?: string
          first_name?: string | null
          full_name?: string | null
          home_address?: string | null
          id: string
          is_admin?: boolean
          is_practitioner?: boolean
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          client_rating?: number | null
          client_rating_count?: number
          created_at?: string
          first_name?: string | null
          full_name?: string | null
          home_address?: string | null
          id?: string
          is_admin?: boolean
          is_practitioner?: boolean
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_offer: { Args: { p_offer_id: string }; Returns: string }
      create_request: {
        Args: {
          p_address?: string
          p_booking_mode: Database["public"]["Enums"]["booking_mode"]
          p_budget_max?: number
          p_budget_min?: number
          p_category: Database["public"]["Enums"]["service_category"]
          p_consent?: boolean
          p_description?: string
          p_expires_minutes?: number
          p_image_url?: string
          p_lat: number
          p_lng: number
          p_scheduled_at?: string
          p_target?: string
        }
        Returns: string
      }
      feed_requests_for_practitioner: {
        Args: { p_studio_radius_km?: number }
        Returns: {
          address: string
          booking_mode: Database["public"]["Enums"]["booking_mode"]
          budget_max: number
          budget_min: number
          category: Database["public"]["Enums"]["service_category"]
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
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      make_offer: {
        Args: { p_message?: string; p_price: number; p_request_id: string }
        Returns: string
      }
      mark_payment_paid: {
        Args: { p_payment_id: string; p_reference: string }
        Returns: undefined
      }
      search_providers: {
        Args: {
          p_category?: Database["public"]["Enums"]["service_category"]
          p_lat: number
          p_lng: number
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
        Args: { p_address?: string; p_lat: number; p_lng: number }
        Returns: undefined
      }
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
      subscription_status: "trialing" | "active" | "past_due" | "canceled"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
