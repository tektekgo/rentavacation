// Database types for Rent-A-Vacation
// These types mirror the Supabase database schema

export type AppRole = 'rav_owner' | 'rav_admin' | 'rav_staff' | 'property_owner' | 'renter';

export type ListingStatus = 'draft' | 'pending_approval' | 'active' | 'booked' | 'completed' | 'cancelled';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type AgreementStatus = 'pending' | 'active' | 'suspended' | 'terminated';

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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
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
          updated_at?: string;
        };
      };
      owner_agreements: {
        Row: {
          id: string;
          owner_id: string;
          status: AgreementStatus;
          commission_rate: number; // Percentage RAV takes
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
      };
      listings: {
        Row: {
          id: string;
          property_id: string;
          owner_id: string;
          status: ListingStatus;
          check_in_date: string;
          check_out_date: string;
          owner_price: number; // Price owner wants
          rav_markup: number; // RAV's markup amount
          final_price: number; // What renter pays
          notes: string | null;
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
          notes?: string | null;
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
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          updated_at?: string;
        };
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
          updated_at?: string;
        };
      };
    };
    Views: {};
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
    };
    Enums: {
      app_role: AppRole;
      listing_status: ListingStatus;
      booking_status: BookingStatus;
      agreement_status: AgreementStatus;
      vacation_club_brand: VacationClubBrand;
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

// Extended types with joins
export type ListingWithProperty = Listing & {
  property: Property;
};

export type BookingWithDetails = Booking & {
  listing: ListingWithProperty;
  renter: Profile;
};
