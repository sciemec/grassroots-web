// 1. Import your newly created JSON session files
import crSession04 from './FIFA-U14-CR-04.json';
import crSession06 from './FIFA-U14-CR-06.json';
// Add imports for your Barcelona or Sundowns JSON files here as you scale!

// 2. Export them as a single combined array that the Coach Hub can map through
export const masterTacticalSessions = [
  crSession04,
  crSession06
];

/**
 * Helper Utility: Finds a specific session block instantly for your PitchPro canvas view
 */
export const getSessionById = (id) => {
  return masterTacticalSessions.find(session => session.sessionId === id) || null;
};