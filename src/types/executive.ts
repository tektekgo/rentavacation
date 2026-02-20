// Executive Dashboard types — API response shapes, not DB table types

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: 'industry' | 'regulatory' | 'market' | 'technology';
  summary?: string;
}

export interface MacroIndicator {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  source: string;
  updatedAt: string;
  trend: 'up' | 'down' | 'flat';
  sparklineData?: number[];
}

export interface AirDNADestination {
  destination: string;
  marketAvgPrice: number;
  ravAvgPrice: number;
  occupancyRate: number;
  demandScore: number;
}

export interface AirDNAData {
  destinations: AirDNADestination[];
  isDemo: boolean;
  updatedAt: string;
}

export interface STRMetric {
  label: string;
  ravValue: number;
  marketValue: number;
  unit: string;
}

export interface STRData {
  metrics: STRMetric[];
  isDemo: boolean;
  updatedAt: string;
}

export interface MonthlyMetric {
  month: string;
  gmv: number;
  revenue: number;
  bookings: number;
}

export interface BidActivityPoint {
  month: string;
  bidsPlaced: number;
  bidsAccepted: number;
}

export interface BidSpreadPoint {
  month: string;
  avgSpread: number;
  medianSpread: number;
}

export interface RevenueWaterfallPoint {
  month: string;
  ownerPayout: number;
  commission: number;
}

export interface BusinessMetrics {
  totalGmv: number;
  platformRevenue: number;
  activeListings: number;
  totalOwners: number;
  totalRenters: number;
  monthlySignups: number;
  monthlyData: MonthlyMetric[];
  bidActivity: BidActivityPoint[];
  bidSpread: BidSpreadPoint[];
  revenueWaterfall: RevenueWaterfallPoint[];
}

export interface SupplyDemandDestination {
  destination: string;
  supply: number;
  demand: number;
  ratio: number; // demand/supply — >1 = undersupplied
}

export interface VoiceFunnelMetrics {
  voiceSearches: number;
  voiceResultClicks: number;
  voiceBookings: number;
  traditionalSearches: number;
  traditionalResultClicks: number;
  traditionalBookings: number;
}

export interface MarketplaceHealthMetrics {
  liquidityScore: number;
  liquidityComponents: {
    bidAcceptanceRate: number;
    avgTimeToBook: number;
    activeListingRatio: number;
    repeatBookingRate: number;
  };
  bidAcceptanceRate: number;
  avgBidSpread: number;
  supplyDemand: SupplyDemandDestination[];
  voiceFunnel: VoiceFunnelMetrics;
  voiceAdoptionRate: number;
}

export interface UnitEconomicsData {
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  avgBookingValue: number;
  takeRate: number;
  momGrowth: number;
}

export interface IntegrationSettings {
  newsapiKey: string;
  airdnaApiKey: string;
  strApiKey: string;
  refreshInterval: number; // minutes
}
