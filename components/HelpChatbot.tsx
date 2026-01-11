
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const HelpChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hi! I am Sage, your CoffeeConnex Assistant. How can I help you navigate your career journey today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are Sage, a helpful customer support bot for CoffeeConnex. 
        CoffeeConnex is a mentorship platform.
        Rules:
        - Students have 3 tiers: Basic (Free), Standard ($14.99), Advanced ($24.99).
        - Contact Email: support@coffeeconnex.ai
        User Question: ${userMsg}`,
      });

      setMessages(prev => [...prev, { role: 'bot', text: response.text || "I'm having trouble connecting right now." }]);
    } catch (error: any) {
      const isRateLimit = error?.message?.includes("429") || error?.status === 429;
      const botMsg = isRateLimit 
        ? "I'm receiving too many requests right now. Please try again in a few seconds, or email support@coffeeconnex.ai for urgent help."
        : "Sorry, I encountered an unexpected error. Please email support@coffeeconnex.ai";
      setMessages(prev => [...prev, { role: 'bot', text: botMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[100] border-4 border-white"
      >
        <i className="fas fa-comment-dots text-2xl"></i>
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-8 w-96 h-[500px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden z-[100] animate-in slide-in-from-bottom-10 duration-300">
      <div className="p-6 bg-blue-950 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-xs"></i>
          </div>
          <span className="font-black text-sm uppercase tracking-widest">Sage</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none animate-pulse flex gap-2">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 bg-slate-50 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20"
        />
        <button 
          onClick={handleSend}
          className="w-12 h-12 bg-blue-900 text-white rounded-xl flex items-center justify-center hover:bg-blue-800 transition shadow-lg shadow-blue-900/10"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default HelpChatbot;
