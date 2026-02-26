// Database types for Rent-A-Vacation
// These types mirror the Supabase database schema

export type AppRole = 'rav_owner' | 'rav_admin' | 'rav_staff' | 'property_owner' | 'renter';

export type ListingStatus = 'draft' | 'pending_approval' | 'active' | 'booked' | 'completed' | 'cancelled';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export type AgreementStatus = 'pending' | 'active' | 'suspended' | 'terminated';

export type CancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'super_strict';

export type CancellationStatus = 'pending' | 'approved' | 'denied' | 'counter_offer' | 'completed';

export type OwnerTrustLevel = 'new' | 'verified' | 'trusted' | 'premium';

export type VerificationDocType =
  | 'timeshare_deed'
  | 'membership_certificate'
  | 'resort_contract'
  | 'points_statement'
  | 'government_id'
  | 'utility_bill'
  | 'other';

export type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';

export type EscrowStatus =
  | 'pending_confirmation'
  | 'confirmation_submitted'
  | 'verified'
  | 'released'
  | 'refunded'
  | 'disputed';

export type OwnerConfirmationStatus =
  | 'pending_owner'
  | 'owner_confirmed'
  | 'owner_timed_out'
  | 'owner_declined';

export type ApprovalStatus = 'pending_approval' | 'approved' | 'rejected';

export type RoleUpgradeStatus = 'pending' | 'approved' | 'rejected';

export type MembershipStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export type RoleCategory = 'traveler' | 'owner';

export interface MembershipTier {
  id: string;
  tier_key: string;
  role_category: RoleCategory;
  tier_name: string;
  tier_level: number;
  monthly_price_cents: number;
  voice_quota_daily: number;
  commission_discount_pct: number;
  max_active_listings: number | null;
  features: string[];
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserMembership {
  id: string;
  user_id: string;
  tier_id: string;
  status: MembershipStatus;
  started_at: string;
  expires_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserMembershipWithTier extends UserMembership {
  tier: MembershipTier;
}

export interface RoleUpgradeRequest {
  id: string;
  user_id: string;
  requested_role: AppRole;
  status: RoleUpgradeStatus;
  reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type VacationClubBrand =
  | 'hilton_grand_vacations'
  | 'marriott_vacation_club'
  | 'disney_vacation_club'
  | 'wyndham_destinations'
  | 'hyatt_residence_club'
  | 'bluegreen_vacations'
  | 'holiday_inn_club'
  | 'worldmark'
  | 'other';

// Resort master data types
export interface Resort {
  id: string;
  brand: VacationClubBrand;
  resort_name: string;
  location: {
    city: string;
    state: string;
    country: string;
    full_address: string;
  };
  description: string | null;
  contact: {
    phone: string;
    email: string;
    website: string;
  } | null;
  resort_amenities: string[];
  policies: {
    check_in: string;
    check_out: string;
    parking: string;
    pets: string;
  } | null;
  nearby_airports: string[];
  guest_rating: number | null;
  main_image_url: string | null;
  additional_images: string[];
  created_at: string;
  updated_at: string;
}

export interface ResortUnitType {
  id: string;
  resort_id: string;
  unit_type_name: string;
  bedrooms: number;
  bathrooms: number;
  max_occupancy: number;
  square_footage: number | null;
  kitchen_type: string | null;
  bedding_config: string | null;
  features: {
    balcony: boolean;
    view_type: string;
    washer_dryer: boolean;
    accessible: boolean;
  } | null;
  unit_amenities: string[];
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          approval_status: ApprovalStatus;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          is_seed_foundation: boolean;
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          stripe_charges_enabled: boolean;
          stripe_payouts_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          approval_status?: ApprovalStatus;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          is_seed_foundation?: boolean;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          stripe_charges_enabled?: boolean;
          stripe_payouts_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          approval_status?: ApprovalStatus;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          is_seed_foundation?: boolean;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          stripe_charges_enabled?: boolean;
          stripe_payouts_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: AppRole;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          brand: VacationClubBrand;
          resort_name: string;
          location: string;
          description: string | null;
          bedrooms: number;
          bathrooms: number;
          sleeps: number;
          amenities: string[];
          images: string[];
          resort_id: string | null;
          unit_type_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          brand: VacationClubBrand;
          resort_name: string;
          location: string;
          description?: string | null;
          bedrooms: number;
          bathrooms: number;
          sleeps: number;
          amenities?: string[];
          images?: string[];
          resort_id?: string | null;
          unit_type_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          brand?: VacationClubBrand;
          resort_name?: string;
          location?: string;
          description?: string | null;
          bedrooms?: number;
          bathrooms?: number;
          sleeps?: number;
          amenities?: string[];
          images?: string[];
          resort_id?: string | null;
          unit_type_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      owner_agreements: {
        Row: {
          id: string;
          owner_id: string;
          status: AgreementStatus;
          commission_rate: number;
          markup_allowed: boolean;
          max_markup_percent: number | null;
          terms_accepted_at: string | null;
          effective_date: string;
          expiry_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          status?: AgreementStatus;
          commission_rate: number;
          markup_allowed?: boolean;
          max_markup_percent?: number | null;
          terms_accepted_at?: string | null;
          effective_date: string;
          expiry_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          status?: AgreementStatus;
          commission_rate?: number;
          markup_allowed?: boolean;
          max_markup_percent?: number | null;
          terms_accepted_at?: string | null;
          effective_date?: string;
          expiry_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          property_id: string;
          owner_id: string;
          status: ListingStatus;
          check_in_date: string;
          check_out_date: string;
          owner_price: number;
          rav_markup: number;
          final_price: number;
          nightly_rate: number;
          notes: string | null;
          cancellation_policy: CancellationPolicy;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          owner_id: string;
          status?: ListingStatus;
          check_in_date: string;
          check_out_date: string;
          owner_price: number;
          rav_markup?: number;
          final_price: number;
          nightly_rate: number;
          notes?: string | null;
          cancellation_policy?: CancellationPolicy;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          owner_id?: string;
          status?: ListingStatus;
          check_in_date?: string;
          check_out_date?: string;
          owner_price?: number;
          rav_markup?: number;
          final_price?: number;
          nightly_rate?: number;
          notes?: string | null;
          cancellation_policy?: CancellationPolicy;
          approved_by?: string | null;
          approved_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      cancellation_requests: {
        Row: {
          id: string;
          booking_id: string;
          requester_id: string;
          status: CancellationStatus;
          reason: string;
          requested_refund_amount: number;
          policy_refund_amount: number;
          days_until_checkin: number;
          owner_response: string | null;
          counter_offer_amount: number | null;
          responded_at: string | null;
          final_refund_amount: number | null;
          refund_processed_at: string | null;
          refund_reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          requester_id: string;
          status?: CancellationStatus;
          reason: string;
          requested_refund_amount: number;
          policy_refund_amount: number;
          days_until_checkin: number;
          owner_response?: string | null;
          counter_offer_amount?: number | null;
          responded_at?: string | null;
          final_refund_amount?: number | null;
          refund_processed_at?: string | null;
          refund_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          requester_id?: string;
          status?: CancellationStatus;
          reason?: string;
          requested_refund_amount?: number;
          policy_refund_amount?: number;
          days_until_checkin?: number;
          owner_response?: string | null;
          counter_offer_amount?: number | null;
          responded_at?: string | null;
          final_refund_amount?: number | null;
          refund_processed_at?: string | null;
          refund_reference?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          listing_id: string;
          renter_id: string;
          status: BookingStatus;
          total_amount: number;
          rav_commission: number;
          owner_payout: number;
          guest_count: number;
          special_requests: string | null;
          payment_intent_id: string | null;
          paid_at: string | null;
          payout_status: PayoutStatus | null;
          payout_date: string | null;
          payout_reference: string | null;
          payout_notes: string | null;
          stripe_transfer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          renter_id: string;
          status?: BookingStatus;
          total_amount: number;
          rav_commission: number;
          owner_payout: number;
          guest_count?: number;
          special_requests?: string | null;
          payment_intent_id?: string | null;
          paid_at?: string | null;
          payout_status?: PayoutStatus | null;
          payout_date?: string | null;
          payout_reference?: string | null;
          payout_notes?: string | null;
          stripe_transfer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          renter_id?: string;
          status?: BookingStatus;
          total_amount?: number;
          rav_commission?: number;
          owner_payout?: number;
          guest_count?: number;
          special_requests?: string | null;
          payment_intent_id?: string | null;
          paid_at?: string | null;
          payout_status?: PayoutStatus | null;
          payout_date?: string | null;
          payout_reference?: string | null;
          payout_notes?: string | null;
          stripe_transfer_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      owner_verifications: {
        Row: {
          id: string;
          owner_id: string;
          trust_level: OwnerTrustLevel;
          kyc_verified: boolean;
          kyc_verified_at: string | null;
          kyc_provider: string | null;
          kyc_reference_id: string | null;
          phone_verified: boolean;
          phone_number: string | null;
          phone_verified_at: string | null;
          verification_status: VerificationStatus;
          verified_by: string | null;
          verified_at: string | null;
          rejection_reason: string | null;
          successful_stays: number;
          total_bookings: number;
          cancellation_count: number;
          dispute_count: number;
          average_rating: number | null;
          max_active_listings: number;
          max_listing_value: number;
          security_deposit_required: boolean;
          security_deposit_amount: number | null;
          security_deposit_paid: boolean;
          security_deposit_paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          trust_level?: OwnerTrustLevel;
          kyc_verified?: boolean;
          kyc_verified_at?: string | null;
          kyc_provider?: string | null;
          kyc_reference_id?: string | null;
          phone_verified?: boolean;
          phone_number?: string | null;
          phone_verified_at?: string | null;
          verification_status?: VerificationStatus;
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          successful_stays?: number;
          total_bookings?: number;
          cancellation_count?: number;
          dispute_count?: number;
          average_rating?: number | null;
          max_active_listings?: number;
          max_listing_value?: number;
          security_deposit_required?: boolean;
          security_deposit_amount?: number | null;
          security_deposit_paid?: boolean;
          security_deposit_paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          trust_level?: OwnerTrustLevel;
          kyc_verified?: boolean;
          kyc_verified_at?: string | null;
          kyc_provider?: string | null;
          kyc_reference_id?: string | null;
          phone_verified?: boolean;
          phone_number?: string | null;
          phone_verified_at?: string | null;
          verification_status?: VerificationStatus;
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          successful_stays?: number;
          total_bookings?: number;
          cancellation_count?: number;
          dispute_count?: number;
          average_rating?: number | null;
          max_active_listings?: number;
          max_listing_value?: number;
          security_deposit_required?: boolean;
          security_deposit_amount?: number | null;
          security_deposit_paid?: boolean;
          security_deposit_paid_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      verification_documents: {
        Row: {
          id: string;
          owner_id: string;
          verification_id: string;
          doc_type: VerificationDocType;
          file_path: string;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          status: VerificationStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          rejection_reason: string | null;
          expires_at: string | null;
          uploaded_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          verification_id: string;
          doc_type: VerificationDocType;
          file_path: string;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          status?: VerificationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
          expires_at?: string | null;
          uploaded_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          verification_id?: string;
          doc_type?: VerificationDocType;
          file_path?: string;
          file_name?: string;
          file_size?: number | null;
          mime_type?: string | null;
          status?: VerificationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_confirmations: {
        Row: {
          id: string;
          booking_id: string;
          listing_id: string;
          owner_id: string;
          resort_confirmation_number: string | null;
          confirmation_screenshot_path: string | null;
          confirmation_submitted_at: string | null;
          confirmation_deadline: string;
          verified_by_rav: boolean;
          rav_verifier_id: string | null;
          rav_verified_at: string | null;
          rav_verification_notes: string | null;
          resort_contact_name: string | null;
          resort_contact_phone: string | null;
          escrow_status: EscrowStatus;
          escrow_amount: number;
          escrow_released_at: string | null;
          escrow_refunded_at: string | null;
          owner_confirmation_status: OwnerConfirmationStatus | null;
          owner_confirmation_deadline: string | null;
          extensions_used: number;
          owner_extension_requested_at: string[] | null;
          owner_confirmed_at: string | null;
          owner_declined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          listing_id: string;
          owner_id: string;
          resort_confirmation_number?: string | null;
          confirmation_screenshot_path?: string | null;
          confirmation_submitted_at?: string | null;
          confirmation_deadline: string;
          verified_by_rav?: boolean;
          rav_verifier_id?: string | null;
          rav_verified_at?: string | null;
          rav_verification_notes?: string | null;
          resort_contact_name?: string | null;
          resort_contact_phone?: string | null;
          escrow_status?: EscrowStatus;
          escrow_amount: number;
          escrow_released_at?: string | null;
          escrow_refunded_at?: string | null;
          owner_confirmation_status?: OwnerConfirmationStatus | null;
          owner_confirmation_deadline?: string | null;
          extensions_used?: number;
          owner_extension_requested_at?: string[] | null;
          owner_confirmed_at?: string | null;
          owner_declined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          listing_id?: string;
          owner_id?: string;
          resort_confirmation_number?: string | null;
          confirmation_screenshot_path?: string | null;
          confirmation_submitted_at?: string | null;
          confirmation_deadline?: string;
          verified_by_rav?: boolean;
          rav_verifier_id?: string | null;
          rav_verified_at?: string | null;
          rav_verification_notes?: string | null;
          resort_contact_name?: string | null;
          resort_contact_phone?: string | null;
          escrow_status?: EscrowStatus;
          escrow_amount?: number;
          escrow_released_at?: string | null;
          escrow_refunded_at?: string | null;
          owner_confirmation_status?: OwnerConfirmationStatus | null;
          owner_confirmation_deadline?: string | null;
          extensions_used?: number;
          owner_extension_requested_at?: string[] | null;
          owner_confirmed_at?: string | null;
          owner_declined_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      checkin_confirmations: {
        Row: {
          id: string;
          booking_id: string;
          traveler_id: string;
          confirmed_arrival: boolean | null;
          confirmed_at: string | null;
          confirmation_deadline: string;
          issue_reported: boolean;
          issue_type: string | null;
          issue_description: string | null;
          issue_reported_at: string | null;
          verification_photo_path: string | null;
          photo_uploaded_at: string | null;
          resolved: boolean;
          resolved_by: string | null;
          resolved_at: string | null;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          traveler_id: string;
          confirmed_arrival?: boolean | null;
          confirmed_at?: string | null;
          confirmation_deadline: string;
          issue_reported?: boolean;
          issue_type?: string | null;
          issue_description?: string | null;
          issue_reported_at?: string | null;
          verification_photo_path?: string | null;
          photo_uploaded_at?: string | null;
          resolved?: boolean;
          resolved_by?: string | null;
          resolved_at?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          traveler_id?: string;
          confirmed_arrival?: boolean | null;
          confirmed_at?: string | null;
          confirmation_deadline?: string;
          issue_reported?: boolean;
          issue_type?: string | null;
          issue_description?: string | null;
          issue_reported_at?: string | null;
          verification_photo_path?: string | null;
          photo_uploaded_at?: string | null;
          resolved?: boolean;
          resolved_by?: string | null;
          resolved_at?: string | null;
          resolution_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      resorts: {
        Row: Resort;
        Insert: Omit<Resort, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Resort, 'id' | 'created_at'>>;
        Relationships: [];
      };
      resort_unit_types: {
        Row: ResortUnitType;
        Insert: Omit<ResortUnitType, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ResortUnitType, 'id' | 'created_at'>>;
        Relationships: [];
      };
      system_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Record<string, unknown>;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: Record<string, unknown>;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: Record<string, unknown>;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
        };
        Relationships: [];
      };
      membership_tiers: {
        Row: MembershipTier;
        Insert: Omit<MembershipTier, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<MembershipTier, 'id' | 'created_at'>>;
        Relationships: [];
      };
      user_memberships: {
        Row: UserMembership;
        Insert: {
          id?: string;
          user_id: string;
          tier_id: string;
          status?: MembershipStatus;
          started_at?: string;
          expires_at?: string | null;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier_id?: string;
          status?: MembershipStatus;
          started_at?: string;
          expires_at?: string | null;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          cancelled_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      voice_search_usage: {
        Row: {
          id: string;
          user_id: string;
          search_date: string;
          search_count: number;
          last_search_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          search_date?: string;
          search_count?: number;
          last_search_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          search_date?: string;
          search_count?: number;
          last_search_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_guarantee_fund: {
        Row: {
          id: string;
          booking_id: string | null;
          contribution_amount: number;
          contribution_percentage: number;
          claim_id: string | null;
          claimed_amount: number | null;
          claimed_at: string | null;
          claim_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          contribution_amount: number;
          contribution_percentage?: number;
          claim_id?: string | null;
          claimed_amount?: number | null;
          claimed_at?: string | null;
          claim_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          contribution_amount?: number;
          contribution_percentage?: number;
          claim_id?: string | null;
          claimed_amount?: number | null;
          claimed_at?: string | null;
          claim_reason?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
      get_user_roles: {
        Args: { _user_id: string };
        Returns: AppRole[];
      };
      is_rav_team: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      can_access_platform: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      approve_user: {
        Args: { _user_id: string; _approved_by: string };
        Returns: boolean;
      };
      reject_user: {
        Args: { _user_id: string; _rejected_by: string; _reason: string };
        Returns: boolean;
      };
      request_role_upgrade: {
        Args: { _requested_role: AppRole; _reason: string | null };
        Returns: string;
      };
      approve_role_upgrade: {
        Args: { _request_id: string; _approved_by: string };
        Returns: boolean;
      };
      reject_role_upgrade: {
        Args: { _request_id: string; _rejected_by: string; _reason: string | null };
        Returns: boolean;
      };
      increment_voice_search_count: {
        Args: { _user_id: string };
        Returns: void;
      };
      get_voice_search_count: {
        Args: { _user_id: string };
        Returns: number;
      };
      can_use_voice_search: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      get_voice_searches_remaining: {
        Args: { _user_id: string };
        Returns: number;
      };
      get_user_voice_quota: {
        Args: { _user_id: string };
        Returns: number;
      };
      get_owner_commission_rate: {
        Args: { _owner_id: string };
        Returns: number;
      };
      extend_owner_confirmation_deadline: {
        Args: { p_booking_confirmation_id: string; p_owner_id: string };
        Returns: Record<string, unknown>;
      };
    };
    Enums: {
      app_role: AppRole;
      listing_status: ListingStatus;
      booking_status: BookingStatus;
      payout_status: PayoutStatus;
      agreement_status: AgreementStatus;
      vacation_club_brand: VacationClubBrand;
      cancellation_policy: CancellationPolicy;
      cancellation_status: CancellationStatus;
      owner_trust_level: OwnerTrustLevel;
      verification_doc_type: VerificationDocType;
      verification_status: VerificationStatus;
      escrow_status: EscrowStatus;
    };
  };
}

// Convenience types for use in components
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type Property = Database['public']['Tables']['properties']['Row'];
export type OwnerAgreement = Database['public']['Tables']['owner_agreements']['Row'];
export type Listing = Database['public']['Tables']['listings']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type CancellationRequest = Database['public']['Tables']['cancellation_requests']['Row'];
export type OwnerVerification = Database['public']['Tables']['owner_verifications']['Row'];
export type VerificationDocument = Database['public']['Tables']['verification_documents']['Row'];
export type BookingConfirmation = Database['public']['Tables']['booking_confirmations']['Row'];
export type CheckinConfirmation = Database['public']['Tables']['checkin_confirmations']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];

// Extended types with joins
export type ListingWithProperty = Listing & {
  property: Property;
};

export type BookingWithDetails = Booking & {
  listing: ListingWithProperty;
  renter: Profile;
};

export type CancellationRequestWithDetails = CancellationRequest & {
  booking: BookingWithDetails;
};

export type OwnerVerificationWithDocs = OwnerVerification & {
  documents: VerificationDocument[];
};

// Cancellation policy display helpers
export const CANCELLATION_POLICY_LABELS: Record<CancellationPolicy, string> = {
  flexible: 'Flexible',
  moderate: 'Moderate',
  strict: 'Strict',
  super_strict: 'Super Strict',
};

export const CANCELLATION_POLICY_DESCRIPTIONS: Record<CancellationPolicy, string> = {
  flexible: 'Full refund up to 24 hours before check-in',
  moderate: 'Full refund 5+ days before, 50% refund 1-4 days before',
  strict: '50% refund 7+ days before, no refund after',
  super_strict: 'No refunds after booking is confirmed',
};

// Trust level display helpers
export const TRUST_LEVEL_LABELS: Record<OwnerTrustLevel, string> = {
  new: 'New Owner',
  verified: 'Verified',
  trusted: 'Trusted',
  premium: 'Premium',
};

export const TRUST_LEVEL_DESCRIPTIONS: Record<OwnerTrustLevel, string> = {
  new: 'Just getting started, limited listings allowed',
  verified: 'Documents verified, building reputation',
  trusted: '3+ successful stays, good standing',
  premium: '10+ stays, zero issues, priority support',
};

// Escrow status display helpers
export const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  pending_confirmation: 'Awaiting Confirmation',
  confirmation_submitted: 'Under Review',
  verified: 'Verified',
  released: 'Released',
  refunded: 'Refunded',
  disputed: 'Disputed',
};

// Verification status display helpers
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

// ── Role display constants (single source of truth) ──────────────────────

/** User-facing role labels */
export const ROLE_LABELS: Record<AppRole, string> = {
  rav_owner: 'RAV Owner',
  rav_admin: 'RAV Admin',
  rav_staff: 'RAV Staff',
  property_owner: 'Property Owner',
  renter: 'Renter',
};

/** Badge colors per role (Tailwind bg classes) */
export const ROLE_COLORS: Record<AppRole, string> = {
  rav_owner: 'bg-purple-500',
  rav_admin: 'bg-blue-500',
  rav_staff: 'bg-cyan-500',
  property_owner: 'bg-green-500',
  renter: 'bg-gray-500',
};

/**
 * Signup account types map to DB roles via the `handle_new_user()` trigger:
 *   'renter'  → renter role,          role_category 'traveler'
 *   'owner'   → property_owner role,  role_category 'owner'
 */
export type AccountType = 'renter' | 'owner';
