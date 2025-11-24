import React from 'react';
import { Calendar, X } from 'lucide-react';

interface FilterPanelProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClose: () => void;
  onApply: () => void; // ✅ ADICIONAR callback para refresh
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClose,
  onApply, // ✅ ADICIONAR
}) => {
  const handleApply = () => {
    onApply(); // ✅ Chamar refresh
    onClose(); // Fechar painel
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-6">
          {/* Date Range Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Date Range
            </h3>
            
            <div className="space-y-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Tip:</span> Data will be filtered to show only records within this date range.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Quick Presets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setMonth(start.getMonth() - 1);
                  onStartDateChange(start.toISOString().split('T')[0]);
                  onEndDateChange(end.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Last Month
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setMonth(start.getMonth() - 3);
                  onStartDateChange(start.toISOString().split('T')[0]);
                  onEndDateChange(end.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Last 3 Months
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setMonth(start.getMonth() - 6);
                  onStartDateChange(start.toISOString().split('T')[0]);
                  onEndDateChange(end.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Last 6 Months
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setFullYear(start.getFullYear() - 1);
                  onStartDateChange(start.toISOString().split('T')[0]);
                  onEndDateChange(end.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Last Year
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleApply} // ✅ Usar nova função
          className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};