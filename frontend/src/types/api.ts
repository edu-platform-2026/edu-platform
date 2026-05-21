export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'SYSTEM' | 'ASSIGNMENT' | 'COURSE' | 'GENERAL';
  userId: string;
  isRead: boolean;
  createdAt: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  description?: string;
  teacherId?: string;
  teacherName?: string;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'OTHER';
  url: string;
  size: number;
  uploaderId: string;
  uploaderName?: string;
  courseId?: string;
  tags?: string[];
  createdAt: string;
}

export interface Feedback {
  id: string;
  userId: string;
  userName?: string;
  userRole?: string;
  title: string;
  content: string;
  type: 'SUGGESTION' | 'COMPLAINT' | 'QUESTION' | 'OTHER';
  status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface InstitutionSettings {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  workingHours?: string;
}
