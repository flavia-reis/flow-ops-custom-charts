import React from 'react';
import { X, Hash, Calendar, Type, Layers, MapPin, Maximize2 } from 'lucide-react';
import { ChartConfiguration, ChartType } from '../types/chart';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface OverlayChartConfigProps {
  config: ChartConfiguration;
  onConfigChange: (config: ChartConfiguration) => void;
  onRemoveField: (fieldId: string, axis: 'x' | 'y' | 'value', isOverlay: boolean) => void;
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
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'scatter', label: 'Scatter' },
];

const positionOptions = [
  { value: 'top-left', label: 'Top Left', icon: '↖️' },
  { value: 'top-right', label: 'Top Right', icon: '↗️' },
  { value: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
  { value: 'bottom-right', label: 'Bottom Right', icon: '↘️' },
];

const sizeOptions = [
  { value: 'small', label: 'Small', dimensions: '200x150' },
  { value: 'medium', label: 'Medium', dimensions: '300x200' },
  { value: 'large', label: 'Large', dimensions: '400x250' },
];

function DroppableOverlayAxis({
  id,
  title,
  fields,
  axis,
  onRemoveField
}: {
  id: string;
  title: string;
  fields: string[]; // CORRIGIDO: agora é array de strings
  axis: 'x' | 'y' | 'value';
  onRemoveField: (fieldId: string, axis: 'x' | 'y' | 'value', isOverlay: boolean) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'overlay-axis',
      axis: axis,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-3 min-h-[60px] transition-colors ${
        isOver
          ? 'border-purple-400 bg-purple-50'
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      <p className="text-xs font-medium text-gray-700 mb-2">{title}</p>
      <div className="space-y-1">
        {fields.length === 0 && (
          <p className="text-xs text-gray-400 italic py-2 text-center">
            {isOver ? 'Drop here!' : `Drop field for ${title.toLowerCase()}`}
          </p>
        )}
        {fields.map((fieldName, index) => (
          <DraggableOverlayField
            key={`overlay-${axis}-${fieldName}`}
            fieldName={fieldName} // CORRIGIDO: agora passa apenas o nome
            axis={axis}
            index={index}
            onRemoveField={onRemoveField}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableOverlayField({
  fieldName,
  axis,
  index,
  onRemoveField
}: {
  fieldName: string; // CORRIGIDO: agora é apenas string
  axis: 'x' | 'y' | 'value';
  index: number;
  onRemoveField: (fieldId: string, axis: 'x' | 'y' | 'value', isOverlay: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `overlay-${axis}-${fieldName}`,
    data: {
      type: 'overlay-axis-field',
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
      className={`flex items-center gap-2 bg-white border rounded px-2 py-1 shadow-sm transition-all text-xs cursor-move ${
        isDragging
          ? 'border-purple-300 shadow-lg opacity-50'
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
      <span className="flex-1 truncate font-medium">{formatFieldName(fieldName)}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemoveField(fieldName, axis, true);
        }}
        className="text-gray-400 hover:text-red-600 transition-colors"
        title="Remove field"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function OverlayChartConfigPanel({
  config,
  onConfigChange,
  onRemoveField,
}: OverlayChartConfigProps) {
  const overlay = config.overlay || {
    enabled: false,
    type: 'pie',
    position: 'top-right',
    size: 'small',
    dataFields: {}, // CORRIGIDO: nova estrutura
    config: {
      showLegend: false,
      showGrid: false,
      colors: ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
    },
  };

  const updateOverlay = (updates: Partial<typeof overlay>) => {
    onConfigChange({
      ...config,
      overlay: {
        ...overlay,
        ...updates,
      },
    });
  };

  const toggleOverlay = () => {
    updateOverlay({ enabled: !overlay.enabled });
  };

  const showXAxis = overlay.type !== 'pie';
  const showYAxis = overlay.type !== 'pie';
  const showValue = overlay.type === 'pie';

  // CORRIGIDO: Nova estrutura usando ComposedDataFields
  const xAxisFields = overlay.dataFields?.x ? [overlay.dataFields.x] : [];
  const yAxisFields = overlay.dataFields?.y ? [overlay.dataFields.y] : [];
  const valueFields = overlay.dataFields?.value ? [overlay.dataFields.value] : [];

  const handleChartTypeChange = (chartType: ChartType) => {
    updateOverlay({
      type: chartType,
      // CORRIGIDO: Limpar campos incompatíveis na nova estrutura
      dataFields: {
        ...overlay.dataFields,
        // Se mudando para pie, manter apenas value
        ...(chartType === 'pie' ? {
          x: undefined,
          y: undefined,
        } : {
          value: undefined,
        })
      },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      

      {overlay.enabled && (
        <div className="space-y-4">
          {/* Chart Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overlay Chart Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {chartTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChartTypeChange(option.value)}
                  className={`p-2 text-xs rounded border transition-colors ${
                    overlay.type === option.value
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Position
            </label>
            <div className="grid grid-cols-2 gap-2">
              {positionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateOverlay({ position: option.value as any })}
                  className={`p-2 text-xs rounded border transition-colors flex items-center gap-2 ${
                    overlay.position === option.value
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Maximize2 className="w-4 h-4 inline mr-1" />
              Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {sizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateOverlay({ size: option.value as any })}
                  className={`p-2 text-xs rounded border transition-colors ${
                    overlay.size === option.value
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div>{option.label}</div>
                  <div className="text-xs text-gray-500">{option.dimensions}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Field Configuration */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Overlay Fields</h4>
            <div className="space-y-3">
              {showXAxis && (
                <DroppableOverlayAxis
                  id="overlay-x-axis"
                  title="X-Axis"
                  fields={xAxisFields}
                  axis="x"
                  onRemoveField={onRemoveField}
                />
              )}
              {showYAxis && (
                <DroppableOverlayAxis
                  id="overlay-y-axis"
                  title="Y-Axis"
                  fields={yAxisFields}
                  axis="y"
                  onRemoveField={onRemoveField}
                />
              )}
              {showValue && (
                <DroppableOverlayAxis
                  id="overlay-value-axis"
                  title="Values"
                  fields={valueFields}
                  axis="value"
                  onRemoveField={onRemoveField}
                />
              )}
            </div>
          </div>

          {/* Overlay Chart Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overlay Title
            </label>
            <input
              type="text"
              value={overlay.config.title || ''}
              onChange={(e) => updateOverlay({
                config: { ...overlay.config, title: e.target.value }
              })}
              placeholder="Enter overlay chart title"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}