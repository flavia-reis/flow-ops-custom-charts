import React from 'react';
import { Database, Hash, Type, Calendar } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface Field {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date';
}

interface DataFieldsPanelProps {
  fields: Field[];
}

const FieldIcon = ({ type }: { type: string }) => {
  const iconClass = "w-3.5 h-3.5";
  
  switch (type) {
    case 'number':
      return <Hash className={`${iconClass} text-emerald-600`} />;
    case 'date':
      return <Calendar className={`${iconClass} text-purple-600`} />;
    default:
      return <Type className={`${iconClass} text-gray-600`} />;
  }
};

const DraggableField: React.FC<{ field: Field }> = ({ field }) => {
  // ✅ IMPORTANTE: Criar o objeto data FORA do useDraggable
  const dragData = React.useMemo(() => ({
    type: 'field',
    field: {
      id: field.id,
      name: field.name,
      type: field.type,
    }
  }), [field.id, field.name, field.type]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.id}`,
    data: dragData, // ✅ Usar o objeto memoizado
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Debug: Verificar se o data está correto
  React.useEffect(() => {
    console.log('🟦 Draggable montado:', {
      id: `field-${field.id}`,
      data: dragData
    });
  }, [field.id, dragData]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group p-2 rounded-lg hover:bg-gray-50 cursor-move transition-all active:scale-95"
    >
      <div className="flex items-center gap-2">
        <FieldIcon type={field.type} />
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
          {field.name.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
};

export const DataFieldsPanel: React.FC<DataFieldsPanelProps> = ({ fields }) => {
  console.log('📦 DataFieldsPanel com', fields.length, 'fields');
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Data Fields</h2>
        </div>
        <p className="text-xs text-gray-500 mt-1">Drag to chart areas</p>
      </div>

      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {fields.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No fields available</p>
            <p className="text-xs text-gray-400 mt-1">Load data first</p>
          </div>
        ) : (
          fields.map((field) => (
            <DraggableField key={field.id} field={field} />
          ))
        )}
      </div>
    </div>
  );
};