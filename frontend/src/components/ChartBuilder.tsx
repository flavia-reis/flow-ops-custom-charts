import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { X, Hash, Calendar, Type, BarChart3, TrendingUp } from 'lucide-react';
import { ChartConfiguration, ChartType } from '../types/chart';
import { RawDataResponse } from '../services/api';
import ChartPreview from './ChartPreview';
import ChartConfigPanel from './ChartConfigPanel';
import SaveLoadPanel from './SaveLoadPanel';
import OverlayChartConfig from './OverlayChartConfig';

// ATUALIZADO: Tipos para gráficos sobrepostos independentes
type AxisType = 'x' | 'y' | 'value' | 'primaryX' | 'primaryY' | 'secondaryX' | 'secondaryY';

interface ChartBuilderProps {
  config: ChartConfiguration;
  onConfigChange: (config: ChartConfiguration) => void;
  onRemoveField: (fieldId: string, axis: AxisType, isOverlay?: boolean) => void;
  rawData: RawDataResponse | null;
  isLoading?: boolean;
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case 'number':
      return <Hash className="w-3 h-3" />;
    case 'date':
      return <Calendar className="w-3 h-3" />;
    default:
      return <Type className="w-3 h-3" />;
  }
};

const chartTypeOptions: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
];

function DroppableAxis({
  id,
  title,
  description,
  fields,
  axis,
  onRemoveField,
  maxFields = 10
}: {
  id: string;
  title: string;
  description: string;
  fields: any[];
  axis: AxisType;
  onRemoveField: (fieldId: string, axis: AxisType, isOverlay?: boolean) => void;
  maxFields?: number;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'axis',
      axis: axis,
    },
  });

  console.log(`🎯 DroppableAxis criado: id="${id}", axis="${axis}", fields=${fields.length}`);

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 min-h-[80px] transition-colors ${
        isOver
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      <p className="text-sm font-medium text-gray-700 mb-3">{title}</p>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      <div className="space-y-2">
        {fields.length === 0 && (
          <p className="text-sm text-gray-400 italic py-4 text-center">
            {isOver ? 'Drop here!' : `Drop a field here for ${title.toLowerCase()}`}
          </p>
        )}
        {fields.map((fieldName, index) => (
          <DraggableAxisField
            key={`${axis}-${fieldName}`}
            fieldName={fieldName}
            axis={axis}
            index={index}
            onRemoveField={onRemoveField}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableAxisField({
  fieldName,
  axis,
  index,
  onRemoveField
}: {
  fieldName: string;
  axis: AxisType;
  index: number;
  onRemoveField: (fieldId: string, axis: AxisType, isOverlay?: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `${axis}-${fieldName}`,
    data: {
      type: 'axis-field',
      fieldName: fieldName,
      axis: axis,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Função para formatar nome do campo
  const formatFieldName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Inferir tipo do campo baseado no nome
  const getFieldType = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('size') || lowerName.includes('count') || 
        lowerName.includes('burn') || lowerName.includes('build')) {
      return 'number';
    }
    if (lowerName.includes('date') || lowerName === 'year' || lowerName === 'month') {
      return 'date';
    }
    return 'string';
  };

  const fieldType = getFieldType(fieldName);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 bg-white border rounded-lg px-3 py-2 shadow-sm transition-all cursor-move ${
        isDragging
          ? 'border-blue-300 shadow-lg opacity-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`${
        fieldType === 'number' ? 'text-green-600' :
        fieldType === 'date' ? 'text-purple-600' :
        'text-gray-600'
      }`}>
        {getFieldIcon(fieldType)}
      </div>
      <span className="text-sm flex-1 truncate font-medium">{formatFieldName(fieldName)}</span>
      <span className="text-xs text-gray-500 capitalize">{fieldType}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemoveField(fieldName, axis, false);
        }}
        className="text-gray-400 hover:text-red-600 transition-colors p-1"
        title="Remove field"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ChartBuilder({
  config,
  onConfigChange,
  onRemoveField,
  rawData,
  isLoading = false,
}: ChartBuilderProps) {
  const showXAxis = config.chart_type !== 'pie';
  const showYAxis = config.chart_type !== 'pie';
  const showValue = config.chart_type === 'pie';

  // Campos para gráficos simples
  const xAxisFields = config.dataFields?.x ? [config.dataFields.x] : [];
  const yAxisFields = config.dataFields?.y ? [config.dataFields.y] : [];
  const valueFields = config.dataFields?.value ? [config.dataFields.value] : [];

  // NOVO: Campos para gráficos compostos (sobrepostos)
const primaryXFields = config.dataFields?.primaryX ? [config.dataFields.primaryX] : [];
const primaryYFields = config.dataFields?.primaryY ? [config.dataFields.primaryY] : [];
const secondaryXFields = config.dataFields?.secondaryX ? [config.dataFields.secondaryX] : [];
const secondaryYFields = config.dataFields?.secondaryY ? [config.dataFields.secondaryY] : [];

console.log('📊 Campos calculados:', {
  primaryXFields,
  primaryYFields,
  secondaryXFields,
  secondaryYFields,
  dataFields: config.dataFields
});

  const handleChartTypeChange = (chartType: ChartType) => {
    onConfigChange({
      ...config,
      chart_type: chartType,
      // Limpar campos incompatíveis
      dataFields: {
        ...config.dataFields,
        // Se mudando para pie, manter apenas value
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

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Chart Configuration</h3>
        </div>

        {/* Composed Chart Toggle */}
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Overlaid Charts</h4>
              <p className="text-xs text-gray-600">Two independent charts with separate axes (e.g., Bar + Line)</p>
            </div>
            <button
              onClick={() => onConfigChange({
                ...config,
                isComposed: !config.isComposed,
                secondaryChartType: config.isComposed ? undefined : 'line'
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {config.isComposed ? 'Primary Chart Type' : 'Chart Type'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {chartTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleChartTypeChange(option.value)}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  config.chart_type === option.value
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Chart Type - Only show if composed is enabled */}
        {config.isComposed && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Secondary Chart Type</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {chartTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onConfigChange({
                    ...config,
                    secondaryChartType: option.value
                  })}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    config.secondaryChartType === option.value
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart Field Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Fields</h3>
        
        {/* Gráficos simples (não compostos) */}
        {!config.isComposed && (
          <div className="space-y-4">
            {showXAxis && (
              <DroppableAxis
                id="x-axis"
                title="X-Axis (Categories)"
                description="Drop a field here to use as categories on the X-axis"
                fields={xAxisFields}
                axis="x"
                onRemoveField={onRemoveField}
              />
            )}

            {showYAxis && (
              <DroppableAxis
                id="y-axis"
                title="Y-Axis (Values)"
                description="Drop a numeric field here to use as values on the Y-axis"
                fields={yAxisFields}
                axis="y"
                onRemoveField={onRemoveField}
              />
            )}

            {showValue && (
              <DroppableAxis
                id="value-axis"
                title="Values"
                description="Drop a numeric field here to use as pie chart values"
                fields={valueFields}
                axis="value"
                onRemoveField={onRemoveField}
              />
            )}
          </div>
        )}

        {/* Gráficos compostos (sobrepostos) */}
        {config.isComposed && (
          <div className="space-y-6">
            {/* Primary Chart */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Primary Chart ({config.chart_type?.toUpperCase()})
              </h4>
              <div className="space-y-3">
                <DroppableAxis
                  id="primary-x-axis"
                  title="X-Axis"
                  description="Drop a field for primary chart X-axis (bottom)"
                  fields={primaryXFields}
                  axis="primaryX"
                  onRemoveField={onRemoveField}
                  maxFields={1}
                />
                <DroppableAxis
                  id="primary-y-axis"
                  title="Y-Axis"
                  description="Drop a numeric field for primary chart Y-axis (left)"
                  fields={primaryYFields}
                  axis="primaryY"
                  onRemoveField={onRemoveField}
                  maxFields={1}
                />
              </div>
            </div>

            {/* Secondary Chart */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Secondary Chart ({config.secondaryChartType?.toUpperCase()})
              </h4>
              <div className="space-y-3">
                <DroppableAxis
                  id="secondary-x-axis"
                  title="X-Axis"
                  description="Drop a field for secondary chart X-axis (top)"
                  fields={secondaryXFields}
                  axis="secondaryX"
                  onRemoveField={onRemoveField}
                  maxFields={1}
                />
                <DroppableAxis
                  id="secondary-y-axis"
                  title="Y-Axis"
                  description="Drop a numeric field for secondary chart Y-axis (right)"
                  fields={secondaryYFields}
                  axis="secondaryY"
                  onRemoveField={onRemoveField}
                  maxFields={1}
                />
              </div>
            </div>

            {/* Informação sobre os eixos */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">📍 Axis Positioning:</p>
                <p>• Primary X-Axis: Bottom | Primary Y-Axis: Left</p>
                <p>• Secondary X-Axis: Top | Secondary Y-Axis: Right</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay Chart Configuration */}
      <OverlayChartConfig
        config={config}
        onConfigChange={onConfigChange}
        onRemoveField={onRemoveField}
      />

      {/* Configuration panels in columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartConfigPanel config={config} onConfigChange={onConfigChange} />
        </div>
        <div>
          <SaveLoadPanel config={config} onConfigChange={onConfigChange} />
        </div>
      </div>

      {/* Chart Preview */}
      <ChartPreview
        config={config}
        rawData={rawData}
        isLoading={isLoading}
      />
    </div>
  );
}