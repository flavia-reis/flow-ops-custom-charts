import { useState } from 'react';
import { Save, FolderOpen, Trash2 } from 'lucide-react';
import { ChartConfiguration } from '../types/chart';

interface SaveLoadPanelProps {
  currentConfig: Omit<ChartConfiguration, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  savedConfigs: ChartConfiguration[];
  onSave: (name: string, description?: string) => void;
  onLoad: (config: ChartConfiguration) => void;
  onDelete: (id: string) => void;
}

export default function SaveLoadPanel({
  currentConfig,
  savedConfigs,
  onSave,
  onLoad,
  onDelete,
}: SaveLoadPanelProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  const handleSave = () => {
    if (saveName.trim()) {
      onSave(saveName.trim(), saveDescription.trim() || undefined);
      setSaveName('');
      setSaveDescription('');
      setShowSaveDialog(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Saved Configurations</h3>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Current
        </button>
      </div>

      {showSaveDialog && (
        <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Configuration Name *
            </label>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g., Sales Analysis Q4"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
              placeholder="Brief description of this chart configuration"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setSaveName('');
                setSaveDescription('');
              }}
              className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {savedConfigs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved configurations yet</p>
            <p className="text-xs mt-1">Save your current chart to reuse it later</p>
          </div>
        ) : (
          savedConfigs.map((config) => (
            <div
              key={config.id}
              className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onLoad(config)}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-medium text-gray-900">{config.name}</p>
                  {config.description && (
                    <p className="text-xs text-gray-600 mt-0.5">{config.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 capitalize">{config.chart_type}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {config.data_fields.length} field(s)
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => config.id && onDelete(config.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                  title="Delete configuration"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
