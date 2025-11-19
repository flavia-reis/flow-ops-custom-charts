import { Droppable, Draggable } from 'react-beautiful-dnd';
import { X, Hash, Calendar, Type } from 'lucide-react';
import { ChartDataField, ChartType } from '../types/chart';

interface ChartBuilderProps {
  chartType: ChartType;
  xAxisFields: ChartDataField[];
  yAxisFields: ChartDataField[];
  valueFields: ChartDataField[];
  onRemoveField: (axis: 'x' | 'y' | 'value', index: number) => void;
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

export default function ChartBuilder({
  chartType,
  xAxisFields,
  yAxisFields,
  valueFields,
  onRemoveField,
}: ChartBuilderProps) {
  const showXAxis = chartType !== 'pie';
  const showYAxis = chartType !== 'pie';
  const showValue = chartType === 'pie';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Chart Configuration</h3>

      {showXAxis && (
        <Droppable droppableId="x-axis">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`border-2 border-dashed rounded-lg p-3 min-h-[80px] transition-colors ${
                snapshot.isDraggingOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <p className="text-xs font-medium text-gray-700 mb-2">X-Axis</p>
              <div className="space-y-2">
                {xAxisFields.length === 0 && (
                  <p className="text-xs text-gray-400 italic">Drop field here</p>
                )}
                {xAxisFields.map((item, index) => (
                  <Draggable
                    key={`x-${item.field.id}`}
                    draggableId={`x-${item.field.id}`}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1.5"
                      >
                        <div className={`${
                          item.field.type === 'number' ? 'text-green-600' :
                          item.field.type === 'date' ? 'text-purple-600' :
                          'text-gray-600'
                        }`}>
                          {getFieldIcon(item.field.type)}
                        </div>
                        <span className="text-xs flex-1 truncate">{item.field.name}</span>
                        <button
                          onClick={() => onRemoveField('x', index)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
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
              className={`border-2 border-dashed rounded-lg p-3 min-h-[80px] transition-colors ${
                snapshot.isDraggingOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <p className="text-xs font-medium text-gray-700 mb-2">Y-Axis</p>
              <div className="space-y-2">
                {yAxisFields.length === 0 && (
                  <p className="text-xs text-gray-400 italic">Drop field here</p>
                )}
                {yAxisFields.map((item, index) => (
                  <Draggable
                    key={`y-${item.field.id}`}
                    draggableId={`y-${item.field.id}`}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1.5"
                      >
                        <div className={`${
                          item.field.type === 'number' ? 'text-green-600' :
                          item.field.type === 'date' ? 'text-purple-600' :
                          'text-gray-600'
                        }`}>
                          {getFieldIcon(item.field.type)}
                        </div>
                        <span className="text-xs flex-1 truncate">{item.field.name}</span>
                        <button
                          onClick={() => onRemoveField('y', index)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
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
        <Droppable droppableId="value">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`border-2 border-dashed rounded-lg p-3 min-h-[80px] transition-colors ${
                snapshot.isDraggingOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <p className="text-xs font-medium text-gray-700 mb-2">Values</p>
              <div className="space-y-2">
                {valueFields.length === 0 && (
                  <p className="text-xs text-gray-400 italic">Drop field here</p>
                )}
                {valueFields.map((item, index) => (
                  <Draggable
                    key={`value-${item.field.id}`}
                    draggableId={`value-${item.field.id}`}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1.5"
                      >
                        <div className={`${
                          item.field.type === 'number' ? 'text-green-600' :
                          item.field.type === 'date' ? 'text-purple-600' :
                          'text-gray-600'
                        }`}>
                          {getFieldIcon(item.field.type)}
                        </div>
                        <span className="text-xs flex-1 truncate">{item.field.name}</span>
                        <button
                          onClick={() => onRemoveField('value', index)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
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
  );
}
