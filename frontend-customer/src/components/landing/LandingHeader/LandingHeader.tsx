import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/ui';

export const LandingHeader: React.FC = () => {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { key: 'features', label: t('header.nav.features'), href: '#features' },
    { key: 'pricing', label: t('header.nav.pricing'), href: '#pricing' },
    { key: 'about', label: t('header.nav.about'), href: '#about' },
    { key: 'support', label: t('header.nav.support'), href: '#support' },
  ];

  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileOpen(false);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton
              sx={{ textAlign: 'center' }}
              onClick={() => handleNavClick(item.href)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton
            sx={{ textAlign: 'center' }}
            onClick={() => {
              navigate('/login');
              setMobileOpen(false);
            }}
          >
            <ListItemText primary={t('header.login')} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            sx={{ textAlign: 'center' }}
            onClick={() => {
              navigate('/signup');
              setMobileOpen(false);
            }}
          >
            <ListItemText primary={t('header.signup')} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Box
            component="a"
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '1.5rem',
              mr: 4,
            }}
          >
            {t('header.logo')}
          </Box>

          {isMobile ? (
            <>
              <Box sx={{ flexGrow: 1 }} />
              <LanguageSwitcher />
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.key}
                    onClick={() => handleNavClick(item.href)}
                    sx={{
                      color: 'text.primary',
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LanguageSwitcher />
                <Button
                  variant="text"
                  onClick={() => navigate('/login')}
                  sx={{ textTransform: 'none' }}
                >
                  {t('header.login')}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/signup')}
                  sx={{ textTransform: 'none' }}
                >
                  {t('header.signup')}
                </Button>
              </Box>
            </>
          )}
        </Toolbar>
      </Container>
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default LandingHeader;
