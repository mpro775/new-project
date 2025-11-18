import { api } from '../api';
import type { ApiResponse } from '../api';

// Types for dashboard data
export interface KPIMetrics {
  totalSales: number;
  totalInvoices: number;
  totalCustomers: number;
  lowStockItems: number;
  monthlySales: number;
  weeklySales: number;
  dailySales: number;
  salesGrowth: number;
}

export interface SalesChartData {
  date: string;
  sales: number;
  orders: number;
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  status: 'critical' | 'warning' | 'normal';
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface DashboardData {
  kpis: KPIMetrics;
  salesChart: SalesChartData[];
  inventoryAlerts: InventoryAlert[];
  topProducts: TopProduct[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'sale' | 'purchase' | 'inventory' | 'customer';
  description: string;
  timestamp: string;
  amount?: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ReportsFilters extends DateRange {
  branchId?: string;
  categoryId?: string;
}

// Reports API service
export const reportsApi = {
  /**
   * الحصول على بيانات لوحة المؤشرات
   */
  async getDashboardData(filters?: Partial<ReportsFilters>): Promise<DashboardData> {
    const params = new URLSearchParams();

    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);

    const response = await api.get<ApiResponse<DashboardData>>(`/reports/dashboard?${params}`);
    return response.data.data;
  },

  /**
   * الحصول على إحصائيات KPI
   */
  async getKPIMetrics(filters?: Partial<ReportsFilters>): Promise<KPIMetrics> {
    const params = new URLSearchParams();

    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.branchId) params.append('branchId', filters.branchId);

    const response = await api.get<ApiResponse<KPIMetrics>>(`/reports/kpis?${params}`);
    return response.data.data;
  },

  /**
   * الحصول على بيانات مخطط المبيعات
   */
  async getSalesChartData(filters?: Partial<ReportsFilters>): Promise<SalesChartData[]> {
    const params = new URLSearchParams();

    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.branchId) params.append('branchId', filters.branchId);

    const response = await api.get<ApiResponse<SalesChartData[]>>(`/reports/sales-chart?${params}`);
    return response.data.data;
  },

  /**
   * الحصول على تنبيهات المخزون
   */
  async getInventoryAlerts(branchId?: string): Promise<InventoryAlert[]> {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get<ApiResponse<InventoryAlert[]>>(`/reports/inventory-alerts?${params}`);
    return response.data.data;
  },

  /**
   * الحصول على أفضل المنتجات مبيعاً
   */
  async getTopProducts(filters?: Partial<ReportsFilters>, limit: number = 10): Promise<TopProduct[]> {
    const params = new URLSearchParams();

    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    params.append('limit', limit.toString());

    const response = await api.get<ApiResponse<TopProduct[]>>(`/reports/top-products?${params}`);
    return response.data.data;
  },

  /**
   * الحصول على النشاط الأخير
   */
  async getRecentActivity(limit: number = 20): Promise<ActivityItem[]> {
    const response = await api.get<ApiResponse<ActivityItem[]>>(`/reports/recent-activity?limit=${limit}`);
    return response.data.data;
  },

  /**
   * تحديث البيانات المخزنة مؤقتاً
   */
  async refreshCache(): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>('/reports/refresh-cache');
    return response.data.data;
  },
};

export default reportsApi;
