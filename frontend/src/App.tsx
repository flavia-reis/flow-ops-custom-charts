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
import DataFieldsPanel from './components/DataFieldsPanel';
import { DateRangeSelector } from './components/DateRangeSelector';
import { useFlowData } from './hooks/useFlowData';
import { ChartConfiguration, DateRange, DataField } from './types/chart';

function App() {
  const {
    rawData,
    availableFields,
    apiStatus,
    fetchRawData,
    fetchDataFields,
  } = useFlowData();

  const [activeField, setActiveField] = useState<DataField | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3); // Default to last 3 months
    
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  });


  const [chartConfig, setChartConfig] = useState<ChartConfiguration>({
    name: 'New Chart',
    chart_type: 'bar',
    data_fields: {},
    filters: [],
    config: {
      showLegend: true,
      showGrid: true,
      colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
    },
    overlay: {
      enabled: false,
      type: 'pie',
      position: 'top-right',
      size: 'small',
      data_fields: [],
      config: {
        showLegend: false,
        showGrid: false,
        colors: ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
      },
    },
  });

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Load initial data when API is connected
  useEffect(() => {
    if (apiStatus.isConnected && !apiStatus.isLoading) {
      handleRefreshData();
    }
  }, [apiStatus.isConnected]);

  const handleRefreshData = async () => {
    try {
      // Fetch available fields first
      await fetchDataFields(dateRange);
      
      // Then fetch raw data
      await fetchRawData({
        ...dateRange,
        page: 1,
        items_per_page: 100, // Get more data for better charts
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    if (active.data.current?.type === 'field') {
      setActiveField(active.data.current.field);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveField(null);

  if (!over) return;

  // Handle drag from available fields to chart axes
  if (
    active.data.current?.type === 'field' &&
    over.data.current?.type === 'axis'
  ) {
    const field = active.data.current.field;
    const targetAxis = over.data.current.axis;

    console.log('Dragging field to axis:', { field: field.name, targetAxis });

    // NOVA LÓGICA: Atualizar a estrutura ComposedDataFields
    setChartConfig(prev => ({
      ...prev,
      dataFields: {
        ...prev.dataFields,
        [targetAxis]: field.id, // Usar o ID do campo
      },
    }));
  }

  // Handle drag from available fields to overlay chart axes
  if (
    active.data.current?.type === 'field' &&
    over.data.current?.type === 'overlay-axis'
  ) {
    const field = active.data.current.field;
    const targetAxis = over.data.current.axis;

    if (!chartConfig.overlay) return;

    console.log('Dragging field to overlay axis:', { field: field.name, targetAxis });

    setChartConfig(prev => ({
      ...prev,
      overlay: {
        ...prev.overlay!,
        dataFields: {
          ...prev.overlay!.dataFields,
          [targetAxis]: field.id,
        },
      },
    }));
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
            [axis]: undefined, // Remove o campo do axis específico
          },
        },
      }));
    } else {
      setChartConfig(prev => ({
        ...prev,
        dataFields: {
          ...prev.dataFields,
          [axis]: undefined, // Remove o campo do axis específico
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flow Ops Chart Builder</h1>
              <p className="text-sm text-gray-600 mt-1">
                Create custom charts with overlay support from your Flow productivity data
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
       

        {/* Date Range Selector */}
        <div className="mb-6">
          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onRefresh={handleRefreshData}
            isLoading={apiStatus.isLoading}
          />
        </div>

        {/* Main Content with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Data Fields Panel */}
            <div className="lg:col-span-1">
              <DataFieldsPanel fields={availableFields} />
            </div>

            {/* Chart Builder */}
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

          {/* Drag Overlay */}
          <DragOverlay>
            {activeField ? (
              <div className="p-3 rounded-lg border bg-blue-50 border-blue-300 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className={`${
                    activeField.type === 'number' ? 'text-green-600' :
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