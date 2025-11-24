import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { X, Hash, Calendar, Type } from 'lucide-react';

type AxisType = 'x' | 'y' | 'value' | 'primaryX' | 'primaryY' | 'secondaryX' | 'secondaryY';

interface AxisDropZoneProps {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  axis: AxisType;
  onRemoveField: (fieldId: string, axis: AxisType) => void;
  maxFields?: number;
  variant?: 'default' | 'primary' | 'secondary';
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

const formatFieldName = (name: string) => {
  return name.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const FieldChip: React.FC<{
  fieldName: string;
  axis: AxisType;
  onRemove: () => void;
}> = ({ fieldName, axis, onRemove }) => {
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

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldType = getFieldType(fieldName);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow transition-all cursor-move group"
    >
      <div className={`${
        fieldType === 'number' ? 'text-emerald-600' :
        fieldType === 'date' ? 'text-purple-600' :
        'text-gray-600'
      }`}>
        {getFieldIcon(fieldType)}
      </div>
      <span className="text-sm flex-1 truncate font-medium text-gray-700">
        {formatFieldName(fieldName)}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1"
        title="Remove field"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const AxisDropZone: React.FC<AxisDropZoneProps> = ({
  id,
  title,
  description,
  fields,
  axis,
  onRemoveField,
  maxFields = 1,
  variant = 'default',
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'axis', // ✅ IMPORTANTE
      axis: axis,   // ✅ IMPORTANTE
    },
  });

  console.log('🎯 AxisDropZone configurado:', {
    id,
    axis,
    isOver,
    fieldsCount: fields.length
  });

  const variantStyles = {
    default: {
      border: isOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50',
      label: 'text-gray-700',
    },
    primary: {
      border: isOver ? 'border-blue-400 bg-blue-100' : 'border-blue-200 bg-blue-50',
      label: 'text-blue-800',
    },
    secondary: {
      border: isOver ? 'border-purple-400 bg-purple-100' : 'border-purple-200 bg-purple-50',
      label: 'text-purple-800',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 min-h-[100px] transition-all ${styles.border}`}
    >
      <div className="mb-2">
        <p className={`text-sm font-semibold ${styles.label}`}>{title}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>

      <div className="space-y-2">
        {fields.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-gray-400">
              {isOver ? '✨ Drop here' : 'Drag a field here'}
            </p>
          </div>
        ) : (
          fields.map((fieldName) => (
            <FieldChip
              key={`${axis}-${fieldName}`}
              fieldName={fieldName}
              axis={axis}
              onRemove={() => onRemoveField(fieldName, axis)}
            />
          ))
        )}
      </div>
    </div>
  );
};