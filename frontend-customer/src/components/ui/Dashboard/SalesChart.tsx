import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Paper, Typography, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SalesChartData } from '@/services/reports';

export interface SalesChartProps {
  data: SalesChartData[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  chartType?: 'line' | 'bar';
  onChartTypeChange?: (type: 'line' | 'bar') => void;
  loading?: boolean;
}

export const SalesChart: React.FC<SalesChartProps> = ({
  data,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  chartType = 'line',
  onChartTypeChange,
  loading = false,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
    });
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            {formatDate(label)}
          </Typography>
          {payload.map((entry: { dataKey?: string; value?: number; color?: string }, index: number) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                }}
              />
              <Typography variant="body2">
                {entry.dataKey === 'sales' ? t('dashboard.kpis.sales', 'المبيعات') : t('dashboard.kpis.orders', 'الطلبات')}: {' '}
                {entry.dataKey === 'sales' ? formatCurrency(entry.value) : entry.value}
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (loading) {
      return (
        <Box
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('common.loading', 'جارٍ التحميل...')}
          </Typography>
        </Box>
      );
    }

    if (!data || data.length === 0) {
      return (
        <Box
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.noData', 'لا توجد بيانات')}
          </Typography>
        </Box>
      );
    }

    const chartProps = {
      data,
      margin: {
        top: 20,
        right: isRTL ? 30 : 20,
        left: isRTL ? 20 : 30,
        bottom: 20,
      },
    };

    if (chartType === 'bar') {
      return (
        <BarChart {...chartProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            reversed={isRTL}
          />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Bar
            dataKey="sales"
            fill="#1976d2"
            name={t('dashboard.kpis.sales', 'المبيعات')}
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="orders"
            fill="#dc004e"
            name={t('dashboard.kpis.orders', 'الطلبات')}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      );
    }

    return (
      <LineChart {...chartProps}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          reversed={isRTL}
        />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#1976d2"
          strokeWidth={3}
          name={t('dashboard.kpis.sales', 'المبيعات')}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="orders"
          stroke="#dc004e"
          strokeWidth={2}
          strokeDasharray="5 5"
          name={t('dashboard.kpis.orders', 'الطلبات')}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    );
  };

  return (
    <Box>
      {(title || onChartTypeChange) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {title && (
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          )}

          {onChartTypeChange && (
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(_, value) => value && onChartTypeChange(value)}
              size="small"
            >
              <ToggleButton value="line">
                {t('dashboard.chart.line', 'خطي')}
              </ToggleButton>
              <ToggleButton value="bar">
                {t('dashboard.chart.bar', 'عمودي')}
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>
      )}

      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </Box>
  );
};

export default SalesChart;
