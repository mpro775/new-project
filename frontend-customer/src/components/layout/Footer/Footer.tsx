import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  showVersion?: boolean;
  showCopyright?: boolean;
  compact?: boolean;
}

const Footer: React.FC<FooterProps> = ({
  showVersion = true,
  showCopyright = true,
  compact = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';

  if (compact) {
    return (
      <Box
        component="footer"
        sx={{
          py: 1,
          px: 2,
          mt: 'auto',
          backgroundColor: theme.palette.grey[100],
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 1,
            }}
          >
            {showCopyright && (
              <Typography variant="body2" color="text.secondary" align="center">
                © {currentYear} {t('app.name')}. {t('common.messages.allRightsReserved', 'جميع الحقوق محفوظة')}
              </Typography>
            )}
            {showVersion && (
              <Typography variant="body2" color="text.secondary">
                v{version}
              </Typography>
            )}
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.grey[100],
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {/* Company Info */}
          <Box>
            <Typography variant="h6" color="text.primary" gutterBottom>
              {t('app.name')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('app.description')}
            </Typography>
          </Box>

          {/* Quick Links */}
          <Box>
            <Typography variant="h6" color="text.primary" gutterBottom>
              {t('common.actions.quickLinks', 'روابط سريعة')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                variant="body2"
                color="text.secondary"
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('navigation.dashboard')}
              </Link>
              <Link
                href="#"
                variant="body2"
                color="text.secondary"
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('navigation.products')}
              </Link>
              <Link
                href="#"
                variant="body2"
                color="text.secondary"
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('navigation.settings')}
              </Link>
            </Box>
          </Box>

          {/* Contact/Support */}
          <Box>
            <Typography variant="h6" color="text.primary" gutterBottom>
              {t('common.messages.support', 'الدعم')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('common.messages.needHelp', 'هل تحتاج مساعدة؟')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('common.messages.contactUs', 'اتصل بنا')}: support@example.com
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('common.messages.phone', 'الهاتف')}: +967-1-234567
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
          }}
        >
          {showCopyright && (
            <Typography variant="body2" color="text.secondary" align="center">
              © {currentYear} {t('app.name')}. {t('common.messages.allRightsReserved', 'جميع الحقوق محفوظة')}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              sx={{
                textDecoration: 'none',
                '&:hover': {
                  color: theme.palette.primary.main,
                  textDecoration: 'underline',
                },
              }}
            >
              {t('common.messages.privacyPolicy', 'سياسة الخصوصية')}
            </Link>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              sx={{
                textDecoration: 'none',
                '&:hover': {
                  color: theme.palette.primary.main,
                  textDecoration: 'underline',
                },
              }}
            >
              {t('common.messages.termsOfService', 'شروط الخدمة')}
            </Link>
            {showVersion && (
              <Typography variant="body2" color="text.secondary">
                v{version}
              </Typography>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
