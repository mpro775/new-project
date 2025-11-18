import React from 'react';
import {
  Card as MuiCard,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { CardProps as MuiCardProps } from '@mui/material';

export interface CardProps extends MuiCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  contentPadding?: number;
  hover?: boolean;
  compact?: boolean;
}

const StyledCard = styled(MuiCard, {
  shouldForwardProp: (prop) => !['hover', 'compact'].includes(prop as string),
})<{ hover?: boolean; compact?: boolean }>(({ theme, hover, compact }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease',
  ...(hover && {
    '&:hover': {
      boxShadow: theme.shadows[8],
      transform: 'translateY(-2px)',
    },
  }),
  ...(compact && {
    padding: theme.spacing(1),
  }),
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  '&:last-child': {
    paddingBottom: theme.spacing(3),
  },
}));

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  contentPadding,
  hover = false,
  compact = false,
  ...props
}) => {
  return (
    <StyledCard hover={hover} compact={compact} {...props}>
      {(title || subtitle || action) && (
        <CardHeader
          title={
            title && (
              <Typography variant="h6" component="h2">
                {title}
              </Typography>
            )
          }
          subheader={
            subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )
          }
          action={action}
          sx={{ pb: 0 }}
        />
      )}

      <StyledCardContent sx={contentPadding ? { padding: contentPadding } : {}}>
        {children}
      </StyledCardContent>
    </StyledCard>
  );
};

export default Card;
