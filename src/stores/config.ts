import { create } from 'zustand';

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
}

interface ConfigStore {
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));
