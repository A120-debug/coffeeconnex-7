
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService.ts';
import { aiService } from '../services/aiService.ts';
import { UserRole, RequestStatus, SchedulingStatus, SubscriptionTier, ChatRequest } from '../types.ts';

const MeetingPrepView = ({ user, onChangeTab }: any) => {
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<ChatRequest | null>(null);
  const [prepData, setPrepData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const userTier = user.tier || SubscriptionTier.BASIC;
  const isLocked = userTier !== SubscriptionTier.ADVANCED;

  useEffect(() => {
    // Filter for CONFIRMED meetings
    const allRequests = dbService.getRequestsForUser(user.id, UserRole.STUDENT);
    const confirmed = allRequests.filter(r => r.schedulingStatus === SchedulingStatus.CONFIRMED && r.status !== RequestStatus.COMPLETED);
    setRequests(confirmed);
  }, [user.id]);

  const handleGeneratePrep = async () => {
    if (!selectedReq) return;
    setIsLoading(true);
    try {
      const studentProfile = dbService.getStudentProfile(user.id);
      const profProfile = dbService.getProfessionalProfile(selectedReq.professionalId);
      const result = await aiService.generateMeetingPrep(studentProfile, profProfile, selectedReq);
      setPrepData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getPartnerName = (req: ChatRequest) => {
    const prof = dbService.getProfessionalProfile(req.professionalId);
    return prof?.fullName || "Professional";
  };

  return (
    <div className="p-12 lg:p-20 bg-slate-50/30 min-h-screen overflow-y-auto">
        <header className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 block">Meeting Intelligence</span>
          <h1 className="text-5xl font-black text-blue-950 tracking-tighter">Preparation Lab.</h1>
        </header>

        {isLocked ? (
          <div className="bg-white p-20 rounded-[4rem] border border-slate-100 shadow-4xl text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center text-4xl mb-10 shadow-inner">
                <i className="fas fa-lock"></i>
             </div>
             <h2 className="text-4xl font-black text-blue-950 tracking-tighter mb-4">Prep Tools Locked.</h2>
             <p className="text-slate-500 text-lg font-medium max-w-md mb-12 leading-relaxed">
               Advanced members get AI-generated meeting agendas, impactful questions, and research briefs for every confirmed call.
             </p>
             <button 
               onClick={() => onChangeTab('membership')}
               className="px-12 py-5 bg-blue-900 text-white rounded-3xl font-black text-lg hover:bg-blue-800 transition-all shadow-2xl shadow-blue-900/20 hover:-translate-y-1"
             >
                Upgrade to Advanced
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Sidebar List */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Upcoming Sessions</h3>
              {requests.length === 0 ? (
                <div className="p-10 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center opacity-40 text-xs font-bold text-slate-400">
                  No confirmed meetings yet.
                </div>
              ) : (
                requests.map(req => (
                  <button 
                    key={req.id} 
                    onClick={() => { setSelectedReq(req); setPrepData(null); }}
                    className={`w-full text-left p-6 rounded-[2rem] border transition-all ${selectedReq?.id === req.id ? 'bg-blue-900 text-white border-blue-900 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}`}
                  >
                    <p className="font-black text-lg mb-1">{getPartnerName(req)}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${selectedReq?.id === req.id ? 'text-blue-300' : 'text-slate-400'}`}>
                      {new Date(req.scheduledTime!).toLocaleDateString()} • {new Date(req.scheduledTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
               {!selectedReq ? (
                  <div className="h-full bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center p-20 text-center opacity-40">
                     <i className="fas fa-clipboard-list text-6xl text-slate-300 mb-6"></i>
                     <p className="font-bold text-slate-400">Select a meeting to generate a prep guide.</p>
                  </div>
               ) : !prepData ? (
                  <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-center flex flex-col items-center justify-center h-full">
                     <h3 className="text-2xl font-black text-blue-950 mb-4">Prepare for {getPartnerName(selectedReq)}</h3>
                     <p className="text-slate-500 mb-10 max-w-sm">Sage will analyze both profiles and your initial outreach goal to structure the perfect 30-minute session.</p>
                     <button 
                       onClick={handleGeneratePrep}
                       disabled={isLoading}
                       className="px-10 py-4 bg-blue-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-900 transition shadow-xl disabled:opacity-50"
                     >
                       {isLoading ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : <i className="fas fa-magic mr-2"></i>}
                       {isLoading ? 'Analyzing Synergies...' : 'Generate Sage Guide'}
                     </button>
                  </div>
               ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
                     {/* Agenda Section */}
                     <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-sm"><i className="fas fa-list-ol"></i></div>
                           <h3 className="text-xl font-black text-blue-950">Strategic Agenda</h3>
                        </div>
                        <div className="space-y-4">
                           {prepData.agenda?.map((item: any, i: number) => (
                             <div key={i} className="flex gap-6 items-start">
                                <span className="w-16 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1">{item.time}</span>
                                <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700">
                                   {item.topic}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* Questions Section */}
                     <div className="bg-blue-950 text-white p-10 rounded-[3rem] shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-12 h-12 bg-white/10 text-blue-300 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-question"></i></div>
                           <h3 className="text-xl font-black">Impact Questions</h3>
                        </div>
                        <div className="space-y-4">
                           {prepData.questions?.map((q: string, i: number) => (
                             <div key={i} className="flex gap-4">
                                <span className="text-blue-500 font-black opacity-50 text-lg">0{i+1}</span>
                                <p className="text-lg font-medium leading-relaxed">{q}</p>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* Tips Section */}
                     <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-sm"><i className="fas fa-lightbulb"></i></div>
                           <h3 className="text-xl font-black text-emerald-900">Sage Tips</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                           {prepData.tips?.map((tip: string, i: number) => (
                             <span key={i} className="px-5 py-3 bg-white text-emerald-800 rounded-xl font-bold text-xs shadow-sm border border-emerald-100">{tip}</span>
                           ))}
                        </div>
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}
    </div>
  );
};

export default MeetingPrepView;
