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
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Image as ImageIcon, FileText, Loader } from 'lucide-react';
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

  // Process raw data for chart consumption
  const processedData = useMemo(() => {
    if (!rawData || !rawData.items || !rawData.items.length) {
      return [];
    }

    const xAxisField = config.data_fields.find(df => df.axis === 'x');
    const yAxisFields = config.data_fields.filter(df => df.axis === 'y');
    const valueField = config.data_fields.find(df => df.axis === 'value');

    if (!xAxisField && !valueField) return [];

    // Check if we're dealing with temporal data
    const isTemporalData = xAxisField && (
      isTemporalField(xAxisField.field.id) || 
      (rawData.items[0]?.year && rawData.items[0]?.month)
    );

    // For pie charts, aggregate data
    if (config.chart_type === 'pie' && xAxisField && valueField) {
      const aggregated = rawData.items.reduce((acc, item) => {
        let key: string;
        
        if (isTemporalData) {
          key = createTemporalKey(item);
        } else {
          key = item[xAxisField.field.id] || 'Unknown';
        }
        
        const value = Number(item[valueField.field.id]) || 0;
        
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
        [xAxisField.field.id]: name,
        [valueField.field.id]: value,
      }));
    }

    // For other chart types, process data with temporal grouping if needed
    if (isTemporalData && xAxisField) {
      // Group data by temporal key and aggregate numeric values
      const grouped = rawData.items.reduce((acc, item) => {
        const temporalKey = createTemporalKey(item);
        
        if (!acc[temporalKey]) {
          acc[temporalKey] = {
            [xAxisField.field.id]: temporalKey,
            [xAxisField.field.name]: temporalKey,
            count: 0,
          };
          
          // Initialize all y-axis fields
          yAxisFields.forEach(yField => {
            acc[temporalKey][yField.field.id] = 0;
            acc[temporalKey][yField.field.name] = 0;
          });
        }
        
        acc[temporalKey].count += 1;
        
        // Aggregate y-axis values
        yAxisFields.forEach(yField => {
          const value = Number(item[yField.field.id]) || 0;
          acc[temporalKey][yField.field.id] += value;
          acc[temporalKey][yField.field.name] += value;
        });
        
        return acc;
      }, {} as Record<string, any>);

      // Convert to array and sort by temporal order
      const result = Object.values(grouped).sort((a, b) => {
        // Extract year and month for proper sorting
        const extractYearMonth = (key: string) => {
          if (key.includes('/')) {
            const [month, year] = key.split('/');
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
            return { year: parseInt(year), month: monthIndex };
          }
          return { year: parseInt(key) || 0, month: 0 };
        };
        
        const aTime = extractYearMonth(a[xAxisField.field.id]);
        const bTime = extractYearMonth(b[xAxisField.field.id]);
        
        if (aTime.year !== bTime.year) {
          return aTime.year - bTime.year;
        }
        return aTime.month - bTime.month;
      });

      return result;
    }

    // For non-temporal data, process normally but still group by x-axis value
    if (xAxisField) {
      const grouped = rawData.items.reduce((acc, item) => {
        const key = item[xAxisField.field.id] || 'Unknown';
        
        if (!acc[key]) {
          acc[key] = {
            [xAxisField.field.id]: key,
            [xAxisField.field.name]: key,
            count: 0,
          };
          
          // Initialize all y-axis fields
          yAxisFields.forEach(yField => {
            acc[key][yField.field.id] = 0;
            acc[key][yField.field.name] = 0;
          });
        }
        
        acc[key].count += 1;
        
        // Aggregate y-axis values
        yAxisFields.forEach(yField => {
          const value = Number(item[yField.field.id]) || 0;
          acc[key][yField.field.id] += value;
          acc[key][yField.field.name] += value;
        });
        
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped);
    }

    // Fallback to original processing
    return rawData.items.map(item => {
      const processedItem: Record<string, any> = {};
      
      if (xAxisField) {
        let xValue = item[xAxisField.field.id];
        
        // Format temporal data
        if (isTemporalData) {
          xValue = createTemporalKey(item);
        }
        
        processedItem[xAxisField.field.id] = xValue;
        processedItem[xAxisField.field.name] = xValue;
      }
      
      yAxisFields.forEach(yField => {
        const yValue = item[yField.field.id];
        processedItem[yField.field.id] = typeof yValue === 'number' ? yValue : Number(yValue) || 0;
        processedItem[yField.field.name] = typeof yValue === 'number' ? yValue : Number(yValue) || 0;
      });
      
      return processedItem;
    });
  }, [rawData, config.data_fields, config.chart_type]);

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

  const xAxisField = config.data_fields.find(df => df.axis === 'x');
  const yAxisFields = config.data_fields.filter(df => df.axis === 'y');
  const valueField = config.data_fields.find(df => df.axis === 'value');

  const hasData = processedData.length > 0;
  const canRenderChart =
    (config.chart_type === 'pie' && valueField && hasData) ||
    (config.chart_type !== 'pie' && xAxisField && yAxisFields.length > 0 && hasData);

  const renderChart = () => {
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

    if (!canRenderChart) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No data to display</p>
            <p className="text-sm mt-1">
              {!hasData 
                ? 'Load data first by clicking "Refresh Data"'
                : 'Configure your chart fields to see a preview'
              }
            </p>
          </div>
        </div>
      );
    }

    const chartColors = config.config.colors || COLORS;
    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    // Custom tooltip for better temporal data display
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
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

    switch (config.chart_type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              {config.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xAxisField?.field.id}
                label={config.config.xAxisLabel ? { value: config.config.xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                label={config.config.yAxisLabel ? { value: config.config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip content={<CustomTooltip />} />
              {config.config.showLegend && <Legend />}
              {yAxisFields.map((field, index) => (
                <Bar
                  key={field.field.id}
                  dataKey={field.field.id}
                  name={field.field.name}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              {config.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xAxisField?.field.id}
                label={config.config.xAxisLabel ? { value: config.config.xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                label={config.config.yAxisLabel ? { value: config.config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip content={<CustomTooltip />} />
              {config.config.showLegend && <Legend />}
              {yAxisFields.map((field, index) => (
                <Line
                  key={field.field.id}
                  type="monotone"
                  dataKey={field.field.id}
                  name={field.field.name}
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              {config.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xAxisField?.field.id}
                label={config.config.xAxisLabel ? { value: config.config.xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                label={config.config.yAxisLabel ? { value: config.config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip content={<CustomTooltip />} />
              {config.config.showLegend && <Legend />}
              {yAxisFields.map((field, index) => (
                <Area
                  key={field.field.id}
                  type="monotone"
                  dataKey={field.field.id}
                  name={field.field.name}
                  fill={chartColors[index % chartColors.length]}
                  stroke={chartColors[index % chartColors.length]}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={processedData}
                dataKey={valueField?.field.id}
                nameKey={xAxisField?.field.id}
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({ name, value }) => `${name}: ${typeof value === 'number' ? value.toLocaleString() : value}`}
              >
                {processedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {config.config.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        const xField = xAxisField?.field.id;
        const yField = yAxisFields[0]?.field.id;
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              {config.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xField}
                type="number"
                label={config.config.xAxisLabel ? { value: config.config.xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
              />
              <YAxis
                dataKey={yField}
                type="number"
                label={config.config.yAxisLabel ? { value: config.config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              {config.config.showLegend && <Legend />}
              <Scatter
                name="Data Points"
                data={processedData}
                fill={chartColors[0]}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {config.config.title || config.name || 'Chart Preview'}
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {processedData.length > 0 ? `${processedData.length} data points` : 'No data'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPNG}
            disabled={!canRenderChart || isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Export as PNG"
          >
            <ImageIcon className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={exportToPDF}
            disabled={!canRenderChart || isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Export as PDF"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <div ref={chartRef} className="flex-1 p-6 bg-white min-h-[400px]">
        {renderChart()}
      </div>
    </div>
  );
}