'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Label,
} from 'recharts';

import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useState } from 'react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#8dd1e1'];

type Metric = {
  explanation: string;
  columns: string[];
  result: Record<string, string | number>[];
};

const viewTypes = [
  'table',
  'bar',
  'horizontalBar',
  'line',
  'area',
  'pie',
  'donut',
] as const;

type ViewType = (typeof viewTypes)[number];

type MetricMultiViewProps = {
  metric: Metric;
};

const formatText = (text: string) => {
  return text.replaceAll('-', ' ').replaceAll('_', ' ');
};

export const MetricMultiView = ({ metric }: MetricMultiViewProps) => {
  const { explanation, columns, result } = metric;
  const [view, setView] = useState<ViewType>('table');

  if (!result?.length) return null;

  const xKey = Object.keys(result[0])[0];
  const yKey = Object.keys(result[0])[1];
  const formattedXKey = formatText(xKey);
  const formattedYKey = formatText(yKey);

  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm w-full">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">

        
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold text-gray-700">{explanation}</h3>
          <Select value={view} onValueChange={(val) => setView(val as ViewType)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              {viewTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {view !== 'table' && (
          <h4 className="text-sm font-medium text-gray-600">{formattedXKey} vs {formattedYKey}</h4>
        )}

        {/* Table View */}
        {view === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100 text-left">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-2 border">
                      {formatText(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="px-4 py-2 border">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bar Chart */}
        {view === 'bar' && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={result}>
              <XAxis dataKey={xKey} tickFormatter={formatText}>
                <Label value={formattedXKey} offset={-5} position="insideBottom" />
              </XAxis>
              <YAxis>
                <Label value={formattedYKey} angle={-90} position="insideLeft" />
              </YAxis>
              <Tooltip formatter={(value, name) => [value, formatText(name)]} />
              <Bar dataKey={yKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Horizontal Bar Chart */}
        {view === 'horizontalBar' && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={result} layout="vertical">
              <XAxis type="number">
                <Label value={formattedYKey} position="insideBottom" offset={-5} />
              </XAxis>
              <YAxis type="category" dataKey={xKey} tickFormatter={formatText}>
                <Label value={formattedXKey} angle={-90} position="insideLeft" />
              </YAxis>
              <Tooltip formatter={(value, name) => [value, formatText(name)]} />
              <Bar dataKey={yKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Line Chart */}
        {view === 'line' && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={result}>
              <XAxis dataKey={xKey} tickFormatter={formatText}>
                <Label value={formattedXKey} offset={-5} position="insideBottom" />
              </XAxis>
              <YAxis>
                <Label value={formattedYKey} angle={-90} position="insideLeft" />
              </YAxis>
              <Tooltip formatter={(value, name) => [value, formatText(name)]} />
              <Line type="monotone" dataKey={yKey} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Area Chart */}
        {view === 'area' && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={result}>
              <XAxis dataKey={xKey} tickFormatter={formatText}>
                <Label value={formattedXKey} offset={-5} position="insideBottom" />
              </XAxis>
              <YAxis>
                <Label value={formattedYKey} angle={-90} position="insideLeft" />
              </YAxis>
              <Tooltip formatter={(value, name) => [value, formatText(name)]} />
              <Area type="monotone" dataKey={yKey} stroke="#8884d8" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Pie Chart */}
        {view === 'pie' && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={result}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${formatText(String(name))}: ${value}`}
              >
                {result.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, formatText(name)]} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Donut Chart */}
        {view === 'donut' && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={result}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label={({ name, value }) => `${formatText(String(name))}: ${value}`}
              >
                {result.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, formatText(name)]} />
            </PieChart>
          </ResponsiveContainer>
        )}
        </div>
      </CardContent>
    </Card>
  );
};
