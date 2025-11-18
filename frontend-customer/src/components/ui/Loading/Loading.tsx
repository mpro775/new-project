import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Backdrop,
  Skeleton,
} from '@mui/material';
import { styled } from '@mui/material/styles';

export interface LoadingProps {
  type?: 'spinner' | 'linear' | 'skeleton' | 'backdrop';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
  message?: string;
  fullScreen?: boolean;
}

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
}));

const SkeletonContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export const Loading: React.FC<LoadingProps> = ({
  type = 'spinner',
  size = 'medium',
  color = 'primary',
  message,
  fullScreen = false,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 64;
      case 'medium':
      default:
        return 40;
    }
  };

  const renderSpinner = () => (
    <LoadingContainer>
      <CircularProgress size={getSize()} color={color} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </LoadingContainer>
  );

  const renderLinear = () => (
    <Box sx={{ width: '100%' }}>
      <LinearProgress color={color} />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          {message}
        </Typography>
      )}
    </Box>
  );

  const renderSkeleton = () => (
    <SkeletonContainer>
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
    </SkeletonContainer>
  );

  const renderBackdrop = () => (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={true}
    >
      <LoadingContainer>
        <CircularProgress size={getSize()} color="inherit" />
        {message && (
          <Typography variant="body1">
            {message}
          </Typography>
        )}
      </LoadingContainer>
    </Backdrop>
  );

  const content = (() => {
    switch (type) {
      case 'linear':
        return renderLinear();
      case 'skeleton':
        return renderSkeleton();
      case 'backdrop':
        return renderBackdrop();
      case 'spinner':
      default:
        return renderSpinner();
    }
  })();

  if (fullScreen && type !== 'backdrop') {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default Loading;
