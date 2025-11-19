import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { BarChart3 } from 'lucide-react';
import DataFieldsPanel from './components/DataFieldsPanel';
import ChartBuilder from './components/ChartBuilder';
import ChartConfigPanel from './components/ChartConfigPanel';
import ChartPreview from './components/ChartPreview';
import SaveLoadPanel from './components/SaveLoadPanel';
import { ChartType, ChartDataField, ChartConfig, ChartConfiguration, DataField } from './types/chart';
import { sampleDataFields, generateSampleData } from './utils/sampleData';

function App() {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxisFields, setXAxisFields] = useState<ChartDataField[]>([]);
  const [yAxisFields, setYAxisFields] = useState<ChartDataField[]>([]);
  const [valueFields, setValueFields] = useState<ChartDataField[]>([]);
  const [config, setConfig] = useState<ChartConfig>({
    showLegend: true,
    showGrid: true,
  });
  const [rawData] = useState(generateSampleData());
  const [savedConfigs, setSavedConfigs] = useState<ChartConfiguration[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('chartConfigs');
    if (saved) {
      setSavedConfigs(JSON.parse(saved));
    }
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceFieldId = result.draggableId.replace(/^(x-|y-|value-)/, '');
    const field = sampleDataFields.find((f) => f.id === sourceFieldId);
    if (!field) return;

    const newField: ChartDataField = {
      field,
      axis: destination.droppableId === 'x-axis' ? 'x' :
            destination.droppableId === 'y-axis' ? 'y' : 'value',
    };

    if (source.droppableId === 'available-fields') {
      if (destination.droppableId === 'x-axis') {
        setXAxisFields([...xAxisFields, newField]);
      } else if (destination.droppableId === 'y-axis') {
        setYAxisFields([...yAxisFields, newField]);
      } else if (destination.droppableId === 'value') {
        setValueFields([...valueFields, newField]);
      }
    } else {
      const sourceList =
        source.droppableId === 'x-axis' ? xAxisFields :
        source.droppableId === 'y-axis' ? yAxisFields : valueFields;

      const destList =
        destination.droppableId === 'x-axis' ? [...xAxisFields] :
        destination.droppableId === 'y-axis' ? [...yAxisFields] : [...valueFields];

      const [removed] = sourceList.splice(source.index, 1);
      destList.splice(destination.index, 0, removed);

      if (source.droppableId === 'x-axis') setXAxisFields(sourceList);
      else if (source.droppableId === 'y-axis') setYAxisFields(sourceList);
      else setValueFields(sourceList);

      if (destination.droppableId === 'x-axis') setXAxisFields(destList);
      else if (destination.droppableId === 'y-axis') setYAxisFields(destList);
      else setValueFields(destList);
    }
  };

  const removeField = (axis: 'x' | 'y' | 'value', index: number) => {
    if (axis === 'x') {
      setXAxisFields(xAxisFields.filter((_, i) => i !== index));
    } else if (axis === 'y') {
      setYAxisFields(yAxisFields.filter((_, i) => i !== index));
    } else {
      setValueFields(valueFields.filter((_, i) => i !== index));
    }
  };

  const handleSaveConfig = (name: string, description?: string) => {
    const newConfig: ChartConfiguration = {
      id: Date.now().toString(),
      name,
      description,
      chart_type: chartType,
      data_fields: [...xAxisFields, ...yAxisFields, ...valueFields],
      filters: [],
      config,
    };

    const updated = [...savedConfigs, newConfig];
    setSavedConfigs(updated);
    localStorage.setItem('chartConfigs', JSON.stringify(updated));
  };

  const handleLoadConfig = (savedConfig: ChartConfiguration) => {
    setChartType(savedConfig.chart_type);
    setXAxisFields(savedConfig.data_fields.filter((f) => f.axis === 'x'));
    setYAxisFields(savedConfig.data_fields.filter((f) => f.axis === 'y'));
    setValueFields(savedConfig.data_fields.filter((f) => f.axis === 'value'));
    setConfig(savedConfig.config);
  };

  const handleDeleteConfig = (id: string) => {
    const updated = savedConfigs.filter((c) => c.id !== id);
    setSavedConfigs(updated);
    localStorage.setItem('chartConfigs', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Challenge XYZ</h1>
              <p className="text-sm text-gray-600">Chart Customization Platform</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3 space-y-6">
              <DataFieldsPanel fields={sampleDataFields} />
              <SaveLoadPanel
                currentConfig={{
                  name: '',
                  chart_type: chartType,
                  data_fields: [...xAxisFields, ...yAxisFields, ...valueFields],
                  filters: [],
                  config,
                }}
                savedConfigs={savedConfigs}
                onSave={handleSaveConfig}
                onLoad={handleLoadConfig}
                onDelete={handleDeleteConfig}
              />
            </div>

            <div className="col-span-9 space-y-6">
              <ChartConfigPanel
                chartType={chartType}
                config={config}
                onChartTypeChange={setChartType}
                onConfigChange={(newConfig) => setConfig({ ...config, ...newConfig })}
              />

              <ChartBuilder
                chartType={chartType}
                xAxisFields={xAxisFields}
                yAxisFields={yAxisFields}
                valueFields={valueFields}
                onRemoveField={removeField}
              />

              <div className="h-[500px]">
                <ChartPreview
                  chartType={chartType}
                  xAxisFields={xAxisFields}
                  yAxisFields={yAxisFields}
                  valueFields={valueFields}
                  config={config}
                  data={rawData}
                />
              </div>
            </div>
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}

export default App;
