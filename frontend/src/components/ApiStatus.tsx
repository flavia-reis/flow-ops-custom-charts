import React from 'react';
import { CheckCircle, XCircle, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { ApiStatus as ApiStatusType } from '../types/chart';

interface ApiStatusProps {
  status: ApiStatusType;
  onRetry?: () => void;
}

export const ApiStatus: React.FC<ApiStatusProps> = ({ status, onRetry }) => {
  const getStatusIcon = () => {
    if (status.isLoading) {
      return <Loader className="w-5 h-5 animate-spin text-blue-600" />;
    }
    
    if (status.isConnected) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    
    if (status.error) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusText = () => {
    if (status.isLoading) {
      return 'Connecting to API...';
    }
    
    if (status.isConnected) {
      return 'Connected to Flow Ops API';
    }
    
    if (status.error) {
      return status.error;
    }
    
    return 'API status unknown';
  };

  const getStatusColor = () => {
    if (status.isLoading) {
      return 'border-blue-200 bg-blue-50';
    }
    
    if (status.isConnected) {
      return 'border-green-200 bg-green-50';
    }
    
    if (status.error) {
      return 'border-red-200 bg-red-50';
    }
    
    return 'border-yellow-200 bg-yellow-50';
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div>
          <p className="text-sm font-medium text-gray-800">
            {getStatusText()}
          </p>
          {status.error && (
            <p className="text-xs text-gray-600 mt-1">
              Make sure the backend service is running on port 8000
            </p>
          )}
        </div>
      </div>
      
      {(status.error || !status.isConnected) && onRetry && (
        <button
          onClick={onRetry}
          disabled={status.isLoading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${status.isLoading ? 'animate-spin' : ''}`} />
          Retry
        </button>
      )}
    </div>
  );
};