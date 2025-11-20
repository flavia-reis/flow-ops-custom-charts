import { Settings, Palette } from 'lucide-react';
import { ChartConfiguration } from '../types/chart';

interface ChartConfigPanelProps {
  config: ChartConfiguration;
  onConfigChange: (config: ChartConfiguration) => void;
}

export default function ChartConfigPanel({
  config,
  onConfigChange,
}: ChartConfigPanelProps) {
  const updateConfig = (updates: Partial<ChartConfiguration['config']>) => {
    onConfigChange({
      ...config,
      config: {
        ...config.config,
        ...updates,
      },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Chart Configuration</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chart Name
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => onConfigChange({ ...config, name: e.target.value })}
            placeholder="Enter chart name"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chart Title
          </label>
          <input
            type="text"
            value={config.config.title || ''}
            onChange={(e) => updateConfig({ title: e.target.value })}
            placeholder="Enter chart title"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {config.chart_type !== 'pie' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X-Axis Label
              </label>
              <input
                type="text"
                value={config.config.xAxisLabel || ''}
                onChange={(e) => updateConfig({ xAxisLabel: e.target.value })}
                placeholder="Enter X-axis label"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Y-Axis Label
              </label>
              <input
                type="text"
                value={config.config.yAxisLabel || ''}
                onChange={(e) => updateConfig({ yAxisLabel: e.target.value })}
                placeholder="Enter Y-axis label"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Show Legend</label>
            <button
              onClick={() => updateConfig({ showLegend: !config.config.showLegend })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.config.showLegend ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.config.showLegend ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {config.chart_type !== 'pie' && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Show Grid</label>
              <button
                onClick={() => updateConfig({ showGrid: !config.config.showGrid })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.config.showGrid ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.config.showGrid ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-900">Color Palette</h4>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'].map(
              (color) => (
                <button
                  key={color}
                  onClick={() => {
                    const colors = config.config.colors || [];
                    const newColors = colors.includes(color)
                      ? colors.filter((c) => c !== color)
                      : [...colors, color];
                    updateConfig({ colors: newColors.length > 0 ? newColors : undefined });
                  }}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    config.config.colors?.includes(color)
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              )
            )}
          </div>
          {config.config.colors && config.config.colors.length > 0 && (
            <button
              onClick={() => updateConfig({ colors: undefined })}
              className="text-xs text-blue-600 hover:text-blue-700 mt-2"
            >
              Reset to default colors
            </button>
          )}
        </div>
      </div>
    </div>
  );
}