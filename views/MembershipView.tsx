
import React, { useState } from 'react';
import { dbService } from '../services/dbService.ts';
import { SubscriptionTier, User } from '../types.ts';

const MembershipView = ({ user, onChangeTab, activeTab = 'membership' }: { user: User, onChangeTab: (tab: string) => void, activeTab?: string }) => {
  const [currentTier, setCurrentTier] = useState(user.tier);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const plans = [
    { id: SubscriptionTier.BASIC, name: 'Basic', price: 'Free', features: ['3 Matches/mo', 'Basic AI'] },
    { id: SubscriptionTier.STANDARD, name: 'Standard', price: '$14.99', features: ['6 Matches/mo', 'radar Access'] },
    { id: SubscriptionTier.ADVANCED, name: 'Advanced', price: '$24.99', features: ['20 Matches/mo', 'AI Strategist'] }
  ];

  const handleUpdate = (tier: SubscriptionTier) => {
    setIsProcessing(tier);
    setTimeout(() => {
      dbService.saveUser({ ...user, tier, updatedAt: Date.now() });
      setCurrentTier(tier);
      setIsProcessing(null);
      alert(`Membership upgraded to ${tier}.`);
    }, 1200);
  };

  return (
    <div className="p-12 lg:p-20 bg-slate-50/30 min-h-screen">
        <header className="mb-16 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-black text-blue-950 tracking-tighter">Membership.</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div key={plan.id} className={`p-10 rounded-[3.5rem] bg-white border shadow-2xl flex flex-col ${currentTier === plan.id ? 'border-blue-600 ring-4 ring-blue-600/10' : 'border-slate-100'}`}>
              <h3 className="text-3xl font-black text-blue-950 mb-2">{plan.name}</h3>
              <p className="text-4xl font-black text-blue-900 mb-8">{plan.price}</p>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((f, i) => <li key={i} className="text-sm font-medium text-slate-600"><i className="fas fa-check text-blue-600 mr-2"></i>{f}</li>)}
              </ul>
              <button onClick={() => handleUpdate(plan.id as SubscriptionTier)} disabled={currentTier === plan.id || !!isProcessing} className="w-full py-5 bg-blue-950 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 disabled:opacity-20">
                {isProcessing === plan.id ? 'Processing...' : currentTier === plan.id ? 'Active' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
    </div>
  );
};

export default MembershipView;
