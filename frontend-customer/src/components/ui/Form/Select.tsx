import React from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  Box,
  Chip,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { SelectProps as MuiSelectProps } from '@mui/material';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<MuiSelectProps, 'variant'> {
  variant?: 'outlined' | 'filled' | 'standard';
  options: SelectOption[];
  label?: string;
  helperText?: string;
  error?: boolean;
  multiple?: boolean;
  renderValue?: (selected: unknown) => React.ReactNode;
  showChips?: boolean;
  placeholder?: string;
}

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    fontSize: '0.875rem',
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

export const Select: React.FC<SelectProps> = ({
  variant = 'outlined',
  options,
  label,
  helperText,
  error = false,
  multiple = false,
  renderValue,
  showChips = false,
  placeholder,
  value,
  onChange,
  ...props
}) => {
  const handleRenderValue = (selected: unknown) => {
    if (renderValue) {
      return renderValue(selected);
    }

    if (multiple && Array.isArray(selected) && showChips) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((value) => {
            const option = options.find(opt => opt.value === value);
            return (
              <Chip
                key={value}
                label={option?.label || value}
                size="small"
                sx={{ height: 24 }}
              />
            );
          })}
        </Box>
      );
    }

    if (multiple && Array.isArray(selected)) {
      return selected
        .map(val => options.find(opt => opt.value === val)?.label || val)
        .join(', ');
    }

    const selectedOption = options.find(opt => opt.value === selected);
    return selectedOption?.label || selected || placeholder || '';
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
  };

  return (
    <StyledFormControl variant={variant} error={error} fullWidth>
      {label && <InputLabel>{label}</InputLabel>}

      <MuiSelect
        value={value}
        onChange={handleChange}
        renderValue={handleRenderValue}
        displayEmpty
        {...props}
      >
        {placeholder && !multiple && (
          <MenuItem value="" disabled>
            <em>{placeholder}</em>
          </MenuItem>
        )}

        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {multiple && (
              <Checkbox
                checked={Array.isArray(value) && value.indexOf(option.value) > -1}
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </MuiSelect>

      {helperText && (
        <FormHelperText sx={{ mt: 0.5, fontSize: '0.75rem' }}>
          {helperText}
        </FormHelperText>
      )}
    </StyledFormControl>
  );
};

export default Select;
