
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService.ts';
import { SubscriptionTier, User, ProfessionalProfile, ChatRequest } from '../types.ts';

const AdminView: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'branding' | 'revenue' | 'costs' | 'infra'>('overview');
  const [users, setUsers] = useState<User[]>(dbService.getUsers());
  const [profProfiles, setProfProfiles] = useState<ProfessionalProfile[]>(dbService.getAllProfessionalProfiles());
  const [requests, setRequests] = useState<ChatRequest[]>(dbService.getRequests());
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  // Branding state
  const [logoUrl, setLogoUrl] = useState(dbService.getSettings().logoUrl || '');
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  const TIER_PRICES = {
    [SubscriptionTier.BASIC]: 0,
    [SubscriptionTier.STANDARD]: 14.99,
    [SubscriptionTier.ADVANCED]: 24.99
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(dbService.getUsers());
      setRequests(dbService.getRequests());
      setProfProfiles(dbService.getAllProfessionalProfiles());
      setLastRefreshed(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const revenueStats = useMemo(() => {
    const standardCount = users.filter(u => u.tier === SubscriptionTier.STANDARD).length;
    const advancedCount = users.filter(u => u.tier === SubscriptionTier.ADVANCED).length;
    const standardRev = standardCount * TIER_PRICES[SubscriptionTier.STANDARD];
    const advancedRev = advancedCount * TIER_PRICES[SubscriptionTier.ADVANCED];
    const totalMRR = standardRev + advancedRev;
    return { standardCount, advancedCount, standardRev, advancedRev, totalMRR };
  }, [users]);

  const costStats = useMemo(() => {
    const computeCost = 145.50;
    const dbCost = 42.00;
    const aiUsageCost = requests.length * 0.052;
    const totalOpEx = computeCost + dbCost + aiUsageCost;
    return { computeCost, dbCost, aiUsageCost, totalOpEx };
  }, [requests]);

  const offlineProfs = useMemo(() => {
    return profProfiles.filter(p => p.maxMeetingsPerWeek === 0);
  }, [profProfiles]);

  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    dbService.saveSettings({ logoUrl });
    // Trigger internal update event for the Logo components
    window.dispatchEvent(new Event('cc_settings_updated'));
    await new Promise(r => setTimeout(r, 1000));
    setIsSavingBranding(false);
    alert("Branding Protocol Synced Successfully.");
  };

  const renderOverview = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Net Monthly Position</p>
          <p className={`text-4xl font-black tracking-tighter ${(revenueStats.totalMRR - costStats.totalOpEx) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            $ {(revenueStats.totalMRR - costStats.totalOpEx).toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400 font-bold mt-2 italic">Combined Gross Margin</p>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Total Users</p>
          <p className="text-4xl font-black tracking-tighter text-blue-900">{users.length}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-2 italic">Across all university hubs</p>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl relative">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Critical Alerts</p>
          <p className="text-4xl font-black tracking-tighter text-amber-500">{offlineProfs.length}</p>
          {offlineProfs.length > 0 && <span className="absolute top-8 right-8 w-3 h-3 bg-amber-500 rounded-full animate-ping"></span>}
          <p className="text-[10px] text-slate-400 font-bold mt-2 italic">Offline Professionals</p>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden relative group">
         <h3 className="text-xl font-black text-blue-950 mb-2 flex items-center gap-3">
           <i className="fas fa-chart-line text-blue-600"></i> Platform Velocity Matrix
         </h3>
         <p className="text-slate-400 text-sm mb-10">Cross-regional engagement and connection growth.</p>
         <div className="flex justify-center gap-3 h-40 items-end">
            {[30, 45, 25, 60, 40, 85, 50, 70, 95, 60, 80, 55].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-50 rounded-t-2xl group-hover:bg-blue-600 transition-all duration-700" style={{ height: `${h}%` }}></div>
            ))}
         </div>
      </div>
    </div>
  );

  const renderBranding = () => (
    <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl">
        <h3 className="text-3xl font-black text-blue-950 tracking-tighter mb-4">Identity & Branding.</h3>
        <p className="text-slate-500 font-medium mb-12">Update your official company presence across the entire platform.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Official Logo URL</label>
                 <input 
                   type="text" 
                   value={logoUrl} 
                   onChange={(e) => setLogoUrl(e.target.value)}
                   className="w-full p-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-900 outline-none font-bold text-blue-950 shadow-inner" 
                   placeholder="https://your-company.com/logo.png"
                 />
              </div>
              <button 
                onClick={handleSaveBranding}
                disabled={isSavingBranding}
                className="w-full py-5 bg-blue-950 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition shadow-2xl active:scale-95 disabled:opacity-50"
              >
                {isSavingBranding ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : null}
                Sync Identity Protocol
              </button>
           </div>

           <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Live Preview</p>
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-white/50 flex flex-col items-center">
                 <div className="w-24 h-24 rounded-2xl bg-blue-900 overflow-hidden mb-6 shadow-2xl">
                    <img 
                      src={logoUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=128&auto=format&fit=crop'} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                 </div>
                 <div className="text-center">
                    <span className="text-2xl font-black text-blue-950">Coffee<span className="text-blue-600">Connex</span></span>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Platform Branding Active</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl">
        <div className="flex justify-between items-center mb-12">
           <div>
              <h3 className="text-3xl font-black text-blue-950 tracking-tighter">Revenue Hub.</h3>
              <p className="text-slate-500 font-medium mt-1">Direct conversion from academic institutional traffic.</p>
           </div>
           <div className="text-right">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Monthly Recurring</p>
              <p className="text-4xl font-black text-emerald-600 tracking-tighter leading-none">$ {revenueStats.totalMRR.toLocaleString()}</p>
           </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-8 py-5">Subscription Strategy</th><th className="px-8 py-5">Unit Price</th><th className="px-8 py-5">Volume</th><th className="px-8 py-5 text-right">Gross Intake</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="hover:bg-slate-50 transition">
              <td className="px-8 py-8 font-black text-blue-950">Advanced Career Strategist</td>
              <td className="px-8 py-8 text-slate-500 font-bold">$24.99</td>
              <td className="px-8 py-8 text-slate-500 font-bold">{revenueStats.advancedCount} Active</td>
              <td className="px-8 py-8 text-right font-black text-blue-900">${revenueStats.advancedRev.toFixed(2)}</td>
            </tr>
            <tr className="hover:bg-slate-50 transition">
              <td className="px-8 py-8 font-black text-blue-950">Standard Networking Hub</td>
              <td className="px-8 py-8 text-slate-500 font-bold">$14.99</td>
              <td className="px-8 py-8 text-slate-500 font-bold">{revenueStats.standardCount} Active</td>
              <td className="px-8 py-8 text-right font-black text-blue-900">${revenueStats.standardRev.toFixed(2)}</td>
            </tr>
            <tr className="bg-slate-50">
              <td className="px-8 py-8 font-black text-blue-950 uppercase tracking-widest text-xs">Aggregate Revenue Flow</td>
              <td className="px-8 py-8"></td>
              <td className="px-8 py-8"></td>
              <td className="px-8 py-8 text-right text-emerald-600 font-black text-3xl leading-none">${revenueStats.totalMRR.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCosts = () => (
    <div className="space-y-8 animate-in slide-in-from-left-10 duration-500">
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl">
        <div className="flex justify-between items-center mb-12">
           <div>
              <h3 className="text-3xl font-black text-blue-950 tracking-tighter">OpEx Center.</h3>
              <p className="text-slate-500 font-medium mt-1">Infrastructure burn and third-party API consumption.</p>
           </div>
           <div className="text-right">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Monthly Operational Burn</p>
              <p className="text-4xl font-black text-red-600 tracking-tighter leading-none">$ {costStats.totalOpEx.toFixed(2)}</p>
           </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-8 py-5">System Resource</th><th className="px-8 py-5">Provider</th><th className="px-8 py-5">Utilization</th><th className="px-8 py-5 text-right">Estimated Cost</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="hover:bg-slate-50 transition">
              <td className="px-8 py-8 font-black text-blue-950">GCP Compute Engine (E2 Cluster)</td>
              <td className="px-8 py-8 text-slate-500 font-bold">Google Cloud</td>
              <td className="px-8 py-8 text-slate-500 font-bold">99.9% Uptime</td>
              <td className="px-8 py-8 text-right font-black text-red-600">${costStats.computeCost.toFixed(2)}</td>
            </tr>
            <tr className="hover:bg-slate-50 transition">
              <td className="px-8 py-8 font-black text-blue-950">Cloud SQL (PostgreSQL Hub)</td>
              <td className="px-8 py-8 text-slate-500 font-bold">Google Cloud</td>
              <td className="px-8 py-8 text-slate-500 font-bold">High Availability</td>
              <td className="px-8 py-8 text-right font-black text-red-600">${costStats.dbCost.toFixed(2)}</td>
            </tr>
            <tr className="hover:bg-slate-50 transition">
              <td className="px-8 py-8 font-black text-blue-950">Gemini 3 Pro API (Inference)</td>
              <td className="px-8 py-8 text-slate-500 font-bold">AI Studio</td>
              <td className="px-8 py-8 text-slate-500 font-bold">{requests.length} Call Volume</td>
              <td className="px-8 py-8 text-right font-black text-red-600">${costStats.aiUsageCost.toFixed(2)}</td>
            </tr>
            <tr className="bg-blue-950 text-white">
              <td className="px-8 py-8 font-black uppercase tracking-widest text-xs">Total Operating Margin</td>
              <td className="px-8 py-8"></td>
              <td className="px-8 py-8 text-blue-300 font-bold">Revenue - OpEx</td>
              <td className="px-8 py-8 text-right text-emerald-400 font-black text-3xl leading-none">$ {(revenueStats.totalMRR - costStats.totalOpEx).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInfra = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-10 block">Global Infrastructure Status</h3>
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-blue-950 uppercase tracking-widest">CPU Cluster Health</span>
                <span className="text-xs font-black text-emerald-600 uppercase">Optimal (24%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full w-[24%] bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-blue-950 uppercase tracking-widest">Redis Cache Utilization</span>
                <span className="text-xs font-black text-blue-600 uppercase">Balanced (42%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full w-[42%] bg-blue-600 rounded-full shadow-lg shadow-blue-600/20"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-blue-950 uppercase tracking-widest">DB Transaction Load</span>
                <span className="text-xs font-black text-amber-500 uppercase">High (68%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full w-[68%] bg-amber-500 rounded-full shadow-lg shadow-amber-500/20"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-10 block">Regional Edge Status</h3>
          <div className="space-y-5">
             <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-sm font-black text-blue-950">canada-central1</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency: 22ms</span>
             </div>
             <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                   <span className="text-sm font-black text-blue-950">us-east4</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency: 45ms</span>
             </div>
             <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4">
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                   <span className="text-sm font-black text-blue-950">europe-west1</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency: 98ms</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className="w-72 bg-blue-950 border-r border-slate-200 p-8 flex flex-col fixed h-full z-50">
        <div className="flex items-center gap-4 cursor-pointer group mb-12" onClick={() => setActiveTab('overview')}>
          <div className="bg-white text-blue-950 p-2.5 rounded-2xl transition-all shadow-xl">
            <i className="fas fa-shield-halved text-xl"></i>
          </div>
          <span className="text-xl font-black tracking-tight uppercase text-white">Root.</span>
        </div>
        <nav className="flex-1 space-y-4">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
            <i className="fas fa-chart-line"></i> Summary
          </button>
          <button onClick={() => setActiveTab('branding')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'branding' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
            <i className="fas fa-palette"></i> Branding
          </button>
          <button onClick={() => setActiveTab('revenue')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'revenue' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
            <i className="fas fa-money-bill-trend-up"></i> Revenue Hub
          </button>
          <button onClick={() => setActiveTab('costs')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'costs' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
            <i className="fas fa-coins"></i> Cost Center
          </button>
          <button onClick={() => setActiveTab('infra')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'infra' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
            <i className="fas fa-server"></i> Infrastructure
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'users' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
            <i className="fas fa-users"></i> User Base
          </button>
        </nav>
        <button onClick={onLogout} className="mt-auto py-4 bg-white/5 rounded-2xl text-red-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition">Logout Supervisor</button>
      </aside>

      <main className="flex-1 ml-72 p-12 lg:p-20 overflow-y-auto min-h-screen">
        <header className="flex justify-between items-end mb-16 pb-12 border-b border-slate-200">
          <div>
             <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-2 block">System Telemetry</span>
             <h1 className="text-6xl font-black text-blue-950 tracking-tighter capitalize leading-none">{activeTab === 'infra' ? 'Infra Matrix' : activeTab}.</h1>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Refresh</p>
             <p className="text-xs font-bold text-slate-900">{lastRefreshed.toLocaleTimeString()}</p>
          </div>
        </header>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'branding' && renderBranding()}
        {activeTab === 'revenue' && renderRevenue()}
        {activeTab === 'costs' && renderCosts()}
        {activeTab === 'infra' && renderInfra()}
        {activeTab === 'users' && (
           <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                 <tr><th className="px-10 py-6">Identity</th><th className="px-10 py-6">Domain Role</th><th className="px-10 py-6">Strategy Tier</th><th className="px-10 py-6 text-right">Joined</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {users.map(u => (
                   <tr key={u.id} className="hover:bg-slate-50 transition">
                     <td className="px-10 py-8 font-black text-blue-950 text-lg">{u.fullName}</td>
                     <td className="px-10 py-8 text-xs text-slate-500 font-bold uppercase tracking-widest">{u.role}</td>
                     <td className="px-10 py-8"><span className="text-[9px] font-black px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-blue-950">{u.tier}</span></td>
                     <td className="px-10 py-8 text-right text-[10px] text-slate-400 font-black">{new Date(u.createdAt).toLocaleDateString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminView;
