import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/services/reports';
import type { DashboardData, ReportsFilters } from '@/services/reports';

export interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  filters?: Partial<ReportsFilters>;
}

export const useDashboard = (options: UseDashboardOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    filters,
  } = options;

  const queryClient = useQueryClient();

  // State for filters
  const [currentFilters, setCurrentFilters] = useState<Partial<ReportsFilters>>(filters || {});

  // Main dashboard query
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['dashboard', currentFilters],
    queryFn: () => reportsApi.getDashboardData(currentFilters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: false,
  });

  // Individual queries for better caching and loading states
  const { data: kpisData } = useQuery({
    queryKey: ['kpis', currentFilters],
    queryFn: () => reportsApi.getKPIMetrics(currentFilters),
    staleTime: 2 * 60 * 1000,
  });

  const { data: salesChartData } = useQuery({
    queryKey: ['sales-chart', currentFilters],
    queryFn: () => reportsApi.getSalesChartData(currentFilters),
    staleTime: 2 * 60 * 1000,
  });

  const { data: inventoryAlertsData } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: () => reportsApi.getInventoryAlerts(),
    staleTime: 1 * 60 * 1000, // 1 minute for alerts
  });

  const { data: topProductsData } = useQuery({
    queryKey: ['top-products', currentFilters],
    queryFn: () => reportsApi.getTopProducts(currentFilters, 5),
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentActivityData } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => reportsApi.getRecentActivity(10),
    staleTime: 1 * 60 * 1000,
  });

  // Combine data from individual queries
  const dashboard: DashboardData | null = dashboardData || {
    kpis: kpisData || {
      totalSales: 0,
      totalInvoices: 0,
      totalCustomers: 0,
      lowStockItems: 0,
      monthlySales: 0,
      weeklySales: 0,
      dailySales: 0,
      salesGrowth: 0,
    },
    salesChart: salesChartData || [],
    inventoryAlerts: inventoryAlertsData || [],
    topProducts: topProductsData || [],
    recentActivity: recentActivityData || [],
  };

  // Update filters function
  const updateFilters = (newFilters: Partial<ReportsFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Set date range
  const setDateRange = (startDate: string, endDate: string) => {
    updateFilters({ startDate, endDate });
  };

  // Set branch filter
  const setBranch = (branchId: string | undefined) => {
    updateFilters({ branchId });
  };

  // Refresh all data
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['kpis'] });
    queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    queryClient.invalidateQueries({ queryKey: ['top-products'] });
    queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
  };

  // Force refresh from server
  const forceRefresh = async () => {
    try {
      await reportsApi.refreshCache();
      refresh();
    } catch (error) {
      console.error('Failed to refresh cache:', error);
    }
  };

  return {
    // Data
    dashboard,
    kpis: dashboard?.kpis,
    salesChart: dashboard?.salesChart,
    inventoryAlerts: dashboard?.inventoryAlerts,
    topProducts: dashboard?.topProducts,
    recentActivity: dashboard?.recentActivity,

    // Loading states
    isLoading,
    isRefetching,
    isLoadingKPIs: !kpisData && isLoading,
    isLoadingChart: !salesChartData && isLoading,
    isLoadingAlerts: !inventoryAlertsData && isLoading,

    // Error
    error,

    // Filters
    filters: currentFilters,

    // Actions
    updateFilters,
    setDateRange,
    setBranch,
    refresh,
    forceRefresh,
    refetch,
  };
};
