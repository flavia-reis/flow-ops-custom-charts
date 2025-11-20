import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
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
            <Droppable droppableId="x-axis">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`border-2 border-dashed rounded-lg p-4 min-h-[80px] transition-colors ${
                    snapshot.isDraggingOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700 mb-3">X-Axis (Categories)</p>
                  <div className="space-y-2">
                    {xAxisFields.length === 0 && (
                      <p className="text-sm text-gray-400 italic">Drop a field here for X-axis</p>
                    )}
                    {xAxisFields.map((item, index) => (
                      <Draggable
                        key={`x-${item.field.id}`}
                        draggableId={`x-${item.field.id}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm"
                            style={{
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none',
                              touchAction: 'none',
                              ...provided.draggableProps.style
                            }}
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
                              onClick={() => onRemoveField(item.field.id, 'x')}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}

          {showYAxis && (
            <Droppable droppableId="y-axis">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`border-2 border-dashed rounded-lg p-4 min-h-[80px] transition-colors ${
                    snapshot.isDraggingOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700 mb-3">Y-Axis (Values)</p>
                  <div className="space-y-2">
                    {yAxisFields.length === 0 && (
                      <p className="text-sm text-gray-400 italic">Drop a numeric field here for Y-axis</p>
                    )}
                    {yAxisFields.map((item, index) => (
                      <Draggable
                        key={`y-${item.field.id}`}
                        draggableId={`y-${item.field.id}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm"
                            style={{
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none',
                              touchAction: 'none',
                              ...provided.draggableProps.style
                            }}
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
                              onClick={() => onRemoveField(item.field.id, 'y')}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}

          {showValue && (
            <Droppable droppableId="value-axis">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`border-2 border-dashed rounded-lg p-4 min-h-[80px] transition-colors ${
                    snapshot.isDraggingOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700 mb-3">Values</p>
                  <div className="space-y-2">
                    {valueFields.length === 0 && (
                      <p className="text-sm text-gray-400 italic">Drop a numeric field here for pie chart values</p>
                    )}
                    {valueFields.map((item, index) => (
                      <Draggable
                        key={`value-${item.field.id}`}
                        draggableId={`value-${item.field.id}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm"
                            style={{
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none',
                              touchAction: 'none',
                              ...provided.draggableProps.style
                            }}
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
                              onClick={() => onRemoveField(item.field.id, 'value')}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
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