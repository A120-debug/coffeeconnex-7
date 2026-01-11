
import React, { useState } from 'react';
import { dbService } from '../services/dbService.ts';
import { ChatRequest, User, UserRole } from '../types.ts';

const CalendarView = ({ user, onLogout, onChangeTab, activeTab = 'calendar' }) => {
  const requests = dbService.getRequestsForUser(user.id, user.role);
  const scheduled = requests.filter(r => r.scheduledTime);
  const allUsers = dbService.getUsers();

  return (
    <div className="p-12 lg:p-20 bg-slate-50/50 min-h-screen">
        <header className="mb-16">
          <h1 className="text-6xl font-black text-blue-950 tracking-tighter leading-none">Agenda.</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           <section className="lg:col-span-2 space-y-6">
              {scheduled.length === 0 ? (
                <div className="bg-white p-20 rounded-[4rem] border border-dashed border-slate-200 text-center opacity-40">No calls scheduled.</div>
              ) : (
                scheduled.map(req => {
                  const partner = allUsers.find(u => u.id === req.studentId);
                  const date = new Date(req.scheduledTime!);
                  return (
                    <div key={req.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex items-center justify-between">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-blue-950 text-white rounded-2xl flex flex-col items-center justify-center font-black">
                             <span className="text-xl">{date.getDate()}</span>
                          </div>
                          <div>
                             <p className="font-black text-blue-950 text-lg">{partner?.fullName}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                       </div>
                    </div>
                  );
                })
              )}
           </section>
        </div>
    </div>
  );
};

export default CalendarView;
