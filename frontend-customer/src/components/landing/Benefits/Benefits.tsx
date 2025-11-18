import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  AccessTime,
  TrendingUp,
  Inventory2,
  Assessment,
  ThumbUp,
  Support,
} from '@mui/icons-material';

export const Benefits: React.FC = () => {
  const { t } = useTranslation('landing');

  const benefits = [
    {
      id: 'time',
      icon: <AccessTime sx={{ fontSize: 48 }} />,
      title: t('benefits.time.title'),
      description: t('benefits.time.description'),
    },
    {
      id: 'sales',
      icon: <TrendingUp sx={{ fontSize: 48 }} />,
      title: t('benefits.sales.title'),
      description: t('benefits.sales.description'),
    },
    {
      id: 'inventory',
      icon: <Inventory2 sx={{ fontSize: 48 }} />,
      title: t('benefits.inventory.title'),
      description: t('benefits.inventory.description'),
    },
    {
      id: 'reports',
      icon: <Assessment sx={{ fontSize: 48 }} />,
      title: t('benefits.reports.title'),
      description: t('benefits.reports.description'),
    },
    {
      id: 'ease',
      icon: <ThumbUp sx={{ fontSize: 48 }} />,
      title: t('benefits.ease.title'),
      description: t('benefits.ease.description'),
    },
    {
      id: 'support',
      icon: <Support sx={{ fontSize: 48 }} />,
      title: t('benefits.support.title'),
      description: t('benefits.support.description'),
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'grey.50',
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
            {t('benefits.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            {t('benefits.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {benefits.map((benefit) => (
            <Grid item xs={12} sm={6} md={4} key={benefit.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  textAlign: 'center',
                  backgroundColor: 'background.paper',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <Box
                  sx={{
                    color: 'primary.main',
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {benefit.icon}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 1.5,
                  }}
                >
                  {benefit.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {benefit.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Benefits;

