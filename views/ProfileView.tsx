
import React, { useState } from 'react';
import { dbService } from '../services/dbService.ts';
import { UserRole } from '../types.ts';

const ProfileView = ({ user }) => {
  const isPro = user.role === UserRole.PROFESSIONAL;
  const initial = isPro ? dbService.getProfessionalProfile(user.id) : dbService.getStudentProfile(user.id);
  const [formData, setFormData] = useState<any>(initial || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    const finalData = { ...formData, updatedAt: Date.now() };
    
    // Convert comma-separated strings back to arrays if user entered them that way
    if (typeof finalData.hobbies === 'string') {
      finalData.hobbies = finalData.hobbies.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (isPro && typeof finalData.workHistory === 'string') {
      finalData.workHistory = finalData.workHistory.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!isPro && typeof finalData.interests === 'string') {
      finalData.interests = finalData.interests.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (isPro) dbService.saveProfessionalProfile(finalData);
    else dbService.saveStudentProfile(finalData);
    
    setIsSaving(false);
    alert("Profile Protocol Synchronized.");
  };

  return (
    <div className="p-12 lg:p-20 bg-slate-50/30 min-h-screen">
        <header className="mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 block">Identity Hub</span>
          <h1 className="text-5xl font-black text-blue-950 tracking-tighter">Profile.</h1>
        </header>

        <div className="max-w-4xl space-y-10 pb-20">
           <section className="bg-white p-12 rounded-[4rem] border shadow-2xl space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Legal Identity</label>
                    <input type="text" value={user.fullName} disabled className="w-full p-4 rounded-2xl bg-slate-50 border-2 font-bold opacity-60" />
                 </div>

                 {isPro ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Professional Title</label>
                      <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 border-2 focus:border-blue-900 outline-none font-bold" placeholder="e.g. Senior VP" />
                    </div>
                 ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Academic Major</label>
                      <input type="text" value={formData.major || ''} onChange={e => setFormData({ ...formData, major: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 border-2 focus:border-blue-900 outline-none font-bold" placeholder="e.g. Computer Science" />
                    </div>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isPro ? 'Organization' : 'University'}</label>
                    <input type="text" value={isPro ? (formData.company || '') : (formData.school || '')} onChange={e => setFormData({ ...formData, [isPro ? 'company' : 'school']: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 border-2 focus:border-blue-900 outline-none font-bold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isPro ? 'Department/Division' : 'Campus Location'}</label>
                    <input type="text" value={isPro ? (formData.division || '') : (formData.campus || '')} onChange={e => setFormData({ ...formData, [isPro ? 'division' : 'campus']: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 border-2 focus:border-blue-900 outline-none font-bold" placeholder={isPro ? "e.g. Capital Markets" : "e.g. Scarborough"} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">City</label>
                  <input type="text" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 border-2 focus:border-blue-900 outline-none font-bold" placeholder="e.g. Toronto" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Hobbies (Comma separated)</label>
                  <input type="text" value={Array.isArray(formData.hobbies) ? formData.hobbies.join(', ') : (formData.hobbies || '')} onChange={e => setFormData({ ...formData, hobbies: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 border-2 focus:border-blue-900 outline-none font-bold" placeholder="e.g. Chess, Squash, Photography" />
                </div>
              </div>

              {isPro && (
                <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 space-y-6">
                   <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Alumni & Experience</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Grad University</label>
                        <input type="text" value={formData.gradUniversity || ''} onChange={e => setFormData({ ...formData, gradUniversity: e.target.value })} className="w-full p-4 rounded-2xl bg-white border-2 border-blue-100 focus:border-blue-900 outline-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Grad Campus</label>
                        <input type="text" value={formData.gradCampus || ''} onChange={e => setFormData({ ...formData, gradCampus: e.target.value })} className="w-full p-4 rounded-2xl bg-white border-2 border-blue-100 focus:border-blue-900 outline-none font-bold" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Work History (Comma separated past roles)</label>
                      <input type="text" value={Array.isArray(formData.workHistory) ? formData.workHistory.join(', ') : (formData.workHistory || '')} onChange={e => setFormData({ ...formData, workHistory: e.target.value })} className="w-full p-4 rounded-2xl bg-white border-2 border-blue-100 focus:border-blue-900 outline-none font-bold" placeholder="Analyst @ Goldman, Associate @ J.P. Morgan" />
                   </div>
                </div>
              )}

              {!isPro && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Aspiring Job / Goal</label>
                  <input type="text" value={formData.goals || ''} onChange={e => setFormData({ ...formData, goals: e.target.value })} className="w-full p-4 rounded-2xl bg-slate-50 border-2 focus:border-blue-900 outline-none font-bold" placeholder="e.g. Investment Banking Associate" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Bio / Professional Narrative</label>
                <textarea value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full p-6 rounded-3xl bg-slate-50 border-2 focus:border-blue-900 outline-none h-32" />
              </div>

              {isPro && (
                <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">Mentorship Capacity</h4>
                      <span className="text-2xl font-black text-blue-900">{formData.maxMeetingsPerWeek || 3} <span className="text-xs uppercase opacity-40">Chats / Week</span></span>
                   </div>
                   <input type="range" min="0" max="10" value={formData.maxMeetingsPerWeek || 3} onChange={e => setFormData({ ...formData, maxMeetingsPerWeek: parseInt(e.target.value) })} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-900" />
                </div>
              )}

              <button onClick={handleSave} disabled={isSaving} className="w-full py-5 bg-blue-950 text-white rounded-3xl font-black text-xs uppercase hover:bg-blue-800 transition shadow-xl active:scale-95">
                {isSaving ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : 'Synchronize Identity'}
              </button>
           </section>
        </div>
    </div>
  );
};

export default ProfileView;
