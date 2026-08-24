import { create } from 'zustand';

export type CarrierQuoteStage = 'order' | 'post' | 'both';

export interface AppConfig {
  auction_duration_hours: number;
  bid_floor_percentage: number;
  max_active_bids_per_user: number;
  max_bids_per_auction: number;
  max_cancellations_per_month: number;
  units: string[];
  min_interests_at_registration: number;
  selection_window_hours: number;
  support_phone: string;
  require_documents: boolean;
  region_filter_enabled: boolean;
  post_approval_enabled: boolean;
  // Where shipping companies quote (#14): 'order', 'post' or 'both'. Unlike the
  // flags above this one is stored in the database, because an admin changes it
  // from the panel rather than by redeploying.
  carrier_quote_stage: CarrierQuoteStage;
}

interface ConfigStore {
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));
