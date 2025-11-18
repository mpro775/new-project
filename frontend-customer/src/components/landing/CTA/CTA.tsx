import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const CTA: React.FC = () => {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, #2e7d32 0%, #60ad5e 100%)',
        color: 'white',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            {t('cta.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.95,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            {t('cta.subtitle')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/signup')}
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              px: 6,
              py: 2,
              fontSize: '1.125rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
          >
            {t('cta.button')}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default CTA;

