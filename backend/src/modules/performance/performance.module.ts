import { Module } from '@nestjs/common';
import { QueryOptimizationService } from './query-optimization.service';
import { CacheOptimizationService } from './cache-optimization.service';
import { LoadTestingService } from './load-testing.service';
import { PerformanceController } from './performance.controller';

@Module({
  controllers: [PerformanceController],
  providers: [QueryOptimizationService, CacheOptimizationService, LoadTestingService],
  exports: [QueryOptimizationService, CacheOptimizationService, LoadTestingService],
})
export class PerformanceModule {}
