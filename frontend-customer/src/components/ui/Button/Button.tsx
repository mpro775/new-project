import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { ButtonProps as MuiButtonProps } from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  loading?: boolean;
  loadingText?: string;
}

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== 'loading',
})<{ loading?: boolean }>(({ theme, loading }) => ({
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: theme.spacing(1, 3),
  minHeight: 40,
  position: 'relative',
  '&:disabled': {
    opacity: loading ? 1 : 0.6,
  },
  '& .MuiButton-startIcon': {
    marginLeft: theme.direction === 'rtl' ? 8 : 0,
    marginRight: theme.direction === 'rtl' ? 0 : 8,
  },
  '& .MuiButton-endIcon': {
    marginLeft: theme.direction === 'rtl' ? 0 : 8,
    marginRight: theme.direction === 'rtl' ? 8 : 0,
  },
}));

const LoadingSpinner = styled(CircularProgress)(() => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  marginTop: -12,
  marginLeft: -12,
  color: 'currentColor',
}));

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  loadingText,
  children,
  disabled,
  startIcon,
  endIcon,
  ...props
}) => {
  const getVariant = (): MuiButtonProps['variant'] => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'success':
      case 'error':
      case 'warning':
      case 'info':
        return 'contained';
      default:
        return 'contained';
    }
  };

  const getColor = (): MuiButtonProps['color'] => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'secondary';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'primary';
    }
  };

  return (
    <StyledButton
      variant={getVariant() || 'contained'}
      color={getColor() || 'primary'}
      disabled={disabled || loading}
      startIcon={!loading ? startIcon : undefined}
      endIcon={!loading ? endIcon : undefined}
      loading={loading}
      {...props}
    >
      {loading && <LoadingSpinner size={20} />}
      {loading && loadingText ? loadingText : children}
    </StyledButton>
  );
};

export default Button;
