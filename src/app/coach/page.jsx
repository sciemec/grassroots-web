'use client';
import React, { useState, useContext } from 'react';
import { CoachSessionContext } from './layout'; // Import our context hook straight from layout

const CoachDashboard = () => {
  const { sessions } = useContext(CoachSessionContext); // Connect directly to our active dynamic registry stream
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  <button 
  onClick={() => window.location.href = '/coach/create'} 
  style={{
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '20px'
  }}
>
  ➕ Create Custom Session
</button>

  // The rest of your filtering logic operates seamlessly on the context array!
  const filteredSessions = sessions.filter(session => {
    const matchesCategory = activeFilter === 'ALL' || session.focus.toUpperCase() === activeFilter;
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    // Keep your return UI layout structure exactly the same...