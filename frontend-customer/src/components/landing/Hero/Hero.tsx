import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  People,
  Receipt,
  Store,
  Star,
} from '@mui/icons-material';

export const Hero: React.FC = () => {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();

  const stats = [
    {
      icon: <People />,
      value: '10K+',
      label: t('hero.stats.users'),
    },
    {
      icon: <Receipt />,
      value: '50K+',
      label: t('hero.stats.invoices'),
    },
    {
      icon: <Store />,
      value: '500+',
      label: t('hero.stats.stores'),
    },
    {
      icon: <Star />,
      value: '4.9',
      label: t('hero.stats.satisfaction'),
    },
  ];

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #2e7d32 0%, #60ad5e 100%)',
        color: 'white',
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.1,
        },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 700,
                mb: 2,
                lineHeight: 1.2,
              }}
            >
              {t('hero.title')}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                mb: 3,
                opacity: 0.95,
                fontWeight: 400,
              }}
            >
              {t('hero.subtitle')}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.125rem' },
                mb: 4,
                opacity: 0.9,
                maxWidth: '600px',
              }}
            >
              {t('hero.description')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/signup')}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'grey.100',
                  },
                }}
              >
                {t('hero.cta.startFree')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => {
                  const element = document.querySelector('#demo');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {t('hero.cta.watchDemo')}
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: { xs: '300px', md: '400px' },
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '600px',
                  height: { xs: '300px', md: '400px' },
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: 'white',
                    opacity: 0.8,
                    textAlign: 'center',
                    px: 4,
                  }}
                >
                  لوحة تحكم زيتونة
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 6 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 1,
                    color: 'white',
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                  }}
                >
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Hero;

