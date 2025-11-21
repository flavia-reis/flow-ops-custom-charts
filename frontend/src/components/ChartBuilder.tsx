import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { X, Hash, Calendar, Type, BarChart3 } from 'lucide-react';
import { ChartConfiguration, ChartType } from '../types/chart';
import { RawDataResponse } from '../services/api';
import ChartPreview from './ChartPreview';
import ChartConfigPanel from './ChartConfigPanel';
import SaveLoadPanel from './SaveLoadPanel';

interface ChartBuilderProps {
  config: ChartConfiguration;
  onConfigChange: (config: ChartConfiguration) => void;
  onRemoveField: (fieldId: string, axis: 'x' | 'y' | 'value') => void;
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
  onRemoveField 
}: {
  id: string;
  title: string;
  description: string;
  fields: any[];
  axis: 'x' | 'y' | 'value';
  onRemoveField: (fieldId: string, axis: 'x' | 'y' | 'value') => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'axis',
      axis: axis,
    },
  });

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
        
        {fields.map((item, index) => (
          <DraggableAxisField
            key={`${axis}-${item.field.id}`}
            item={item}
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
  item, 
  axis, 
  index, 
  onRemoveField 
}: {
  item: any;
  axis: 'x' | 'y' | 'value';
  index: number;
  onRemoveField: (fieldId: string, axis: 'x' | 'y' | 'value') => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `${axis}-${item.field.id}`,
    data: {
      type: 'axis-field',
      field: item.field,
      axis: axis,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 bg-white border rounded-lg px-3 py-2 shadow-sm transition-all ${
        isDragging 
          ? 'border-blue-300 shadow-lg opacity-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`${
        item.field.type === 'number' ? 'text-green-600' :
        item.field.type === 'date' ? 'text-purple-600' :
        'text-gray-600'
      }`}>
        {getFieldIcon(item.field.type)}
      </div>
      <span className="text-sm flex-1 truncate font-medium">{item.field.name}</span>
      <span className="text-xs text-gray-500 capitalize">{item.field.type}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemoveField(item.field.id, axis);
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

  const xAxisFields = config.data_fields.filter(df => df.axis === 'x');
  const yAxisFields = config.data_fields.filter(df => df.axis === 'y');
  const valueFields = config.data_fields.filter(df => df.axis === 'value');

  const handleChartTypeChange = (chartType: ChartType) => {
    onConfigChange({
      ...config,
      chart_type: chartType,
      // Clear incompatible fields when switching chart types
      data_fields: config.data_fields.filter(df => {
        if (chartType === 'pie') {
          return df.axis === 'value';
        } else {
          return df.axis !== 'value';
        }
      }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Chart Type</h3>
        </div>
        
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

      {/* Field Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Configuration</h3>
        
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
      </div>

      {/* Two column layout for config and save/load */}
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