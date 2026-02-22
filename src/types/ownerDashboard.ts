export interface OwnerDashboardStats {
  total_earned_ytd: number;
  active_listings: number;
  active_bids: number;
  annual_maintenance_fees: number | null;
  fees_covered_percent: number | null;
}

export interface MonthlyEarning {
  month: string;
  earnings: number;
  booking_count: number;
}

export interface OwnerListingRow {
  id: string;
  property_name: string;
  resort_name: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  final_price: number;
  owner_price: number;
  nightly_rate: number;
  open_for_bidding: boolean;
  bid_count: number;
  highest_bid: number | null;
  days_until_checkin: number;
}

export interface BidEvent {
  id: string;
  listing_id: string;
  property_name: string;
  event_type: 'new_bid' | 'accepted' | 'rejected' | 'counter_offer' | 'booking_confirmed';
  amount: number;
  traveler_initial: string;
  created_at: string;
}
