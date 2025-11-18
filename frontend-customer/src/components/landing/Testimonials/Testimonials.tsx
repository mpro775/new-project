import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Avatar,
  Rating,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export const Testimonials: React.FC = () => {
  const { t } = useTranslation('landing');

  const testimonials = [
    {
      id: '1',
      name: 'أحمد محمد',
      role: 'مدير متجر',
      company: 'متجر الأمل',
      content: 'زيتونة غيرت طريقة إدارة متجري بالكامل. الآن أستطيع تتبع المخزون والمبيعات بسهولة كبيرة.',
      rating: 5,
    },
    {
      id: '2',
      name: 'فاطمة علي',
      role: 'صاحبة متجر',
      company: 'بوتيك الأناقة',
      content: 'النظام سهل الاستخدام جداً، وفريق الدعم متجاوب دائماً. أنصح به بشدة.',
      rating: 5,
    },
    {
      id: '3',
      name: 'محمد حسن',
      role: 'مدير فروع',
      company: 'سلسلة المتاجر الكبرى',
      content: 'إدارة عدة فروع من مكان واحد كانت حلماً، والآن أصبحت حقيقة بفضل زيتونة.',
      rating: 5,
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
            {t('testimonials.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            {t('testimonials.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {testimonials.map((testimonial) => (
            <Grid item xs={12} md={4} key={testimonial.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <Rating value={testimonial.rating} readOnly />
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    fontStyle: 'italic',
                    color: 'text.secondary',
                  }}
                >
                  "{testimonial.content}"
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: 'primary.main',
                      width: 56,
                      height: 56,
                    }}
                  >
                    {testimonial.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {testimonial.role} - {testimonial.company}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Testimonials;

