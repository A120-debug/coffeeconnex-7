
export const UserRole = {
  STUDENT: 'student',
  PROFESSIONAL: 'professional',
  ADMIN: 'admin'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const SubscriptionTier = {
  BASIC: 'Basic',
  STANDARD: 'Standard',
  ADVANCED: 'Advanced'
} as const;

export type SubscriptionTier = typeof SubscriptionTier[keyof typeof SubscriptionTier];

export const RequestStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  COMPLETED: 'completed'
} as const;

export type RequestStatus = typeof RequestStatus[keyof typeof RequestStatus];

export const MeetingPlatform = {
  ZOOM: 'Zoom',
  TEAMS: 'Microsoft Teams',
  OUTLOOK: 'Outlook Calendar',
  GOOGLE: 'Google Meet'
} as const;

export type MeetingPlatform = typeof MeetingPlatform[keyof typeof MeetingPlatform];

export const SchedulingStatus = {
  NOT_STARTED: 'not_started',
  PROPOSED: 'proposed',
  COUNTER_PROPOSED: 'counter_proposed',
  CONFIRMED: 'confirmed'
} as const;

export type SchedulingStatus = typeof SchedulingStatus[keyof typeof SchedulingStatus];

export const ONTARIO_UNIVERSITIES = [
  "University of Toronto",
  "York University",
  "Western University",
  "McMaster University",
  "University of Waterloo",
  "Queen's University",
  "Toronto Metropolitan University (TMU)",
  "Wilfrid Laurier University",
  "University of Guelph",
  "Ontario Tech University",
  "Brock University",
  "Carleton University",
  "University of Ottawa"
];

export const CAMPUSES: Record<string, string[]> = {
  "University of Toronto": ["St. George", "Scarborough", "Mississauga"],
  "York University": ["Keele", "Glendon", "Markham"]
};

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Feedback {
  rating: number;
  comment: string;
  timestamp: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tier: SubscriptionTier;
  createdAt: number;
  updatedAt?: number;
  lastLoginAt?: number;
}

export interface StudentProfile {
  userId: string;
  school: string;
  campus?: string;
  degree: string;
  major: string;
  yearOfStudy: string;
  interests: string[];
  hobbies: string[];
  goals: string;
  industries: string[];
  city: string;
  location: string;
  region: string;
  timezone: string;
  bio: string;
  updatedAt: number;
}

export interface ProfessionalProfile {
  userId: string;
  fullName: string;
  company: string;
  title: string;
  division: string;
  gradUniversity: string;
  gradCampus?: string;
  industry: string;
  yearsExperience: number;
  workHistory: string[];
  topics: string[];
  hobbies: string[];
  city: string;
  location: string;
  timezone: string;
  bio: string;
  availability: string;
  maxMeetingsPerWeek: number;
  meetingsThisWeek: number;
  points: number;
  isVerified?: boolean;
  preferredPlatform?: MeetingPlatform;
  updatedAt: number;
}

export interface ChatRequest {
  id: string;
  studentId: string;
  professionalId: string;
  status: RequestStatus;
  studentNote: string;
  messageDraft?: string;
  talkingPoints?: string[];
  suggestedQuestions?: string[];
  meetingPlatform?: MeetingPlatform;
  meetingLink?: string;
  scheduledTime?: number; 
  proposedTimes?: string[]; 
  schedulingStatus?: SchedulingStatus;
  followUpEnabled?: boolean;
  followUpDraft?: string;
  followUpFrequency?: '1week' | '2weeks' | '1month';
  actionItems?: string[];
  lastFollowUpAt?: number;
  declineReason?: string; 
  isQueuedForNextWeek?: boolean;
  messages: Message[];
  studentLastRead?: number;
  proLastRead?: number;
  studentFeedback?: Feedback;
  proFeedback?: Feedback;
  createdAt: number;
  updatedAt: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Co-op' | 'Internship';
  industry: string;
  description: string;
  sourceUrl: string;
  matchScore?: number;
}

export interface Event {
  id: string;
  title: string;
  organizer: string;
  date: string;
  location: string;
  type: string;
  sourceUrl: string;
}
