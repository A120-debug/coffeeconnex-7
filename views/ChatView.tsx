
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, RequestStatus, MeetingPlatform, ChatRequest, SchedulingStatus } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { aiService } from '../services/aiService.ts';

const ChatView = ({ user, onLogout, onChangeTab, activeTab, selectedId }: any) => {
  const isPro = user.role === UserRole.PROFESSIONAL;
  const [requests, setRequests] = useState<ChatRequest[]>(dbService.getRequestsForUser(user.id, user.role));
  const [selectedReq, setSelectedReq] = useState<ChatRequest | null>(null);
  const [msgInput, setMsgInput] = useState("");
  const [showScheduling, setShowScheduling] = useState(false);
  
  // Advanced Scheduling State
  const [selectedDate, setSelectedDate] = useState("");
  const [tempTimes, setTempTimes] = useState<string[]>([]);
  const [finalSlots, setFinalSlots] = useState<string[]>([]); // Array of ISO strings
  const [selectedPlatform, setSelectedPlatform] = useState<MeetingPlatform>(MeetingPlatform.GOOGLE);
  
  // Sage (AI Guide) State for Students
  const [showAiGuide, setShowAiGuide] = useState(false);
  const [aiCoachingResult, setAiCoachingResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId) {
      const req = requests.find(r => r.id === selectedId);
      if (req) {
        setSelectedReq(req);
        if (isPro) {
          const prof = dbService.getProfessionalProfile(user.id);
          if (prof?.preferredPlatform) setSelectedPlatform(prof.preferredPlatform);
          // If editing existing proposals
          if (req.proposedTimes && req.proposedTimes.length > 0) {
             setFinalSlots(req.proposedTimes);
          }
        } else {
          setFinalSlots([]);
          if (req.meetingPlatform) setSelectedPlatform(req.meetingPlatform);
        }
      }
    }
  }, [selectedId, requests]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [selectedReq?.messages]);

  const handleSendMsg = () => {
    if (!msgInput.trim() || !selectedReq) return;
    const updated = dbService.addMessageToRequest(selectedReq.id, { senderId: user.id, text: msgInput });
    if (updated) {
      setSelectedReq(updated);
      setRequests(dbService.getRequestsForUser(user.id, user.role));
      setMsgInput("");
      setAiCoachingResult(null);
    }
  };

  // --- Scheduling Logic ---

  const handleAddTimeForDate = (time: string) => {
    if (!selectedDate || !time) return;
    const dateTimeStr = `${selectedDate}T${time}`;
    const isoString = new Date(dateTimeStr).toISOString();
    
    // Avoid duplicates
    if (!finalSlots.includes(isoString)) {
      setFinalSlots([...finalSlots, isoString].sort());
    }
  };

  const removeSlot = (isoString: string) => {
    setFinalSlots(finalSlots.filter(s => s !== isoString));
  };

  const handleProposeTimes = () => {
    if (!selectedReq) return;

    if (finalSlots.length === 0) {
      alert("Please add at least one time slot.");
      return;
    }
    
    // If student is proposing, it's a counter-proposal. If pro, it's a proposal.
    const newStatus = isPro ? SchedulingStatus.PROPOSED : SchedulingStatus.COUNTER_PROPOSED;
    
    const updated = { 
      ...selectedReq, 
      proposedTimes: finalSlots, 
      schedulingStatus: newStatus,
      meetingPlatform: selectedPlatform,
      updatedAt: Date.now() 
    };
    dbService.saveRequest(updated);
    setSelectedReq(updated);
    setShowScheduling(false);
    dbService.addMessageToRequest(selectedReq.id, { 
      senderId: user.id, 
      text: isPro 
        ? `I've proposed ${finalSlots.length} time slot(s) via ${selectedPlatform}. Please confirm one that works.`
        : `I've counter-proposed ${finalSlots.length} alternative slots. Let me know if any of these work!`
    });
  };

  const handleConfirmTime = (time: string) => {
    if (!selectedReq) return;
    const platform = selectedReq.meetingPlatform || MeetingPlatform.GOOGLE;
    let link = "";
    if (platform === MeetingPlatform.GOOGLE) link = `https://meet.google.com/ccc-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 3)}`;
    else if (platform === MeetingPlatform.ZOOM) link = `https://zoom.us/j/${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
    else if (platform === MeetingPlatform.TEAMS) link = `https://teams.microsoft.com/l/meetup-join/${Math.random().toString(36).substr(2, 12)}`;
    
    const updated = { 
      ...selectedReq, 
      scheduledTime: new Date(time).getTime(), 
      schedulingStatus: SchedulingStatus.CONFIRMED,
      meetingLink: link,
      updatedAt: Date.now() 
    };
    dbService.saveRequest(updated);
    setSelectedReq(updated);
    dbService.addMessageToRequest(selectedReq.id, { senderId: user.id, text: `Confirmed for ${new Date(time).toLocaleString()}. Link: ${link}` });
  };

  // --- AI Logic ---

  const handleGetAiCoaching = async () => {
    if (!selectedReq) return;
    setIsAiLoading(true);
    try {
      const studentProfile = dbService.getStudentProfile(selectedReq.studentId);
      const profProfile = dbService.getProfessionalProfile(selectedReq.professionalId);
      const result = await aiService.coachDraftMessage(
        studentProfile, 
        profProfile, 
        "Drafting a professional follow-up in the current chat thread."
      );
      setAiCoachingResult(result);
      setShowAiGuide(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const active = requests.filter(r => r.status === RequestStatus.ACCEPTED || r.status === RequestStatus.COMPLETED);
  const quickTimes = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div className="flex h-screen bg-slate-50/30 overflow-hidden">
        {/* Left Sidebar: Active Chats */}
        <div className="w-80 border-r bg-white p-6 shrink-0 overflow-y-auto hidden md:block">
           <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-8">Active Conversations</h2>
           <div className="space-y-4">
              {active.map(req => {
                const partnerUser = dbService.getUsers().find(u => u.id === (isPro ? req.studentId : req.professionalId));
                const partnerProf = !isPro ? dbService.getProfessionalProfile(req.professionalId) : null;
                const name = isPro ? partnerUser?.fullName : partnerProf?.fullName;

                return (
                  <button key={req.id} onClick={() => setSelectedReq(req)} className={`w-full p-4 rounded-2xl text-left border transition-all ${selectedReq?.id === req.id ? 'bg-blue-900 text-white shadow-xl translate-x-1' : 'bg-white text-slate-700 hover:border-blue-200'}`}>
                    <p className="font-bold text-sm truncate">{name || 'User'}</p>
                    <p className={`text-[9px] font-black uppercase mt-1 ${selectedReq?.id === req.id ? 'text-blue-300' : 'text-slate-400'}`}>
                      {req.schedulingStatus === SchedulingStatus.CONFIRMED ? 'Scheduled' : 
                       req.schedulingStatus === SchedulingStatus.PROPOSED ? (isPro ? 'Awaiting Reply' : 'Review Slots') : 
                       req.schedulingStatus === SchedulingStatus.COUNTER_PROPOSED ? (isPro ? 'Review Counters' : 'Awaiting Reply') : 'Active'}
                    </p>
                  </button>
                );
              })}
           </div>
        </div>

        {/* Main Content: Chat Window */}
        <div className="flex-1 flex flex-col relative">
          {selectedReq ? (
            <>
              <header className="h-24 border-b bg-white px-10 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center font-black">
                      {(isPro ? dbService.getUsers().find(u => u.id === selectedReq.studentId)?.fullName : dbService.getProfessionalProfile(selectedReq.professionalId)?.fullName)?.charAt(0)}
                   </div>
                   <div>
                      <h3 className="text-lg font-black text-blue-950">
                        {isPro ? dbService.getUsers().find(u => u.id === selectedReq.studentId)?.fullName : dbService.getProfessionalProfile(selectedReq.professionalId)?.fullName}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encrypted</p>
                   </div>
                </div>
                {selectedReq.status !== RequestStatus.COMPLETED && (
                  <div className="flex gap-4">
                    <button onClick={() => { setFinalSlots([]); setShowScheduling(!showScheduling); }} className="px-6 py-2.5 bg-blue-50 text-blue-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition">
                      {isPro ? 'Scheduling' : 'Propose Alternative'}
                    </button>
                  </div>
                )}
              </header>

              <div ref={scrollRef} className="flex-1 p-10 overflow-y-auto space-y-6 bg-slate-50/20">
                {/* Proposal Overlays - Student View of Pro's Proposal */}
                {selectedReq.schedulingStatus === SchedulingStatus.PROPOSED && !isPro && (
                   <div className="flex flex-col items-center mb-8 gap-4 animate-in slide-in-from-top-4">
                      <div className="bg-blue-950 text-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center">
                         <div className="flex items-center justify-center gap-3 mb-4">
                            <i className="fas fa-calendar-day text-blue-400"></i>
                            <h4 className="text-xs font-black uppercase tracking-widest">Review Invitation</h4>
                         </div>
                         <p className="text-xs text-blue-200 mb-6 font-medium">Please select a time for our {selectedReq.meetingPlatform} chat:</p>
                         <div className="space-y-3 mb-6">
                            {selectedReq.proposedTimes?.map((t, i) => (
                              <button key={i} onClick={() => handleConfirmTime(t)} className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl text-left text-xs font-bold hover:bg-white/20 transition flex items-center justify-between group">
                                <span><i className="far fa-clock mr-3 text-blue-400"></i> {new Date(t).toLocaleDateString()} @ {new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <i className="fas fa-check-circle opacity-0 group-hover:opacity-100 transition-all text-emerald-400"></i>
                              </button>
                            ))}
                         </div>
                         <button onClick={() => setShowScheduling(true)} className="w-full py-4 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition">
                           None of these work
                         </button>
                      </div>
                   </div>
                )}
                
                {/* Counter Proposal Overlay - Professional View of Student's Proposal */}
                {selectedReq.schedulingStatus === SchedulingStatus.COUNTER_PROPOSED && isPro && (
                   <div className="flex flex-col items-center mb-8 gap-4 animate-in slide-in-from-top-4">
                      <div className="bg-white text-blue-950 p-8 rounded-[2.5rem] border border-blue-100 shadow-2xl max-w-md w-full text-center">
                         <div className="flex items-center justify-center gap-3 mb-4">
                            <i className="fas fa-history text-blue-600"></i>
                            <h4 className="text-xs font-black uppercase tracking-widest">Student Counter-Proposal</h4>
                         </div>
                         <p className="text-xs text-slate-500 mb-6 font-medium">The student suggested alternative times:</p>
                         <div className="space-y-3 mb-6">
                            {selectedReq.proposedTimes?.map((t, i) => (
                              <button key={i} onClick={() => handleConfirmTime(t)} className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl text-left text-xs font-bold hover:bg-blue-100 transition flex items-center justify-between group">
                                <span><i className="far fa-clock mr-3 text-blue-600"></i> {new Date(t).toLocaleDateString()} @ {new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <i className="fas fa-check-circle opacity-0 group-hover:opacity-100 transition-all text-emerald-500"></i>
                              </button>
                            ))}
                         </div>
                         <button onClick={() => setShowScheduling(true)} className="w-full py-4 bg-blue-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-800 transition">
                           Propose New Times
                         </button>
                      </div>
                   </div>
                )}

                {selectedReq.schedulingStatus === SchedulingStatus.CONFIRMED && (
                   <div className="flex justify-center mb-8">
                      <div className="bg-white border-2 border-emerald-500/20 p-8 rounded-[3rem] shadow-2xl max-w-md w-full flex flex-col items-center text-center">
                         <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
                            <i className="fas fa-calendar-check"></i>
                         </div>
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Session Locked</p>
                         <p className="text-xl font-black text-blue-950 mb-2">{new Date(selectedReq.scheduledTime!).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                         <p className="text-lg font-bold text-slate-500 mb-6">{new Date(selectedReq.scheduledTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         <a href={selectedReq.meetingLink} target="_blank" rel="noreferrer" className="w-full py-4 bg-blue-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition shadow-xl">
                            Join on {selectedReq.meetingPlatform}
                         </a>
                      </div>
                   </div>
                )}

                {selectedReq.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`max-w-lg p-5 rounded-[2rem] text-sm font-medium ${msg.senderId === user.id ? 'bg-blue-900 text-white rounded-tr-none shadow-xl' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'}`}>
                       {msg.text}
                       <p className={`text-[8px] font-black uppercase mt-2 opacity-40 ${msg.senderId === user.id ? 'text-white' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Footer: Input & Sage Support */}
              <footer className="p-8 bg-white border-t z-10">
                <div className="max-w-4xl mx-auto space-y-4">
                  {aiCoachingResult && !isPro && (
                    <div className="p-6 bg-blue-50 border-2 border-blue-100 rounded-3xl animate-in slide-in-from-bottom-4 relative">
                       <div className="flex justify-between items-center mb-4">
                          <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                             <i className="fas fa-comment-dots"></i> Sage's Strategic Draft
                          </h4>
                          <button onClick={() => setAiCoachingResult(null)} className="text-blue-900/40 hover:text-blue-900"><i className="fas fa-times"></i></button>
                       </div>
                       <p className="text-xs font-medium text-slate-700 leading-relaxed italic mb-4">"{aiCoachingResult.messageDraft}"</p>
                       <div className="flex gap-4">
                          <button 
                            onClick={() => { setMsgInput(aiCoachingResult.messageDraft); setAiCoachingResult(null); }}
                            className="px-6 py-2.5 bg-blue-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition"
                          >
                            Apply & Edit
                          </button>
                       </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {!isPro && (
                      <button 
                        onClick={handleGetAiCoaching}
                        disabled={isAiLoading}
                        className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center hover:bg-blue-100 transition shadow-sm disabled:opacity-50 group"
                        title="Sage • Strategic Guide"
                      >
                        {isAiLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-comment-dots text-xl group-hover:scale-110 transition-transform"></i>}
                      </button>
                    )}
                    <textarea 
                      value={msgInput} 
                      onChange={e => setMsgInput(e.target.value)} 
                      onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMsg())}
                      placeholder="Discuss with your mentor..." 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-medium outline-none h-16 focus:ring-2 ring-blue-500/10 transition-all resize-none" 
                    />
                    <button onClick={handleSendMsg} className="w-16 h-16 bg-blue-900 text-white rounded-2xl flex items-center justify-center hover:bg-blue-800 transition shadow-xl active:scale-95"><i className="fas fa-paper-plane"></i></button>
                  </div>
                </div>
              </footer>

              {/* Advanced Scheduling Modal */}
              {showScheduling && (
                 <div className="absolute inset-0 z-50 bg-blue-950/95 backdrop-blur-xl p-6 md:p-10 flex items-center justify-center animate-in fade-in zoom-in-95">
                    <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-4xl w-full text-blue-950 shadow-4xl relative overflow-hidden flex flex-col max-h-[90vh]">
                       <h3 className="text-3xl md:text-4xl font-black mb-2 tracking-tighter">{isPro ? 'Propose Availability.' : 'Counter Propose.'}</h3>
                       <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                         Select a day first, then add multiple time slots for that day.
                       </p>
                       
                       <div className="flex-1 overflow-y-auto pr-2 space-y-10 scrollbar-hide">
                          
                          {/* Platform Selection */}
                          <div className="space-y-3">
                             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">Meeting Platform</p>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.values(MeetingPlatform).map(p => (
                                   <button 
                                      key={p} 
                                      onClick={() => setSelectedPlatform(p)}
                                      className={`py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all ${selectedPlatform === p ? 'bg-blue-900 border-blue-900 text-white shadow-xl' : 'bg-slate-50 border-transparent text-slate-400 hover:border-blue-100'}`}
                                   >
                                      {p}
                                   </button>
                                ))}
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Left Column: Input */}
                             <div className="space-y-6">
                                <div className="space-y-2">
                                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">1. Select Day</p>
                                  <input 
                                    type="date" 
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-900 font-bold text-sm" 
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-3 opacity-100 transition-opacity">
                                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">2. Add Times for {selectedDate || "..."}</p>
                                  <div className="grid grid-cols-4 gap-2">
                                     {quickTimes.map(qt => (
                                        <button 
                                           key={qt} 
                                           onClick={() => handleAddTimeForDate(qt)}
                                           disabled={!selectedDate}
                                           className="px-2 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-blue-50 hover:border-blue-200 transition disabled:opacity-50"
                                        >
                                           {qt}
                                        </button>
                                     ))}
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <input 
                                       type="time" 
                                       id="customTime"
                                       className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold"
                                    />
                                    <button 
                                      onClick={() => {
                                        const val = (document.getElementById('customTime') as HTMLInputElement).value;
                                        handleAddTimeForDate(val);
                                      }}
                                      disabled={!selectedDate}
                                      className="px-6 bg-blue-900 text-white rounded-xl font-black uppercase text-[10px] disabled:opacity-50"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                             </div>

                             {/* Right Column: Review */}
                             <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 h-full flex flex-col">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Proposed Slots ({finalSlots.length})</p>
                                <div className="flex-1 overflow-y-auto space-y-2 max-h-60">
                                   {finalSlots.length === 0 ? (
                                     <p className="text-xs text-slate-400 italic text-center mt-10">No slots added yet.</p>
                                   ) : (
                                     finalSlots.sort().map((slot, i) => (
                                       <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm animate-in fade-in">
                                          <div className="flex gap-2 items-center">
                                             <i className="fas fa-clock text-blue-400"></i>
                                             <span className="text-xs font-bold text-blue-950">
                                                {new Date(slot).toLocaleDateString()} <span className="text-slate-400">@</span> {new Date(slot).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                             </span>
                                          </div>
                                          <button onClick={() => removeSlot(slot)} className="text-red-400 hover:text-red-600 px-2"><i className="fas fa-times"></i></button>
                                       </div>
                                     ))
                                   )}
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="mt-8 flex gap-4 pt-4 border-t border-slate-100">
                          <button onClick={() => setShowScheduling(false)} className="flex-1 py-5 font-black uppercase text-xs tracking-widest text-slate-400 hover:text-blue-900 transition">Discard</button>
                          <button onClick={handleProposeTimes} className="flex-[2] py-5 bg-blue-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-blue-800 transition active:scale-95">
                            {isPro ? 'Dispatch Proposal' : 'Dispatch Counter-Proposal'}
                          </button>
                       </div>
                    </div>
                 </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
               <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center text-4xl mb-6 opacity-40">
                  <i className="fas fa-comment-dots"></i>
               </div>
               <h3 className="text-xl font-black uppercase tracking-widest opacity-20">Mentor Channel Ready</h3>
               <p className="text-xs font-bold text-slate-300 mt-2 text-center max-w-xs">Select a verified connection to start discussing your career trajectory.</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default ChatView;
