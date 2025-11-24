import { useState } from 'react';
import { Save, Download, Upload } from 'lucide-react';
import { ChartConfiguration } from '../types/chart';

interface SaveLoadPanelProps {
  config: ChartConfiguration;
  onConfigChange: (config: ChartConfiguration) => void;
}

export default function SaveLoadPanel({
  config,
  onConfigChange,
}: SaveLoadPanelProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleExportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.name || 'chart-config'}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        onConfigChange(importedConfig);
      } catch (error) {
        alert('Invalid configuration file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Save className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Save & Load</h3>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleExportConfig}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Configuration
        </button>

        <div>
          <input
            type="file"
            accept=".json"
            onChange={handleImportConfig}
            className="hidden"
            id="import-config"
          />
          <label
            htmlFor="import-config"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import Configuration
          </label>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Export your chart configuration to save it locally, or import a previously saved configuration.
        </p>
      </div>
    </div>
  );
}