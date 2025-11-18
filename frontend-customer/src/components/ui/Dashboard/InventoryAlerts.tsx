import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Button,
  Paper,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { InventoryAlert } from '@/services/reports';

export interface InventoryAlertsProps {
  alerts: InventoryAlert[];
  maxItems?: number;
  onViewAll?: () => void;
  onViewProduct?: (productId: string) => void;
  loading?: boolean;
}

export const InventoryAlerts: React.FC<InventoryAlertsProps> = ({
  alerts,
  maxItems = 5,
  onViewAll,
  onViewProduct,
  loading = false,
}) => {
  const { t } = useTranslation();

  const getAlertIcon = (status: InventoryAlert['status']) => {
    switch (status) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'normal':
      default:
        return <InventoryIcon color="info" />;
    }
  };

  const getAlertColor = (status: InventoryAlert['status']): 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'normal':
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status: InventoryAlert['status']): string => {
    switch (status) {
      case 'critical':
        return t('inventory.status.critical', 'حرج');
      case 'warning':
        return t('inventory.status.warning', 'تحذير');
      case 'normal':
      default:
        return t('inventory.status.normal', 'عادي');
    }
  };

  const displayedAlerts = alerts.slice(0, maxItems);
  const hasMore = alerts.length > maxItems;

  if (loading) {
    return (
      <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('common.loading', 'جارٍ التحميل...')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('dashboard.alerts.inventory', 'تنبيهات المخزون')}
        </Typography>

        {alerts.length > 0 && (
          <Chip
            label={`${alerts.length}`}
            color="error"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      {displayedAlerts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <InventoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.alerts.noAlerts', 'لا توجد تنبيهات مخزون')}
          </Typography>
        </Box>
      ) : (
        <>
          <List sx={{ py: 0 }}>
            {displayedAlerts.map((alert, index) => (
              <ListItem
                key={`${alert.productId}-${index}`}
                sx={{
                  px: 0,
                  py: 1.5,
                  borderBottom: index < displayedAlerts.length - 1 ? '1px solid' : 'none',
                  borderBottomColor: 'divider',
                  cursor: onViewProduct ? 'pointer' : 'default',
                  '&:hover': onViewProduct ? {
                    backgroundColor: 'action.hover',
                  } : {},
                }}
                onClick={() => onViewProduct?.(alert.productId)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getAlertIcon(alert.status)}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {alert.productName}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('inventory.currentStock', 'المخزون الحالي')}: {alert.currentStock}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('inventory.reorderPoint', 'نقطة إعادة الطلب')}: {alert.reorderPoint}
                      </Typography>
                    </Box>
                  }
                />

                <Chip
                  label={getStatusLabel(alert.status)}
                  color={getAlertColor(alert.status)}
                  size="small"
                  variant="outlined"
                />
              </ListItem>
            ))}
          </List>

          {(hasMore || onViewAll) && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              {hasMore && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {t('dashboard.alerts.moreAlerts', '{{count}} تنبيهات أخرى', { count: alerts.length - maxItems })}
                </Typography>
              )}

              {onViewAll && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onViewAll}
                  sx={{ minWidth: 120 }}
                >
                  {t('common.actions.viewAll', 'عرض الكل')}
                </Button>
              )}
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default InventoryAlerts;
