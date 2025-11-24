import React from 'react';
import { BarChart3, Layers } from 'lucide-react';
import { ChartConfiguration, ChartType } from '../types/chart';

interface ChartTypeSelectorProps {
  config: ChartConfiguration;
  onConfigChange: (config: ChartConfiguration) => void;
}

const chartTypeOptions: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'pie', label: 'Pie Chart' },
  //{ value: 'scatter', label: 'Scatter Plot' },
];

export const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  config,
  onConfigChange,
}) => {
  const handleChartTypeChange = (chartType: ChartType) => {
    onConfigChange({
      ...config,
      chart_type: chartType,
      dataFields: {
        ...config.dataFields,
        ...(chartType === 'pie' ? {
          x: undefined,
          y: undefined,
          primaryX: undefined,
          primaryY: undefined,
          secondaryX: undefined,
          secondaryY: undefined,
        } : {
          value: undefined,
        })
      },
    });
  };

  const handleComposedToggle = () => {
    onConfigChange({
      ...config,
      isComposed: !config.isComposed,
      secondaryChartType: config.isComposed ? undefined : 'line'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Chart Type</h3>
      </div>

      {/* Overlaid Charts Toggle */}
      <div className="mb-5 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-purple-600" />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Overlaid Charts</h4>
              <p className="text-xs text-gray-600 mt-0.5">
                Combine two chart types with independent axes
              </p>
            </div>
          </div>
          <button
            onClick={handleComposedToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
              config.isComposed ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.isComposed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Primary Chart Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {config.isComposed ? 'Primary Chart' : 'Chart Type'}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {chartTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleChartTypeChange(option.value)}
              className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                config.chart_type === option.value
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label.replace(' Chart', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Chart Type */}
      {config.isComposed && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Chart
          </label>
          <div className="grid grid-cols-3 gap-2">
            {chartTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onConfigChange({
                  ...config,
                  secondaryChartType: option.value
                })}
                className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                  config.secondaryChartType === option.value
                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label.replace(' Chart', '')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};