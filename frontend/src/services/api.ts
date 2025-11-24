import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface RawDataParams {
  start_date: string;
  end_date: string;
  page?: number;
  items_per_page?: number;
}

// Updated interface to match actual API response
export interface RawDataItem {
  project_key?: string;
  team_name?: string;
  year?: number;
  month?: number;
  burn_team_size?: number | null;
  build_team_size?: number | null;
  all_team_size?: number | null;
  [key: string]: any; // Allow for additional fields
}

export interface RawDataResponse {
  items: RawDataItem[];
  total_items: number;  // Changed from total_count
  page: number;
  items_per_page: number;
  total_pages?: number; // This might be calculated on frontend
}

export interface ApiError {
  error: string;
  details?: Record<string, any>;
}

class FlowOpsAPI {
  async getRawData(params: RawDataParams): Promise<RawDataResponse> {
    try {
      const response = await api.get<RawDataResponse>('/api/v1/raw-data', { params });
      
      // Calculate total_pages if not provided
      const data = response.data;
      if (!data.total_pages) {
        data.total_pages = Math.ceil(data.total_items / data.items_per_page);
      }
      
      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch raw data';
      throw new Error(errorMessage);
    }
  }

  async getDataFields(start_date: string, end_date: string): Promise<string[]> {
    try {
      // Get a sample of data to extract field names
      const response = await this.getRawData({
        start_date,
        end_date,
        page: 1,
        items_per_page: 10
      });
      
      // Extract unique field names from the sample data
      const fields = new Set<string>();
      response.items.forEach(item => {
        Object.keys(item).forEach(key => fields.add(key));
      });
      
      return Array.from(fields).sort();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch data fields';
      throw new Error(errorMessage);
    }
  }

  async healthCheck(): Promise<{ status: string; service?: string }> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error: any) {
      throw new Error('Backend service is not available');
    }
  }
}

export const flowOpsAPI = new FlowOpsAPI();
export default api;