import { Database, Calendar, Hash, Type } from 'lucide-react';
import { useDraggable } from "@dnd-kit/core"
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

function DraggableField({ field }: { field: DataField }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: field.id,
    data: {
      type: 'field',
      field: field,
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
      className={`p-3 rounded-lg border transition-all cursor-move select-none ${
        isDragging
          ? 'bg-blue-50 border-blue-300 shadow-lg opacity-50'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
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
  );
}

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

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No fields available</p>
              <p className="text-xs mt-1">Load data first to see available fields</p>
            </div>
          )}
          
          {fields.map((field) => (
            <DraggableField key={field.id} field={field} />
          ))}
        </div>
      </div>
    </div>
  );
}