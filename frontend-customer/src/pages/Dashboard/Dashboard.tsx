import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Container,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  TrendingUp as SalesIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { arSA, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useDashboard } from './Dashboard.hooks';
import { KPICard, SalesChart, InventoryAlerts } from '@/components/ui';

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const {
    kpis,
    salesChart,
    inventoryAlerts,
    isLoading,
    isRefetching,
    error,
    setDateRange,
    setBranch,
    refresh,
    forceRefresh,
  } = useDashboard({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Mock branches data - in real app this would come from API
  const branches = [
    { id: '', name: t('dashboard.allBranches', 'جميع الفروع') },
    { id: '1', name: t('branch.main', 'الفرع الرئيسي') },
    { id: '2', name: t('branch.secondary', 'الفرع الثانوي') },
  ];

  const handleDateRangeApply = () => {
    if (startDate && endDate) {
      setDateRange(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
    }
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    setBranch(branchId || undefined);
  };

  const handleRefresh = () => {
    refresh();
  };

  const handleForceRefresh = async () => {
    await forceRefresh();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('dashboard.title')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={t('common.actions.refresh', 'تحديث')}>
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading || isRefetching}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ minWidth: 120 }}
            >
              {t('common.actions.filter', 'فلترة')}
            </Button>
          </Box>
        </Box>

        {/* Filters Panel */}
        {showFilters && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('dashboard.filters.title', 'فلاتر البيانات')}
            </Typography>

            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={isRTL ? arSA : enUS}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label={t('dashboard.filters.startDate', 'تاريخ البداية')}
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label={t('dashboard.filters.endDate', 'تاريخ النهاية')}
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    label={t('dashboard.filters.branch', 'الفرع')}
                    value={selectedBranch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    fullWidth
                    size="small"
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleDateRangeApply}
                      startIcon={<DateRangeIcon />}
                      sx={{ flex: 1 }}
                    >
                      {t('common.actions.apply', 'تطبيق')}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={handleForceRefresh}
                      disabled={isLoading}
                      sx={{ minWidth: 120 }}
                    >
                      {t('dashboard.forceRefresh', 'تحديث كامل')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Paper>
        )}

        {/* Error State */}
        {error && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
            <Typography variant="body1" color="error.contrastText">
              {t('dashboard.error', 'حدث خطأ في تحميل البيانات')}: {error.message}
            </Typography>
          </Paper>
        )}

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title={t('dashboard.kpis.totalSales', 'إجمالي المبيعات')}
              value={kpis?.totalSales || 0}
              icon={<SalesIcon />}
              color="primary"
              format="currency"
              loading={isLoading}
              trend={kpis?.salesGrowth ? {
                value: kpis.salesGrowth,
                label: t('dashboard.trend.monthly', 'شهري'),
                direction: kpis.salesGrowth > 0 ? 'up' : kpis.salesGrowth < 0 ? 'down' : 'flat',
              } : undefined}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title={t('dashboard.kpis.totalOrders', 'إجمالي الطلبات')}
              value={kpis?.totalInvoices || 0}
              icon={<OrdersIcon />}
              color="secondary"
              loading={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title={t('dashboard.kpis.totalCustomers', 'إجمالي العملاء')}
              value={kpis?.totalCustomers || 0}
              icon={<CustomersIcon />}
              color="success"
              loading={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title={t('dashboard.kpis.lowStockItems', 'منتجات منخفضة المخزون')}
              value={kpis?.lowStockItems || 0}
              icon={<InventoryIcon />}
              color="warning"
              loading={isLoading}
            />
          </Grid>
        </Grid>

        {/* Charts and Alerts */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <SalesChart
                data={salesChart || []}
                title={t('dashboard.charts.sales.title', 'اتجاهات المبيعات')}
                height={350}
                loading={isLoading}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <InventoryAlerts
              alerts={inventoryAlerts || []}
              maxItems={5}
              loading={isLoading}
            />
          </Grid>
        </Grid>

        {/* Additional Stats */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                {t('dashboard.stats.dailySales', 'مبيعات اليوم')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {kpis?.dailySales ? new Intl.NumberFormat('ar-SA', {
                  style: 'currency',
                  currency: 'YER',
                  minimumFractionDigits: 0,
                }).format(kpis.dailySales) : '0 ر.ي'}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="secondary" sx={{ mb: 1 }}>
                {t('dashboard.stats.weeklySales', 'مبيعات الأسبوع')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {kpis?.weeklySales ? new Intl.NumberFormat('ar-SA', {
                  style: 'currency',
                  currency: 'YER',
                  minimumFractionDigits: 0,
                }).format(kpis.weeklySales) : '0 ر.ي'}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                {t('dashboard.stats.monthlySales', 'مبيعات الشهر')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {kpis?.monthlySales ? new Intl.NumberFormat('ar-SA', {
                  style: 'currency',
                  currency: 'YER',
                  minimumFractionDigits: 0,
                }).format(kpis.monthlySales) : '0 ر.ي'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard;
