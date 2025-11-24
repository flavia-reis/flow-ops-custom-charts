import React, { useState, useEffect } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Toaster } from 'react-hot-toast';
import ChartBuilder from './components/ChartBuilder';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { useFlowData } from './hooks/useFlowData';
import { ChartConfiguration, DateRange, DataField } from './types/chart';
import { FilterPanel } from './components/FilterPanel';

const generateChartName = (config: ChartConfiguration): string => {
  const formatFieldName = (fieldName?: string) => {
    if (!fieldName) return '';
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (config.isComposed) {
    const primaryY = formatFieldName(config.dataFields?.primaryY);
    const secondaryY = formatFieldName(config.dataFields?.secondaryY);

    if (primaryY && secondaryY) {
      return `${primaryY} & ${secondaryY}`;
    }
    if (primaryY) return primaryY;
    if (secondaryY) return secondaryY;
  }

  const xField = formatFieldName(config.dataFields?.x);
  const yField = formatFieldName(config.dataFields?.y);
  const valueField = formatFieldName(config.dataFields?.value);

  if (config.chart_type === 'pie') {
    return valueField ? `${valueField} Distribution` : 'Chart';
  }

  if (yField && xField) {
    return `${yField} by ${xField}`;
  }

  if (yField) return yField;
  if (xField) return xField;

  return 'New Chart';
};

function App() {
  const {
    rawData,
    availableFields,
    apiStatus,
    fetchRawData,
    fetchDataFields,
  } = useFlowData();

  const [activeField, setActiveField] = useState<DataField | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  });

  const [chartConfig, setChartConfig] = useState<ChartConfiguration>({
    name: 'New Chart',
    chart_type: 'bar',
    dataFields: {},
    filters: [],
    config: {
      showLegend: true,
      showGrid: false,
      colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
    },
    overlay: {
      enabled: false,
      type: 'pie',
      position: 'top-right',
      size: 'small',
      dataFields: {},
      config: {
        showLegend: false,
        showGrid: false,
        colors: ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
      },
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    if (apiStatus.isConnected && !apiStatus.isLoading) {
      handleRefreshData();
    }
  }, [apiStatus.isConnected]);

  const handleRefreshData = async () => {
    try {
      await fetchDataFields(dateRange);
      await fetchRawData({
        ...dateRange,
        page: 1,
        items_per_page: 100,
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleDateRangeChange = (newRange: { start: string; end: string }) => {
    setDateRange({
      start_date: newRange.start,
      end_date: newRange.end,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log('🟢 DRAG START:', { id: active.id, data: active.data.current });

    if (active.data.current?.type === 'field') {
      console.log('🟢 Field detected:', active.data.current.field);
      setActiveField(active.data.current.field);
    } else {
      console.log('🔴 No field detected');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveField(null);

    if (!over) {
      console.log('🔴 Sem target de drop');
      return;
    }

    if (
      active.data.current?.type === 'field' &&
      over.data.current?.type === 'axis'
    ) {
      const field = active.data.current.field;
      const targetAxis = over.data.current.axis;

      console.log('✅ DRAG VÁLIDO:', {
        fieldName: field.name,
        fieldId: field.id,
        targetAxis,
        overId: over.id,
        currentDataFields: chartConfig.dataFields
      });

      let mappedAxis = targetAxis;

      if (over.id === 'primary-x-axis') {
        mappedAxis = 'primaryX';
      } else if (over.id === 'primary-y-axis') {
        mappedAxis = 'primaryY';
      } else if (over.id === 'secondary-x-axis') {
        mappedAxis = 'secondaryX';
      } else if (over.id === 'secondary-y-axis') {
        mappedAxis = 'secondaryY';
      } else if (over.id === 'x-axis') {
        mappedAxis = 'x';
      } else if (over.id === 'y-axis') {
        mappedAxis = 'y';
      } else if (over.id === 'value-axis') {
        mappedAxis = 'value';
      }

      console.log('🔄 Mapeamento:', {
        droppableId: over.id,
        targetAxis,
        mappedAxis
      });

      setChartConfig(prev => {
        const newDataFields = {
          ...prev.dataFields,
          [mappedAxis]: field.id,
        };

        const newConfig = {
          ...prev,
          dataFields: newDataFields,
        };

        const autoGeneratedName = generateChartName(newConfig);
        newConfig.name = autoGeneratedName;

        console.log('📝 Config update:', {
          oldDataFields: prev.dataFields,
          newDataFields,
          fieldAdded: { axis: mappedAxis, fieldId: field.id },
          autoGeneratedName,
        });

        return newConfig;
      });
    }
  };

  const handleRemoveField = (
    fieldId: string,
    axis: 'x' | 'y' | 'value' | 'primaryX' | 'primaryY' | 'secondaryX' | 'secondaryY',
    isOverlay: boolean = false
  ) => {
    console.log('Removing field:', { fieldId, axis, isOverlay });

    if (isOverlay && chartConfig.overlay) {
      setChartConfig(prev => ({
        ...prev,
        overlay: {
          ...prev.overlay!,
          dataFields: {
            ...prev.overlay!.dataFields,
            [axis]: undefined,
          },
        },
      }));
    } else {
      setChartConfig(prev => ({
        ...prev,
        dataFields: {
          ...prev.dataFields,
          [axis]: undefined,
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <Header
        dateRange={{
          start: dateRange.start_date,
          end: dateRange.end_date,
        }}
        onDateRangeChange={handleDateRangeChange}
        onRefreshData={handleRefreshData}
        onOpenFilters={() => setIsFilterPanelOpen(true)}
        isLoading={apiStatus.isLoading}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <LeftSidebar
                fields={availableFields}
                config={chartConfig}
                onConfigChange={setChartConfig}
              />
            </div>

            <div className="lg:col-span-3">
              <ChartBuilder
                config={chartConfig}
                onConfigChange={setChartConfig}
                onRemoveField={handleRemoveField}
                rawData={rawData}
                isLoading={apiStatus.isLoading}
              />
            </div>
          </div>

          {/* Filter Panel */}
          {isFilterPanelOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setIsFilterPanelOpen(false)}
              />
              <FilterPanel
                startDate={dateRange.start_date}
                endDate={dateRange.end_date}
                onStartDateChange={(date) => setDateRange(prev => ({ ...prev, start_date: date }))}
                onEndDateChange={(date) => setDateRange(prev => ({ ...prev, end_date: date }))}
                onClose={() => setIsFilterPanelOpen(false)}
                onApply={handleRefreshData} // ✅ ADICIONAR callback de refresh
              />
            </>
          )}

          <DragOverlay>
            {activeField ? (
              <div className="p-3 rounded-lg border bg-blue-50 border-blue-300 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className={`${activeField.type === 'number' ? 'text-green-600' :
                      activeField.type === 'date' ? 'text-purple-600' :
                        'text-gray-600'
                    }`}>
                    {activeField.type === 'number' ? '🔢' :
                      activeField.type === 'date' ? '📅' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activeField.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{activeField.type}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

export default App;