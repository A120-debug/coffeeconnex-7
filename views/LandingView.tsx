
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import Logo from '../components/Logo.tsx';

interface LandingProps {
  onGetStarted: () => void;
  onDemo: () => void;
}

const LandingView: React.FC<LandingProps> = ({ onGetStarted, onDemo }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const reassuringMessages = [
    "Sage is storyboarding the user journey...",
    "Generating professional environments...",
    "Simulating Sage interactions...",
    "Rendering career radar analytics...",
    "Finalizing high-fidelity meeting visuals...",
    "Polishing the cinematic transition..."
  ];

  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      let idx = 0;
      setLoadingMessage(reassuringMessages[0]);
      interval = window.setInterval(() => {
        idx = (idx + 1) % reassuringMessages.length;
        setLoadingMessage(reassuringMessages[idx]);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const generateTourVideo = async () => {
    try {
      // Safety check for window.aistudio
      // @ts-ignore
      if (typeof window !== 'undefined' && window.aistudio) {
        // @ts-ignore
        if (typeof window.aistudio.hasSelectedApiKey === 'function' && !(await window.aistudio.hasSelectedApiKey())) {
           // @ts-ignore
           await window.aistudio.openSelectKey();
        }
      }
      
      setIsGenerating(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `A cinematic split-screen montage in a high-end corporate aesthetic. 
      On the left: A diverse university student in a bright, modern library setting up a profile on a sleek platform. Floating UI shows 'Sage' drafting a respectful outreach message.
      On the right: A seasoned professional in a glass-walled skyscraper office receiving a prioritized notification. 
      Center: The two connect on a clear video call with blue holographic AI talking points floating on the student's screen.
      The video ends with a 'Success' notification and a 'Follow-up' reminder appearing. 
      Lighting is crisp white and deep professional blue. Professional, inspiring, and high-tech.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setVideoUrl(`${downloadLink}&key=${process.env.API_KEY}`);
      }
    } catch (error: any) {
      console.error("Video generation failed:", error);
      const errorStr = JSON.stringify(error);
      const errorMessage = error.message || "";
      const isEntityNotFound = errorStr.includes("Requested entity was not found") || errorMessage.includes("Requested entity was not found") || errorStr.includes("404");
      
      // Only attempt to open key selector if we are in an environment that supports it
      // @ts-ignore
      if (isEntityNotFound && typeof window !== 'undefined' && window.aistudio) {
        // @ts-ignore
        try { await window.aistudio.openSelectKey(); } catch (e) { console.error(e); }
      } else {
        alert("AI Video generation encountered an error. Please ensure your API key is valid.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden font-sans">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-slate-100">
        <Logo variant="dark" />
        <div className="flex items-center gap-6">
           <button onClick={onDemo} className="text-sm font-black text-blue-600 uppercase tracking-widest hover:underline">Launch Demo</button>
           <button 
             onClick={onGetStarted}
             className="px-6 py-2 rounded-full font-bold text-blue-900 border-2 border-blue-900 hover:bg-blue-50 transition"
           >
             Sign In
           </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="text-center relative z-10 max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 mb-8">
            🌐 Next-Gen AI Mentorship Protocol
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]">
            Professional <br/>
            <span className="text-blue-900">Synergy.</span>
          </h1>
          <p className="text-xl text-slate-600 mb-12 leading-relaxed font-medium">
            Bridging academia and industry through AI-orchestrated coffee chats. Verified mentors from Stripe, Google, and Anthropic.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24">
            <button 
              onClick={onDemo}
              className="w-full sm:w-auto px-12 py-5 bg-blue-900 text-white rounded-2xl font-black text-lg hover:bg-blue-800 shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 flex items-center justify-center gap-4"
            >
              <i className="fas fa-play"></i>
              Launch Live Demo
            </button>
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-12 py-5 bg-white text-blue-900 border-2 border-slate-200 rounded-2xl font-black text-lg hover:bg-slate-50 transition"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* AI Video Journey Section */}
        <div className="mb-32 max-w-5xl mx-auto">
          <div className="bg-slate-900 rounded-[3rem] overflow-hidden shadow-3xl relative min-h-[500px] flex items-center justify-center">
            {!videoUrl && !isGenerating ? (
              <div className="p-16 text-center">
                <div className="w-24 h-24 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-xl shadow-blue-500/20">
                  <i className="fas fa-film"></i>
                </div>
                <h2 className="text-3xl font-black text-white mb-4">See the Sage Experience</h2>
                <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
                  Generate a cinematic preview of how Sage transforms your networking lifecycle.
                </p>
                <div className="space-y-4">
                  <button 
                    onClick={generateTourVideo}
                    className="px-10 py-4 bg-white text-blue-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition flex items-center gap-3 mx-auto"
                  >
                    <i className="fas fa-sparkles text-blue-600"></i>
                    Generate AI Product Tour
                  </button>
                </div>
              </div>
            ) : isGenerating ? (
              <div className="p-16 text-center animate-in fade-in duration-500">
                <div className="relative w-24 h-24 mx-auto mb-10">
                  <div className="absolute inset-0 border-4 border-blue-900/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-white rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-brain text-white text-2xl animate-pulse"></i>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Cinematic Synthesis</h3>
                <p className="text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em] h-4">
                  {loadingMessage}
                </p>
              </div>
            ) : (
              <video 
                src={videoUrl || ""} 
                controls 
                autoPlay 
                loop
                className="w-full h-full object-cover animate-in fade-in duration-1000"
              />
            )}
          </div>
        </div>

        {/* Features Matrix */}
        <div className="py-24 border-t border-slate-100">
           <div className="max-w-4xl mx-auto text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black text-blue-950 tracking-tighter mb-6">The Coffee Chat, Reimagined.</h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">We've automated the friction out of networking. No more ghosting, no more "what do I say?", and no more lost connections.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="group">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 group-hover:bg-blue-900 group-hover:text-white transition-all duration-500">
                    <i className="fas fa-pen-nib"></i>
                 </div>
                 <h3 className="text-xl font-bold text-blue-950 mb-4">Zero-Effort Outreach</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">Sage drafts the perfect request message based on your profile and the mentor's specific career markers.</p>
              </div>
              <div className="group">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 group-hover:bg-blue-900 group-hover:text-white transition-all duration-500">
                    <i className="fas fa-robot"></i>
                 </div>
                 <h3 className="text-xl font-bold text-blue-950 mb-4">Automated Follow-ups</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">Sage monitors your network health and drafts warm check-ins every 30 days to keep your mentors engaged.</p>
              </div>
              <div className="group">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 group-hover:bg-blue-900 group-hover:text-white transition-all duration-500">
                    <i className="fas fa-ranking-star"></i>
                 </div>
                 <h3 className="text-xl font-bold text-blue-950 mb-4">Smart Inbound Sorting</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">Mentors see inbound requests ranked by relevance. We ensure the right student meets the right professional.</p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default LandingView;
