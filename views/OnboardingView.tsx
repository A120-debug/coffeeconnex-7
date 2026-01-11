


import React, { useState, useRef, useEffect } from 'react';
import { UserRole, MeetingPlatform, ONTARIO_UNIVERSITIES, CAMPUSES } from '../types.ts';
import { dbService } from '../services/dbService.ts';

const DEGREES = ["Undergraduate", "Graduate (Master's)", "Doctorate (PhD)", "Professional Degree"];

const MAJORS = [
  "Accounting",
  "Finance",
  "Software Engineering",
  "Computer Science",
  "Economics",
  "Product Design",
  "Data Science",
  "Marketing",
  "Human Resources",
  "Life Sciences",
  "Mechanical Engineering"
];

const OnboardingView = ({ user, onComplete }) => {
  const isStudent = user.role === UserRole.STUDENT;
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    preferredPlatform: MeetingPlatform.GOOGLE,
    school: ONTARIO_UNIVERSITIES[0],
    campus: CAMPUSES[ONTARIO_UNIVERSITIES[0]]?.[0] || "",
    degree: DEGREES[0],
    major: MAJORS[0],
    yearOfStudy: "1st Year",
    division: "",
    gradUniversity: ONTARIO_UNIVERSITIES[0]
  });
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const verifyCode = async () => {
    if (otp.some(digit => digit === '')) return;
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsVerified(true);
    setIsVerifying(false);
    setTimeout(() => setStep(1), 800);
  };

  const handleFinish = () => {
    if (isStudent) {
      dbService.saveStudentProfile({
        userId: user.id,
        ...formData,
        interests: (formData.interests || '').split(',').map(s => s.trim()),
        industries: (formData.industries || '').split(',').map(s => s.trim()),
        updatedAt: Date.now()
      });
    } else {
      dbService.saveProfessionalProfile({
        userId: user.id,
        fullName: user.fullName,
        ...formData,
        topics: (formData.topics || '').split(',').map(s => s.trim()),
        meetingsThisWeek: 0,
        maxMeetingsPerWeek: 3,
        updatedAt: Date.now()
      });
    }
    onComplete();
  };

  const studentSteps = [
    { title: "Verification", subtitle: `Enter the 6-digit code sent to ${user.email}`, icon: "fa-envelope-shield" },
    { title: "Academic Hub", subtitle: "Tell us about your current studies", icon: "fa-university" },
    { title: "Career Targets", subtitle: "What does success look like for you?", icon: "fa-rocket" }
  ];

  const profSteps = [
    { title: "Professional Footprint", subtitle: "Current company and domain", icon: "fa-briefcase" },
    { title: "Mentorship Focus", subtitle: "How can you help the next generation?", icon: "fa-sparkles" }
  ];

  const steps = isStudent ? studentSteps : profSteps;
  const currentStepData = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative font-sans">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-900/30">
         <div 
           className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-1000"
           style={{ width: `${((step + 1) / steps.length) * 100}%` }}
         ></div>
      </div>

      <div className="max-w-xl w-full bg-blue-900/20 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/5 shadow-3xl animate-in zoom-in duration-700 relative overflow-hidden">
         <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50/5 rounded-full blur-3xl"></div>
         
         <div className="text-center mb-12 relative z-10">
            <div className="w-20 h-20 bg-blue-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-2xl shadow-blue-950/40">
               {isVerified ? <i className="fas fa-check-circle text-green-400"></i> : <i className={`fas ${currentStepData.icon}`}></i>}
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-3 leading-none">{isVerified && step === 0 ? "Verified!" : currentStepData.title}</h2>
            <p className="text-blue-300 font-medium text-lg opacity-80">{currentStepData.subtitle}</p>
         </div>

         <div className="space-y-8 relative z-10">
            {isStudent && step === 0 && (
              <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="flex justify-center gap-3">
                   {otp.map((digit, i) => (
                     <input
                       key={i}
                       ref={el => { otpRefs.current[i] = el; }}
                       type="text"
                       maxLength={1}
                       value={digit}
                       onChange={e => handleOtpChange(e.target.value, i)}
                       onKeyDown={e => handleKeyDown(e, i)}
                       className="w-12 h-16 bg-white/5 border-2 border-white/10 rounded-2xl text-center text-2xl font-black text-blue-300 focus:border-blue-500 focus:bg-white/10 outline-none transition-all"
                       autoFocus={i === 0}
                     />
                   ))}
                 </div>
                 <button onClick={verifyCode} disabled={isVerifying || otp.some(d => !d) || isVerified} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${isVerified ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl'} disabled:opacity-50`}>
                   {isVerifying ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : null}
                   {isVerified ? "Access Granted" : "Secure Verification"}
                 </button>
              </div>
            )}

            {isStudent && step === 1 && (
               <div className="space-y-4 animate-in slide-in-from-right-10 duration-500">
                 <div className="space-y-2">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">University</p>
                   <select className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/5 outline-none focus:border-blue-500 font-bold" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value, campus: CAMPUSES[e.target.value]?.[0] || ""})}>
                     {ONTARIO_UNIVERSITIES.map(u => <option key={u} value={u} className="bg-blue-900">{u}</option>)}
                   </select>
                 </div>
                 
                 {CAMPUSES[formData.school] && (
                   <div className="space-y-2">
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Campus</p>
                     <select className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/5 outline-none focus:border-blue-500 font-bold" value={formData.campus} onChange={e => setFormData({...formData, campus: e.target.value})}>
                       {CAMPUSES[formData.school].map(c => <option key={c} value={c} className="bg-blue-900">{c}</option>)}
                     </select>
                   </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Degree Type</p>
                     <select className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/5 outline-none focus:border-blue-500 font-bold" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})}>
                       {DEGREES.map(d => <option key={d} value={d} className="bg-blue-900">{d}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Academic Major</p>
                     <select className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/5 outline-none focus:border-blue-500 font-bold" value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})}>
                       {MAJORS.map(m => <option key={m} value={m} className="bg-blue-900">{m}</option>)}
                     </select>
                   </div>
                 </div>
               </div>
            )}

            {isStudent && step === 2 && (
               <div className="space-y-4 animate-in slide-in-from-right-10 duration-500">
                 <textarea placeholder="Describe your career goals..." className="w-full p-6 rounded-3xl bg-white/5 border-2 border-white/5 h-36 outline-none resize-none focus:border-blue-500 font-medium" value={formData.goals || ''} onChange={e => setFormData({...formData, goals: e.target.value})} />
                 <input type="text" placeholder="Interests (e.g. Distributed Systems, FinTech)" className="w-full p-5 rounded-2xl bg-white/5 border-2 border-white/5 outline-none focus:border-blue-500 font-bold" value={formData.interests || ''} onChange={e => setFormData({...formData, interests: e.target.value})} />
               </div>
            )}

            {!isStudent && step === 0 && (
               <div className="space-y-4">
                 <input type="text" placeholder="Current Firm" className="w-full p-5 rounded-2xl bg-white/5 border-2 border-white/5 outline-none focus:border-blue-500 font-bold" value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} />
                 <input type="text" placeholder="Division (e.g. Engineering, Sales, IB)" className="w-full p-5 rounded-2xl bg-white/5 border-2 border-white/5 outline-none focus:border-blue-500 font-bold" value={formData.division || ''} onChange={e => setFormData({...formData, division: e.target.value})} />
                 <div className="space-y-2">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Alma Mater (Graduated From)</p>
                   <select className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/5 outline-none focus:border-blue-500 font-bold" value={formData.gradUniversity} onChange={e => setFormData({...formData, gradUniversity: e.target.value})}>
                     {ONTARIO_UNIVERSITIES.map(u => <option key={u} value={u} className="bg-blue-900">{u}</option>)}
                   </select>
                 </div>
               </div>
            )}

            {!isStudent && step === 1 && (
               <div className="space-y-8">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] px-2">Primary Meeting Hub</p>
                    <div className="grid grid-cols-2 gap-4">
                       {Object.values(MeetingPlatform).map(p => (
                         <button key={p} type="button" onClick={() => setFormData({...formData, preferredPlatform: p})} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${formData.preferredPlatform === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-blue-300/40'}`}>
                           {p}
                         </button>
                       ))}
                    </div>
                 </div>
                 <textarea placeholder="Mentorship Topics (e.g. Portfolio Reviews, Interview Prep)" className="w-full p-5 rounded-3xl bg-white/5 border-2 border-white/5 h-28 outline-none resize-none focus:border-blue-500 font-medium" value={formData.topics || ''} onChange={e => setFormData({...formData, topics: e.target.value})} />
               </div>
            )}
         </div>

         <div className="mt-14 flex gap-6 relative z-10">
            {step > 0 && (
               <button onClick={() => setStep(step - 1)} className="flex-1 py-5 text-blue-400 font-black uppercase text-xs tracking-widest hover:text-white transition">Back</button>
            )}
            <button 
              onClick={() => isLastStep ? handleFinish() : setStep(step + 1)} 
              disabled={isStudent && step === 0 && !isVerified}
              className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all disabled:opacity-30"
            >
               {isLastStep ? 'Complete Setup' : 'Continue'}
            </button>
         </div>
      </div>
    </div>
  );
};

export default OnboardingView;
