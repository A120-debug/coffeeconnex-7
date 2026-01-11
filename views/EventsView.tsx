
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService.ts';
import { aiService } from '../services/aiService.ts';
import { Event, SubscriptionTier } from '../types.ts';

const EventsView = ({ user, onLogout, onChangeTab, activeTab = 'events' }) => {
  const [profile] = useState(dbService.getStudentProfile(user.id));
  const [events, setEvents] = useState<Event[]>(dbService.getEvents());
  const [isLoading, setIsLoading] = useState(false);
  const userTier = user.tier || SubscriptionTier.BASIC;
  const isLocked = userTier === SubscriptionTier.BASIC;

  useEffect(() => {
    // Fixed: changed profile?.program to profile?.major to match StudentProfile interface
    if (!isLocked) fetchEvents();
  }, [profile?.major]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const results = await aiService.getEvents(profile);
      setEvents(results);
      dbService.saveEvents(results);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="p-12 lg:p-20 bg-slate-50/30 min-h-screen">
        <header className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 block">Industry Networking</span>
          <h1 className="text-5xl font-black text-blue-950 tracking-tighter">Event Hub.</h1>
        </header>

        {isLocked ? (
          <div className="bg-white p-20 rounded-[4rem] border border-slate-100 shadow-4xl text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center text-4xl mb-10 shadow-inner">
                <i className="fas fa-lock"></i>
             </div>
             <h2 className="text-4xl font-black text-blue-950 tracking-tighter mb-4">Event Radar Locked.</h2>
             <p className="text-slate-500 text-lg font-medium max-w-md mb-12 leading-relaxed">
               Access real-time networking mixers and recruiting events tailored to your discipline. Upgrade to <span className="text-blue-600 font-black">Standard</span> to unlock.
             </p>
             <button 
               onClick={() => onChangeTab('membership')}
               className="px-12 py-5 bg-blue-900 text-white rounded-3xl font-black text-lg hover:bg-blue-800 transition-all shadow-2xl shadow-blue-900/20 hover:-translate-y-1"
             >
                View Plans
             </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[4rem] border border-slate-100 shadow-2xl">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-6"></div>
             {/* Fixed: changed profile?.program to profile?.major */}
             <p className="font-black text-blue-900 text-xs tracking-widest uppercase">Fetching {profile?.major} mixers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {events.map(ev => (
              <div key={ev.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                <h3 className="text-3xl font-black text-blue-950 leading-tight mb-4">{ev.title}</h3>
                <p className="text-lg font-bold text-blue-700 mb-6">{ev.organizer}</p>
                <a href={ev.sourceUrl} target="_blank" rel="noreferrer" className="block w-full py-4 bg-blue-950 text-white rounded-2xl font-black text-xs text-center uppercase tracking-widest">Register Now</a>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default EventsView;
