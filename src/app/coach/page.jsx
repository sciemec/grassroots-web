'use client';
import React, { useState, useContext } from 'react';
import { CoachSessionContext } from './context'; // Pointed directly to your isolated context file

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
        <div style={styles.brandContainer}>
          <h2 style={styles.sidebarHeader}>Grassroots Coach</h2>
          <p style={styles.sidebarSub}>Tactical Blueprint Suite</p>
        </div>
        
        {/* INTERACTIVE COMPILER TRIGGER LINK BUTTON */}
        <button 
          onClick={() => window.location.href = '/coach/create'} 
          style={styles.createBtn}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          ➕ Create Custom Session
        </button>

        <div style={styles.filterMenu}>
          <div style={styles.menuLabel}>TACTICAL FOCUS</div>
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
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Search drill metrics (e.g., press, 1v1, cross)..." 
              style={styles.searchBar}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Card Generation Layout Engine */}
        <div style={styles.cardsGrid}>
          {filteredSessions.length === 0 ? (
            <div style={styles.emptyNoticeContainer}>
              <div style={styles.emptyIcon}>📋</div>
              <div style={styles.emptyNotice}>No tactical blueprints match your current query parameters.</div>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.sessionId} style={styles.sessionCard}>
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <span style={styles.ageBadge}>{session.ageGroup || 'U14-Boys'}</span>
                    <span style={styles.focusLabel}>{session.category || session.theme}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{session.title}</h3>
                  <p style={styles.cardOverview} title={session.overview}>{session.overview}</p>
                  
                  <div style={styles.timelineHeaderRow}>
                    <span style={styles.timelineHeaderTitle}>📦 Session Timeline Grid</span>
                    <span style={styles.drillCountTag}>{session.drills ? `${session.drills.length} Stages` : '0 Stages'}</span>
                  </div>
                  
                  {/* Loops inside the drills array structure parsed straight out of JSON */}
                  <div style={styles.timelineContainer}>
                    {session.drills && session.drills.map((drill, index) => (
                      <div key={index} style={styles.timelineItem}>
                        <div style={styles.timelineLine}></div>
                        <div style={styles.timelineBubble}>{drill.part || (index + 1)}</div>
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
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#111827'}
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

// Layout style sheets object model matrix (Enhanced for micro-spacing and clean scannability)
const styles = {
  pageLayout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  sidebar: { width: '280px', backgroundColor: '#0f172a', padding: '32px 24px', color: '#ffffff', display: 'flex', flexDirection: 'column', boxShading: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRight: '1px solid #1e293b' },
  brandContainer: { marginBottom: '28px' },
  sidebarHeader: { fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.5px', color: '#f8fafc' },
  sidebarSub: { fontSize: '12px', color: '#38bdf8', margin: '0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  createBtn: { backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '14px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', width: '100%', marginBottom: '32px', fontSize: '14px', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' },
  filterMenu: { display: 'flex', flexDirection: 'column', gap: '6px' },
  menuLabel: { fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' },
  filterBtn: { textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.15s ease' },
  activeFilterBtn: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#3b82f6', border: 'none', color: '#ffffff', fontSize: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' },
  contentArea: { flex: 1, padding: '40px', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' },
  topNavbar: { marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  searchWrapper: { position: 'relative', width: '100%', maxWidth: '540px', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '16px', fontSize: '14px', color: '#94a3b8' },
  searchBar: { width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#ffffff', color: '#0f172a', transition: 'all 0.15s ease', outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '28px' },
  sessionCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '440px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  cardContent: { display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  ageBadge: { backgroundColor: '#e2f5ea', color: '#0f766e', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' },
  focusLabel: { fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardTitle: { fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', lineHeight: '1.3', letterSpacing: '-0.3px' },
  cardOverview: { fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px 0', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' },
  timelineHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' },
  timelineHeaderTitle: { fontSize: '12px', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  drillCountTag: { fontSize: '11px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' },
  timelineContainer: { marginLeft: '8px', paddingLeft: '20px', marginTop: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' },
  timelineItem: { position: 'relative', display: 'flex', alignItems: 'flex-start' },
  timelineLine: { position: 'absolute', left: '-21px', top: '20px', bottom: '-24px', width: '2px', backgroundColor: '#cbd5e1', opacity: '0.4' },
  timelineBubble: { position: 'absolute', left: '-27px', top: '2px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#ffffff', fontSize: '9px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: '0 0 0 4px #ffffff' },
  timelineBody: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' },
  drillMetaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  drillName: { fontSize: '13px', fontWeight: '700', color: '#1e293b' },
  scaleTag: { fontSize: '10px', backgroundColor: '#f8fafc', color: '#64748b', padding: '2px 6px', borderRadius: '5px', fontWeight: '600', border: '1px solid #e2e8f0' },
  dimensionTag: { fontSize: '11px', color: '#2563eb', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' },
  launchBtn: { width: '100%', backgroundColor: '#111827', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '20px', transition: 'background-color 0.15s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  emptyNoticeContainer: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' },
  emptyIcon: { fontSize: '32px', marginBottom: '12px', opacity: 0.7 },
  emptyNotice: { color: '#64748b', fontSize: '14px', fontWeight: '500', fontStyle: 'italic', textAlign: 'center' }
};