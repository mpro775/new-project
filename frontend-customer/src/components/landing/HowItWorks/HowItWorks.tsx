import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  PersonAdd,
  Settings,
  ShoppingCart,
} from '@mui/icons-material';

export const HowItWorks: React.FC = () => {
  const { t } = useTranslation('landing');

  const steps = [
    {
      id: 'step1',
      icon: <PersonAdd sx={{ fontSize: 48 }} />,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
    },
    {
      id: 'step2',
      icon: <Settings sx={{ fontSize: 48 }} />,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
    },
    {
      id: 'step3',
      icon: <ShoppingCart sx={{ fontSize: 48 }} />,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
    },
  ];

  return (
    <Box
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
            {t('howItWorks.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            {t('howItWorks.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {steps.map((step, index) => (
            <Grid item xs={12} md={4} key={step.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  textAlign: 'center',
                  position: 'relative',
                  backgroundColor: 'background.paper',
                  border: '2px solid',
                  borderColor: index === 1 ? 'primary.main' : 'divider',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                  }}
                >
                  {index + 1}
                </Box>
                <Box
                  sx={{
                    color: 'primary.main',
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {step.icon}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 1.5,
                  }}
                >
                  {step.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {step.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HowItWorks;

