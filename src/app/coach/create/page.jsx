
'use client';
import React, { useState, useContext } from 'react';
import { CoachSessionContext } from '../layout'; // Pull our shared layout state manager

export default function CreateTacticalSession() {
  const { addCustomSession } = useContext(CoachSessionContext);
  const [title, setTitle] = useState('');
  const [ageGroup, setAgeGroup] = useState('U14-Boys');
  const [category, setCategory] = useState('Attacking');
  const [overview, setOverview] = useState('');
  const [drills, setDrills] = useState([]);

  const handleAddDrill = () => {
    setDrills([...drills, { part: drills.length + 1, name: '', scale: 'Unit Level', dimensions: '', keyFocus: '' }]);
  };

  const handleSaveSession = (e) => {
    e.preventDefault();
    
    // Assemble our structured session blueprint JSON format
    const newSessionSchema = {
      sessionId: `ACADEMY-BLUEPRINT-${Date.now()}`,
      title,
      ageGroup,
      category: `${category} / Custom Academy`,
      focus: category,
      overview: overview || "Custom tactical configuration designed locally via platform parameters.",
      drills
    };

    // Commit straight to our global array context layer
    addCustomSession(newSessionSchema);
    
    alert("Blueprint compiled successfully! Saved directly to local workspace registry.");
    window.location.href = '/coach';
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', color: '#111827' }}>
      <h2 style={{ color: '#1e3a8a', marginBottom: '5px' }}>Compile Academy Tactical Blueprint</h2>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '25px' }}>Format training matrices into structural JSON configuration parameters.</p>
      
      <form onSubmit={handleSaveSession} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={styles.label}>Session Blueprint Title</label>
          <input type="text" placeholder="e.g., Overloading Wide Channels on Transitions" style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Age Target Bracket</label>
            <select style={styles.input} value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
              <option value="U11-Juniors">U11 Juniors</option>
              <option value="U14-Boys">U14 Boys Group</option>
              <option value="U17-Academy">U17 Elite Academy</option>
              <option value="U23-Womens">U23 Select Squad</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Strategic Focus Theme</label>
            <select style={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Attacking">Attacking Principles</option>
              <option value="Defending">Defending Structures</option>
            </select>
          </div>
        </div>

        <div>
          <label style={styles.label}>Strategic Overview Summary</label>
          <textarea placeholder="Describe tactical goals..." style={{ ...styles.input, height: '70px', resize: 'none' }} value={overview} onChange={(e) => setOverview(e.target.value)} />
        </div>

        {drills.map((drill, index) => (
          <div key={index} style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '10px', border: '1px solid #e5e7eb', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong style={{ fontSize: '14px', color: '#1e3a8a' }}>PART {drill.part} CONFIGURATION VECTOR</strong>
              <select style={{ fontSize: '12px', padding: '2px' }} onChange={(e) => {
                const updated = [...drills]; updated[index].scale = e.target.value; setDrills(updated);
              }}>
                <option value="Player Level">Player Scale (1v1)</option>
                <option value="Unit Level">Unit Scale (Groups/Rondos)</option>
                <option value="Team Level">Team Scale (Match Shape)</option>
              </select>
            </div>
            
            <input type="text" placeholder="Drill Vector Name (e.g., 3v1 Rondo Option)" style={{ ...styles.input, marginBottom: '8px' }} onChange={(e) => {
              const updated = [...drills]; updated[index].name = e.target.value; setDrills(updated);
            }} required />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Pitch Boundaries (e.g., 15m x 10m)" style={{ ...styles.input, flex: 1 }} onChange={(e) => {
                const updated = [...drills]; updated[index].dimensions = e.target.value; setDrills(updated);
              }} required />
              <input type="text" placeholder="Core Instruction / Focus" style={{ ...styles.input, flex: 2 }} onChange={(e) => {
                const updated = [...drills]; updated[index].keyFocus = e.target.value; setDrills(updated);
              }} required />
            </div>
          </div>
        ))}

        <button type="button" onClick={handleAddDrill} style={styles.secondaryBtn}>➕ Add Session Part Vector</button>
        <button type="submit" style={styles.primaryBtn}>Commit Blueprint to Coach Hub</button>
      </form>
    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold', color: '#374151' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' },
  secondaryBtn: { padding: '10px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  primaryBtn: { padding: '12px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }
};