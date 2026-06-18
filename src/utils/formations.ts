// src/utils/formations.ts
export const FORMATIONS = {
  '4-4-2': {
    home: [
      { x: 50, y: 85, role: 'GK' },
      { x: 15, y: 70, role: 'RB' },
      { x: 35, y: 75, role: 'CB' },
      { x: 65, y: 75, role: 'CB' },
      { x: 85, y: 70, role: 'LB' },
      { x: 10, y: 45, role: 'RM' },
      { x: 35, y: 45, role: 'CM' },
      { x: 65, y: 45, role: 'CM' },
      { x: 90, y: 45, role: 'LM' },
      { x: 35, y: 20, role: 'ST' },
      { x: 65, y: 20, role: 'ST' },
    ],
    away: [
      { x: 50, y: 15, role: 'GK' },
      { x: 15, y: 30, role: 'RB' },
      { x: 35, y: 25, role: 'CB' },
      { x: 65, y: 25, role: 'CB' },
      { x: 85, y: 30, role: 'LB' },
      { x: 10, y: 55, role: 'RM' },
      { x: 35, y: 55, role: 'CM' },
      { x: 65, y: 55, role: 'CM' },
      { x: 90, y: 55, role: 'LM' },
      { x: 35, y: 80, role: 'ST' },
      { x: 65, y: 80, role: 'ST' },
    ]
  },
  '4-3-3': {
    home: [
      { x: 50, y: 85, role: 'GK' },
      { x: 15, y: 70, role: 'RB' },
      { x: 35, y: 75, role: 'CB' },
      { x: 65, y: 75, role: 'CB' },
      { x: 85, y: 70, role: 'LB' },
      { x: 30, y: 50, role: 'CM' },
      { x: 50, y: 45, role: 'CDM' },
      { x: 70, y: 50, role: 'CM' },
      { x: 10, y: 30, role: 'RW' },
      { x: 50, y: 20, role: 'ST' },
      { x: 90, y: 30, role: 'LW' },
    ],
    away: [
      { x: 50, y: 15, role: 'GK' },
      { x: 15, y: 30, role: 'RB' },
      { x: 35, y: 25, role: 'CB' },
      { x: 65, y: 25, role: 'CB' },
      { x: 85, y: 30, role: 'LB' },
      { x: 30, y: 50, role: 'CM' },
      { x: 50, y: 55, role: 'CDM' },
      { x: 70, y: 50, role: 'CM' },
      { x: 10, y: 70, role: 'RW' },
      { x: 50, y: 80, role: 'ST' },
      { x: 90, y: 70, role: 'LW' },
    ]
  }
};

export type FormationName = '4-4-2' | '4-3-3';

export function getFormationPositions(formation: FormationName): { home: any[], away: any[] } {
  return FORMATIONS[formation] || FORMATIONS['4-4-2'];
}