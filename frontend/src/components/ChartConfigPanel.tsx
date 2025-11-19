import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Activity, TrendingUp } from 'lucide-react';
import { ChartType, ChartConfig } from '../types/chart';

interface ChartConfigPanelProps {
  chartType: ChartType;
  config: ChartConfig;
  onChartTypeChange: (type: ChartType) => void;
  onConfigChange: (config: Partial<ChartConfig>) => void;
}

const chartTypes: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'bar', label: 'Bar', icon: <BarChart3 className="w-5 h-5" /> },
  { type: 'line', label: 'Line', icon: <LineChartIcon className="w-5 h-5" /> },
  { type: 'area', label: 'Area', icon: <Activity className="w-5 h-5" /> },
  { type: 'pie', label: 'Pie', icon: <PieChartIcon className="w-5 h-5" /> },
  { type: 'scatter', label: 'Scatter', icon: <TrendingUp className="w-5 h-5" /> },
];

export default function ChartConfigPanel({
  chartType,
  config,
  onChartTypeChange,
  onConfigChange,
}: ChartConfigPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Chart Type</h3>
        <div className="grid grid-cols-5 gap-2">
          {chartTypes.map((item) => (
            <button
              key={item.type}
              onClick={() => onChartTypeChange(item.type)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                chartType === item.type
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Appearance</h3>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Chart Title
          </label>
          <input
            type="text"
            value={config.title || ''}
            onChange={(e) => onConfigChange({ title: e.target.value })}
            placeholder="Enter chart title"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {chartType !== 'pie' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                X-Axis Label
              </label>
              <input
                type="text"
                value={config.xAxisLabel || ''}
                onChange={(e) => onConfigChange({ xAxisLabel: e.target.value })}
                placeholder="Enter X-axis label"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Y-Axis Label
              </label>
              <input
                type="text"
                value={config.yAxisLabel || ''}
                onChange={(e) => onConfigChange({ yAxisLabel: e.target.value })}
                placeholder="Enter Y-axis label"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700">Show Legend</label>
          <button
            onClick={() => onConfigChange({ showLegend: !config.showLegend })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.showLegend ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.showLegend ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {chartType !== 'pie' && (
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">Show Grid</label>
            <button
              onClick={() => onConfigChange({ showGrid: !config.showGrid })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.showGrid ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.showGrid ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Color Palette</h3>
        <div className="grid grid-cols-8 gap-2">
          {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'].map(
            (color) => (
              <button
                key={color}
                onClick={() => {
                  const colors = config.colors || [];
                  const newColors = colors.includes(color)
                    ? colors.filter((c) => c !== color)
                    : [...colors, color];
                  onConfigChange({ colors: newColors.length > 0 ? newColors : undefined });
                }}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  config.colors?.includes(color)
                    ? 'border-gray-900 scale-110'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
              />
            )
          )}
        </div>
        {config.colors && config.colors.length > 0 && (
          <button
            onClick={() => onConfigChange({ colors: undefined })}
            className="text-xs text-blue-600 hover:text-blue-700 mt-2"
          >
            Reset to default colors
          </button>
        )}
      </div>
    </div>
  );
}
