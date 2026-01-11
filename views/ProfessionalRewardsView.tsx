
import React, { useState } from 'react';
import { dbService } from '../services/dbService.ts';

const ProfessionalRewardsView = ({ user }) => {
  const profile = dbService.getProfessionalProfile(user.id);
  const categories = [
    { 
      name: "Professional Development", 
      icon: "fa-graduation-cap", 
      items: [
        { id: 'masterclass', title: 'Masterclass Sub', points: 1000, desc: "1 Year Annual Membership" },
        { id: 'cert', title: 'AWS/GCP Cert Voucher', points: 1500, desc: "Standard Exam Fee" }
      ] 
    },
    { 
      name: "Charity & Impact", 
      icon: "fa-hand-holding-heart", 
      items: [
        { id: 'charity_100', title: 'Donate $100', points: 500, desc: "To Doctors Without Borders" },
        { id: 'planting', title: 'Plant 100 Trees', points: 300, desc: "Eco-Restoration Fund" }
      ] 
    },
    { 
      name: "Personal Spending", 
      icon: "fa-coffee", 
      items: [
        { id: 'starbucks', title: '$50 Gift Card', points: 400, desc: "Starbucks / Amazon / Uber" },
        { id: 'tech', title: 'Noise-Cancelling Headphones', points: 5000, desc: "Sony WH-1000XM5" }
      ] 
    }
  ];

  return (
    <div className="p-12 lg:p-20 bg-slate-50/30 min-h-screen">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 block">Value Accrual Hub</span>
            <h1 className="text-5xl font-black text-blue-950 tracking-tighter">Marketplace.</h1>
          </div>
          <div className="p-8 bg-blue-950 text-white rounded-3xl flex items-center gap-6 shadow-2xl">
             <i className="fas fa-coins text-amber-500 text-3xl"></i>
             <div>
                <p className="text-[10px] font-black uppercase opacity-60">Balance Protocol</p>
                <p className="text-2xl font-black">{profile?.points || 0} Points</p>
             </div>
          </div>
        </header>

        <div className="space-y-16">
           {categories.map((cat, i) => (
             <section key={i}>
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-900"><i className={`fas ${cat.icon}`}></i></div>
                   <h2 className="text-xl font-black text-blue-950 tracking-tight">{cat.name}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {cat.items.map(item => (
                     <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col group hover:border-blue-500 transition-all">
                        <h3 className="text-lg font-black text-blue-950 mb-1">{item.title}</h3>
                        <p className="text-xs text-slate-400 font-medium mb-6">{item.desc}</p>
                        <div className="mt-auto flex items-center justify-between">
                           <span className="text-sm font-black text-blue-600">{item.points} Pts</span>
                           <button disabled className="px-6 py-2 bg-slate-50 text-slate-300 rounded-xl text-[10px] font-black uppercase">Redeem</button>
                        </div>
                     </div>
                   ))}
                </div>
             </section>
           ))}
        </div>
    </div>
  );
};

export default ProfessionalRewardsView;
