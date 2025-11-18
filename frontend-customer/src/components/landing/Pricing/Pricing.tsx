import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from '@mui/icons-material';

export const Pricing: React.FC = () => {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();

  return (
    <Box
      id="pricing"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'grey.50',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            {t('pricing.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            {t('pricing.subtitle')}
          </Typography>
        </Box>

        <Paper
          elevation={4}
          sx={{
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            maxWidth: '600px',
            mx: 'auto',
            border: '2px solid',
            borderColor: 'primary.main',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: 'primary.main',
            }}
          >
            {t('pricing.free.title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 4,
            }}
          >
            {t('pricing.free.description')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mb: 4,
              textAlign: 'right',
            }}
          >
            {[
              'جميع الميزات متاحة',
              'دعم فني كامل',
              'تحديثات مجانية',
              'نسخ احتياطية تلقائية',
            ].map((feature) => (
              <Box
                key={feature}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CheckCircle sx={{ color: 'success.main' }} />
                <Typography variant="body1">{feature}</Typography>
              </Box>
            ))}
          </Box>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/signup')}
            sx={{
              px: 6,
              py: 1.5,
              fontSize: '1.125rem',
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            {t('pricing.cta')}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default Pricing;

