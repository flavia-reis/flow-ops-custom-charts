import React from 'react';
import { Settings, Palette } from 'lucide-react';
import { ChartConfiguration } from '../types/chart';

interface ChartConfigPanelProps {
  config: ChartConfiguration;
  onConfigChange: (config: ChartConfiguration) => void;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export default function ChartConfigPanel({ config, onConfigChange }: ChartConfigPanelProps) {
  const handleConfigUpdate = (updates: Partial<ChartConfiguration>) => {
    onConfigChange({ ...config, ...updates });
  };

  const handleNestedConfigUpdate = (key: keyof ChartConfiguration['config'], value: any) => {
    onConfigChange({
      ...config,
      config: {
        ...config.config,
        [key]: value,
      },
    });
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...(config.config.colors || DEFAULT_COLORS)];
    newColors[index] = color;
    handleNestedConfigUpdate('colors', newColors);
  };

  const resetColors = () => {
    handleNestedConfigUpdate('colors', DEFAULT_COLORS);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Chart Settings</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-6">
        {/* Chart Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chart Name
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => handleConfigUpdate({ name: e.target.value })}
            placeholder="My Chart"
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            This name will appear in the chart header
          </p>
        </div>

        {/* Color Palette */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-900">Colors</h4>
            </div>
            <button
              onClick={resetColors}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Reset to default
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2.5">
            {(config.config.colors || DEFAULT_COLORS).map((color, index) => (
              <div key={index} className="relative group">
                <label
                  className="block cursor-pointer"
                  title={`Color ${index + 1}: ${color}`}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className="w-full h-11 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow"
                    style={{ backgroundColor: color }}
                  />
                </label>
                <div className="text-[10px] text-center text-gray-500 mt-1 font-mono">
                  {color.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Click on any color to customize
          </p>
        </div>

        {/* Visual Options */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Display Options</h4>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">Legend</label>
              <p className="text-xs text-gray-500 mt-0.5">Show data labels</p>
            </div>
            <button
              onClick={() => handleNestedConfigUpdate('showLegend', !config.config.showLegend)}
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
        </div>
      </div>
    </div>
  );
}