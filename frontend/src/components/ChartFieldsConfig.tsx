import React from 'react';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';
import { ChartConfiguration } from '../types/chart';
import { AxisDropZone } from './AxisDropZone';

type AxisType = 'x' | 'y' | 'value' | 'primaryX' | 'primaryY' | 'secondaryX' | 'secondaryY';

interface ChartFieldsConfigProps {
  config: ChartConfiguration;
  onRemoveField: (fieldId: string, axis: AxisType) => void;
}

export const ChartFieldsConfig: React.FC<ChartFieldsConfigProps> = ({
  config,
  onRemoveField,
}) => {
  const showXAxis = true
  const showYAxis = config.chart_type !== 'pie';
  const showValue = config.chart_type === 'pie';

  // Campos para gráficos simples
  const xAxisFields = config.dataFields?.x ? [config.dataFields.x] : [];
  const yAxisFields = config.dataFields?.y ? [config.dataFields.y] : [];
  const valueFields = config.dataFields?.value ? [config.dataFields.value] : [];

  // Campos para gráficos compostos
  const primaryXFields = config.dataFields?.primaryX ? [config.dataFields.primaryX] : [];
  const primaryYFields = config.dataFields?.primaryY ? [config.dataFields.primaryY] : [];
  const secondaryXFields = config.dataFields?.secondaryX ? [config.dataFields.secondaryX] : [];
  const secondaryYFields = config.dataFields?.secondaryY ? [config.dataFields.secondaryY] : [];

  if (!config.isComposed) {
    // Gráficos simples
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Chart Fields</h3>
        </div>

        <div className="space-y-4">
          {showXAxis && (
            <AxisDropZone
              id="x-axis"
              title="X-Axis"
              description="Categories or time dimension"
              fields={xAxisFields}
              axis="x"
              onRemoveField={onRemoveField}
            />
          )}

          {showYAxis && (
            <AxisDropZone
              id="y-axis"
              title="Y-Axis"
              description="Numeric values to display"
              fields={yAxisFields}
              axis="y"
              onRemoveField={onRemoveField}
            />
          )}

          {showValue && (
            <AxisDropZone
              id="value-axis"
              title="Values"
              description="Numeric field for pie slices"
              fields={valueFields}
              axis="value"
              onRemoveField={onRemoveField}
            />
          )}
        </div>
      </div>
    );
  }

  // Gráficos compostos
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-5">
        <Layers className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Overlaid Chart Fields</h3>
      </div>

      <div className="space-y-5">
        {/* Primary Chart */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-900">
              Primary Chart ({config.chart_type?.toUpperCase()})
            </h4>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <AxisDropZone
              id="primary-x-axis"
              title="X-Axis (Bottom)"
              fields={primaryXFields}
              axis="primaryX"
              onRemoveField={onRemoveField}
              variant="primary"
            />
            <AxisDropZone
              id="primary-y-axis"
              title="Y-Axis (Left)"
              fields={primaryYFields}
              axis="primaryY"
              onRemoveField={onRemoveField}
              variant="primary"
            />
          </div>
        </div>

        {/* Secondary Chart */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-200">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-semibold text-purple-900">
              Secondary Chart ({config.secondaryChartType?.toUpperCase()})
            </h4>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <AxisDropZone
              id="secondary-x-axis"
              title="X-Axis (Top)"
              fields={secondaryXFields}
              axis="secondaryX"
              onRemoveField={onRemoveField}
              variant="secondary"
            />
            <AxisDropZone
              id="secondary-y-axis"
              title="Y-Axis (Right)"
              fields={secondaryYFields}
              axis="secondaryY"
              onRemoveField={onRemoveField}
              variant="secondary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};