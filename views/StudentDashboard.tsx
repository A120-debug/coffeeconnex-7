
import React, { useState, useEffect } from 'react';
import { UserRole, RequestStatus, MeetingPlatform, ChatRequest, SubscriptionTier, StudentProfile, ProfessionalProfile } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { aiService } from '../services/aiService.ts';

const StudentDashboard = ({ user, onLogout, onChangeTab, activeTab = 'professionals' }) => {
  const [profile, setProfile] = useState<StudentProfile | undefined>(dbService.getStudentProfile(user.id));
  const [allProfs, setAllProfs] = useState<ProfessionalProfile[]>(dbService.getAllProfessionalProfiles());
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProf, setSelectedProf] = useState<ProfessionalProfile | null>(null);
  const [viewingProfDetail, setViewingProfDetail] = useState<ProfessionalProfile | null>(null);
  const [chatGoal, setChatGoal] = useState('');
  const [coachedDraft, setCoachedDraft] = useState<any>(null);
  const [isCoaching, setIsCoaching] = useState(false);
  const [myRequests, setMyRequests] = useState<ChatRequest[]>(dbService.getRequestsForUser(user.id, UserRole.STUDENT));

  const userTier = user.tier || SubscriptionTier.BASIC;

  const getTierConfig = () => {
    switch (userTier) {
      case SubscriptionTier.BASIC: return { limit: 3, name: 'Basic' };
      case SubscriptionTier.STANDARD: return { limit: 6, name: 'Standard' };
      case SubscriptionTier.ADVANCED: return { limit: 20, name: 'Advanced' };
      default: return { limit: 3, name: 'Basic' };
    }
  };

  const config = getTierConfig();
  const currentMonthRequests = myRequests.filter(r => {
    const d = new Date(r.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  
  const isAtQuota = currentMonthRequests >= config.limit;

  useEffect(() => {
    if (profile) fetchRecommendations();
  }, [profile?.major, profile?.school, profile?.interests, profile?.goals]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const recs = await aiService.getRecommendations(profile, allProfs);
      setRecommendations(recs.slice(0, 20));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleRequestChat = (prof: ProfessionalProfile) => {
    if (isAtQuota) {
      alert(`Monthly quota reached for ${config.name} tier (${config.limit} matches). Upgrade for more connections.`);
      onChangeTab('membership');
      return;
    }
    setSelectedProf(prof);
    setViewingProfDetail(null);
    setCoachedDraft(null);
    setChatGoal('');
  };

  const handleGenerateCoach = async () => {
    if (!chatGoal) return;
    setIsCoaching(true);
    try {
      const result = await aiService.coachDraftMessage(profile, selectedProf, chatGoal);
      setCoachedDraft(result);
    } catch (e) { console.error(e); }
    finally { setIsCoaching(false); }
  };

  const handleConfirmRequest = () => {
    if (!selectedProf) return;
    const isAtLimit = (selectedProf.meetingsThisWeek || 0) >= (selectedProf.maxMeetingsPerWeek || 0);
    const req: ChatRequest = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: user.id,
      professionalId: selectedProf.userId,
      status: RequestStatus.PENDING,
      studentNote: chatGoal,
      messageDraft: coachedDraft?.messageDraft || chatGoal,
      talkingPoints: coachedDraft?.talkingPoints || [],
      suggestedQuestions: coachedDraft?.suggestedQuestions || [],
      meetingPlatform: selectedProf.preferredPlatform || MeetingPlatform.GOOGLE,
      isQueuedForNextWeek: isAtLimit,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    dbService.saveRequest(req);
    setMyRequests(dbService.getRequestsForUser(user.id, UserRole.STUDENT));
    setSelectedProf(null);
    onChangeTab('chats');
  };

  const mentorsWithStatus = recommendations.map(rec => {
    const prof = allProfs.find(p => p.userId === rec.professionalId);
    if (!prof) return null;
    const isAtLimit = (prof.meetingsThisWeek || 0) >= (prof.maxMeetingsPerWeek || 0);
    return { ...rec, prof, isAtLimit };
  }).filter(Boolean);

  const availableNow = mentorsWithStatus.filter(m => !m.isAtLimit);

  return (
    <div className="p-12 lg:p-20 bg-slate-50/30 min-h-screen">
        <header className="flex justify-between items-start mb-16">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 block">Synergy Engine</span>
            <h1 className="text-5xl font-black text-blue-950 tracking-tighter">Professionals.</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white px-8 py-4 rounded-[1.5rem] border border-slate-100 shadow-xl flex items-center gap-8">
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Quota Usage</p>
                  <p className={`text-xl font-black ${isAtQuota ? 'text-red-500' : 'text-blue-900'}`}>{currentMonthRequests} / {config.limit}</p>
               </div>
               <div className="h-10 w-px bg-slate-100"></div>
               <button onClick={() => onChangeTab('membership')} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Upgrade</button>
             </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[4rem] border border-slate-100 shadow-2xl">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <p className="text-xs font-black uppercase text-blue-900/40 tracking-widest animate-pulse">Syncing professionals...</p>
          </div>
        ) : (
          <div className="space-y-16">
            <section>
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-10">Optimized Peer Matches</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {availableNow.map(m => (
                  <div key={m.prof.userId} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col group animate-in slide-in-from-bottom-4">
                    <div className="p-10 flex-1 cursor-pointer" onClick={() => setViewingProfDetail(m.prof)}>
                      <div className="flex justify-between items-start mb-8">
                          <div className="bg-blue-50 text-blue-700 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">{m.score}% Synergy</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.prof.city || m.prof.location}</div>
                      </div>
                      <h3 className="text-3xl font-black text-blue-950 leading-none mb-2">{m.prof.fullName}</h3>
                      <p className="text-lg font-bold text-slate-500 mb-6">{m.prof.title} @ {m.prof.company}</p>
                      <div className="flex flex-wrap gap-2">
                        {m.prof.topics?.slice(0, 3).map((t: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest rounded-lg border border-slate-100">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="px-10 pb-10 mt-auto">
                        <button 
                          onClick={() => handleRequestChat(m.prof)} 
                          className={`w-full py-5 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-3 ${isAtQuota ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-950 text-white hover:bg-blue-800 active:scale-95'}`}
                        >
                          {isAtQuota ? <i className="fas fa-lock"></i> : <i className="fas fa-paper-plane"></i>}
                          {isAtQuota ? 'Quota Reached' : 'Send Pitch'}
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Detailed Profile View Modal */}
        {viewingProfDetail && (
           <div className="fixed inset-0 z-[1001] bg-blue-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
             <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-4xl p-12 relative overflow-y-auto max-h-[90vh] flex flex-col gap-8">
                <button onClick={() => setViewingProfDetail(null)} className="absolute top-10 right-10 text-slate-300 hover:text-blue-950 transition-colors z-20"><i className="fas fa-times text-xl"></i></button>
                
                <header className="flex items-center gap-8 mb-4">
                   <div className="w-24 h-24 bg-blue-950 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black">
                      {viewingProfDetail.fullName.charAt(0)}
                   </div>
                   <div>
                      <h3 className="text-4xl font-black text-blue-950 tracking-tighter">{viewingProfDetail.fullName}</h3>
                      <p className="text-xl font-bold text-slate-400">{viewingProfDetail.title} @ {viewingProfDetail.company}</p>
                      <div className="flex gap-4 mt-2">
                         <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest"><i className="fas fa-map-marker-alt mr-1"></i> {viewingProfDetail.city || viewingProfDetail.location}</span>
                         <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest"><i className="fas fa-graduation-cap mr-1"></i> {viewingProfDetail.gradUniversity}</span>
                      </div>
                   </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      <section className="space-y-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">The Narrative</h4>
                         <p className="text-sm text-slate-600 font-medium leading-relaxed">{viewingProfDetail.bio}</p>
                      </section>
                      
                      {viewingProfDetail.workHistory && viewingProfDetail.workHistory.length > 0 && (
                        <section className="space-y-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Professional Footprint</h4>
                           <div className="space-y-3">
                              {viewingProfDetail.workHistory.map((job, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                   <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                   <p className="text-xs font-bold text-blue-950">{job}</p>
                                </div>
                              ))}
                           </div>
                        </section>
                      )}
                   </div>

                   <div className="space-y-8 bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                      <section className="space-y-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Discussion Hubs</h4>
                         <div className="flex flex-wrap gap-2">
                            {viewingProfDetail.topics?.map((topic, idx) => (
                              <span key={idx} className="px-4 py-2 bg-white text-[10px] font-black text-blue-900 uppercase tracking-widest rounded-xl border border-blue-100">{topic}</span>
                            ))}
                         </div>
                      </section>

                      {viewingProfDetail.hobbies && viewingProfDetail.hobbies.length > 0 && (
                        <section className="space-y-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity & Hobbies</h4>
                           <div className="flex flex-wrap gap-2">
                              {viewingProfDetail.hobbies.map((hobby, idx) => (
                                <span key={idx} className="px-4 py-2 bg-blue-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">{hobby}</span>
                              ))}
                           </div>
                        </section>
                      )}
                   </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 flex gap-4">
                   <button onClick={() => setViewingProfDetail(null)} className="flex-1 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-blue-950 transition">Close View</button>
                   <button onClick={() => handleRequestChat(viewingProfDetail)} className="flex-[2] py-5 bg-blue-950 text-white rounded-3xl font-black text-lg hover:bg-blue-800 transition shadow-2xl active:scale-95">Initiate Synergy Guided Pitch</button>
                </div>
             </div>
           </div>
        )}

        {selectedProf && (
           <div className="fixed inset-0 z-[1001] bg-blue-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
             <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-4xl p-12 relative overflow-y-auto max-h-[95vh] flex flex-col lg:flex-row gap-12">
               <button onClick={() => setSelectedProf(null)} className="absolute top-10 right-10 text-slate-300 hover:text-blue-950 transition-colors z-20"><i className="fas fa-times text-xl"></i></button>
               
               <div className="flex-1 flex flex-col space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2 block">Network Outreach</span>
                    <h3 className="text-4xl font-black text-blue-950 tracking-tighter">Draft Your Pitch.</h3>
                    <p className="text-sm text-slate-500 font-medium">Be specific about your goal with {selectedProf.fullName}.</p>
                  </div>

                  <textarea 
                    value={chatGoal}
                    onChange={e => setChatGoal(e.target.value)}
                    placeholder="Briefly state your intent (e.g., 'Looking for advice on transitioning from Accounting to M&A...')"
                    className="w-full p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-900 outline-none font-medium h-48 transition-all shadow-inner text-sm leading-relaxed"
                  />

                  <div className="mt-auto space-y-4 pt-4 border-t border-slate-50">
                    <button 
                      onClick={handleGenerateCoach}
                      disabled={isCoaching || !chatGoal}
                      className="w-full py-5 bg-blue-50 text-blue-950 rounded-2xl font-black text-xs uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isCoaching ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                      {isCoaching ? 'Sage is analyzing...' : 'Ask Sage to Polish'}
                    </button>
                    
                    <button 
                      onClick={handleConfirmRequest}
                      disabled={!chatGoal}
                      className="w-full py-5 bg-blue-950 text-white rounded-[1.5rem] font-black text-lg hover:bg-blue-800 transition-all shadow-2xl active:scale-95"
                    >
                      Send Connection Request
                    </button>
                  </div>
               </div>

               <div className="flex-1 bg-slate-50/50 rounded-[3rem] p-10 border border-slate-100 overflow-y-auto max-h-[750px]">
                  {!coachedDraft && !isCoaching ? (
                    <div className="h-full space-y-10">
                       <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                          <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <i className="fas fa-lightbulb"></i> Networking Best Practices
                          </h4>
                          <ul className="space-y-4">
                             <li className="flex gap-3">
                                <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                                <p className="text-[11px] font-bold text-slate-600">Be concise: Professionals often scan messages. Keep it under 3-4 sentences.</p>
                             </li>
                             <li className="flex gap-3">
                                <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                                <p className="text-[11px] font-bold text-slate-600">State the 'Why': Why this specific professional? Mention a company or a topic on their profile.</p>
                             </li>
                             <li className="flex gap-3">
                                <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                                <p className="text-[11px] font-bold text-slate-600">Clear Call to Action: Ask for a 20-30 minute coffee chat specifically.</p>
                             </li>
                          </ul>
                       </div>
                       
                       <div className="flex flex-col items-center justify-center text-center p-6 space-y-6 opacity-30">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-950 text-2xl">
                             <i className="fas fa-robot"></i>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sage's guidance will appear here</p>
                       </div>
                    </div>
                  ) : isCoaching ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                       <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                       <p className="text-xs font-black text-blue-900 uppercase tracking-widest animate-pulse">Sage is drafting recommendations...</p>
                    </div>
                  ) : (
                    <div className="space-y-10 animate-in fade-in duration-700">
                       <section className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-blue-950 text-white rounded-lg flex items-center justify-center text-xs"><i className="fas fa-magic"></i></div>
                             <h4 className="text-xs font-black text-blue-950 uppercase tracking-widest">Sage's Optimized Outreach</h4>
                          </div>
                          <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 text-xs font-medium text-slate-700 leading-relaxed relative">
                             <button className="absolute top-4 right-4 text-blue-600 hover:text-blue-900" onClick={() => setChatGoal(coachedDraft.messageDraft)} title="Use this draft">
                                <i className="fas fa-copy"></i>
                             </button>
                             "{coachedDraft.messageDraft}"
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Tip: You can edit this draft before sending.</p>
                       </section>

                       <section className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-xs"><i className="fas fa-comments"></i></div>
                             <h4 className="text-xs font-black text-blue-950 uppercase tracking-widest">Strategic Talking Points</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                             {coachedDraft.talkingPoints?.map((tp: string, idx: number) => (
                               <div key={idx} className="flex gap-3 items-center p-3 bg-white border border-slate-100 rounded-xl">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                  <p className="text-[10px] font-bold text-slate-600">{tp}</p>
                               </div>
                             ))}
                          </div>
                       </section>

                       <section className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs"><i className="fas fa-question"></i></div>
                             <h4 className="text-xs font-black text-blue-950 uppercase tracking-widest">High-Impact Questions</h4>
                          </div>
                          <div className="space-y-3">
                             {coachedDraft.suggestedQuestions?.map((sq: string, idx: number) => (
                               <div key={idx} className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] font-bold text-blue-950">
                                  {sq}
                               </div>
                             ))}
                          </div>
                       </section>
                    </div>
                  )}
               </div>
             </div>
           </div>
        )}
    </div>
  );
};

export default StudentDashboard;
