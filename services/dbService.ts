
import { UserRole, RequestStatus, SubscriptionTier } from '../types.ts';

const IS_PRODUCTION = false; 
const API_BASE_URL = 'https://api.coffeeconnex.ai'; 

const STORAGE_KEYS = {
  USERS: 'cc_users',
  STUDENT_PROFILES: 'cc_student_profiles',
  PROF_PROFILES: 'cc_prof_profiles',
  REQUESTS: 'cc_requests',
  CURRENT_USER: 'cc_current_user',
  JOBS: 'cc_jobs',
  EVENTS: 'cc_events',
  SETTINGS: 'cc_platform_settings'
};

const getFromStorage = (key, defaultValue) => {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const apiRequest = async (path: string, method = 'GET', body?: any) => {
  if (!IS_PRODUCTION) return null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return response.json();
};

export const dbService = {
  getUsers: () => getFromStorage(STORAGE_KEYS.USERS, []),
  
  saveUser: async (user) => {
    if (IS_PRODUCTION) return apiRequest('/users', 'POST', user);
    const users = dbService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push({ ...user, tier: user.tier || SubscriptionTier.BASIC });
    }
    setToStorage(STORAGE_KEYS.USERS, users);
  },

  deleteUser: (userId: string) => {
    const users = dbService.getUsers().filter(u => u.id !== userId);
    setToStorage(STORAGE_KEYS.USERS, users);
    
    const studentProfiles = getFromStorage(STORAGE_KEYS.STUDENT_PROFILES, []).filter(p => p.userId !== userId);
    setToStorage(STORAGE_KEYS.STUDENT_PROFILES, studentProfiles);
    
    const profProfiles = getFromStorage(STORAGE_KEYS.PROF_PROFILES, []).filter(p => p.userId !== userId);
    setToStorage(STORAGE_KEYS.PROF_PROFILES, profProfiles);
  },

  findUserByEmail: (email) => dbService.getUsers().find(u => u.email === email),

  getCurrentUser: () => getFromStorage(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user) => setToStorage(STORAGE_KEYS.CURRENT_USER, user),

  getStudentProfile: (userId) => 
    getFromStorage(STORAGE_KEYS.STUDENT_PROFILES, []).find(p => p.userId === userId),
    
  getAllStudentProfiles: () => getFromStorage(STORAGE_KEYS.STUDENT_PROFILES, []),

  saveStudentProfile: async (profile) => {
    if (IS_PRODUCTION) return apiRequest('/profiles/student', 'POST', profile);
    const profiles = getFromStorage(STORAGE_KEYS.STUDENT_PROFILES, []);
    const index = profiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) profiles[index] = profile;
    else profiles.push(profile);
    setToStorage(STORAGE_KEYS.STUDENT_PROFILES, profiles);
  },

  getProfessionalProfile: (userId) => 
    getFromStorage(STORAGE_KEYS.PROF_PROFILES, []).find(p => p.userId === userId),
    
  getAllProfessionalProfiles: () => getFromStorage(STORAGE_KEYS.PROF_PROFILES, []),
  
  saveProfessionalProfile: async (profile) => {
    if (IS_PRODUCTION) return apiRequest('/profiles/professional', 'POST', profile);
    const profiles = getFromStorage(STORAGE_KEYS.PROF_PROFILES, []);
    const index = profiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) profiles[index] = profile;
    else profiles.push(profile);
    setToStorage(STORAGE_KEYS.PROF_PROFILES, profiles);
  },

  getRequests: () => getFromStorage(STORAGE_KEYS.REQUESTS, []),
  
  getRequestsForUser: (userId, role) => {
    const all = dbService.getRequests();
    return role === UserRole.STUDENT 
      ? all.filter(r => r.studentId === userId)
      : all.filter(r => r.professionalId === userId);
  },

  saveRequest: async (request) => {
    if (IS_PRODUCTION) return apiRequest('/requests', 'POST', request);
    const requests = dbService.getRequests();
    const index = requests.findIndex(r => r.id === request.id);
    const oldRequest = index >= 0 ? requests[index] : null;

    if (request.status === RequestStatus.ACCEPTED && (!oldRequest || oldRequest.status !== RequestStatus.ACCEPTED)) {
      const prof = dbService.getProfessionalProfile(request.professionalId);
      if (prof) {
        dbService.saveProfessionalProfile({
          ...prof,
          meetingsThisWeek: (prof.meetingsThisWeek || 0) + 1,
          points: (prof.points || 0) + 50 
        });
      }
    }

    if (index >= 0) requests[index] = request;
    else {
      if (!request.messages) request.messages = [];
      requests.push(request);
    }
    setToStorage(STORAGE_KEYS.REQUESTS, requests);
  },

  addMessageToRequest: (requestId: string, message: { senderId: string, text: string }) => {
    const requests = dbService.getRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index >= 0) {
      if (!requests[index].messages) requests[index].messages = [];
      const newMsg = {
        id: Math.random().toString(36).substr(2, 9),
        ...message,
        timestamp: Date.now()
      };
      requests[index].messages.push(newMsg);
      requests[index].updatedAt = Date.now();
      setToStorage(STORAGE_KEYS.REQUESTS, requests);
      return requests[index];
    }
    return null;
  },

  markAsRead: (requestId: string, userId: string, role: UserRole) => {
    const requests = dbService.getRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index >= 0) {
      if (role === UserRole.STUDENT) requests[index].studentLastRead = Date.now();
      else requests[index].proLastRead = Date.now();
      setToStorage(STORAGE_KEYS.REQUESTS, requests);
    }
  },

  hasUnreadMessages: (userId: string, role: UserRole) => {
    const requests = dbService.getRequestsForUser(userId, role);
    return requests.some(r => {
      if (!r.messages || r.messages.length === 0) return false;
      const lastMsgTime = r.messages[r.messages.length - 1].timestamp;
      const lastRead = role === UserRole.STUDENT ? (r.studentLastRead || 0) : (r.proLastRead || 0);
      const lastMsgSender = r.messages[r.messages.length - 1].senderId;
      return lastMsgTime > lastRead && lastMsgSender !== userId;
    });
  },

  resetWeeklyMeetings: (userId: string) => {
    const profiles = getFromStorage(STORAGE_KEYS.PROF_PROFILES, []);
    const index = profiles.findIndex(p => p.userId === userId);
    if (index >= 0) {
      profiles[index] = { ...profiles[index], meetingsThisWeek: 0 };
      setToStorage(STORAGE_KEYS.PROF_PROFILES, profiles);
    }

    const requests = dbService.getRequests();
    let updated = false;
    const newRequests = requests.map(r => {
      if (r.professionalId === userId && r.status === RequestStatus.DECLINED && r.declineReason === 'Personal Capacity') {
        updated = true;
        return { 
          ...r, 
          status: RequestStatus.PENDING, 
          isOptimalSynergy: true, 
          declineReason: undefined,
          updatedAt: Date.now()
        };
      }
      return r;
    });

    if (updated) {
      setToStorage(STORAGE_KEYS.REQUESTS, newRequests);
    }
  },

  resetAllWeeklyMeetings: () => {
    const profiles = dbService.getAllProfessionalProfiles();
    profiles.forEach(p => dbService.resetWeeklyMeetings(p.userId));
  },

  getJobs: () => getFromStorage(STORAGE_KEYS.JOBS, []),
  saveJobs: (jobs) => setToStorage(STORAGE_KEYS.JOBS, jobs),
  getEvents: () => getFromStorage(STORAGE_KEYS.EVENTS, []),
  saveEvents: (events) => setToStorage(STORAGE_KEYS.EVENTS, events),

  getSettings: () => getFromStorage(STORAGE_KEYS.SETTINGS, { logoUrl: '' }),
  saveSettings: (settings) => setToStorage(STORAGE_KEYS.SETTINGS, settings)
};
