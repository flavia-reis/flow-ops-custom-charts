import { useRef } from 'react';
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
import { Download, Image as ImageIcon, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ChartType, ChartDataField, ChartConfig } from '../types/chart';

interface ChartPreviewProps {
  chartType: ChartType;
  xAxisFields: ChartDataField[];
  yAxisFields: ChartDataField[];
  valueFields: ChartDataField[];
  config: ChartConfig;
  data: Record<string, unknown>[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ChartPreview({
  chartType,
  xAxisFields,
  yAxisFields,
  valueFields,
  config,
  data,
}: ChartPreviewProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const exportToPNG = async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    const link = document.createElement('a');
    link.download = `chart-${Date.now()}.png`;
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
    pdf.save(`chart-${Date.now()}.pdf`);
  };

  const xDataKey = xAxisFields[0]?.field.name;
  const yDataKey = yAxisFields[0]?.field.name;
  const valueDataKey = valueFields[0]?.field.name;

  const hasData = data.length > 0;
  const canRenderChart =
    (chartType === 'pie' && valueDataKey && hasData) ||
    (chartType !== 'pie' && xDataKey && yDataKey && hasData);

  const renderChart = () => {
    if (!canRenderChart) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No data to display</p>
            <p className="text-sm mt-1">Configure your chart fields to see a preview</p>
          </div>
        </div>
      );
    }

    const chartColors = config.colors || COLORS;
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xDataKey}
                label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
              />
              <YAxis
                label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip />
              {config.showLegend && <Legend />}
              {yAxisFields.map((field, index) => (
                <Bar
                  key={field.field.id}
                  dataKey={field.field.name}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xDataKey}
                label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
              />
              <YAxis
                label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip />
              {config.showLegend && <Legend />}
              {yAxisFields.map((field, index) => (
                <Line
                  key={field.field.id}
                  type="monotone"
                  dataKey={field.field.name}
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xDataKey}
                label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
              />
              <YAxis
                label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip />
              {config.showLegend && <Legend />}
              {yAxisFields.map((field, index) => (
                <Area
                  key={field.field.id}
                  type="monotone"
                  dataKey={field.field.name}
                  fill={chartColors[index % chartColors.length]}
                  stroke={chartColors[index % chartColors.length]}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={valueDataKey}
                nameKey={xDataKey}
                cx="50%"
                cy="50%"
                outerRadius={150}
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              {config.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xDataKey}
                label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
              />
              <YAxis
                dataKey={yDataKey}
                label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              {config.showLegend && <Legend />}
              <Scatter
                name="Data"
                data={data}
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
            {config.title || 'Chart Preview'}
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">Real-time visualization</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPNG}
            disabled={!canRenderChart}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Export as PNG"
          >
            <ImageIcon className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={exportToPDF}
            disabled={!canRenderChart}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Export as PDF"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <div ref={chartRef} className="flex-1 p-6 bg-white">
        {renderChart()}
      </div>
    </div>
  );
}
