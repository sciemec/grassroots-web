// src/lib/world-cup-data.ts

export interface Match {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'live' | 'finished';
  minute?: number;
  stadium: string;
  group: string;
  highlights?: {
    url: string;
    thumbnail: string;
    title: string;
  }[];
}

// Full World Cup 2026 Schedule (June 11 - July 19)
export const WORLD_CUP_MATCHES: Match[] = [
  // GROUP STAGE - Match Day 1 (June 11-12)
  { id: "1", date: "2026-06-11", time: "17:00", homeTeam: "Germany", awayTeam: "Scotland", status: "scheduled", stadium: "Munich", group: "Group A" },
  { id: "2", date: "2026-06-11", time: "20:00", homeTeam: "Hungary", awayTeam: "Switzerland", status: "scheduled", stadium: "Cologne", group: "Group A" },
  { id: "3", date: "2026-06-11", time: "23:00", homeTeam: "Spain", awayTeam: "Croatia", status: "scheduled", stadium: "Berlin", group: "Group B" },
  { id: "4", date: "2026-06-12", time: "17:00", homeTeam: "Italy", awayTeam: "Albania", status: "scheduled", stadium: "Dortmund", group: "Group B" },
  { id: "5", date: "2026-06-12", time: "20:00", homeTeam: "Poland", awayTeam: "Netherlands", status: "scheduled", stadium: "Hamburg", group: "Group C" },
  { id: "6", date: "2026-06-12", time: "23:00", homeTeam: "Slovenia", awayTeam: "Denmark", status: "scheduled", stadium: "Stuttgart", group: "Group C" },
  { id: "7", date: "2026-06-13", time: "14:00", homeTeam: "Serbia", awayTeam: "England", status: "scheduled", stadium: "Gelsenkirchen", group: "Group D" },
  { id: "8", date: "2026-06-13", time: "17:00", homeTeam: "Belgium", awayTeam: "Slovakia", status: "scheduled", stadium: "Frankfurt", group: "Group E" },
  { id: "9", date: "2026-06-13", time: "20:00", homeTeam: "Romania", awayTeam: "Ukraine", status: "scheduled", stadium: "Munich", group: "Group E" },
  { id: "10", date: "2026-06-14", time: "14:00", homeTeam: "Austria", awayTeam: "France", status: "scheduled", stadium: "Düsseldorf", group: "Group D" },
  { id: "11", date: "2026-06-14", time: "17:00", homeTeam: "Turkey", awayTeam: "Georgia", status: "scheduled", stadium: "Dortmund", group: "Group F" },
  { id: "12", date: "2026-06-14", time: "20:00", homeTeam: "Portugal", awayTeam: "Czech Republic", status: "scheduled", stadium: "Leipzig", group: "Group F" },
  { id: "13", date: "2026-06-15", time: "14:00", homeTeam: "Croatia", awayTeam: "Albania", status: "scheduled", stadium: "Hamburg", group: "Group B" },
  { id: "14", date: "2026-06-15", time: "17:00", homeTeam: "Germany", awayTeam: "Hungary", status: "scheduled", stadium: "Stuttgart", group: "Group A" },
  { id: "15", date: "2026-06-15", time: "20:00", homeTeam: "Scotland", awayTeam: "Switzerland", status: "scheduled", stadium: "Cologne", group: "Group A" },
  { id: "16", date: "2026-06-16", time: "14:00", homeTeam: "Poland", awayTeam: "Austria", status: "scheduled", stadium: "Berlin", group: "Group C" },
  { id: "17", date: "2026-06-16", time: "17:00", homeTeam: "Netherlands", awayTeam: "France", status: "scheduled", stadium: "Leipzig", group: "Group C" },
  { id: "18", date: "2026-06-16", time: "20:00", homeTeam: "Denmark", awayTeam: "England", status: "scheduled", stadium: "Frankfurt", group: "Group D" },
  { id: "19", date: "2026-06-17", time: "14:00", homeTeam: "Slovenia", awayTeam: "Serbia", status: "scheduled", stadium: "Munich", group: "Group D" },
  { id: "20", date: "2026-06-17", time: "17:00", homeTeam: "Belgium", awayTeam: "Romania", status: "scheduled", stadium: "Cologne", group: "Group E" },
  { id: "21", date: "2026-06-17", time: "20:00", homeTeam: "Slovakia", awayTeam: "Ukraine", status: "scheduled", stadium: "Düsseldorf", group: "Group E" },
  { id: "22", date: "2026-06-18", time: "14:00", homeTeam: "Turkey", awayTeam: "Portugal", status: "scheduled", stadium: "Dortmund", group: "Group F" },
  { id: "23", date: "2026-06-18", time: "17:00", homeTeam: "Georgia", awayTeam: "Czech Republic", status: "scheduled", stadium: "Hamburg", group: "Group F" },
  { id: "24", date: "2026-06-18", time: "20:00", homeTeam: "Italy", awayTeam: "Spain", status: "scheduled", stadium: "Gelsenkirchen", group: "Group B" },
  
  // Add more matches through July 19 as needed
  // Knockout stages start June 28
];

export const GROUP_STAGES = [
  "Group A", "Group B", "Group C", "Group D", "Group E", "Group F"
];

export function getMatchesByDate(date: string): Match[] {
  return WORLD_CUP_MATCHES.filter(match => match.date === date);
}

export function getLiveMatches(): Match[] {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  
  return WORLD_CUP_MATCHES.filter(match => {
    if (match.date !== currentDate) return false;
    const matchHour = parseInt(match.time.split(':')[0]);
    // Match is live if within 2 hours of scheduled time (simplified)
    return Math.abs(matchHour - currentHour) <= 2;
  });
}

export function getUpcomingMatches(): Match[] {
  const today = new Date().toISOString().split('T')[0];
  return WORLD_CUP_MATCHES
    .filter(match => match.date >= today && match.status === 'scheduled')
    .slice(0, 10);
}

export function formatMatchTime(match: Match): string {
  const matchDate = new Date(`${match.date}T${match.time}:00`);
  return matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function isMatchToday(match: Match): boolean {
  const today = new Date().toISOString().split('T')[0];
  return match.date === today;
}