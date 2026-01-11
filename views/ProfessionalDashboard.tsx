
import React, { useState } from 'react';
import { UserRole, RequestStatus, ProfessionalProfile, ChatRequest, User } from '../types.ts';
import { dbService } from '../services/dbService.ts';

interface ProfessionalDashboardProps {
  user: any;
  onLogout: () => void;
  onStartMeeting: (req: ChatRequest) => void;
  onAcceptAndChat: (reqId: string) => void;
  onChangeTab?: (tab: string) => void;
  activeTab?: string;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ 
  user, 
  onStartMeeting,
  onAcceptAndChat,
  onChangeTab,
}) => {
  const [profile, setProfile] = useState<ProfessionalProfile | undefined>(dbService.getProfessionalProfile(user.id));
  const [requests, setRequests] = useState<ChatRequest[]>(dbService.getRequestsForUser(user.id, UserRole.PROFESSIONAL));
  const [allUsers] = useState<User[]>(dbService.getUsers());
  const [rejectingRequest, setRejectingRequest] = useState<ChatRequest | null>(null);

  const handleAccept = (reqId: string) => {
    const req = requests.find(r => r.id === reqId);
    if (req) {
      const updated = { ...req, status: RequestStatus.ACCEPTED, updatedAt: Date.now() };
      dbService.saveRequest(updated);
      onAcceptAndChat(reqId);
    }
  };

  const pending = requests.filter(r => r.status === RequestStatus.PENDING);
  const accepted = requests.filter(r => r.status === RequestStatus.ACCEPTED);

  return (
    <div className="p-12 lg:p-20 bg-slate-50/50 min-h-screen">
        <header className="flex justify-between items-end mb-16">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-2 block">Mentor Workstation</span>
            <h1 className="text-6xl font-black text-blue-950 tracking-tighter leading-none">Console.</h1>
          </div>
          <button onClick={() => onChangeTab?.('profile')} className="px-8 py-4 bg-white border border-slate-100 rounded-2xl text-blue-900 font-black text-[10px] uppercase tracking-widest shadow-xl">Settings</button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
           <div className="lg:col-span-3 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex items-center gap-10">
              <div className="flex-1 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase">
                    <span>Weekly Throughput</span>
                    <span>{profile?.meetingsThisWeek} / {profile?.maxMeetingsPerWeek} Matches</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-950 transition-all" style={{ width: `${(profile?.meetingsThisWeek! / profile?.maxMeetingsPerWeek!) * 100}%` }}></div>
                </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <section className="lg:col-span-2 space-y-8">
                <h2 className="text-2xl font-black text-blue-950 tracking-tighter">Inbound Requests</h2>
                <div className="space-y-6 pb-20">
                   {pending.length === 0 ? (
                      <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center opacity-40 font-black uppercase tracking-widest text-xs">No pending syncs.</div>
                   ) : pending.map(req => {
                     const studentProfile = dbService.getStudentProfile(req.studentId);
                     const studentUser = allUsers.find(u => u.id === req.studentId);
                     return (
                       <div key={req.id} className="bg-white rounded-[3rem] border p-10 shadow-2xl border-slate-100 hover:border-blue-200 transition-all group">
                          <div className="flex justify-between items-start mb-8">
                             <div className="flex gap-6 items-center">
                                <div className="w-16 h-16 bg-blue-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">{studentUser?.fullName?.charAt(0)}</div>
                                <div>
                                   <p className="font-black text-blue-950 text-2xl tracking-tight">{studentUser?.fullName}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{studentProfile?.major || 'General'} Specialist</span>
                                      <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{studentProfile?.campus || studentProfile?.school} Hub</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex gap-3">
                                <button onClick={() => setRejectingRequest(req)} className="px-6 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition">Decline</button>
                                <button onClick={() => handleAccept(req.id)} className="px-6 py-3 bg-blue-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-800 transition">Accept & Chat</button>
                             </div>
                          </div>
                          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 italic relative">
                            <i className="fas fa-quote-left absolute -top-3 -left-1 text-blue-100 text-3xl"></i>
                            <p className="text-sm text-slate-600 leading-relaxed">"{req.studentNote}"</p>
                          </div>
                          {studentProfile?.goals && (
                            <div className="mt-6 flex items-center gap-3">
                               <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Aspiration:</span>
                               <span className="text-[10px] font-bold text-blue-950 bg-blue-50 px-3 py-1 rounded-full">{studentProfile.goals}</span>
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
             </section>

             <section className="space-y-8">
                <h2 className="text-2xl font-black text-blue-950 tracking-tighter">Agenda</h2>
                <div className="space-y-4">
                   {accepted.map(req => (
                     <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs"><i className="fas fa-check"></i></div>
                           <p className="font-bold text-blue-950 text-sm">{allUsers.find(u => u.id === req.studentId)?.fullName}</p>
                        </div>
                        <button onClick={() => onStartMeeting(req)} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition"><i className="fas fa-video text-xs"></i></button>
                     </div>
                   ))}
                </div>
             </section>
        </div>
    </div>
  );
};

export default ProfessionalDashboard;
