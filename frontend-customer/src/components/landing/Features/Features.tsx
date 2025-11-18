import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  PointOfSale,
  Inventory,
  ShoppingCart,
  AccountBalance,
  Assessment,
  Store,
  CloudOff,
  Security,
} from '@mui/icons-material';

export const Features: React.FC = () => {
  const { t } = useTranslation('landing');

  const features = [
    {
      id: 'pos',
      icon: <PointOfSale sx={{ fontSize: 48 }} />,
      title: t('features.pos.title'),
      description: t('features.pos.description'),
    },
    {
      id: 'inventory',
      icon: <Inventory sx={{ fontSize: 48 }} />,
      title: t('features.inventory.title'),
      description: t('features.inventory.description'),
    },
    {
      id: 'sales',
      icon: <ShoppingCart sx={{ fontSize: 48 }} />,
      title: t('features.sales.title'),
      description: t('features.sales.description'),
    },
    {
      id: 'accounting',
      icon: <AccountBalance sx={{ fontSize: 48 }} />,
      title: t('features.accounting.title'),
      description: t('features.accounting.description'),
    },
    {
      id: 'reports',
      icon: <Assessment sx={{ fontSize: 48 }} />,
      title: t('features.reports.title'),
      description: t('features.reports.description'),
    },
    {
      id: 'branches',
      icon: <Store sx={{ fontSize: 48 }} />,
      title: t('features.branches.title'),
      description: t('features.branches.description'),
    },
    {
      id: 'offline',
      icon: <CloudOff sx={{ fontSize: 48 }} />,
      title: t('features.offline.title'),
      description: t('features.offline.description'),
    },
    {
      id: 'security',
      icon: <Security sx={{ fontSize: 48 }} />,
      title: t('features.security.title'),
      description: t('features.security.description'),
    },
  ];

  return (
    <Box
      id="features"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            {t('features.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            {t('features.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={4} key={feature.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      color: 'primary.main',
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1.5,
                      textAlign: 'center',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      textAlign: 'center',
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Features;

