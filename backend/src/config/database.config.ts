import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ||
    'postgresql://zaytuna_user:password@localhost:5432/zaytuna_pos',

  // Connection Pool Configuration
  pool: {
    // Maximum number of connections in the pool
    max: parseInt(process.env.DB_POOL_MAX || '20'),

    // Minimum number of connections in the pool
    min: parseInt(process.env.DB_POOL_MIN || '5'),

    // Maximum time (in milliseconds) to wait for a connection
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'),

    // Maximum time (in milliseconds) that a connection can be idle
    idle: parseInt(process.env.DB_POOL_IDLE || '20000'),

    // Maximum time (in milliseconds) to wait for connection validation
    evict: parseInt(process.env.DB_POOL_EVICT || '10000'),

    // Handle connection validation
    handleDisconnects: true,

    // Create connections lazily
    lazy: true,
  },

  // Query Logging (for development)
  logging: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],

  // Connection Retry Configuration
  retry: {
    max: parseInt(process.env.DB_RETRY_MAX || '3'),
    timeout: parseInt(process.env.DB_RETRY_TIMEOUT || '5000'),
  },

  // Performance Monitoring
  monitor: {
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'), // ms
    enableMetrics: process.env.DB_ENABLE_METRICS === 'true',
  },
}));
