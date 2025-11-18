import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

export interface KPICardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  trend?: {
    value: number;
    label?: string;
    direction?: 'up' | 'down' | 'flat';
  };
  format?: 'currency' | 'number' | 'percentage';
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'color' && prop !== 'size',
})<{ color?: string; size?: string }>(({ theme, size }) => ({
  height: '100%',
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },
  ...(size === 'small' && {
    minHeight: 120,
  }),
  ...(size === 'large' && {
    minHeight: 160,
  }),
}));

const IconContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color?: string }>(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette[color].main,
  color: theme.palette[color].contrastText,
  marginBottom: theme.spacing(2),
}));

const TrendChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.75rem',
  fontWeight: 600,
}));

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  format = 'number',
  loading = false,
  size = 'medium',
}) => {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('ar-SA', {
          style: 'currency',
          currency: 'YER',
          minimumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('ar-SA').format(val);
    }
  };

  const getTrendIcon = () => {
    if (!trend?.direction) return null;

    switch (trend.direction) {
      case 'up':
        return <TrendingUp fontSize="small" />;
      case 'down':
        return <TrendingDown fontSize="small" />;
      case 'flat':
      default:
        return <TrendingFlat fontSize="small" />;
    }
  };

  const getTrendColor = (): 'success' | 'error' | 'default' => {
    if (!trend?.direction) return 'default';

    switch (trend.direction) {
      case 'up':
        return 'success';
      case 'down':
        return 'error';
      case 'flat':
      default:
        return 'default';
    }
  };

  return (
    <StyledCard color={color} size={size}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                fontSize: size === 'small' ? '0.875rem' : '1rem',
                fontWeight: 500,
                mb: 1,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant={size === 'small' ? 'h5' : 'h4'}
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: trend ? 1 : 0,
              }}
            >
              {loading ? '...' : formatValue(value)}
            </Typography>

            {trend && (
              <TrendChip
                icon={getTrendIcon()}
                label={`${trend.value > 0 ? '+' : ''}${trend.value}% ${trend.label || ''}`}
                color={getTrendColor()}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {icon && (
            <IconContainer color={color}>
              {icon}
            </IconContainer>
          )}
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default KPICard;
