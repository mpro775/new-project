import React from 'react';
import {
  TextField,
  FormHelperText,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material';

export interface TextAreaProps extends Omit<TextFieldProps, 'variant' | 'multiline'> {
  variant?: 'outlined' | 'filled' | 'standard';
  helperText?: string;
  error?: boolean;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  showCharCount?: boolean;
  maxLength?: number;
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

export const TextArea: React.FC<TextAreaProps> = ({
  variant = 'outlined',
  helperText,
  error = false,
  rows = 4,
  minRows,
  maxRows,
  showCharCount = false,
  maxLength,
  value = '',
  onChange,
  ...props
}) => {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    if (maxLength && newValue.length > maxLength) {
      return;
    }

    setLocalValue(newValue);
    onChange?.(event);
  };

  const charCount = (localValue as string)?.length || 0;
  const displayHelperText = showCharCount && maxLength
    ? `${charCount}/${maxLength}${helperText ? ` - ${helperText}` : ''}`
    : helperText;

  return (
    <Box>
      <StyledTextField
        variant={variant}
        multiline
        rows={rows}
        minRows={minRows}
        maxRows={maxRows}
        error={error}
        value={localValue}
        onChange={handleChange}
        inputProps={{
          maxLength,
        }}
        {...props}
      />
      {displayHelperText && (
        <FormHelperText error={error} sx={{ mt: 0.5, fontSize: '0.75rem' }}>
          {displayHelperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default TextArea;
