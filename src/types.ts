export type UserRole = 'CEO' | 'Manager' | 'Employee';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  salary: number;
  joinedAt: string;
  isClockedIn?: boolean;
  lastClockIn?: string;
  lastClockOut?: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason: string;
  createdAt: string;
  approvedBy?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  managerId: string;
  managerName: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  type: 'clock_in' | 'clock_out';
  timestamp: string;
}
