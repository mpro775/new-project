import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PlayArrow } from '@mui/icons-material';

export const Demo: React.FC = () => {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();

  return (
    <Box
      id="demo"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'grey.50',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 2,
              }}
            >
              {t('demo.title')}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                mb: 4,
              }}
            >
              {t('demo.subtitle')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={() => {
                  // Handle video play
                }}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {t('demo.watchVideo')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/signup')}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {t('demo.requestDemo')}
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={4}
              sx={{
                position: 'relative',
                paddingTop: '56.25%',
                overflow: 'hidden',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'grey.900',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'grey.800',
                  },
                }}
                onClick={() => {
                  // Handle video play
                }}
              >
                <PlayArrow
                  sx={{
                    fontSize: 80,
                    color: 'white',
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Demo;

