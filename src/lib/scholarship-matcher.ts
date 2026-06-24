// src/lib/scholarship-matcher.ts
// Client-side scholarship matching engine — no API or external calls needed.
// Scores curated programs against a player's passport data and returns ranked results.

// ── Types ─────────────────────────────────────────────────────────────────────

export type Division =
  | 'NCAA D1' | 'NCAA D2' | 'NCAA D3' | 'NAIA' | 'NJCAA'
  | 'UK University' | 'Canada' | 'Australia' | 'Germany';

export type FitLabel = 'Strong Fit' | 'Good Fit' | 'Possible Fit' | 'Stretch';

export interface ScholarshipProgram {
  id: string;
  institution: string;
  country: string;
  division: Division;
  sport: string;           // lowercase — "football", "rugby", "athletics", etc.
  positions: string[];     // positions actively recruited
  min_thuto_score: number; // 0–100
  requires_english: boolean;
  requires_ncaa_id: boolean;
  min_school_year: string; // earliest school_year value accepted
  deadline_month: number;  // 1–12 (recruiting window closes)
  notes: string;
  website: string;
}

export interface PlayerMatchData {
  sport: string;
  position: string;
  thuto_score: number;
  school_year: string;
  ncaa_registered: boolean;
  english_proficiency: string;   // 'none' | 'basic' | 'ielts' | 'native'
  reel_complete: boolean;         // all 4 ScholarshipReel slots filled
  target_pathway: string;         // 'ncaa_d1' | 'ncaa_d2' | 'uk' | 'naia' | etc.
}

export interface MatchResult {
  program: ScholarshipProgram;
  score: number;    // 0–100 composite match score
  fit: {
    thuto:    boolean;
    reel:     boolean;
    academic: boolean;
    position: boolean;
    ncaa:     boolean;
  };
  label: FitLabel;
  blockers: string[];  // human-readable things preventing a stronger match
}

// ── School-year ordering (for min_school_year comparison) ────────────────────

const YEAR_ORDER: Record<string, number> = {
  form1: 1, form2: 2, form3: 3, form4: 4,
  form5: 5, form6: 6, university: 7, graduated: 8,
};

function yearGte(playerYear: string, minYear: string): boolean {
  return (YEAR_ORDER[playerYear] ?? 0) >= (YEAR_ORDER[minYear] ?? 0);
}

// ── Curated program list ─────────────────────────────────────────────────────
// Programs known to actively recruit from sub-Saharan Africa.
// Kept realistic — correct divisions and actual recruiting patterns.

export const SCHOLARSHIP_PROGRAMS: ScholarshipProgram[] = [
  // ── NCAA D1 Football (Soccer) ──────────────────────────────────────────────
  {
    id: 'akron_d1_soccer',
    institution: 'University of Akron',
    country: 'USA',
    division: 'NCAA D1',
    sport: 'football',
    positions: ['midfielder', 'defender', 'goalkeeper'],
    min_thuto_score: 68,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 8,
    notes: 'Strong international recruitment history. Known to take African midfielders.',
    website: 'https://gozips.com/sports/mens-soccer',
  },
  {
    id: 'connecticut_d1_soccer',
    institution: 'University of Connecticut',
    country: 'USA',
    division: 'NCAA D1',
    sport: 'football',
    positions: ['striker', 'winger', 'midfielder'],
    min_thuto_score: 72,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form6',
    deadline_month: 7,
    notes: 'Big East program. Regularly scouts African and Caribbean players.',
    website: 'https://uconnhuskies.com/sports/mens-soccer',
  },
  {
    id: 'fordham_d1_soccer',
    institution: 'Fordham University',
    country: 'USA',
    division: 'NCAA D1',
    sport: 'football',
    positions: ['striker', 'midfielder', 'defender'],
    min_thuto_score: 65,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 9,
    notes: 'Atlantic 10 program. Good academic support for international students.',
    website: 'https://fordhamsports.com/sports/mens-soccer',
  },
  // ── NCAA D2 Football (Soccer) ──────────────────────────────────────────────
  {
    id: 'barry_d2_soccer',
    institution: 'Barry University',
    country: 'USA',
    division: 'NCAA D2',
    sport: 'football',
    positions: ['striker', 'winger', 'midfielder', 'defender'],
    min_thuto_score: 52,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 10,
    notes: 'Florida-based. Elite D2 program, multiple Zimbabwean alumni.',
    website: 'https://barrybucs.com/sports/mens-soccer',
  },
  {
    id: 'eckerd_d2_soccer',
    institution: 'Eckerd College',
    country: 'USA',
    division: 'NCAA D2',
    sport: 'football',
    positions: ['midfielder', 'defender', 'striker'],
    min_thuto_score: 50,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 10,
    notes: 'Sunshine State Conference. Strong African player pipeline.',
    website: 'https://eckerd.edu/athletics',
  },
  {
    id: 'lynn_d2_soccer',
    institution: 'Lynn University',
    country: 'USA',
    division: 'NCAA D2',
    sport: 'football',
    positions: ['striker', 'winger', 'goalkeeper'],
    min_thuto_score: 54,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 9,
    notes: 'Boca Raton, Florida. Known for international recruitment. Full scholarship packages available.',
    website: 'https://lynnfighting.com/sports/msoc',
  },
  {
    id: 'columbus_state_d2',
    institution: 'Columbus State University',
    country: 'USA',
    division: 'NCAA D2',
    sport: 'football',
    positions: ['midfielder', 'defender'],
    min_thuto_score: 48,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 11,
    notes: 'Peach Belt Conference. Georgia-based with affordable cost of attendance.',
    website: 'https://csucougars.com',
  },
  // ── NAIA Football (Soccer) ─────────────────────────────────────────────────
  {
    id: 'malone_naia',
    institution: 'Malone University',
    country: 'USA',
    division: 'NAIA',
    sport: 'football',
    positions: ['striker', 'winger', 'midfielder', 'defender', 'goalkeeper'],
    min_thuto_score: 40,
    requires_english: true,
    requires_ncaa_id: false,
    min_school_year: 'form4',
    deadline_month: 12,
    notes: 'NAIA — no NCAA Eligibility Center needed. Strong scholarship availability for Africans.',
    website: 'https://malonepioneers.com',
  },
  {
    id: 'lindsey_wilson_naia',
    institution: 'Lindsey Wilson College',
    country: 'USA',
    division: 'NAIA',
    sport: 'football',
    positions: ['striker', 'midfielder', 'defender'],
    min_thuto_score: 38,
    requires_english: true,
    requires_ncaa_id: false,
    min_school_year: 'form4',
    deadline_month: 12,
    notes: 'Kentucky-based NAIA powerhouse. One of the most internationally diverse rosters in US soccer.',
    website: 'https://lindseywilsonathletics.com/sports/msoc',
  },
  {
    id: 'william_carey_naia',
    institution: 'William Carey University',
    country: 'USA',
    division: 'NAIA',
    sport: 'football',
    positions: ['striker', 'winger', 'midfielder', 'defender'],
    min_thuto_score: 36,
    requires_english: true,
    requires_ncaa_id: false,
    min_school_year: 'form4',
    deadline_month: 12,
    notes: 'Mississippi-based. Multiple Zimbabwean and Southern African players recruited annually.',
    website: 'https://wcucrusaders.com/sports/msoc',
  },
  // ── UK Universities ────────────────────────────────────────────────────────
  {
    id: 'loughborough_uk',
    institution: 'Loughborough University',
    country: 'UK',
    division: 'UK University',
    sport: 'football',
    positions: ['midfielder', 'defender', 'striker'],
    min_thuto_score: 60,
    requires_english: true,
    requires_ncaa_id: false,
    min_school_year: 'form6',
    deadline_month: 3,
    notes: 'Top UK sports university. Performance scholarship + elite training environment.',
    website: 'https://lboro.ac.uk/sport/scholarships',
  },
  {
    id: 'northumbria_uk',
    institution: 'Northumbria University',
    country: 'UK',
    division: 'UK University',
    sport: 'football',
    positions: ['striker', 'winger', 'midfielder', 'defender', 'goalkeeper'],
    min_thuto_score: 50,
    requires_english: true,
    requires_ncaa_id: false,
    min_school_year: 'form6',
    deadline_month: 4,
    notes: 'Strong sports scholarship programme. BUCS Premier North football.',
    website: 'https://northumbria.ac.uk/sport',
  },
  // ── Canada ─────────────────────────────────────────────────────────────────
  {
    id: 'guelph_canada',
    institution: 'University of Guelph',
    country: 'Canada',
    division: 'Canada',
    sport: 'football',
    positions: ['midfielder', 'defender', 'striker'],
    min_thuto_score: 55,
    requires_english: true,
    requires_ncaa_id: false,
    min_school_year: 'form6',
    deadline_month: 2,
    notes: 'U SPORTS. Strong academic institution with athletic bursaries.',
    website: 'https://gryphons.ca/sports/msoc',
  },
  // ── Australia ──────────────────────────────────────────────────────────────
  {
    id: 'victoria_university_aus',
    institution: 'Victoria University',
    country: 'Australia',
    division: 'Australia',
    sport: 'football',
    positions: ['striker', 'midfielder', 'defender', 'goalkeeper'],
    min_thuto_score: 48,
    requires_english: true,
    requires_ncaa_id: false,
    min_school_year: 'form6',
    deadline_month: 11,
    notes: 'Elite athlete programme. Football (soccer) pathway to NPL/A-League academy.',
    website: 'https://vu.edu.au/sport',
  },
  // ── Rugby ──────────────────────────────────────────────────────────────────
  {
    id: 'hartpury_rugby',
    institution: 'Hartpury University',
    country: 'UK',
    division: 'UK University',
    sport: 'rugby',
    positions: ['loosehead prop', 'hooker', 'tighthead prop', 'lock', 'flanker', 'number 8', 'scrum-half', 'fly-half', 'centre', 'winger', 'fullback'],
    min_thuto_score: 50,
    requires_english: true,
    requires_ncaa_id: false,
    min_school_year: 'form6',
    deadline_month: 4,
    notes: 'UK\'s leading rugby scholarship provider. Linked to Gloucester Rugby.',
    website: 'https://hartpury.ac.uk/sport',
  },
  {
    id: 'life_university_rugby',
    institution: 'Life University',
    country: 'USA',
    division: 'NAIA',
    sport: 'rugby',
    positions: ['loosehead prop', 'hooker', 'lock', 'flanker', 'number 8', 'scrum-half', 'fly-half', 'centre', 'winger'],
    min_thuto_score: 42,
    requires_english: true,
    requires_ncaa_id: false,
    min_school_year: 'form5',
    deadline_month: 12,
    notes: 'Georgia-based. #1 college rugby program in USA. Full scholarships available.',
    website: 'https://liferunningeagles.com/sports/rugby',
  },
  // ── Athletics ──────────────────────────────────────────────────────────────
  {
    id: 'providence_athletics',
    institution: 'Providence College',
    country: 'USA',
    division: 'NCAA D1',
    sport: 'athletics',
    positions: ['sprinter', 'middle distance', 'long distance', 'jumper'],
    min_thuto_score: 62,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 1,
    notes: 'BIG EAST program. Known for recruiting African distance runners. Strong track history.',
    website: 'https://friars.com/sports/mens-track',
  },
  {
    id: 'utep_athletics',
    institution: 'University of Texas at El Paso',
    country: 'USA',
    division: 'NCAA D1',
    sport: 'athletics',
    positions: ['sprinter', 'middle distance', 'long distance'],
    min_thuto_score: 58,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 2,
    notes: 'Conference USA. Historically recruited from Southern Africa. Full scholarship packages.',
    website: 'https://utepminers.com/sports/mens-track',
  },
  // ── Netball ────────────────────────────────────────────────────────────────
  {
    id: 'bath_netball',
    institution: 'University of Bath',
    country: 'UK',
    division: 'UK University',
    sport: 'netball',
    positions: ['goal shooter', 'goal attack', 'wing attack', 'centre', 'wing defence', 'goal defence', 'goal keeper'],
    min_thuto_score: 55,
    requires_english: true,
    requires_ncaa_id: false,
    min_school_year: 'form6',
    deadline_month: 3,
    notes: 'Top UK university for netball. Bath Superleague franchise links.',
    website: 'https://teambath.com/scholarships',
  },
  // ── Basketball ─────────────────────────────────────────────────────────────
  {
    id: 'alcorn_state_basketball',
    institution: 'Alcorn State University',
    country: 'USA',
    division: 'NCAA D1',
    sport: 'basketball',
    positions: ['point guard', 'shooting guard', 'small forward', 'power forward', 'center'],
    min_thuto_score: 58,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 4,
    notes: 'SWAC conference HBCU. Scholarship + academic support for international athletes.',
    website: 'https://alcornsports.com/sports/mbball',
  },
  {
    id: 'eastern_new_mexico_basketball',
    institution: 'Eastern New Mexico University',
    country: 'USA',
    division: 'NCAA D2',
    sport: 'basketball',
    positions: ['point guard', 'shooting guard', 'small forward', 'power forward', 'center'],
    min_thuto_score: 44,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 5,
    notes: 'Lone Star Conference D2. Actively recruits from Africa.',
    website: 'https://enmugreyhounds.com/sports/mbball',
  },
  // ── Cricket ────────────────────────────────────────────────────────────────
  {
    id: 'uc_irvine_cricket',
    institution: 'UC Irvine',
    country: 'USA',
    division: 'NCAA D1',
    sport: 'cricket',
    positions: ['batsman', 'bowler', 'all-rounder', 'wicket keeper'],
    min_thuto_score: 55,
    requires_english: true,
    requires_ncaa_id: true,
    min_school_year: 'form5',
    deadline_month: 9,
    notes: 'One of very few NCAA D1 cricket programs. Strong Zimbabwean cricket community in California.',
    website: 'https://athletics.uci.edu/sports/cricket',
  },
];

// ── Scoring weights ───────────────────────────────────────────────────────────

const W_THUTO    = 30;   // THUTO score meets minimum
const W_POSITION = 25;   // position matches recruited positions
const W_PATHWAY  = 20;   // target_pathway aligns with division
const W_REEL     = 15;   // scholarship reel complete
const W_ACADEMIC = 10;   // school year eligible + english

// ── Pathway → division mapping ────────────────────────────────────────────────

const PATHWAY_DIVISION_MAP: Record<string, Division[]> = {
  ncaa_d1:     ['NCAA D1'],
  ncaa_d2:     ['NCAA D2', 'NCAA D3'],
  naia:        ['NAIA', 'NJCAA'],
  junior_college: ['NJCAA'],
  uk:          ['UK University'],
  canada:      ['Canada'],
  australia:   ['Australia'],
  europe:      ['Germany'],
};

// ── Normalise sport/position strings ─────────────────────────────────────────

function normSport(s: string): string {
  s = s.toLowerCase().trim();
  if (s === 'soccer') return 'football';
  return s;
}

function normPos(s: string): string {
  return s.toLowerCase().trim();
}

// ── Main matcher ──────────────────────────────────────────────────────────────

export function matchPrograms(player: PlayerMatchData): MatchResult[] {
  const playerSport = normSport(player.sport);
  const playerPos   = normPos(player.position);

  // Filter to matching sport first
  const sportPrograms = SCHOLARSHIP_PROGRAMS.filter(
    p => normSport(p.sport) === playerSport
  );

  return sportPrograms
    .map((program): MatchResult => {
      const blockers: string[] = [];

      // ── Individual fit checks ─────────────────────────────────────────────
      const fitThuto = player.thuto_score >= program.min_thuto_score;
      if (!fitThuto) blockers.push(`THUTO score below ${program.min_thuto_score} minimum`);

      const fitPosition = program.positions.length === 0
        || program.positions.some(p => normPos(p).includes(playerPos) || playerPos.includes(normPos(p)));
      if (!fitPosition) blockers.push('Position not currently recruited');

      const fitAcademic = yearGte(player.school_year, program.min_school_year)
        && (!program.requires_english || player.english_proficiency !== 'none');
      if (!fitAcademic) {
        if (!yearGte(player.school_year, program.min_school_year))
          blockers.push('Too early in schooling — apply from Form 5+');
        if (program.requires_english && player.english_proficiency === 'none')
          blockers.push('English proficiency certificate required');
      }

      const fitReel = player.reel_complete;
      if (!fitReel) blockers.push('Complete all 4 Scholarship Reel slots');

      const fitNcaa = !program.requires_ncaa_id || player.ncaa_registered;
      if (!fitNcaa) blockers.push('NCAA Eligibility Center registration required');

      // ── Pathway alignment bonus ───────────────────────────────────────────
      const pathwayDivisions = PATHWAY_DIVISION_MAP[player.target_pathway] ?? [];
      const fitPathway = pathwayDivisions.length === 0
        || pathwayDivisions.includes(program.division);

      // ── Composite score (0–100) ───────────────────────────────────────────
      let score = 0;
      if (fitThuto)    score += W_THUTO;
      if (fitPosition) score += W_POSITION;
      if (fitPathway)  score += W_PATHWAY;
      if (fitReel)     score += W_REEL;
      if (fitAcademic) score += W_ACADEMIC;

      // Partial THUTO credit — how close the player is (up to half the weight)
      if (!fitThuto && program.min_thuto_score > 0) {
        const proximity = Math.min(1, player.thuto_score / program.min_thuto_score);
        score += Math.round(W_THUTO * proximity * 0.5);
      }

      const label: FitLabel =
        score >= 80 ? 'Strong Fit' :
        score >= 60 ? 'Good Fit'   :
        score >= 40 ? 'Possible Fit' :
        'Stretch';

      return {
        program,
        score,
        fit: { thuto: fitThuto, reel: fitReel, academic: fitAcademic, position: fitPosition, ncaa: fitNcaa },
        label,
        blockers,
      };
    })
    .filter(r => r.score >= 20)                      // drop very poor matches
    .sort((a, b) => b.score - a.score);              // best first
}

// ── Label colour helper (for UI) ──────────────────────────────────────────────

export function fitColor(label: FitLabel): string {
  switch (label) {
    case 'Strong Fit':   return '#16a34a';
    case 'Good Fit':     return '#1a5c2a';
    case 'Possible Fit': return '#c8962a';
    case 'Stretch':      return '#9ca3af';
  }
}
