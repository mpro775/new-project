import React from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

export type SortDirection = 'asc' | 'desc';

export interface Column<T = Record<string, unknown>> {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string | number;
  minWidth?: number;
  maxWidth?: number;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  format?: (value: unknown) => string;
}

export interface Action<T = Record<string, unknown>> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T, index: number) => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean | ((row: T) => boolean);
  hidden?: boolean | ((row: T) => boolean);
}

export interface TableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  actions?: Action<T>[];
  pagination?: {
    page: number;
    rowsPerPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    rowsPerPageOptions?: number[];
  };
  sorting?: {
    orderBy: string;
    order: SortDirection;
    onSort: (property: string) => void;
  };
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  selectedRows?: T[];
  stickyHeader?: boolean;
  maxHeight?: number | string;
  size?: 'small' | 'medium';
}

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  boxShadow: theme.shadows[2],
  '& .MuiTableHead-root': {
    backgroundColor: theme.palette.grey[50],
    '& .MuiTableCell-head': {
      fontWeight: 600,
      fontSize: '0.875rem',
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  '& .MuiTableBody-root': {
    '& .MuiTableRow-root': {
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      '&.Mui-selected': {
        backgroundColor: theme.palette.action.selected,
        '&:hover': {
          backgroundColor: theme.palette.action.selected + '80',
        },
      },
    },
    '& .MuiTableCell-body': {
      fontSize: '0.875rem',
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(1.5, 2),
    },
  },
}));

const ActionsCell = styled(TableCell)(({ theme }) => ({
  whiteSpace: 'nowrap',
  padding: theme.spacing(0.5, 1),
}));

function Table<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage,
  selectable = false,
  actions = [],
  pagination,
  sorting,
  onRowClick,
  onSelectionChange,
  selectedRows = [],
  stickyHeader = false,
  maxHeight,
  size = 'medium',
}: TableProps<T>) {
  const { t } = useTranslation();

  const [localSelected, setLocalSelected] = React.useState<T[]>(selectedRows || []);

  React.useEffect(() => {
    setLocalSelected(selectedRows || []);
  }, [selectedRows]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSelected = event.target.checked ? data : [];
    setLocalSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  const handleSelectRow = (row: T) => {
    const selectedIndex = localSelected.findIndex(selected => JSON.stringify(selected) === JSON.stringify(row));
    let newSelected: T[] = [];

    if (selectedIndex === -1) {
      newSelected = [...localSelected, row];
    } else {
      newSelected = localSelected.filter((_, index) => index !== selectedIndex);
    }

    setLocalSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  const isSelected = (row: T) => localSelected.some(selected => JSON.stringify(selected) === JSON.stringify(row));

  const renderCellValue = (column: Column<T>, value: unknown, row: T, index: number) => {
    if (column.render) {
      return column.render(value, row, index);
    }

    if (column.format) {
      return column.format(value);
    }

    return value;
  };

  const renderActions = (row: T, index: number) => {
    const visibleActions = actions.filter(action =>
      typeof action.hidden === 'function' ? !action.hidden(row) : !action.hidden
    );

    if (visibleActions.length === 0) return null;

    return (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {visibleActions.map((action) => {
          const isDisabled = typeof action.disabled === 'function'
            ? action.disabled(row)
            : action.disabled;

          return (
            <Tooltip key={action.id} title={action.label}>
              <IconButton
                size="small"
                color={action.color || 'primary'}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  action.onClick(row, index);
                }}
                disabled={isDisabled}
                sx={{ p: 0.5 }}
              >
                {action.icon || <EditIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  const tableHeight = maxHeight ? { maxHeight, overflow: 'auto' } : {};

  return (
    <Paper>
      <StyledTableContainer style={tableHeight}>
        <MuiTable stickyHeader={stickyHeader} size={size}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={localSelected.length > 0 && localSelected.length < data.length}
                    checked={data.length > 0 && localSelected.length === data.length}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
              )}

              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  sortDirection={sorting?.orderBy === column.id ? sorting.order : false}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sorting?.orderBy === column.id}
                      direction={sorting?.orderBy === column.id ? sorting.order : 'asc'}
                      onClick={() => sorting?.onSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}

              {actions.length > 0 && (
                <TableCell align="center" style={{ width: 120 }}>
                  {t('common.actions.actions', 'Actions')}
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t('table.loading', 'Loading...')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage || t('table.noData', 'No data available')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={index}
                  hover
                  selected={isSelected(row)}
                  onClick={() => {
                    if (selectable) {
                      handleSelectRow(row);
                    } else if (onRowClick) {
                      onRowClick(row, index);
                    }
                  }}
                  sx={{
                    cursor: selectable || onRowClick ? 'pointer' : 'default',
                  }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected(row)}
                        size="small"
                        onChange={() => handleSelectRow(row)}
                      />
                    </TableCell>
                  )}

                  {columns.map((column) => {
                    const value = (row as Record<string, unknown>)[column.id];
                    return (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {renderCellValue(column, value, row, index)}
                      </TableCell>
                    );
                  })}

                  {actions.length > 0 && (
                    <ActionsCell>
                      {renderActions(row, index)}
                    </ActionsCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </MuiTable>
      </StyledTableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          rowsPerPageOptions={pagination.rowsPerPageOptions || [5, 10, 25, 50]}
          onPageChange={(_, page) => pagination.onPageChange(page)}
          onRowsPerPageChange={(event) => pagination.onRowsPerPageChange(parseInt(event.target.value, 10))}
          labelRowsPerPage={t('table.rowsPerPage', 'Rows per page:')}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} ${t('table.of', 'of')} ${count}`
          }
        />
      )}
    </Paper>
  );
}

export default Table;
