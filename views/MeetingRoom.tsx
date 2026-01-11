
import React, { useState, useEffect } from 'react';
import { ChatRequest, User, RequestStatus, UserRole } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { aiService } from '../services/aiService.ts';

const MeetingRoom = ({ user, request, onLeave }: { user: User, request: ChatRequest, onLeave: () => void }) => {
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [persistenceInterval, setPersistenceInterval] = useState<'1week' | '2weeks' | '1month'>('1week');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeRemaining(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmitFeedback = async () => {
    if (rating === 0) return alert("Please rate the synergy level.");
    setIsSubmitting(true);
    const updated = { ...request, status: RequestStatus.COMPLETED, updatedAt: Date.now() };
    
    if (user.role === UserRole.STUDENT) {
      updated.studentFeedback = { rating, comment, timestamp: Date.now() };
      if (persistenceEnabled) {
        updated.followUpEnabled = true;
        updated.followUpFrequency = persistenceInterval;
        const draft = await aiService.generatePostCallFollowUp(dbService.getStudentProfile(user.id), dbService.getProfessionalProfile(request.professionalId), "Discussed career journey and TMT M&A.");
        updated.followUpDraft = draft.followUpDraft;
      }
    } else {
      updated.proFeedback = { rating, comment, timestamp: Date.now() };
    }

    dbService.saveRequest(updated);
    setIsSubmitting(false);
    onLeave();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-[100] flex flex-col font-sans">
      <header className="h-20 px-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl"><i className="fas fa-mug-hot"></i></div>
          <p className="text-sm font-black uppercase tracking-widest">Coffee Chat Live • {Math.floor(timeRemaining / 60)}:{timeRemaining % 60}</p>
        </div>
        <button onClick={() => setShowFeedback(true)} className="px-6 py-2.5 bg-red-600 rounded-xl text-xs font-black uppercase shadow-lg">End Session</button>
      </header>

      <main className="flex-1 p-12 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900/20">
         <div className="bg-slate-800 rounded-[3rem] border border-white/5 flex items-center justify-center text-4xl font-black opacity-20">PARTNER FEED</div>
         <div className="bg-slate-800 rounded-[3rem] border border-blue-500/20 flex items-center justify-center text-4xl font-black opacity-20">SELF FEED</div>
      </main>

      {showFeedback && (
        <div className="fixed inset-0 z-[200] bg-blue-950/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 text-slate-900 shadow-4xl overflow-y-auto max-h-[90vh]">
             <h2 className="text-4xl font-black tracking-tighter mb-2 text-blue-950">Session Report.</h2>
             <p className="text-slate-500 font-medium mb-10 leading-relaxed">Rate the connection and set up network persistence.</p>
             
             <div className="space-y-8">
                <div className="flex justify-center gap-4">
                   {[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setRating(s)} className={`text-4xl transition-all ${rating >= s ? 'text-amber-500 scale-110' : 'text-slate-100'}`}><i className="fas fa-star"></i></button>)}
                </div>

                {user.role === UserRole.STUDENT && (
                  <div className="space-y-6">
                    <label className="p-6 bg-blue-50 rounded-[2.5rem] flex items-center justify-between cursor-pointer border border-blue-100">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-900 text-white rounded-xl flex items-center justify-center"><i className="fas fa-infinity"></i></div>
                          <div>
                             <p className="font-black text-[10px] text-blue-950 uppercase tracking-widest leading-none mb-1">Network Persistence</p>
                             <p className="text-[10px] text-blue-600 font-bold">AI-Driven Periodic Outreach</p>
                          </div>
                       </div>
                       <input type="checkbox" checked={persistenceEnabled} onChange={() => setPersistenceEnabled(!persistenceEnabled)} className="w-6 h-6 accent-blue-900" />
                    </label>

                    {persistenceEnabled && (
                      <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-2xl">
                         {['1week', '2weeks', '1month'].map(interval => (
                           <button key={interval} onClick={() => setPersistenceInterval(interval as any)} className={`py-3 rounded-xl text-[9px] font-black uppercase transition ${persistenceInterval === interval ? 'bg-blue-950 text-white shadow-xl' : 'text-slate-400 hover:text-blue-900'}`}>
                             {interval.replace('week', ' Week').replace('month', ' Month')}
                           </button>
                         ))}
                      </div>
                    )}
                  </div>
                )}

                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Session observations..." className="w-full p-6 bg-slate-50 rounded-[2rem] h-28 outline-none" />

                <button onClick={handleSubmitFeedback} disabled={isSubmitting} className="w-full py-5 bg-blue-950 text-white rounded-[1.5rem] font-black text-lg shadow-2xl disabled:opacity-50">
                   {isSubmitting ? 'Syncing...' : 'Complete Hub Cycle'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;
