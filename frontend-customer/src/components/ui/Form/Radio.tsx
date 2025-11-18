import React from 'react';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio as MuiRadio,
  FormHelperText,
} from '@mui/material';
import { styled } from '@mui/material/styles';

export interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface RadioProps {
  label?: string;
  helperText?: string;
  error?: boolean;
  options: RadioOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium';
  disabled?: boolean;
}

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  '& .MuiFormControlLabel-label': {
    fontSize: '0.875rem',
  },
  '& .MuiRadio-root': {
    padding: theme.spacing(0.5),
  },
}));

export const Radio: React.FC<RadioProps> = ({
  label,
  helperText,
  error = false,
  options,
  value,
  onChange,
  orientation = 'vertical',
  size = 'medium',
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    // Try to convert to number if the original value was a number
    const originalOption = options.find(opt => opt.value === value);
    const convertedValue = typeof originalOption?.value === 'number'
      ? parseFloat(newValue)
      : newValue;

    onChange?.(convertedValue);
  };

  return (
    <FormControl error={error} component="fieldset">
      {label && (
        <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem' }}>
          {label}
        </FormLabel>
      )}

      <RadioGroup
        value={value}
        onChange={handleChange}
        sx={{
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: orientation === 'horizontal' ? 2 : 1,
        }}
      >
        {options.map((option) => (
          <StyledFormControlLabel
            key={option.value}
            value={option.value}
            control={
              <MuiRadio
                size={size}
                disabled={disabled || option.disabled}
              />
            }
            label={option.label}
            disabled={disabled || option.disabled}
          />
        ))}
      </RadioGroup>

      {helperText && (
        <FormHelperText sx={{ mt: 0.5, fontSize: '0.75rem' }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default Radio;
