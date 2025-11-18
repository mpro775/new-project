import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  FormHelperText,
  Box,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material';

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled' | 'standard';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  helperText?: string;
  error?: boolean;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    borderRadius: theme.spacing(1),
    fontSize: '0.875rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: theme.palette.grey[300],
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
  },
}));

export const Input: React.FC<InputProps> = ({
  variant = 'outlined',
  startIcon,
  endIcon,
  showPasswordToggle = false,
  helperText,
  error = false,
  type = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const getInputType = () => {
    if (showPasswordToggle && type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  const renderEndAdornment = () => {
    if (showPasswordToggle && type === 'password') {
      return (
        <InputAdornment position="end">
          <IconButton
            aria-label="toggle password visibility"
            onClick={handleClickShowPassword}
            edge="end"
            size="small"
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      );
    }

    if (endIcon) {
      return <InputAdornment position="end">{endIcon}</InputAdornment>;
    }

    return null;
  };

  const renderStartAdornment = () => {
    if (startIcon) {
      return <InputAdornment position="start">{startIcon}</InputAdornment>;
    }
    return null;
  };

  return (
    <Box>
      <StyledTextField
        variant={variant}
        type={getInputType()}
        error={error}
        InputProps={{
          startAdornment: renderStartAdornment(),
          endAdornment: renderEndAdornment(),
        }}
        {...props}
      />
      {helperText && (
        <FormHelperText error={error} sx={{ mt: 0.5, fontSize: '0.75rem' }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default Input;
