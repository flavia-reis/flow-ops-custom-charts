export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter';

export interface DataField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date';
  value?: string;
}

// SIMPLIFICADO: Removendo ChartDataField, usando apenas ComposedDataFields
export interface Filter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: string | number | [number, number];
}

export interface ChartConfig {
  dualYAxis?: boolean;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// Overlay chart configuration
export interface OverlayChartConfig {
  enabled: boolean;
  type: ChartType;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: 'small' | 'medium' | 'large';
  dataFields: ComposedDataFields; // SIMPLIFICADO
  config: ChartConfig;
}

// ÚNICA estrutura para campos - mais simples e consistente
export interface ComposedDataFields {
  x?: string;
  y?: string;
  value?: string;
  primaryY1?: string;
  primaryY2?: string;
  secondaryY1?: string;
  secondaryY2?: string;
}

export interface ChartConfiguration {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  chart_type: ChartType;
  dataFields: ComposedDataFields; // SIMPLIFICADO: apenas uma estrutura
  filters: Filter[];
  config: ChartConfig;
  overlay?: OverlayChartConfig;
  created_at?: string;
  updated_at?: string;
  
  // Propriedades para gráficos compostos
  isComposed?: boolean;
  secondaryChartType?: ChartType;
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

export interface FlowDataItem {
  project_key?: string;
  team_name?: string;
  year?: number;
  month?: number;
  burn_team_size?: number | null;
  build_team_size?: number | null;
  all_team_size?: number | null;
  [key: string]: any;
}

export interface ProcessedChartData {
  [key: string]: any;
}

export interface RawDataResponse {
  items: FlowDataItem[];
  total_items: number;
  page: number;
  items_per_page: number;
  total_pages?: number;
}

export interface RawDataParams extends DateRange, PaginationParams {}

export const KNOWN_FIELD_TYPES: Record<string, 'string' | 'number' | 'date'> = {
  project_key: 'string',
  team_name: 'string',
  year: 'number',
  month: 'number',
  burn_team_size: 'number',
  build_team_size: 'number',
  all_team_size: 'number',
};