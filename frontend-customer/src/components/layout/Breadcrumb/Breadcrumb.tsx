import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  maxItems?: number;
  separator?: React.ReactNode;
  showHomeIcon?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items = [],
  maxItems = 3,
  separator = <NavigateNextIcon fontSize="small" />,
  showHomeIcon = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const { t } = useTranslation();

  // Generate breadcrumbs from current location if no items provided
  const generateBreadcrumbsFromPath = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (showHomeIcon) {
      breadcrumbs.push({
        label: t('navigation.dashboard'),
        path: '/dashboard',
      });
    }

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip 'dashboard' if it's the first segment and we already have home
      if (showHomeIcon && index === 0 && segment === 'dashboard') {
        return;
      }

      // Translate common segments
      let label = segment;
      switch (segment) {
        case 'products':
          label = t('navigation.products');
          break;
        case 'inventory':
          label = t('navigation.inventory');
          break;
        case 'sales':
          label = t('navigation.sales');
          break;
        case 'customers':
          label = t('navigation.customers');
          break;
        case 'reports':
          label = t('navigation.reports');
          break;
        case 'settings':
          label = t('navigation.settings');
          break;
        case 'users':
          label = t('navigation.users');
          break;
        case 'branches':
          label = t('navigation.branches');
          break;
        default:
          // Capitalize first letter for unknown segments
          label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      breadcrumbs.push({
        label,
        path: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbsFromPath();

  // Don't show breadcrumbs if we're on the home/dashboard page
  if (breadcrumbItems.length <= 1 && location.pathname === '/dashboard') {
    return null;
  }

  return (
    <Box sx={{ mb: 2, px: 1 }}>
      <MuiBreadcrumbs
        separator={separator}
        maxItems={isMobile ? 2 : maxItems}
        sx={{
          '& .MuiBreadcrumbs-separator': {
            mx: 0.5,
          },
        }}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isHome = index === 0 && showHomeIcon;

          return isLast ? (
            <Typography
              key={item.path || item.label}
              variant="body2"
              color="text.primary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500,
              }}
            >
              {isHome && <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />}
              {item.label}
            </Typography>
          ) : (
            <Link
              key={item.path || item.label}
              component={RouterLink}
              to={item.path || '#'}
              variant="body2"
              color="inherit"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                  color: theme.palette.primary.main,
                },
              }}
            >
              {isHome && <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />}
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumb;
