'use client';
import React, { createContext, useState, useEffect } from 'react';
import { initialFifaSessions } from '../../data/fifaSessions';

// 1. Create a global Context Provider matrix layer
export const CoachSessionContext = createContext();

export default function CoachLayout({ children }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Check if the coach has previously saved custom academy metrics locally
    const saved = localStorage.getItem('grassroots_tactical_blueprints');
    if (saved) {
      setSessions(JSON.parse(saved));
    } else {
      // If none exist, fall back to our default parsed PDF files
      setSessions(initialFifaSessions);
    }
  }, []);

  // 2. Functional data pipeline to append new blueprints and persist them safely
  const addCustomSession = (newSession) => {
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    localStorage.setItem('grassroots_tactical_blueprints', JSON.stringify(updatedSessions));
  };

  return (
    <CoachSessionContext.Provider value={{ sessions, addCustomSession }}>
      {children}
    </CoachSessionContext.Provider>
  );
}