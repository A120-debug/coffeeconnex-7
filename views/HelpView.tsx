
import React, { useState } from 'react';
import { UserRole, SubscriptionTier } from '../types.ts';

const HelpView = ({ user, onChangeTab, activeTab = 'help' }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    { q: "How do I get more matches?", a: "Matches are refreshed monthly. Higher subscription tiers grant significantly more match requests." },
    { q: "What are points used for?", a: "Professionals earn points per completed call to redeem for rewards." },
    { q: "How long are coffee chats?", a: "Typically 30 minutes." }
  ];

  return (
    <div className="p-12 lg:p-20 bg-slate-50/30 min-h-screen overflow-y-auto">
        <header className="mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 block">Knowledge Base</span>
          <h1 className="text-5xl font-black text-blue-950 tracking-tighter">Help Hub.</h1>
        </header>

        <div className="max-w-4xl space-y-12">
           <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl">
              <h2 className="text-2xl font-black text-blue-950 tracking-tight mb-8">Platform Manifesto</h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                CoffeeConnex replaces random networking with an automated, high-fidelity mentorship lifecycle.
              </p>
           </section>

           <section className="space-y-6">
              <h2 className="text-2xl font-black text-blue-950 tracking-tighter">FAQs</h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
                    <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full p-8 text-left flex justify-between items-center">
                      <span className="font-bold text-blue-950">{faq.q}</span>
                      <i className={`fas fa-chevron-down transition-transform ${activeFaq === i ? 'rotate-180' : ''}`}></i>
                    </button>
                    {activeFaq === i && <div className="p-8 bg-slate-50 text-slate-600 font-medium text-sm leading-relaxed border-t border-slate-100">{faq.a}</div>}
                  </div>
                ))}
              </div>
           </section>
        </div>
    </div>
  );
};

export default HelpView;
