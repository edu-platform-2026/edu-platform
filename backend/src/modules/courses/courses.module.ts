import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

/**
 * 课程管理模块
 * 包含课程 CRUD、排课管理、上课记录等功能
 */
@Module({
  controllers: [CoursesController, ScheduleController, AttendanceController],
  providers: [CoursesService, ScheduleService, AttendanceService],
  exports: [CoursesService, ScheduleService, AttendanceService],
})
export class CoursesModule {}
