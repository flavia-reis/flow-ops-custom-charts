import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Toaster } from 'react-hot-toast';
import ChartBuilder from './components/ChartBuilder';
import DataFieldsPanel from './components/DataFieldsPanel';
import { DateRangeSelector } from './components/DateRangeSelector';
import { ApiStatus } from './components/ApiStatus';
import { useFlowData } from './hooks/useFlowData';
import { ChartConfiguration, DateRange } from './types/chart';

function App() {
  const {
    rawData,
    availableFields,
    apiStatus,
    fetchRawData,
    fetchDataFields,
    refreshConnection,
  } = useFlowData();

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
    data_fields: [],
    filters: [],
    config: {
      showLegend: true,
      showGrid: true,
      colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
    },
  });

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

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Handle drag from available fields to chart builder
    if (source.droppableId === 'available-fields' && 
        (destination.droppableId === 'x-axis' || 
         destination.droppableId === 'y-axis' || 
         destination.droppableId === 'value-axis')) {
      
      const field = availableFields.find(f => f.id === draggableId);
      if (!field) return;

      const axis = destination.droppableId.replace('-axis', '') as 'x' | 'y' | 'value';
      
      // Remove any existing field from the same axis
      const updatedFields = chartConfig.data_fields.filter(df => df.axis !== axis);
      
      // Add the new field
      updatedFields.push({ field, axis });
      
      setChartConfig(prev => ({
        ...prev,
        data_fields: updatedFields,
      }));
    }

    // Handle reordering within chart builder
    if (source.droppableId === destination.droppableId && 
        source.droppableId !== 'available-fields') {
      
      const axis = source.droppableId.replace('-axis', '') as 'x' | 'y' | 'value';
      const fieldsForAxis = chartConfig.data_fields.filter(df => df.axis === axis);
      
      if (fieldsForAxis.length > 1) {
        const [reorderedField] = fieldsForAxis.splice(source.index, 1);
        fieldsForAxis.splice(destination.index, 0, reorderedField);
        
        const otherFields = chartConfig.data_fields.filter(df => df.axis !== axis);
        
        setChartConfig(prev => ({
          ...prev,
          data_fields: [...otherFields, ...fieldsForAxis],
        }));
      }
    }
  };

  const handleRemoveField = (fieldId: string, axis: 'x' | 'y' | 'value') => {
    setChartConfig(prev => ({
      ...prev,
      data_fields: prev.data_fields.filter(df => !(df.field.id === fieldId && df.axis === axis)),
    }));
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
                Create custom charts from your Flow productivity data
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* API Status */}
        <div className="mb-6">
          <ApiStatus status={apiStatus} onRetry={refreshConnection} />
        </div>

        {/* Date Range Selector */}
        <div className="mb-6">
          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onRefresh={handleRefreshData}
            isLoading={apiStatus.isLoading}
          />
        </div>

        {/* Main Content */}
        <DragDropContext onDragEnd={handleDragEnd}>
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
        </DragDropContext>

        {/* Data Summary */}
        {rawData && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Items:</span>
                <span className="ml-2 font-medium">{rawData.total_items}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Page:</span>
                <span className="ml-2 font-medium">{rawData.page} of {rawData.total_pages || 1}</span>
              </div>
              <div>
                <span className="text-gray-600">Items Loaded:</span>
                <span className="ml-2 font-medium">{rawData.items.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Available Fields:</span>
                <span className="ml-2 font-medium">{availableFields.length}</span>
              </div>
            </div>
            
            {/* Sample Data Preview */}
            {rawData.items.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Data:</h4>
                <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
                  <pre className="text-xs text-gray-600">
                    {JSON.stringify(rawData.items[0], null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;