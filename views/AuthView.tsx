
import React, { useState } from 'react';
import { dbService } from '../services/dbService.ts';
import { User, UserRole, SubscriptionTier } from '../types.ts';
import Logo from '../components/Logo.tsx';

interface AuthViewProps {
  mode: 'login' | 'register';
  onSuccess: (user: User) => void;
  onToggle: () => void;
  onBack: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ mode, onSuccess, onToggle, onBack }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [error, setError] = useState('');

  const isUniversityEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    const genericProviders = [
      'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 
      'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com', 'yandex.com'
    ];
    const isAcademic = domain.endsWith('.edu') || domain.endsWith('.ac.uk') || domain.endsWith('.edu.au') || domain.endsWith('.edu.ca');
    const isInstitutional = !genericProviders.includes(domain) && domain.split('.').length >= 2;
    return isAcademic || isInstitutional;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (role === UserRole.STUDENT && !isUniversityEmail(email)) {
        setError('Verification requires an academic email (e.g., .edu). Personal emails are restricted for students.');
        return;
      }

      if (dbService.findUserByEmail(email)) {
        setError('This email is already associated with an account.');
        return;
      }
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        fullName,
        role,
        tier: SubscriptionTier.BASIC,
        createdAt: Date.now()
      };
      dbService.saveUser(newUser);
      dbService.setCurrentUser(newUser);
      onSuccess(newUser);
    } else {
      const user = dbService.findUserByEmail(email);
      if (!user) {
        setError('Invalid credentials or account does not exist.');
        return;
      }
      dbService.setCurrentUser(user);
      onSuccess(user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 font-sans">
      <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] shadow-3xl border border-slate-100 animate-in zoom-in-95 duration-500">
        
        <div className="text-center mb-12 flex flex-col items-center">
          <Logo variant="dark" className="mb-6 scale-125 origin-center" />
          <h2 className="text-4xl font-black text-blue-950 tracking-tighter">{mode === 'login' ? 'Welcome Back' : 'Get Connected'}</h2>
          <p className="text-slate-500 mt-2 font-medium">{mode === 'login' ? 'Access your mentorship radar.' : 'Verify your academic status to start.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Identity</label>
                <input 
                  type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-900 outline-none transition font-bold text-blue-950"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button 
                  type="button" onClick={() => setRole(UserRole.STUDENT)}
                  className={`py-4 rounded-2xl border-2 font-black transition text-xs uppercase tracking-widest ${role === UserRole.STUDENT ? 'bg-blue-900 border-blue-900 text-white shadow-xl shadow-blue-900/20' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-100'}`}
                >
                  Student
                </button>
                <button 
                  type="button" onClick={() => setRole(UserRole.PROFESSIONAL)}
                  className={`py-4 rounded-2xl border-2 font-black transition text-xs uppercase tracking-widest ${role === UserRole.PROFESSIONAL ? 'bg-blue-900 border-blue-900 text-white shadow-xl shadow-blue-900/20' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-100'}`}
                >
                  Professional
                </button>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              {role === UserRole.STUDENT && mode === 'register' ? 'University Email (.edu)' : 'Work Email'}
            </label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-900 outline-none transition font-bold text-blue-950"
              placeholder={role === UserRole.STUDENT && mode === 'register' ? "you@university.edu" : "jane@company.com"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-900 outline-none transition font-bold text-blue-950"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in shake duration-300">
              <i className="fas fa-exclamation-triangle text-base"></i>
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-5 bg-blue-950 text-white rounded-2xl font-black text-lg hover:bg-blue-900 transition-all shadow-2xl shadow-blue-950/10 mt-6 active:scale-[0.98]"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-12 pt-10 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-sm font-medium">
            {mode === 'login' ? "New to the platform?" : "Already verified?"}
            <button onClick={onToggle} className="text-blue-900 font-black ml-2 hover:underline">
              {mode === 'login' ? 'Register Now' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
