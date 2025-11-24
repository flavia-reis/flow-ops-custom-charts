import React from 'react';
import { ChartConfiguration, RawDataResponse } from '../types/chart';
import { ChartTypeSelector } from './ChartTypeSelector';
import { ChartFieldsConfig } from './ChartFieldsConfig';
import ChartPreview from './ChartPreview';

interface ChartBuilderProps {
  config: ChartConfiguration;
  onConfigChange: (config: ChartConfiguration) => void;
  onRemoveField: (fieldId: string, axis: any, isOverlay?: boolean) => void;
  rawData: RawDataResponse | null;
  isLoading?: boolean;
}

export default function ChartBuilder({
  config,
  onConfigChange,
  onRemoveField,
  rawData,
  isLoading = false,
}: ChartBuilderProps) {
  return (
    <div className="space-y-6">
      {/* Chart Type Selection */}
      <ChartTypeSelector config={config} onConfigChange={onConfigChange} />

      {/* Chart Fields Configuration */}
      <ChartFieldsConfig config={config} onRemoveField={onRemoveField} />

      {/* Chart Preview */}
      <ChartPreview
        config={config}
        rawData={rawData}
        isLoading={isLoading}
        onConfigChange={onConfigChange}
      />
    </div>
  );
}