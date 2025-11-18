import React from 'react';
import {
  FormControlLabel,
  Checkbox as MuiCheckbox,
  FormControl,
  FormLabel,
  FormGroup,
  FormHelperText,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { CheckboxProps as MuiCheckboxProps } from '@mui/material';

export interface CheckboxOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface CheckboxProps extends MuiCheckboxProps {
  label?: string;
  helperText?: string;
  error?: boolean;
  options?: CheckboxOption[];
  value?: (string | number)[];
  onChange?: (value: (string | number)[]) => void;
  orientation?: 'horizontal' | 'vertical';
}

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  '& .MuiFormControlLabel-label': {
    fontSize: '0.875rem',
  },
  '& .MuiCheckbox-root': {
    padding: theme.spacing(0.5),
  },
}));

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  helperText,
  error = false,
  options,
  value = [],
  onChange,
  orientation = 'vertical',
  ...props
}) => {
  const handleChange = (optionValue: string | number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    let newValue: (string | number)[];

    if (checked) {
      newValue = [...value, optionValue];
    } else {
      newValue = value.filter(v => v !== optionValue);
    }

    onChange?.(newValue);
  };

  const handleSingleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange?.(event);
  };

  // Single checkbox
  if (!options) {
    return (
      <FormControl error={error}>
        <StyledFormControlLabel
          control={
            <MuiCheckbox
              {...props}
              onChange={handleSingleChange}
            />
          }
          label={label}
        />
        {helperText && (
          <FormHelperText sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  }

  // Multiple checkboxes
  return (
    <FormControl error={error} component="fieldset">
      {label && (
        <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem' }}>
          {label}
        </FormLabel>
      )}

      <FormGroup
        sx={{
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: orientation === 'horizontal' ? 2 : 1,
        }}
      >
        {options.map((option) => (
          <StyledFormControlLabel
            key={option.value}
            control={
              <MuiCheckbox
                checked={value.includes(option.value)}
                onChange={handleChange(option.value)}
                disabled={option.disabled}
                {...props}
              />
            }
            label={option.label}
          />
        ))}
      </FormGroup>

      {helperText && (
        <FormHelperText sx={{ mt: 0.5, fontSize: '0.75rem' }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default Checkbox;
