import React from 'react';
import { RefreshCw, Filter } from 'lucide-react';

interface HeaderProps {
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onRefreshData: () => void;
  onOpenFilters: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  dateRange,
  onRefreshData,
  onOpenFilters,
  isLoading,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Flow Ops Charts</h1>
            <p className="text-sm text-gray-600">Build custom data visualizations</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Botão Filter - apenas texto */}
            <button
              onClick={onOpenFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>

            {/* Botão Refresh */}
            <button
              onClick={onRefreshData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};