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

// Helper para formatar nomes de campos
const formatFieldName = (fieldName?: string) => {
  if (!fieldName) return '';
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface ChartPreviewProps {
  config: ChartConfiguration;
  rawData: RawDataResponse | null;
  isLoading?: boolean;
  onConfigChange?: (config: ChartConfiguration) => void;
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
  onConfigChange,
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
    <div className="relative w-full h-[500px]"> {/* ✅ Aumentar altura também */}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={combinedData}
          margin={{ top: 20, right: 80, left: 80, bottom: 80 }} // ✅ Aumentar margens para labels
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          {/* Eixo X compartilhado */}
          <XAxis 
            dataKey={xAxisField}
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={60}
            label={{ 
              value: formatFieldName(xAxisField), 
              position: 'insideBottom', 
              offset: -10,
              style: { fontSize: 13, fill: '#4b5563', fontWeight: 500 }
            }}
          />
          
          {/* Eixo Y esquerdo (primário) */}
          {hasPrimaryChart && (
            <YAxis 
              yAxisId="left"
              fontSize={11}
              orientation="left"
              label={{ 
                value: formatFieldName(config.dataFields?.primaryY), 
                angle: -90, 
                position: 'insideLeft',
                offset: 10,
                style: { fontSize: 13, fill: '#3b82f6', fontWeight: 500 } // ✅ Azul para primário
              }}
            />
          )}
          
          {/* Eixo Y direito (secundário) */}
          {hasSecondaryChart && (
            <YAxis 
              yAxisId="right"
              fontSize={11}
              orientation="right"
              label={{ 
                value: formatFieldName(config.dataFields?.secondaryY), 
                angle: 90, 
                position: 'insideRight',
                offset: 10,
                style: { fontSize: 13, fill: '#8b5cf6', fontWeight: 500 } // ✅ Roxo para secundário
              }}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} />

              <Tooltip content={<CustomTooltip />} />

              {/* Gráfico Primário */}
              {hasPrimaryChart && config.dataFields?.primaryY && (
                <>
                  {config.chart_type === 'bar' && (
                    <Bar
                      yAxisId="left"
                      dataKey={config.dataFields.primaryY}
                      name={formatFieldName(config.dataFields.primaryY)} // ✅ Legenda automática
                      fill={chartColors[0]}
                      fillOpacity={0.8}
                    />
                  )}
                  {config.chart_type === 'line' && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey={config.dataFields.primaryY}
                      name={formatFieldName(config.dataFields.primaryY)} // ✅ Legenda automática
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
                      name={formatFieldName(config.dataFields.primaryY)} // ✅ Legenda automática
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
                      name={formatFieldName(config.dataFields.secondaryY)} // ✅ Legenda automática
                      fill={secondaryColors[0]}
                      fillOpacity={0.7}
                    />
                  )}
                  {config.secondaryChartType === 'line' && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey={config.dataFields.secondaryY}
                      name={formatFieldName(config.dataFields.secondaryY)} // ✅ Legenda automática
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
                      name={formatFieldName(config.dataFields.secondaryY)} // ✅ Legenda automática
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
                label={{
                  value: formatFieldName(config.dataFields?.x),
                  position: 'insideBottom',
                  offset: -50,
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
              />
              <YAxis
                fontSize={12}
                label={{
                  value: formatFieldName(config.dataFields?.y),
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {config.config.showLegend && <Legend />}
              {config.dataFields?.y && (
                <Bar
                  dataKey={config.dataFields.y}
                  name={formatFieldName(config.dataFields.y)} // ✅ Legenda automática
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
                label={{
                  value: formatFieldName(config.dataFields?.x),
                  position: 'insideBottom',
                  offset: -50,
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
              />
              <YAxis
                fontSize={12}
                label={{
                  value: formatFieldName(config.dataFields?.y),
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {config.config.showLegend && <Legend />}
              {config.dataFields?.y && (
                <Line
                  type="monotone"
                  dataKey={config.dataFields.y}
                  name={formatFieldName(config.dataFields.y)} // ✅ Legenda automática
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
            <AreaChart
              data={processedMainData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              {/* ✅ Comentar ou remover CartesianGrid */}
          {/* <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /> */}
              <XAxis
                dataKey={config.dataFields?.x}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
                label={{
                  value: formatFieldName(config.dataFields?.x),
                  position: 'insideBottom',
                  offset: -50,
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
              />
              <YAxis
                fontSize={12}
                label={{
                  value: formatFieldName(config.dataFields?.y),
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {config.config.showLegend && <Legend />}
              {config.dataFields?.y && (
                <Area
                  type="monotone"
                  dataKey={config.dataFields.y}
                  name={formatFieldName(config.dataFields.y)}
                  fill={chartColors[0]}
                  stroke={chartColors[0]}
                  fillOpacity={0.6}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
      // ✅ Verificar se há dados antes de renderizar
      if (!processedMainData || processedMainData.length === 0) {
        return (
          <div className="flex items-center justify-center h-[500px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No data available for Pie Chart</p>
          </div>
        );
      }

      return (
        <ResponsiveContainer width="100%" height={500}>
          <PieChart>
            <Pie
              data={processedMainData}
              dataKey={config.dataFields?.value}
              nameKey={config.dataFields?.x}
              cx="38%"
              cy="50%"
              outerRadius={160}
              paddingAngle={2}
              label={false}
            >
              {processedMainData.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0];
                  const total = processedMainData.reduce(
                    (sum, item) => sum + (item[config.dataFields?.value || ''] || 0), 
                    0
                  );
                  const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
                  
                  return (
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg">
                      <p className="font-semibold text-gray-900 text-sm mb-2">
                        {data.name}
                      </p>
                      <div className="space-y-1">
                        <p className="text-gray-700 text-sm">
                          <span className="text-gray-500">Value:</span>{' '}
                          <span className="font-bold">
                            {typeof data.value === 'number' 
                              ? data.value.toLocaleString() 
                              : data.value}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {percentage}% of total
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* ✅ Só mostrar Legend se tiver dados E showLegend ativo */}
            {config.config.showLegend && processedMainData.length > 0 && (
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                iconSize={10}
                wrapperStyle={{
                  paddingLeft: '30px',
                  fontSize: '13px',
                  lineHeight: '26px',
                }}
                formatter={(value) => {
                  if (value && value.length > 25) {
                    return value.substring(0, 25) + '...';
                  }
                  return value || '';
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
              data={processedMainData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey={config.dataFields?.x}
                name={formatFieldName(config.dataFields?.x)}
                fontSize={12}
                label={{
                  value: formatFieldName(config.dataFields?.x),
                  position: 'insideBottom',
                  offset: -50,
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
              />
              <YAxis
                type="number"
                dataKey={config.dataFields?.y}
                name={formatFieldName(config.dataFields?.y)}
                fontSize={12}
                label={{
                  value: formatFieldName(config.dataFields?.y),
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={<CustomTooltip />}
              />
              {config.config.showLegend && <Legend />}
              {config.dataFields?.x && config.dataFields?.y && (
                <Scatter
                  name={`${formatFieldName(config.dataFields.y)} vs ${formatFieldName(config.dataFields.x)}`}
                  data={processedMainData}
                  fill={chartColors[0]}
                  shape="circle"
                />
              )}
            </ScatterChart>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Header com nome editável */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Nome editável inline */}
          <input
            type="text"
            value={config.name || 'New Chart'}
            onChange={(e) => {
              if (onConfigChange) {
                onConfigChange({ ...config, name: e.target.value });
              }
            }}
            disabled={!onConfigChange}
            className={`text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2 py-1 -ml-2 transition-colors flex-1 min-w-0 max-w-md ${onConfigChange ? 'hover:bg-gray-50 cursor-text' : 'cursor-default'
              }`}
            placeholder="Chart Name"
          />

          {/* Badges e Info */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {config.isComposed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                <Layers className="w-3 h-3" />
                Overlaid
              </span>
            )}

            {config.overlay?.enabled && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <Layers className="w-3 h-3" />
                Overlay
              </span>
            )}

            {/* Info de dados */}
            <span className="text-xs text-gray-500 font-medium">
              {processedMainData.length > 0
                ? `${processedMainData.length} points`
                : 'No data'}
            </span>
          </div>
        </div>

        {/* Botões de Export */}
        <div className="flex gap-2 flex-shrink-0 ml-4">
          <button
            onClick={exportToPNG}
            disabled={isLoading || !rawData || !rawData.items || rawData.items.length === 0} // ✅ Verificar rawData ao invés de processedMainData
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Export as PNG"
          >
            <ImageIcon className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={exportToPDF}
            disabled={isLoading || !rawData || !rawData.items || rawData.items.length === 0} // ✅ Mesma verificação
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Export as PDF"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div ref={chartRef} className="flex-1 p-6 bg-white min-h-[500px] relative">
        {renderMainChart()}
        {renderOverlayChart()}
      </div>
    </div>
  );
}