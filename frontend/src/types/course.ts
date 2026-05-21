export enum CourseStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'CANCELLED',
}

export interface Course {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  classId: string;
  className?: string;
  status: CourseStatus;
  startDate: string;
  endDate: string;
  totalHours: number;
  completedHours?: number;
  maxStudents: number;
  currentStudents?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  courseId: string;
  courseName?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  teacherName?: string;
}

export interface CreateCourseRequest {
  name: string;
  description: string;
  classId: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  maxStudents: number;
}

export interface Attendance {
  id: string;
  scheduleId: string;
  studentId: string;
  studentName?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remark?: string;
}
