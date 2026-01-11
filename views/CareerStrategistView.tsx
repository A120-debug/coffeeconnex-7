
import React, { useState } from 'react';
import { dbService } from '../services/dbService.ts';
import { aiService } from '../services/aiService.ts';
import { UserRole, SubscriptionTier } from '../types.ts';

const CareerStrategistView = ({ user, onLogout, onChangeTab, activeTab = 'strategist' }) => {
  const isProfessional = user.role === UserRole.PROFESSIONAL;
  const profile = isProfessional 
    ? dbService.getProfessionalProfile(user.id) 
    : dbService.getStudentProfile(user.id);
    
  const userTier = user.tier || SubscriptionTier.BASIC;
  const isLocked = !isProfessional && userTier !== SubscriptionTier.ADVANCED;

  const [aspirations, setAspirations] = useState("");
  const [strategy, setStrategy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateStrategy = async () => {
    if (!aspirations && !(isProfessional ? profile?.bio : profile?.goals)) {
      alert("Please provide some goals or aspirations first!");
      return;
    }
    setIsLoading(true);
    try {
      const result = await aiService.generateCareerStrategy(profile, aspirations);
      setStrategy(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-12 lg:p-20 bg-slate-50/30 min-h-screen overflow-y-auto">
        <header className="mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 block">AI Career Architect</span>
          <h1 className="text-5xl font-black text-blue-950 tracking-tighter">Strategic Blueprint.</h1>
        </header>

        {isLocked ? (
          <div className="bg-white p-20 rounded-[4rem] border border-slate-100 shadow-4xl text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center text-4xl mb-10 shadow-inner">
                <i className="fas fa-lock"></i>
             </div>
             <h2 className="text-4xl font-black text-blue-950 tracking-tighter mb-4">Advanced Strategy Vault.</h2>
             <p className="text-slate-500 text-lg font-medium max-w-md mb-12 leading-relaxed">
               The AI Career Strategist generates deep-learning roadmaps and skill-gap analyses reserved for our <span className="text-blue-600 font-black">Advanced</span> members.
             </p>
             <button 
               onClick={() => onChangeTab('membership')}
               className="px-12 py-5 bg-blue-900 text-white rounded-3xl font-black text-lg hover:bg-blue-800 transition shadow-2xl shadow-blue-900/20 active:scale-95"
             >
               Upgrade to Advanced
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-8">
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">Define Aspirations</h3>
                  <textarea 
                    value={aspirations}
                    onChange={e => setAspirations(e.target.value)}
                    placeholder="Where do you want to be in 5 years?"
                    className="w-full p-6 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-blue-900 outline-none font-medium h-48 transition-all shadow-inner text-sm"
                  />
                  <button 
                    onClick={handleGenerateStrategy}
                    disabled={isLoading}
                    className="w-full mt-6 py-5 bg-blue-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-sparkles mr-2"></i>}
                    {isLoading ? 'Synthesizing...' : 'Generate Strategy'}
                  </button>
               </div>
               
               {strategy && (
                 <div className="bg-blue-950 p-10 rounded-[3rem] text-white shadow-3xl animate-in slide-in-from-left-8">
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">Mentorship Focus</h3>
                    <p className="text-sm font-medium leading-relaxed italic border-l-2 border-blue-500 pl-4">"{strategy.mentorshipFocus}"</p>
                 </div>
               )}
            </div>

            <div className="lg:col-span-2 space-y-12">
               {!strategy && !isLoading ? (
                  <div className="bg-white h-[600px] border-2 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center text-center p-20 opacity-30">
                     <i className="fas fa-route text-6xl mb-8 text-slate-300"></i>
                     <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Blueprint Pending</h3>
                  </div>
               ) : isLoading ? (
                  <div className="bg-white h-[600px] rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col items-center justify-center p-20 animate-pulse">
                     <div className="w-16 h-16 bg-slate-100 rounded-2xl mb-8 flex items-center justify-center">
                        <i className="fas fa-brain text-blue-200 text-3xl"></i>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-12 animate-in fade-in duration-1000">
                     <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl">
                        <h3 className="text-2xl font-black text-blue-950 mb-12 tracking-tight">Strategic Roadmap</h3>
                        <div className="space-y-12 relative">
                           <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
                           {[strategy.roadmap?.phase1ShortTerm, strategy.roadmap?.phase2MidTerm, strategy.roadmap?.phase3LongTerm].map((phase, i) => phase && (
                             <div key={i} className="flex gap-8 relative">
                                <div className="w-14 h-14 bg-white border-4 border-slate-50 rounded-2xl flex items-center justify-center text-blue-900 font-black z-10 shadow-lg">{i + 1}</div>
                                <div className="flex-1 pb-4">
                                   <div className="flex justify-between items-start mb-2">
                                      <h4 className="text-lg font-black text-blue-950">{phase.title}</h4>
                                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">{phase.timeline}</span>
                                   </div>
                                   <div className="flex flex-wrap gap-2 mt-4">
                                      {phase.tasks.map((task, j) => (
                                        <div key={j} className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 border border-slate-100">{task}</div>
                                      ))}
                                   </div>
                                </div>
                             </div>
                           ))}
                        </div>
                     </section>
                  </div>
               )}
            </div>
          </div>
        )}
    </div>
  );
};

export default CareerStrategistView;
