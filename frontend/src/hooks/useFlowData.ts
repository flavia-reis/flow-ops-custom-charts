import { useState, useEffect, useCallback } from 'react';
import { flowOpsAPI, RawDataParams, RawDataResponse } from '../services/api';
import { DataField, DateRange, ApiStatus, KNOWN_FIELD_TYPES } from '../types/chart';
import toast from 'react-hot-toast';

export const useFlowData = () => {
  const [rawData, setRawData] = useState<RawDataResponse | null>(null);
  const [availableFields, setAvailableFields] = useState<DataField[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isConnected: false,
    isLoading: false,
  });

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      setApiStatus(prev => ({ ...prev, isLoading: true }));
      await flowOpsAPI.healthCheck();
      setApiStatus({ isConnected: true, isLoading: false });
      toast.success('Connected to Flow Ops API');
    } catch (error) {
      setApiStatus({ 
        isConnected: false, 
        isLoading: false, 
        error: 'Failed to connect to backend API' 
      });
      toast.error('Failed to connect to backend API');
    }
  };

  const fetchRawData = useCallback(async (params: RawDataParams) => {
    if (!apiStatus.isConnected) {
      toast.error('API not connected. Please check backend service.');
      return;
    }

    try {
      setApiStatus(prev => ({ ...prev, isLoading: true }));
      
      const data = await flowOpsAPI.getRawData(params);
      setRawData(data);
      
      toast.success(`Loaded ${data.items.length} items from Flow API (${data.total_items} total)`);
      
      setApiStatus(prev => ({ ...prev, isLoading: false }));
      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch data';
      setApiStatus(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      throw error;
    }
  }, [apiStatus.isConnected]);

  const fetchDataFields = useCallback(async (dateRange: DateRange) => {
    if (!apiStatus.isConnected) {
      toast.error('API not connected. Please check backend service.');
      return;
    }

    try {
      setApiStatus(prev => ({ ...prev, isLoading: true }));
      
      const fields = await flowOpsAPI.getDataFields(
        dateRange.start_date, 
        dateRange.end_date
      );
      
      // Convert string fields to DataField objects with proper types
      const dataFields: DataField[] = fields.map(field => ({
        id: field,
        name: formatFieldName(field),
        type: inferFieldType(field),
      }));
      
      setAvailableFields(dataFields);
      setApiStatus(prev => ({ ...prev, isLoading: false }));
      
      toast.success(`Found ${fields.length} available fields`);
      return dataFields;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch data fields';
      setApiStatus(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      throw error;
    }
  }, [apiStatus.isConnected]);

  const refreshConnection = useCallback(() => {
    checkApiHealth();
  }, []);

  return {
    rawData,
    availableFields,
    apiStatus,
    fetchRawData,
    fetchDataFields,
    refreshConnection,
  };
};

// Helper function to infer field type based on field name and known types
const inferFieldType = (fieldName: string): 'string' | 'number' | 'date' => {
  // Check known field types first
  if (KNOWN_FIELD_TYPES[fieldName]) {
    return KNOWN_FIELD_TYPES[fieldName];
  }
  
  const lowerField = fieldName.toLowerCase();
  
  // Date fields
  if (lowerField.includes('date') || 
      lowerField.includes('time') || 
      lowerField.includes('timestamp') ||
      lowerField === 'year' ||
      lowerField === 'month') {
    return 'date';
  }
  
  // Numeric fields
  if (lowerField.includes('size') ||
      lowerField.includes('count') || 
      lowerField.includes('number') || 
      lowerField.includes('amount') || 
      lowerField.includes('value') ||
      lowerField.includes('score') ||
      lowerField.includes('rate') ||
      lowerField.includes('percent') ||
      lowerField.includes('burn') ||
      lowerField.includes('build')) {
    return 'number';
  }
  
  return 'string';
};

// Helper function to format field names for better display
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};