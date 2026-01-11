
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService.ts';
import { aiService } from '../services/aiService.ts';
import { Job, SubscriptionTier } from '../types.ts';

const JobsView = ({ user, onLogout, onChangeTab, activeTab = 'jobs' }) => {
  const [profile] = useState(dbService.getStudentProfile(user.id));
  const [jobs, setJobs] = useState<Job[]>(dbService.getJobs());
  const [isLoading, setIsLoading] = useState(false);
  const userTier = user.tier || SubscriptionTier.BASIC;
  const isLocked = userTier === SubscriptionTier.BASIC;

  useEffect(() => {
    // Fixed: changed profile?.program to profile?.major to match StudentProfile interface
    if (!isLocked) fetchJobs();
  }, [profile?.major]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const results = await aiService.getJobsAndCoops(profile);
      const stabilized = results.map((j, i) => ({ ...j, id: j.id || `job-${i}` }));
      setJobs(stabilized);
      dbService.saveJobs(stabilized);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const sortedJobs = [...jobs].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  return (
    <div className="p-12 lg:p-20 bg-slate-50/30 min-h-screen">
        <header className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 block">Industry Radar</span>
          <h1 className="text-5xl font-black text-blue-950 tracking-tighter">Market Pulse.</h1>
        </header>

        {isLocked ? (
          <div className="bg-white p-20 rounded-[4rem] border border-slate-100 shadow-4xl text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center text-4xl mb-10 shadow-inner">
                <i className="fas fa-lock"></i>
             </div>
             <h2 className="text-4xl font-black text-blue-950 tracking-tighter mb-4">Career Radar Locked.</h2>
             <p className="text-slate-500 text-lg font-medium max-w-md mb-12 leading-relaxed">
               Access real-time job/co-op listings contextualized for your career trajectory. Upgrade to <span className="text-blue-600 font-black">Standard</span> to unlock.
             </p>
             <button 
               onClick={() => onChangeTab('membership')}
               className="px-12 py-5 bg-blue-900 text-white rounded-3xl font-black text-lg hover:bg-blue-800 transition-all shadow-2xl shadow-blue-900/20 hover:-translate-y-1"
             >
                View Plans
             </button>
          </div>
        ) : isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[4rem] border border-slate-100 shadow-2xl">
             <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-900 mb-6"></div>
          </div>
        ) : (
          <div className="space-y-8">
             {sortedJobs.map(job => (
               <div key={job.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden hover:border-blue-400 transition-all duration-500 group">
                  <div className="p-10 flex flex-col lg:flex-row gap-10">
                     <div className="lg:w-2/3">
                        <h3 className="text-3xl font-black text-blue-950 leading-none mb-1">{job.title}</h3>
                        <p className="text-xl font-bold text-slate-400 mb-8">{job.company}</p>
                        <a href={job.sourceUrl} target="_blank" rel="noreferrer" className="inline-block px-10 py-4 bg-blue-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition shadow-2xl">Apply Externally</a>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}
    </div>
  );
};

export default JobsView;
