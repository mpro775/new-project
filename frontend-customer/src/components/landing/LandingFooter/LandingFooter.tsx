import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Twitter,
  Facebook,
  LinkedIn,
  Instagram,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export const LandingFooter: React.FC = () => {
  const { t } = useTranslation('landing');

  const footerSections = [
    {
      title: t('footer.product.title'),
      links: [
        { label: t('footer.product.features'), href: '#features' },
        { label: t('footer.product.pricing'), href: '#pricing' },
        { label: t('footer.product.updates'), href: '#updates' },
        { label: t('footer.product.roadmap'), href: '#roadmap' },
      ],
    },
    {
      title: t('footer.company.title'),
      links: [
        { label: t('footer.company.about'), href: '#about' },
        { label: t('footer.company.blog'), href: '#blog' },
        { label: t('footer.company.careers'), href: '#careers' },
        { label: t('footer.company.contact'), href: '#contact' },
      ],
    },
    {
      title: t('footer.support.title'),
      links: [
        { label: t('footer.support.help'), href: '/support' },
        { label: t('footer.support.documentation'), href: '/docs' },
        { label: t('footer.support.api'), href: '/api-docs' },
        { label: t('footer.support.status'), href: '/status' },
      ],
    },
    {
      title: t('footer.legal.title'),
      links: [
        { label: t('footer.legal.privacy'), href: '/privacy' },
        { label: t('footer.legal.terms'), href: '/terms' },
        { label: t('footer.legal.cookies'), href: '/cookies' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Twitter, label: t('footer.social.twitter'), href: '#' },
    { icon: Facebook, label: t('footer.social.facebook'), href: '#' },
    { icon: LinkedIn, label: t('footer.social.linkedin'), href: '#' },
    { icon: Instagram, label: t('footer.social.instagram'), href: '#' },
  ];

  const handleLinkClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'grey.900',
        color: 'grey.100',
        pt: 6,
        pb: 3,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {footerSections.map((section) => (
            <Grid item xs={6} sm={4} md={3} key={section.title}>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, color: 'primary.light' }}
              >
                {section.title}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {section.links.map((link) => (
                  <Box component="li" key={link.label} sx={{ mb: 1 }}>
                    <Link
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(link.href);
                      }}
                      sx={{
                        color: 'grey.300',
                        textDecoration: 'none',
                        '&:hover': {
                          color: 'primary.light',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {link.label}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}

          <Grid item xs={12} sm={4} md={3}>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 600, color: 'primary.light' }}
            >
              {t('footer.contact.title')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  support@zaytuna.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  +967 1 234 5678
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  صنعاء، اليمن
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, color: 'primary.light' }}
              >
                {t('footer.social.title')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <IconButton
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      sx={{
                        color: 'grey.300',
                        '&:hover': {
                          color: 'primary.light',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      <Icon />
                    </IconButton>
                  );
                })}
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'grey.700' }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: 'grey.400' }}>
            {t('footer.copyright')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link
              href="/privacy"
              sx={{
                color: 'grey.400',
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  color: 'primary.light',
                },
              }}
            >
              {t('footer.legal.privacy')}
            </Link>
            <Link
              href="/terms"
              sx={{
                color: 'grey.400',
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  color: 'primary.light',
                },
              }}
            >
              {t('footer.legal.terms')}
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingFooter;

