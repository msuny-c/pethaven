export type Role = 'admin' | 'coordinator' | 'veterinar' | 'volunteer' | 'candidate';

export interface AuthUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roles: Role[];
  accessToken: string;
  avatarUrl?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: Role[];
  active?: boolean;
  avatarUrl?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  phone?: string;
  address?: string;
  housing?: string;
  experience?: string;
}

export interface Animal {
  id: number;
  name: string;
  species: 'cat' | 'dog';
  breed?: string;
  age?: number;
  ageMonths?: number;
  gender?: 'male' | 'female';
  status: 'quarantine' | 'available' | 'reserved' | 'adopted' | 'not_available';
  description?: string;
  behaviorNotes?: string;
  medicalSummary?: string;
  vaccinated?: boolean;
  sterilized?: boolean;
  microchipped?: boolean;
  medical?: {
    vaccinated?: boolean;
    sterilized?: boolean;
    microchipped?: boolean;
  };
  behavior?: {
    kids?: boolean;
    cats?: boolean;
    dogs?: boolean;
    notes?: string;
  };
  photos?: string[];
}

export interface AnimalMedia {
  id: number;
  animalId: number;
  fileUrl: string;
  url?: string;
  description?: string;
  uploadedAt?: string;
}

export interface ReportMedia {
  id: number;
  reportId: number;
  url?: string;
  description?: string;
  uploadedAt?: string;
}

export type ApplicationStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface Application {
  id: number;
  animalId: number;
  candidateId: number;
  candidateName?: string;
  reason?: string;
  experience?: string;
  housing?: string;
  createdAt?: string;
  status: ApplicationStatus;
  notes?: string;
  decisionComment?: string;
  date?: string;
  details?: {
    email?: string;
    phone?: string;
    address?: string;
    housing?: string;
    experience?: string;
    reason?: string;
  };
}

export interface MedicalRecord {
  id: number;
  animalId: number;
  vetId: number;
  procedure: string;
  description: string;
  administeredDate: string;
  nextDueDate?: string;
}

export interface Shift {
  id: number;
  shiftDate: string;
  shiftType: 'morning' | 'evening' | 'full_day';
}

export interface Interview {
  id: number;
  applicationId: number;
  interviewerId: number;
  scheduledDatetime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  coordinatorNotes?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  animalId?: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  estimatedShifts?: number;
  dueDate?: string;
  updatedAt?: string;
}

export interface PostAdoptionReport {
  id: number;
  agreementId: number;
  applicationId?: number;
  animalId?: number;
  animalName?: string;
  dueDate: string;
  submittedDate?: string;
  reportText?: string;
  volunteerFeedback?: string;
  status: 'pending' | 'submitted' | 'overdue' | 'reviewed';
  authorId?: number;
  authorFirstName?: string;
  authorLastName?: string;
  authorAvatar?: string;
}

export interface SystemSetting {
  key: string;
  value: string;
}

export interface Notification {
  id: number;
  personId: number;
  title: string;
  message: string;
  createdAt: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'new_application' | 'shift_reminder' | 'report_due' | 'interview_scheduled';
  read: boolean;
}

export interface Agreement {
  id: number;
  applicationId: number;
  signedDate: string;
  postAdoptionPlan: string;
}

export interface ShiftVolunteer {
  shiftId: number;
  volunteerId: number;
  attendanceStatus: 'signed_up' | 'attended' | 'absent';
}

export interface TaskShift {
  taskId: number;
  shiftId: number;
  progressNotes?: string;
}

export interface VolunteerApplication {
  id: number;
  personId: number;
  motivation: string;
  availability?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  decisionComment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MentorAssignment {
  volunteerId: number;
  mentorId?: number;
  orientationDate?: string;
  mentorFeedback?: string;
  allowSelfShifts?: boolean;
  approvedAt?: string;
}

export type FilterState = {
  species: 'all' | string;
  age: 'all' | 'baby' | 'young' | 'adult' | 'senior';
};
