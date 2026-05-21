export enum AssignmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  RETURNED = 'RETURNED',
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName?: string;
  teacherId: string;
  teacherName?: string;
  dueDate: string;
  status: AssignmentStatus;
  totalScore: number;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  submissionCount?: number;
  totalStudents?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  content: string;
  attachments?: string[];
  score?: number;
  feedback?: string;
  status: SubmissionStatus;
  submittedAt: string;
  gradedAt?: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
  totalScore: number;
  attachments?: string[];
}

export interface GradeSubmissionRequest {
  score: number;
  feedback: string;
}
