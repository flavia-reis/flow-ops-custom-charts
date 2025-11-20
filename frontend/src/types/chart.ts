export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter';

export interface DataField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date';
  value?: string;
}

export interface ChartDataField {
  field: DataField;
  axis: 'x' | 'y' | 'value';
}

export interface Filter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: string | number | [number, number];
}

export interface ChartConfig {
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface ChartConfiguration {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  chart_type: ChartType;
  data_fields: ChartDataField[];
  filters: Filter[];
  config: ChartConfig;
  created_at?: string;
  updated_at?: string;
}

// Types for API integration
export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface PaginationParams {
  page: number;
  items_per_page: number;
}

export interface ApiStatus {
  isConnected: boolean;
  isLoading: boolean;
  error?: string;
}

// Updated to match actual API response structure
export interface FlowDataItem {
  project_key?: string;
  team_name?: string;
  year?: number;
  month?: number;
  burn_team_size?: number | null;
  build_team_size?: number | null;
  all_team_size?: number | null;
  [key: string]: any; // Allow for additional dynamic fields
}

export interface ProcessedChartData {
  [key: string]: any;
}

// Known field types for better UX
export const KNOWN_FIELD_TYPES: Record<string, 'string' | 'number' | 'date'> = {
  project_key: 'string',
  team_name: 'string',
  year: 'number',
  month: 'number',
  burn_team_size: 'number',
  build_team_size: 'number',
  all_team_size: 'number',
};