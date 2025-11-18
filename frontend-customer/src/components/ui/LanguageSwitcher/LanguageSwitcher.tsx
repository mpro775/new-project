import React from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full';
  size?: 'small' | 'medium' | 'large';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'icon',
  size = 'medium',
}) => {
  const { i18n } = useTranslation();
  const { setLanguage } = useUiStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (language: 'ar' | 'en') => {
    i18n.changeLanguage(language);
    setLanguage(language);
    handleClose();
  };

  const languages = [
    {
      code: 'ar' as const,
      name: 'العربية',
      flag: '🇸🇦',
      dir: 'rtl',
    },
    {
      code: 'en' as const,
      name: 'English',
      flag: '🇺🇸',
      dir: 'ltr',
    },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  if (variant === 'full') {
    return (
      <>
        <IconButton
          size={size}
          onClick={handleClick}
          sx={{
            borderRadius: 1,
            px: 2,
            py: 1,
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <LanguageIcon sx={{ mr: 1 }} />
          {currentLanguage?.flag} {currentLanguage?.name}
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {languages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={language.code === i18n.language}
            >
              <ListItemIcon>
                {language.flag}
              </ListItemIcon>
              <ListItemText primary={language.name} />
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  return (
    <>
      <Tooltip title={currentLanguage?.name || 'Language'}>
        <IconButton size={size} onClick={handleClick}>
          <LanguageIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === i18n.language}
          >
            <ListItemIcon>
              {language.flag}
            </ListItemIcon>
            <ListItemText primary={language.name} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
