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
