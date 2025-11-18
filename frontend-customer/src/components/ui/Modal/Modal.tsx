import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  fullScreen?: boolean;
  showCloseButton?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
  PaperProps?: Record<string, unknown>;
  TransitionProps?: Record<string, unknown>;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(1),
    boxShadow: theme.shadows[8],
  },
  '& .MuiDialogTitle-root': {
    padding: theme.spacing(2, 3),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& .MuiTypography-root': {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
    gap: theme.spacing(1),
  },
}));

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  showCloseButton = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  PaperProps,
  TransitionProps,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClose = (_event: Record<string, unknown>, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClick && reason === 'backdropClick') return;
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') return;
    onClose();
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen || isMobile}
      PaperProps={PaperProps}
      TransitionProps={TransitionProps}
    >
      {title && (
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {showCloseButton && (
              <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                  color: theme.palette.grey[500],
                  '&:hover': {
                    color: theme.palette.grey[700],
                  },
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}

      <DialogContent>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </StyledDialog>
  );
};

export default Modal;
