'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { ArrowLeft, PlusCircle, Users } from 'lucide-react';

const COLORS = {
  bg: "#f4f2ee",
  primary: "#1a5c2a",
  accent: "#c8962a",
  border: "#e5e7eb"
};

export default function CreateSquadOrSession() {
  // Grab user details cleanly from global store instead of broken layout context
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');

  return (
    <div style={{ backgroundColor: COLORS.bg }} className="min-h-screen text-gray-900 font-sans antialiased pb-12">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 shadow-sm">
        <div className="max-w-4xl mx-auto h-full px-4 flex items-center justify-between">
          <Link href="/coach" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
          </Link>
          <div style={{ color: COLORS.primary }} className="text-sm font-black uppercase tracking-wider">
            Creation Studio
          </div>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 mt-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-center space-x-3 mb-6">
            <PlusCircle size={24} style={{ color: COLORS.primary }} />
            <h1 className="text-xl font-black tracking-tight text-gray-900">Create New Module Layout</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item Name or Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Under-15 Selection Roster" 
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-green-700 transition"
              />
            </div>

            <button 
              style={{ backgroundColor: COLORS.primary }}
              className="w-full font-bold text-sm text-white py-3 px-4 rounded-xl shadow-sm hover:opacity-90 transition mt-4"
            >
              Initialize Component
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}