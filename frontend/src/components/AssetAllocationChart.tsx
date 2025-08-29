'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Investment } from '@/lib/api';

interface AssetAllocationChartProps {
  investments: Investment[];
}

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const ASSET_COLORS = {
  STOCK: '#8B5CF6',      // Purple
  BOND: '#10B981',       // Green
  MUTUAL_FUND: '#F59E0B', // Amber
  ETF: '#3B82F6',        // Blue
  CRYPTO: '#EF4444',     // Red
  COMMODITY: '#6B7280',  // Gray
  REAL_ESTATE: '#8B5A2B', // Brown
  CASH: '#059669',       // Emerald
};

export default function AssetAllocationChart({ investments }: AssetAllocationChartProps) {
  // Calculate allocation by asset type
  const calculateAllocation = (): ChartData[] => {
    const allocationMap = new Map<string, number>();
    let totalValue = 0;

    investments.forEach((investment) => {
      const value = investment.current_value || 0;
      const assetType = investment.asset_type;
      
      allocationMap.set(assetType, (allocationMap.get(assetType) || 0) + value);
      totalValue += value;
    });

    const chartData: ChartData[] = [];
    
    allocationMap.forEach((value, assetType) => {
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      chartData.push({
        name: assetType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        value: value,
        percentage: percentage,
        color: ASSET_COLORS[assetType as keyof typeof ASSET_COLORS] || '#6B7280',
      });
    });

    return chartData.sort((a, b) => b.value - a.value);
  };

  const chartData = calculateAllocation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Value: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            Percentage: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No investment data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color, fontSize: '12px' }}>
                {value} ({entry.payload.percentage.toFixed(1)}%)
              </span>
            )}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
