'use client';
import React, { useState, useContext } from 'react';
import { CoachSessionContext } from './layout'; // Connected straight to your live dynamic layout context

export default function CoachDashboard() {
  const { sessions } = useContext(CoachSessionContext); // Subscribed to dynamic local storage array registry
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Data Processing Pipeline: Dynamically filters both default FIFA plans and custom academy templates
  const filteredSessions = sessions ? sessions.filter(session => {
    // Determine the focus tag safely depending on whether it's a default or custom blueprint object
    const sessionFocus = session.focus || (session.theme && session.theme.toLowerCase().includes('defend') ? 'Defending' : 'Attacking');
    
    const matchesCategory = activeFilter === 'ALL' || 
                            sessionFocus.toUpperCase() === activeFilter.toUpperCase();
                            
    const matchesSearch = (session.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (session.overview || '').toLowerCase().includes(searchTerm.toLowerCase());
                          
    return matchesCategory && matchesSearch;
  }) : [];

  return (
    <div style={styles.pageLayout}>
      {/* SIDEBAR FILTER NAVIGATION PANEL */}
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarHeader}>Grassroots Coach</h2>
        <p style={styles.sidebarSub}>Tactical Blueprint Suite</p>
        
        {/* INTERACTIVE COMPILER TRIGGER LINK BUTTON */}
        <button 
          onClick={() => window.location.href = '/coach/create'} 
          style={styles.createBtn}
        >
          ➕ Create Custom Session
        </button>

        <div style={styles.filterMenu}>
          <button 
            style={activeFilter === 'ALL' ? styles.activeFilterBtn : styles.filterBtn}
            onClick={() => setActiveFilter('ALL')}
          >
            📋 All Master Sessions
          </button>
          <button 
            style={activeFilter === 'ATTACKING' ? styles.activeFilterBtn : styles.filterBtn}
            onClick={() => setActiveFilter('ATTACKING')}
          >
            🔥 Attacking Focus
          </button>
          <button 
            style={activeFilter === 'DEFENDING' ? styles.activeFilterBtn : styles.filterBtn}
            onClick={() => setActiveFilter('DEFENDING')}
          >
            🛡️ Defensive Blocks
          </button>
        </div>
      </div>

      {/* CORE CARDS CONTENT GRID WORKSPACE */}
      <div style={styles.contentArea}>
        <div style={styles.topNavbar}>
          <input 
            type="text" 
            placeholder="Search drill metrics (e.g., press, 1v1, cross)..." 
            style={styles.searchBar}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dynamic Card Generation Layout Engine */}
        <div style={styles.cardsGrid}>
          {filteredSessions.length === 0 ? (
            <div style={styles.emptyNotice}>No tactical blueprints match your current query parameters.</div>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.sessionId} style={styles.sessionCard}>
                <div>
                  <div style={styles.cardHeader}>
                    <span style={styles.ageBadge}>{session.ageGroup || 'U14-Boys'}</span>
                    <span style={styles.focusLabel}>{session.category || session.theme}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{session.title}</h3>
                  <p style={styles.cardOverview}>{session.overview}</p>
                  
                  <span style={{ fontSize: '13px', color: '#4b5563', fontWeight: 'bold' }}>
                    📦 Session Timeline Grid:
                  </span>
                  
                  {/* Loops inside the drills array structure parsed straight out of JSON */}
                  <div style={styles.timelineContainer}>
                    {session.drills && session.drills.map((drill, index) => (
                      <div key={index} style={styles.timelineItem}>
                        <div style={styles.timelineBubble}>{drill.part}</div>
                        <div style={styles.timelineBody}>
                          <div style={styles.drillMetaRow}>
                            <span style={styles.drillName}>{drill.name || 'Tactical Drill Vector'}</span>
                            <span style={styles.scaleTag}>{drill.scale || 'Unit Level'}</span>
                          </div>
                          <span style={styles.dimensionTag}>
                            📏 Boundaries: {drill.dimensions || (drill.gridDimensions ? `${drill.gridDimensions.width}m x ${drill.gridDimensions.length}m` : 'Flexible')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct window query link trigger mapping into PitchPro whiteboard board canvas */}
                <button 
                  style={styles.launchBtn}
                  onClick={() => window.location.href = `/coach/pitchpro-canvas?session=${session.sessionId}`}
                >
                  Launch PitchPro Board Engine
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Layout style sheets object model matrix
const styles = {
  pageLayout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Segoe UI, Roboto, sans-serif' },
  sidebar: { width: '280px', backgroundColor: '#1e3a8a', padding: '30px 20px', color: '#ffffff', boxShadow: '4px 0 10px rgba(0,0,0,0.05)' },
  sidebarHeader: { fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '0.5px' },
  sidebarSub: { fontSize: '13px', color: '#93c5fd', margin: '0 0 25px 0', fontWeight: '500' },
  createBtn: { backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '12px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginBottom: '25px', fontSize: '14px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' },
  filterMenu: { display: 'flex', flexDirection: 'column', gap: '10px' },
  filterBtn: { textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', color: '#bfdbfe', fontSize: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
  activeFilterBtn: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#2563eb', border: 'none', color: '#ffffff', fontSize: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  contentArea: { flex: 1, padding: '30px', overflowY: 'auto' },
  topNavbar: { marginBottom: '25px' },
  searchBar: { width: '100%', maxWidth: '500px', padding: '12px 18px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#ffffff' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '25px' },
  sessionCard: { backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '380px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  ageBadge: { backgroundColor: '#10b981', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '5px' },
  focusLabel: { fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0', lineHeight: '1.3' },
  cardOverview: { fontSize: '13px', color: '#4b5563', lineHeight: '1.5', margin: '0 0 20px 0', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  timelineContainer: { borderLeft: '2px dashed #cbd5e1', marginLeft: '10px', paddingLeft: '15px', marginTop: '12px', marginBottom: '25px' },
  timelineItem: { position: 'relative', marginBottom: '15px' },
  timelineBubble: { position: 'absolute', left: '-23px', top: '2px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '9px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  timelineBody: { display: 'flex', flexDirection: 'column', gap: '2px' },
  drillMetaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
  drillName: { fontSize: '13px', fontWeight: '600', color: '#1f2937' },
  scaleTag: { fontSize: '9px', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 5px', borderRadius: '4px', fontWeight: '500' },
  dimensionTag: { fontSize: '11px', color: '#3b82f6', fontWeight: '500' },
  launchBtn: { width: '100%', backgroundColor: '#111827', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px', transition: 'background-color 0.2s' },
  emptyNotice: { color: '#6b7280', fontSize: '14px', fontStyle: 'italic', gridColumn: '1 / -1', padding: '20px 0' }
};