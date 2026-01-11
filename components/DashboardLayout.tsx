
import React from 'react';
import { UserRole } from '../types.ts';
import Logo from './Logo.tsx';

interface DashboardLayoutProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  hasUnread: boolean;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  role, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  hasUnread, 
  children 
}) => {
  const isProfessional = role === UserRole.PROFESSIONAL;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Persistent Sidebar */}
      <aside className="w-72 bg-blue-950 p-8 flex flex-col fixed h-full text-white z-50 shadow-2xl shrink-0 hidden md:flex">
        <Logo variant="light" className="mb-12" onClick={() => setActiveTab(isProfessional ? 'requests' : 'professionals')} />
        
        <nav className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
          {!isProfessional ? (
            <>
              <button 
                onClick={() => setActiveTab('professionals')} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'professionals' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-users text-blue-300"></i> Professionals
              </button>
              <button 
                onClick={() => setActiveTab('chats')} 
                className={`relative w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'chats' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-comments text-blue-300"></i> Conversations
                {hasUnread && <span className="absolute right-6 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-blue-950 animate-pulse"></span>}
              </button>
              <button 
                onClick={() => setActiveTab('prep')} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'prep' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-clipboard-check text-blue-300"></i> Meeting Prep
              </button>
              <button 
                onClick={() => setActiveTab('strategist')} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'strategist' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-chess-knight text-blue-300"></i> Strategist
              </button>
              <button 
                onClick={() => setActiveTab('events')} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'events' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-calendar-alt text-blue-300"></i> Events
              </button>
              <button 
                onClick={() => setActiveTab('jobs')} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'jobs' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-briefcase text-blue-300"></i> Jobs
              </button>
              <button 
                onClick={() => setActiveTab('membership')} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'membership' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-credit-card text-blue-300"></i> Membership
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('requests')} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'requests' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-inbox text-blue-300"></i> Connections
              </button>
              <button 
                onClick={() => setActiveTab('chats')} 
                className={`relative w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'chats' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-comments text-blue-300"></i> Chats
                {hasUnread && <span className="absolute right-6 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-blue-950 animate-pulse"></span>}
              </button>
              <button 
                onClick={() => setActiveTab('calendar')} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'calendar' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-calendar text-blue-300"></i> Calendar
              </button>
              <button 
                onClick={() => setActiveTab('rewards')} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'rewards' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-award text-blue-300"></i> Rewards
              </button>
              <button 
                onClick={() => setActiveTab('strategist')} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'strategist' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <i className="fas fa-chess-knight text-blue-300"></i> Strategist
              </button>
            </>
          )}

          <div className="pt-8 border-t border-white/5 space-y-4">
            <button 
              onClick={() => setActiveTab('profile')} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'profile' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
            >
              <i className="fas fa-user-circle text-blue-300"></i> My Profile
            </button>
            <button 
              onClick={() => setActiveTab('help')} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition border border-white/5 ${activeTab === 'help' ? 'bg-white/10' : 'text-white/40 hover:text-white'}`}
            >
              <i className="fas fa-question-circle text-blue-300"></i> Help Hub
            </button>
          </div>
        </nav>
        
        <div className="mt-auto border-t border-white/10 pt-6">
           <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 text-red-400 hover:text-red-300 transition font-black uppercase text-xs tracking-widest">
             <i className="fas fa-sign-out-alt"></i> Logout
           </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 md:ml-72">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
