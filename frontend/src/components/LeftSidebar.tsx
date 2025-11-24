import React from 'react';
import { DataFieldsPanel } from './DataFieldsPanel';
import ChartConfigPanel  from './ChartConfigPanel';
import SaveLoadPanel from './SaveLoadPanel';
import { DataField, ChartConfiguration } from '../types/chart';

interface LeftSidebarProps {
  fields: DataField[];
  config: ChartConfiguration;
  onConfigChange: (config: ChartConfiguration) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  fields,
  config,
  onConfigChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Data Fields */}
      <DataFieldsPanel fields={fields} />
      
      {/* Chart Settings */}
      <ChartConfigPanel 
        config={config} 
        onConfigChange={onConfigChange} 
      />
      
      {/* Save & Load */}
      <SaveLoadPanel 
        config={config} 
        onConfigChange={onConfigChange} 
      />
    </div>
  );
};