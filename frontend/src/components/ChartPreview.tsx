import { useRef, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ComposedChart,
  Legend
} from 'recharts';
import { Image as ImageIcon, FileText, Loader, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ChartConfiguration } from '../types/chart';
import { RawDataResponse } from '../services/api';

interface ChartPreviewProps {
  config: ChartConfiguration;
  rawData: RawDataResponse | null;
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Helper function to format month/year combinations
const formatMonthYear = (year: number, month: number): string => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${monthNames[month - 1]}/${year}`;
};

// Helper function to determine if a field represents temporal data
const isTemporalField = (fieldId: string): boolean => {
  const temporalFields = ['year', 'month', 'date', 'timestamp'];
  return temporalFields.some(field => fieldId.toLowerCase().includes(field));
};

// Helper function to create a temporal key for grouping
const createTemporalKey = (item: any): string => {
  if (item.year && item.month) {
    return formatMonthYear(item.year, item.month);
  }
  if (item.year) {
    return item.year.toString();
  }
  return 'Unknown';
};

export default function ChartPreview({
  config,
  rawData,
  isLoading = false,
}: ChartPreviewProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // CORRIGIDO: Processar dados baseado no tipo de gráfico
  const processedMainData = useMemo(() => {
    if (!rawData || !config.dataFields) return [];
    
    if (config.isComposed) {
      // Para gráficos compostos, não processar aqui - será feito no render
      return [];
    }
    
    // Para gráficos simples
    return processSimpleChartData(rawData, config.dataFields, config.chart_type);
  }, [rawData, config.dataFields, config.chart_type, config.isComposed]);

  // Process data for overlay chart
  const processedOverlayData = useMemo(() => {
    if (!config.overlay?.enabled || !config.overlay.dataFields) {
      return [];
    }
    return processSimpleChartData(rawData, config.overlay.dataFields, config.overlay.type);
  }, [rawData, config.overlay]);

  // CORRIGIDA: Função para processar dados
  function processSimpleChartData(rawData: RawDataResponse | null, dataFields: any, chartType: string) {
    console.log('🔄 processSimpleChartData DEBUG:', {
      hasRawData: !!rawData,
      itemsCount: rawData?.items?.length || 0,
      dataFields,
      chartType,
      firstItem: rawData?.items?.[0]
    });

    if (!rawData || !rawData.items || !rawData.items.length) {
      console.log('❌ No raw data available');
      return [];
    }

    const xField = dataFields.x;
    const yField = dataFields.y;
    const valueField = dataFields.value;

    console.log('📋 Fields extracted:', { xField, yField, valueField });

    if (!xField && !valueField) {
      console.log('❌ No valid fields found');
      return [];
    }

    // Vamos ver uma amostra dos dados reais
    console.log('📊 Sample data:', {
      sampleItem: rawData.items[0],
      xFieldValue: rawData.items[0]?.[xField],
      yFieldValue: rawData.items[0]?.[yField],
      availableKeys: Object.keys(rawData.items[0] || {})
    });

    // Para gráficos não-pie, precisamos de X e Y
    if (chartType !== 'pie' && (!xField || !yField)) {
      console.log('❌ Missing X or Y field for non-pie chart');
      return [];
    }

    // Check if we're dealing with temporal data
    const isTemporalData = xField && (
      isTemporalField(xField) ||
      (rawData.items[0]?.year && rawData.items[0]?.month)
    );

    // For pie charts, aggregate data
    if (chartType === 'pie' && xField && valueField) {
      const aggregated = rawData.items.reduce((acc, item) => {
        let key: string;
        if (isTemporalData) {
          key = createTemporalKey(item);
        } else {
          key = item[xField] || 'Unknown';
        }
        const value = Number(item[valueField]) || 0;
        if (acc[key]) {
          acc[key] += value;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(aggregated).map(([name, value]) => ({
        name,
        value,
        [xField]: name,
        [valueField]: value,
      }));
    }

    // For other chart types with temporal grouping
    if (isTemporalData && xField) {
      const grouped = rawData.items.reduce((acc, item) => {
        const temporalKey = createTemporalKey(item);
        if (!acc[temporalKey]) {
          acc[temporalKey] = {
            [xField]: temporalKey,
            count: 0,
          };
          if (yField) {
            acc[temporalKey][yField] = 0;
          }
        }
        acc[temporalKey].count += 1;
        if (yField) {
          const value = Number(item[yField]) || 0;
          acc[temporalKey][yField] += value;
        }
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped).sort((a, b) => {
        const extractYearMonth = (key: string) => {
          if (key.includes('/')) {
            const [month, year] = key.split('/');
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
            return { year: parseInt(year), month: monthIndex };
          }
          return { year: parseInt(key) || 0, month: 0 };
        };

        const aTime = extractYearMonth(a[xField]);
        const bTime = extractYearMonth(b[xField]);
        if (aTime.year !== bTime.year) {
          return aTime.year - bTime.year;
        }
        return aTime.month - bTime.month;
      });
    }

    // CORRIGIDO: Para dados não-temporais, processar diretamente
    if (xField && yField) {
      const grouped = rawData.items.reduce((acc, item) => {
        const key = item[xField] || 'Unknown';
        if (!acc[key]) {
          acc[key] = {
            [xField]: key,
            count: 0,
          };
          if (yField) {
            acc[key][yField] = 0;
          }
        }
        acc[key].count += 1;
        if (yField) {
          const value = Number(item[yField]) || 0;
          acc[key][yField] += value;
        }
        return acc;
      }, {} as Record<string, any>);

      const result = Object.values(grouped);
      console.log('✅ Processed data:', {
        totalItems: result.length,
        firstItem: result[0],
        lastItem: result[result.length - 1]
      });
      
      return result;
    }

    return [];
  }

  const exportToPNG = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `${config.name || 'chart'}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportToPDF = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${config.name || 'chart'}-${Date.now()}.pdf`);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderMainChart = () => {
    console.log('🏗️ renderMainChart called:', {
      isLoading,
      hasRawData: !!rawData,
      isComposed: config.isComposed,
      dataFields: config.dataFields
    });

    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-lg font-medium">Loading data...</p>
          </div>
        </div>
      );
    }

    if (!rawData || !rawData.items || rawData.items.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm mt-1">Load data first by clicking "Refresh Data"</p>
          </div>
        </div>
      );
    }

        // SOLUÇÃO PARA GRÁFICOS COMPOSTOS
    if (config.isComposed) {
      console.log('🎨 Rendering composed chart with fields:', config.dataFields);
      
      const hasPrimaryChart = config.dataFields?.primaryX && config.dataFields?.primaryY;
      const hasSecondaryChart = config.dataFields?.secondaryX && config.dataFields?.secondaryY;
      
      if (!hasPrimaryChart && !hasSecondaryChart) {
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg font-medium">Configure Overlaid Charts</p>
              <p className="text-sm mt-1">Drag fields to both Primary and Secondary chart areas</p>
            </div>
          </div>
        );
      }

      // Combinar dados dos dois gráficos usando o mesmo eixo X
      const xAxisField = config.dataFields?.primaryX || config.dataFields?.secondaryX || 'x';
      
      // Processar dados primários
      const primaryData = hasPrimaryChart && config.dataFields?.primaryX && config.dataFields?.primaryY ? 
        processSimpleChartData(rawData, {
          x: config.dataFields.primaryX,
          y: config.dataFields.primaryY,
        }, config.chart_type) : [];

      // Processar dados secundários
      const secondaryData = hasSecondaryChart && config.dataFields?.secondaryX && config.dataFields?.secondaryY ? 
        processSimpleChartData(rawData, {
          x: config.dataFields.secondaryX,
          y: config.dataFields.secondaryY,
        }, config.secondaryChartType || 'line') : [];

      // Mesclar dados em um único dataset
      const combinedData: any[] = [];
      const dataMap = new Map<string, any>();

      // Adicionar dados primários
      if (config.dataFields?.primaryX && config.dataFields?.primaryY) {
        primaryData.forEach(item => {
          const key = String(item[config.dataFields.primaryX!]);
          dataMap.set(key, {
            [xAxisField]: key,
            [config.dataFields.primaryY!]: item[config.dataFields.primaryY!]
          });
        });
      }

      // Adicionar dados secundários
      if (config.dataFields?.secondaryX && config.dataFields?.secondaryY) {
        secondaryData.forEach(item => {
          const key = String(item[config.dataFields.secondaryX!]);
          const existing = dataMap.get(key) || { [xAxisField]: key };
          existing[config.dataFields.secondaryY!] = item[config.dataFields.secondaryY!];
          dataMap.set(key, existing);
        });
      }

      combinedData.push(...Array.from(dataMap.values()));

      const chartColors = config.config?.colors || COLORS;
      const secondaryColors = ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

      return (
        <div className="relative w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={combinedData}
              margin={{ top: 20, right: 60, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              
              {/* Eixo X compartilhado */}
              <XAxis 
                dataKey={xAxisField}
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              
              {/* Eixo Y esquerdo (primário) */}
              {hasPrimaryChart && (
                <YAxis 
                  yAxisId="left"
                  fontSize={11}
                  orientation="left"
                />
              )}
              
              {/* Eixo Y direito (secundário) */}
              {hasSecondaryChart && (
                <YAxis 
                  yAxisId="right"
                  fontSize={11}
                  orientation="right"
                />
              )}
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Gráfico Primário */}
              {hasPrimaryChart && config.dataFields?.primaryY && (
                <>
                  {config.chart_type === 'bar' && (
                    <Bar
                      yAxisId="left"
                      dataKey={config.dataFields.primaryY}
                      name={config.dataFields.primaryY.replace(/_/g, ' ')}
                      fill={chartColors[0]}
                      fillOpacity={0.8}
                    />
                  )}
                  {config.chart_type === 'line' && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey={config.dataFields.primaryY}
                      name={config.dataFields.primaryY.replace(/_/g, ' ')}
                      stroke={chartColors[0]}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  )}
                  {config.chart_type === 'area' && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey={config.dataFields.primaryY}
                      name={config.dataFields.primaryY.replace(/_/g, ' ')}
                      fill={chartColors[0]}
                      stroke={chartColors[0]}
                      fillOpacity={0.6}
                    />
                  )}
                </>
              )}

              {/* Gráfico Secundário */}
              {hasSecondaryChart && config.dataFields?.secondaryY && (
                <>
                  {config.secondaryChartType === 'bar' && (
                    <Bar
                      yAxisId="right"
                      dataKey={config.dataFields.secondaryY}
                      name={config.dataFields.secondaryY.replace(/_/g, ' ')}
                      fill={secondaryColors[0]}
                      fillOpacity={0.7}
                    />
                  )}
                  {config.secondaryChartType === 'line' && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey={config.dataFields.secondaryY}
                      name={config.dataFields.secondaryY.replace(/_/g, ' ')}
                      stroke={secondaryColors[0]}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  )}
                  {config.secondaryChartType === 'area' && (
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey={config.dataFields.secondaryY}
                      name={config.dataFields.secondaryY.replace(/_/g, ' ')}
                      fill={secondaryColors[0]}
                      stroke={secondaryColors[0]}
                      fillOpacity={0.5}
                    />
                  )}
                </>
              )}

              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="line"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // CORRIGIDO: Gráficos simples
    const chartColors = config.config.colors || COLORS;
    
    if (processedMainData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">Configure your chart</p>
            <p className="text-sm mt-1">Drag fields to X-Axis and Y-Axis to create a chart</p>
          </div>
        </div>
      );
    }

    switch (config.chart_type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={processedMainData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={config.dataFields?.x}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              {config.dataFields?.y && (
                <Bar
                  dataKey={config.dataFields.y}
                  name={config.dataFields.y.replace(/_/g, ' ')}
                  fill={chartColors[0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={processedMainData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={config.dataFields?.x}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              {config.dataFields?.y && (
                <Line
                  type="monotone"
                  dataKey={config.dataFields.y}
                  name={config.dataFields.y.replace(/_/g, ' ')}
                  stroke={chartColors[0]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={processedMainData}
                dataKey={config.dataFields?.value}
                nameKey={config.dataFields?.x}
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({ name, value }) => `${name}: ${typeof value === 'number' ? value.toLocaleString() : value}`}
              >
                {processedMainData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>Chart type not supported yet</p>
          </div>
        );
    }
  };

  const renderOverlayChart = () => {
    if (!config.overlay?.enabled || !processedOverlayData.length) return null;

    const overlayColors = config.overlay.config.colors || ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    
    const getOverlayDimensions = () => {
      switch (config.overlay?.size) {
        case 'small': return { width: 200, height: 150 };
        case 'medium': return { width: 300, height: 200 };
        case 'large': return { width: 400, height: 250 };
        default: return { width: 200, height: 150 };
      }
    };

    const getOverlayPositionClasses = () => {
      switch (config.overlay?.position) {
        case 'top-left': return 'top-4 left-4';
        case 'top-right': return 'top-4 right-4';
        case 'bottom-left': return 'bottom-4 left-4';
        case 'bottom-right': return 'bottom-4 right-4';
        default: return 'top-4 right-4';
      }
    };

    const dimensions = getOverlayDimensions();
    const positionClasses = getOverlayPositionClasses();

    return (
      <div
        className={`absolute ${positionClasses} bg-white rounded-lg shadow-lg border border-gray-200 p-2`}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {config.overlay.config.title && (
          <div className="text-xs font-semibold text-gray-700 mb-1 text-center">
            {config.overlay.config.title}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={processedOverlayData}
              dataKey={config.overlay.dataFields?.value}
              nameKey={config.overlay.dataFields?.x}
              cx="50%"
              cy="50%"
              outerRadius={50}
              label={false}
            >
              {processedOverlayData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={overlayColors[index % overlayColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {config.config.title || config.name || 'Chart Preview'}
            </h2>
            {config.isComposed && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                <Layers className="w-3 h-3" />
                Overlaid
              </div>
            )}
            {config.overlay?.enabled && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                <Layers className="w-3 h-3" />
                Overlay
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-0.5">
            {processedMainData.length > 0 ? `${processedMainData.length} data points` : 'No data'}
            {config.overlay?.enabled && processedOverlayData.length > 0 && ` • Overlay: ${processedOverlayData.length} points`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPNG}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Export as PNG"
          >
            <ImageIcon className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={exportToPDF}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Export as PDF"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>
      <div ref={chartRef} className="flex-1 p-6 bg-white min-h-[400px] relative">
        {renderMainChart()}
        {renderOverlayChart()}
      </div>
    </div>
  );
}