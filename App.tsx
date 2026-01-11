
import React, { useState, useEffect } from 'react';
import { UserRole, RequestStatus, MeetingPlatform, ChatRequest, SubscriptionTier } from './types.ts';
import { dbService } from './services/dbService.ts';

import OnboardingView from './views/OnboardingView.tsx';
import StudentDashboard from './views/StudentDashboard.tsx';
import ProfessionalDashboard from './views/ProfessionalDashboard.tsx';
import AdminView from './views/AdminView.tsx';
import ChatView from './views/ChatView.tsx';
import EventsView from './views/EventsView.tsx';
import JobsView from './views/JobsView.tsx';
import CareerStrategistView from './views/CareerStrategistView.tsx';
import ProfessionalRewardsView from './views/ProfessionalRewardsView.tsx';
import CalendarView from './views/CalendarView.tsx';
import HelpView from './views/HelpView.tsx';
import MembershipView from './views/MembershipView.tsx';
import ProfileView from './views/ProfileView.tsx';
import MeetingPrepView from './views/MeetingPrepView.tsx';
import HelpChatbot from './components/HelpChatbot.tsx';
import DashboardLayout from './components/DashboardLayout.tsx';
import MeetingRoom from './views/MeetingRoom.tsx';

type ViewState = 'onboarding' | 'dashboard' | 'admin';

const App = () => {
  const [currentUser, setCurrentUser] = useState(dbService.getCurrentUser());
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeTab, setActiveTab] = useState('professionals'); 
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isDemoMenuVisible, setIsDemoMenuVisible] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState<ChatRequest | null>(null);

  useEffect(() => {
    seedDatabase();
    
    let user = dbService.getCurrentUser();
    
    // DEMO MODE AUTO-LOGIN: If no user found, default to Alex (Student)
    if (!user) {
      user = dbService.findUserByEmail('alex.doe@stanford.edu');
      if (user) {
        dbService.setCurrentUser(user);
        setCurrentUser(user);
      }
    } else {
      setCurrentUser(user);
    }

    if (user) {
      if (user.role === UserRole.ADMIN) {
        setCurrentView('admin');
      } else {
        checkProfileAndRedirect(user);
      }
    }
  }, []);

  const checkProfileAndRedirect = (user: any) => {
    const hasProfile = user.role === UserRole.STUDENT 
      ? dbService.getStudentProfile(user.id)
      : dbService.getProfessionalProfile(user.id);

    if (hasProfile) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('onboarding');
    }
  };

  const seedDatabase = () => {
    const existingUsers = dbService.getUsers();
    if (existingUsers.length > 0) return;

    const admin = { id: 'admin_user', email: 'admin@coffeeconnex.ai', fullName: 'System Admin', role: UserRole.ADMIN, tier: SubscriptionTier.ADVANCED, createdAt: Date.now() };
    dbService.saveUser(admin);

    const pro = { 
      id: 'jordan_pro', 
      name: "Jordan Lee", 
      company: "Goldman Sachs", 
      title: "VP Investment Banking", 
      division: "TMT M&A", 
      gradUniversity: "York University", 
      gradCampus: "Keele", 
      industry: "Finance", 
      bio: "Mentoring the next generation of finance leaders. York Alumni with a focus on high-stakes deal making.", 
      topics: ["Valuation", "M&A Strategy", "Career Pathing"], 
      workHistory: ["Associate @ J.P. Morgan", "Analyst @ RBC Capital Markets"],
      hobbies: ["Photography", "Squash", "Vintage Watches"],
      city: "Toronto",
      location: "Toronto, ON", 
      platform: MeetingPlatform.GOOGLE 
    };
    dbService.saveUser({ id: pro.id, email: 'jordan.lee@demo.com', fullName: pro.name, role: UserRole.PROFESSIONAL, tier: SubscriptionTier.ADVANCED, createdAt: Date.now() });
    dbService.saveProfessionalProfile({ ...pro, userId: pro.id, fullName: pro.name, yearsExperience: 12, timezone: "EST", availability: "Available", maxMeetingsPerWeek: 5, meetingsThisWeek: 0, points: 450, isVerified: true, preferredPlatform: pro.platform, updatedAt: Date.now() });

    const student = { 
      id: 'alex_student', 
      name: 'Alex Doe', 
      email: 'alex.doe@stanford.edu', 
      school: 'University of Toronto', 
      campus: 'Scarborough', 
      degree: 'Undergraduate', 
      major: 'Accounting', 
      yearOfStudy: '3rd Year', 
      industry: 'Accounting', 
      tier: SubscriptionTier.ADVANCED, 
      createdAt: Date.now() 
    };
    dbService.saveUser({ id: student.id, email: student.email, fullName: student.name, role: UserRole.STUDENT, tier: student.tier, createdAt: student.createdAt });
    dbService.saveStudentProfile({ userId: student.id, school: student.school, campus: student.campus, degree: student.degree, major: student.major, yearOfStudy: student.yearOfStudy, region: 'Ontario', interests: [student.industry, 'FinTech'], hobbies: ["Chess", "Hiking"], city: "Scarborough", goals: "Recruiting for top-tier Finance roles.", industries: [student.industry], location: 'Toronto', timezone: 'EST', bio: "Passionate accounting student interested in TMT M&A.", updatedAt: Date.now() });

    const mockRequest: ChatRequest = {
      id: 'mock_req_' + Math.random().toString(36).substr(2, 9),
      studentId: student.id,
      professionalId: pro.id,
      status: RequestStatus.PENDING,
      studentNote: "I'm a 3rd year accounting student at UofT. I've been following your work in TMT M&A and would love to ask about the transition from campus to Goldman Sachs!",
      messageDraft: "Hi Jordan, I'm Alex. I saw your profile and your impressive journey at Goldman Sachs. I'm currently studying accounting at UofT and I'm very interested in the TMT M&A space...",
      talkingPoints: ["UofT to Wall Street transition", "Goldman Sachs culture", "Specific technical skills for M&A"],
      suggestedQuestions: ["What was your favorite deal you worked on?", "How did you find the recruiting process at York?", "What advice do you have for a 3rd year student?"],
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    dbService.saveRequest(mockRequest);
  };

  const handleLogout = () => {
    // In Demo Mode, logout simply resets to the default student persona to restart the experience
    switchPersona('alex.doe@stanford.edu');
  };

  const switchPersona = (email: string) => {
    let user = dbService.findUserByEmail(email);
    if (user) {
      dbService.setCurrentUser(user);
      setCurrentUser(user);
      setSelectedChatId(null);
      if (user.role === UserRole.ADMIN) setCurrentView('admin');
      else {
        setActiveTab(user.role === UserRole.STUDENT ? 'professionals' : 'requests');
        checkProfileAndRedirect(user);
      }
    }
  };

  const handleAdminAccess = () => {
    const password = window.prompt("ADMIN PROTOCOL: Enter Authorization Key");
    if (password === "CoffeeConnex2025") switchPersona('admin@coffeeconnex.ai');
  };

  const onAcceptAndChat = (requestId: string) => {
    setSelectedChatId(requestId);
    setActiveTab('chats');
  };

  const handleStartMeeting = (req: ChatRequest) => {
    setActiveMeeting(req);
  };

  // View Routing
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Initializing Demo Protocol...</p>
        </div>
      </div>
    );
  }

  if (activeMeeting && currentUser) {
    return <MeetingRoom user={currentUser} request={activeMeeting} onLeave={() => setActiveMeeting(null)} />;
  }

  if (currentView === 'onboarding' && currentUser) {
    return (
      <OnboardingView 
        user={currentUser} 
        onComplete={() => setCurrentView('dashboard')} 
      />
    );
  }

  if (currentView === 'admin' && currentUser?.role === UserRole.ADMIN) {
    return <AdminView onLogout={handleLogout} />;
  }

  // Dashboard Logic
  const commonProps = { user: currentUser, onLogout: handleLogout, onChangeTab: setActiveTab, activeTab };

  const renderTabContent = () => {
    if (currentUser?.role === UserRole.STUDENT) {
      switch (activeTab) {
        case 'professionals': return <StudentDashboard {...commonProps} />;
        case 'chats': return <ChatView {...commonProps} selectedId={selectedChatId} />;
        case 'prep': return <MeetingPrepView {...commonProps} />;
        case 'events': return <EventsView {...commonProps} />;
        case 'jobs': return <JobsView {...commonProps} />;
        case 'strategist': return <CareerStrategistView {...commonProps} />;
        case 'profile': return <ProfileView {...commonProps} />;
        case 'help': return <HelpView {...commonProps} />;
        case 'membership': return <MembershipView {...commonProps} user={currentUser!} onChangeTab={setActiveTab} />;
        default: return <StudentDashboard {...commonProps} />;
      }
    } else if (currentUser?.role === UserRole.PROFESSIONAL) {
      switch (activeTab) {
        case 'requests': return <ProfessionalDashboard {...commonProps} onAcceptAndChat={onAcceptAndChat} onStartMeeting={handleStartMeeting} />;
        case 'chats': return <ChatView {...commonProps} selectedId={selectedChatId} />;
        case 'calendar': return <CalendarView {...commonProps} />;
        case 'rewards': return <ProfessionalRewardsView {...commonProps} />;
        case 'strategist': return <CareerStrategistView {...commonProps} />;
        case 'profile': return <ProfileView {...commonProps} />;
        case 'help': return <HelpView {...commonProps} />;
        default: return <ProfessionalDashboard {...commonProps} onAcceptAndChat={onAcceptAndChat} onStartMeeting={handleStartMeeting} />;
      }
    }
    return null;
  };

  const hasUnread = currentUser ? dbService.hasUnreadMessages(currentUser.id, currentUser.role) : false;

  return (
    <div className="min-h-screen relative bg-slate-50">
      {currentUser && (
        <DashboardLayout role={currentUser.role} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} hasUnread={hasUnread}>
          {renderTabContent()}
          <HelpChatbot />
        </DashboardLayout>
      )}

      {/* Demo Switcher - Floating UI */}
      <div className="fixed bottom-8 right-8 z-[2000] flex flex-col items-end gap-4">
        {isDemoMenuVisible && (
          <div className="flex items-center bg-white/90 backdrop-blur-xl border border-slate-200 p-2 rounded-[2rem] shadow-2xl space-x-2 animate-in slide-in-from-right-10 duration-500">
            <button 
              onClick={() => switchPersona('alex.doe@stanford.edu')} 
              className={`px-6 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${currentUser?.role === UserRole.STUDENT && currentUser?.id !== 'admin_user' ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:text-blue-900'}`}
            >
              Student
            </button>
            <button 
              onClick={() => switchPersona('jordan.lee@demo.com')} 
              className={`px-6 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${currentUser?.role === UserRole.PROFESSIONAL ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:text-blue-900'}`}
            >
              Professional
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button 
              onClick={handleAdminAccess} 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${currentUser?.role === UserRole.ADMIN ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-300 hover:text-blue-600'}`}
              title="Admin Mode"
            >
              <i className="fas fa-terminal"></i>
            </button>
          </div>
        )}
        
        <button 
          onClick={() => setIsDemoMenuVisible(!isDemoMenuVisible)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl border-2 ${isDemoMenuVisible ? 'bg-white text-slate-400 border-slate-100 hover:text-blue-600' : 'bg-blue-900 text-white border-blue-800 hover:scale-110'}`}
        >
          <i className={`fas ${isDemoMenuVisible ? 'fa-eye-slash' : 'fa-wand-magic-sparkles'}`}></i>
        </button>
      </div>
    </div>
  );
};

export default App;
