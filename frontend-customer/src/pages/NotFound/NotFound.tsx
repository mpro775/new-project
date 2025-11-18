import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: 400,
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: '6rem', color: 'primary.main' }}>
          404
        </Typography>

        <Typography variant="h5" component="h2" gutterBottom>
          الصفحة غير موجودة
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/')}>
            العودة للرئيسية
          </Button>

          <Button variant="outlined" onClick={() => navigate(-1)}>
            العودة للخلف
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotFound;
