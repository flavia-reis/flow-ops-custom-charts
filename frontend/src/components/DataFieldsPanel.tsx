import { Database, Calendar, Hash, Type } from 'lucide-react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { DataField } from '../types/chart';

interface DataFieldsPanelProps {
  fields: DataField[];
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case 'number':
      return <Hash className="w-4 h-4" />;
    case 'date':
      return <Calendar className="w-4 h-4" />;
    default:
      return <Type className="w-4 h-4" />;
  }
};

export default function DataFieldsPanel({ fields }: DataFieldsPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Available Fields</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">Drag fields to create your chart</p>
      </div>

      <Droppable droppableId="available-fields" isDropDisabled={true}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 overflow-y-auto p-4"
          >
            <div className="space-y-2">
              {fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided, snapshot) => (
                    <>
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 rounded-lg border transition-all cursor-move ${
                          snapshot.isDragging
                            ? 'bg-blue-50 border-blue-300 shadow-lg'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`${
                            field.type === 'number' ? 'text-green-600' :
                            field.type === 'date' ? 'text-purple-600' :
                            'text-gray-600'
                          }`}>
                            {getFieldIcon(field.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {field.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{field.type}</p>
                          </div>
                        </div>
                      </div>
                      {snapshot.isDragging && (
                        <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                          <div className="flex items-center gap-2 opacity-50">
                            <div className={`${
                              field.type === 'number' ? 'text-green-600' :
                              field.type === 'date' ? 'text-purple-600' :
                              'text-gray-600'
                            }`}>
                              {getFieldIcon(field.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {field.name}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">{field.type}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Draggable>
              ))}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
