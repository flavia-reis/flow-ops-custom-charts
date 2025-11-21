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

  // NOVA LÓGICA: Processar dados usando ComposedDataFields
  const processedMainData = useMemo(() => {
    if (!rawData || !config.dataFields) return [];
    
    // Para gráficos simples
    return processSimpleChartData(rawData, config.dataFields, config.chart_type);
  }, [rawData, config.dataFields, config.chart_type]);

  // Process data for overlay chart
  const processedOverlayData = useMemo(() => {
    if (!config.overlay?.enabled || !config.overlay.dataFields) {
      return [];
    }
    return processSimpleChartData(rawData, config.overlay.dataFields, config.overlay.type);
  }, [rawData, config.overlay]);

  // NOVA FUNÇÃO: Processar dados para gráficos simples
  function processSimpleChartData(rawData: RawDataResponse | null, dataFields: any, chartType: string) {
    if (!rawData || !rawData.items || !rawData.items.length) {
      return [];
    }

    const xField = dataFields.x;
    const yField = dataFields.y;
    const valueField = dataFields.value;

    if (!xField && !valueField) return [];

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

    // For non-temporal data, group by x-axis value
    if (xField) {
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

      return Object.values(grouped);
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

  // NOVA LÓGICA: Verificar se pode renderizar
  const hasMainData = processedMainData.length > 0;
  const canRenderMainChart = hasMainData && (
  (config.chart_type === 'pie' && config.dataFields?.value) ||
  (config.chart_type !== 'pie' && !config.isComposed && config.dataFields?.x && config.dataFields?.y) ||
  (config.isComposed && (
    (config.dataFields?.primaryY1 && config.dataFields?.primaryY1) ||
    (config.dataFields?.secondaryY1 && config.dataFields?.secondaryY1)
  ))
);

  const hasOverlayData = processedOverlayData.length > 0;
  const canRenderOverlay = config.overlay?.enabled && hasOverlayData;

  // Get overlay dimensions based on size
  const getOverlayDimensions = () => {
    switch (config.overlay?.size) {
      case 'small': return { width: 200, height: 150 };
      case 'medium': return { width: 300, height: 200 };
      case 'large': return { width: 400, height: 250 };
      default: return { width: 200, height: 150 };
    }
  };

  // Get overlay position classes
  const getOverlayPositionClasses = () => {
    switch (config.overlay?.position) {
      case 'top-left': return 'top-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      default: return 'top-4 right-4';
    }
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

  // NOVA FUNÇÃO: Renderizar gráficos sobrepostos independentes
  const renderOverlaidCharts = () => {
    if (!config.isComposed) return null;

    const chartColors = config.config.colors || COLORS;
    const secondaryColors = ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316']; // Cores diferentes para o segundo gráfico

    // CORRIGIDO: Dados para o gráfico primário
    const primaryData = processSimpleChartData(rawData, {
      x: config.dataFields?.primaryY1,  // CORRIGIDO
      y: config.dataFields?.primaryY1,  // CORRIGIDO
    }, config.chart_type);

    // CORRIGIDO: Dados para o gráfico secundário
    const secondaryData = processSimpleChartData(rawData, {
      x: config.dataFields?.secondaryY1, // CORRIGIDO
      y: config.dataFields?.secondaryY1, // CORRIGIDO
    }, config.secondaryChartType || 'line');

    // Verificar se temos dados suficientes para renderizar
    const canRenderPrimary = config.dataFields?.primaryY1 && config.dataFields?.primaryY1 && primaryData.length > 0;
    const canRenderSecondary = config.dataFields?.secondaryY1 && config.dataFields?.secondaryY1 && secondaryData.length > 0;

    if (!canRenderPrimary && !canRenderSecondary) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">Configure overlaid charts</p>
            <p className="text-sm mt-1">
              Drag fields to both Primary and Secondary chart areas to see overlaid visualization
            </p>
            <div className="text-xs mt-2 text-gray-500">
              <p>Primary: {config.dataFields?.primaryY1 ? '✅' : '❌'} X-Axis, {config.dataFields?.primaryY1 ? '✅' : '❌'} Y-Axis</p>
              <p>Secondary: {config.dataFields?.secondaryY1 ? '✅' : '❌'} X-Axis, {config.dataFields?.secondaryY1 ? '✅' : '❌'} Y-Axis</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-[400px]">
        {/* Gráfico Primário (fundo) */}
        {canRenderPrimary && (
          <div className="absolute inset-0 z-10">
            <ResponsiveContainer width="100%" height="100%">
              {renderSingleChart(
                primaryData, 
                config.chart_type, 
                config.dataFields?.primaryY1,
                config.dataFields?.primaryY1,
                chartColors,
                {
                  showTopXAxis: false,
                  showBottomXAxis: true,
                  showLeftYAxis: true,
                  showRightYAxis: false,
                  opacity: 0.8
                }
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico Secundário (frente) */}
        {canRenderSecondary && (
          <div className="absolute inset-0 z-20">
            <ResponsiveContainer width="100%" height="100%">
              {renderSingleChart(
                secondaryData, 
                config.secondaryChartType || 'line', 
                config.dataFields?.secondaryY1,
                config.dataFields?.secondaryY1,
                secondaryColors,
                {
                  showTopXAxis: true,
                  showBottomXAxis: false,
                  showLeftYAxis: false,
                  showRightYAxis: true,
                  opacity: 0.7,
                  backgroundColor: 'transparent'
                }
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Legendas customizadas */}
        {(canRenderPrimary || canRenderSecondary) && (
          <div className="absolute top-2 left-2 z-30 bg-white/90 rounded p-2 text-xs">
            {canRenderPrimary && (
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: chartColors[0] }}></div>
                <span>{config.chart_type.toUpperCase()}: {config.dataFields?.primaryY1?.replace(/_/g, ' ')}</span>
              </div>
            )}
            {canRenderSecondary && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: secondaryColors[0] }}></div>
                <span>{config.secondaryChartType?.toUpperCase()}: {config.dataFields?.secondaryY1?.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // NOVA FUNÇÃO: Renderizar um gráfico individual com configurações específicas
  const renderSingleChart = (
    data: any[], 
    chartType: string, 
    xField?: string, 
    yField?: string, 
    colors: string[] = COLORS,
    options: {
      showTopXAxis?: boolean;
      showBottomXAxis?: boolean;
      showLeftYAxis?: boolean;
      showRightYAxis?: boolean;
      opacity?: number;
      backgroundColor?: string;
    } = {}
  ) => {
    const {
      showTopXAxis = false,
      showBottomXAxis = true,
      showLeftYAxis = true,
      showRightYAxis = false,
      opacity = 1,
      backgroundColor = 'white'
    } = options;

    const commonProps = {
      data,
      margin: { top: 40, right: 60, left: 60, bottom: 40 },
    };

    const xAxisProps = {
      dataKey: xField,
      fontSize: 11,
      angle: -45,
      textAnchor: "end" as const,
      height: 50,
      axisLine: true,
      tickLine: true,
    };

    const yAxisProps = {
      fontSize: 11,
      axisLine: true,
      tickLine: true,
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {backgroundColor !== 'transparent' && (
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            )}
            
            {showBottomXAxis && (
              <XAxis {...xAxisProps} orientation="bottom" />
            )}
            {showTopXAxis && (
              <XAxis {...xAxisProps} orientation="top" />
            )}
            {showLeftYAxis && (
              <YAxis {...yAxisProps} orientation="left" />
            )}
            {showRightYAxis && (
              <YAxis {...yAxisProps} orientation="right" />
            )}
            
            <Tooltip 
              content={<CustomTooltip />}
              wrapperStyle={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
            />
            
            {yField && (
              <Bar
                dataKey={yField}
                name={yField.replace(/_/g, ' ')}
                fill={colors[0]}
                fillOpacity={opacity}
                stroke={colors[0]}
                strokeWidth={1}
              />
            )}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {backgroundColor !== 'transparent' && (
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            )}
            
            {showBottomXAxis && (
              <XAxis {...xAxisProps} orientation="bottom" />
            )}
            {showTopXAxis && (
              <XAxis {...xAxisProps} orientation="top" />
            )}
            {showLeftYAxis && (
              <YAxis {...yAxisProps} orientation="left" />
            )}
            {showRightYAxis && (
              <YAxis {...yAxisProps} orientation="right" />
            )}
            
            <Tooltip 
              content={<CustomTooltip />}
              wrapperStyle={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
            />
            
            {yField && (
              <Line
                type="monotone"
                dataKey={yField}
                name={yField.replace(/_/g, ' ')}
                stroke={colors[0]}
                strokeWidth={3}
                strokeOpacity={opacity}
                dot={{ r: 4, fill: colors[0], fillOpacity: opacity }}
                activeDot={{ r: 6, fill: colors[0] }}
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {backgroundColor !== 'transparent' && (
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            )}
            
            {showBottomXAxis && (
              <XAxis {...xAxisProps} orientation="bottom" />
            )}
            {showTopXAxis && (
              <XAxis {...xAxisProps} orientation="top" />
            )}
            {showLeftYAxis && (
              <YAxis {...yAxisProps} orientation="left" />
            )}
            {showRightYAxis && (
              <YAxis {...yAxisProps} orientation="right" />
            )}
            
            <Tooltip 
              content={<CustomTooltip />}
              wrapperStyle={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
            />
            
            {yField && (
              <Area
                type="monotone"
                dataKey={yField}
                name={yField.replace(/_/g, ' ')}
                fill={colors[0]}
                fillOpacity={opacity * 0.6}
                stroke={colors[0]}
                strokeWidth={2}
                strokeOpacity={opacity}
              />
            )}
          </AreaChart>
        );

      default:
        return null;
    }
  };

  const renderMainChart = () => {
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

    if (!canRenderMainChart) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No data to display</p>
            <p className="text-sm mt-1">
              {!hasMainData
                ? 'Load data first by clicking "Refresh Data"'
                : 'Configure your chart fields to see a preview'
              }
            </p>
          </div>
        </div>
      );
    }

    // NOVA LÓGICA: Se é composto, renderizar gráficos sobrepostos
    if (config.isComposed) {
      return renderOverlaidCharts();
    }

    // Gráficos simples (código existente)
    const chartColors = config.config.colors || COLORS;
    const commonProps = {
      data: processedMainData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 },
    };

    switch (config.chart_type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
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
            <LineChart {...commonProps}>
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

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
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
                <Area
                  type="monotone"
                  dataKey={config.dataFields.y}
                  name={config.dataFields.y.replace(/_/g, ' ')}
                  fill={chartColors[0]}
                  stroke={chartColors[0]}
                />
              )}
            </AreaChart>
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

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={config.dataFields?.x} type="number" fontSize={12} />
              <YAxis dataKey={config.dataFields?.y} type="number" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Data Points" data={processedMainData} fill={chartColors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const renderOverlayChart = () => {
    if (!canRenderOverlay || !config.overlay) return null;

    const overlayColors = config.overlay.config.colors || ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
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
            {canRenderOverlay && ` • Overlay: ${processedOverlayData.length} points`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPNG}
            disabled={!canRenderMainChart || isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Export as PNG"
          >
            <ImageIcon className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={exportToPDF}
            disabled={!canRenderMainChart || isLoading}
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