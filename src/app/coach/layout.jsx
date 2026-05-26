'use client';
import React, { useState, useEffect } from 'react';
import { CoachSessionContext } from './context'; // Import from the new isolated file
import { initialFifaSessions } from '../../data/fifaSessions';

export default function CoachLayout({ children }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('grassroots_tactical_blueprints');
    if (saved) {
      setSessions(JSON.parse(saved));
    } else {
      setSessions(initialFifaSessions);
    }
  }, []);

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