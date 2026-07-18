// Zimbabwe school sports gender programme data
// Source: NASH / NAPH / ZIMSEC participation records (illustrative baseline)

export type Gender = "boys" | "girls";

export interface SportParticipation {
  sport: string;
  emoji: string;
  boys: number;
  girls: number;
  nashTournaments: number;
  naphTournaments: number;
  trend: "up" | "down" | "stable"; // year-on-year
}

export interface ProvinceData {
  province: string;
  schools: number;
  boysParticipants: number;
  girlsParticipants: number;
  topSchool: string;
}

export interface ProgrammeType {
  id: string;
  name: string;
  body: "NASH" | "NAPH";
  gender: "boys" | "girls" | "mixed";
  ageGroup: string;
  description: string;
  status: "Active" | "Upcoming" | "Completed";
  registeredSchools: number;
}

export interface YearlyTrend {
  year: number;
  boysParticipants: number;
  girlsParticipants: number;
  totalSchools: number;
}

// ── Sport participation breakdown ───────────────────────────────────────────

export const SPORT_PARTICIPATION: SportParticipation[] = [
  {
    sport: "Football",
    emoji: "⚽",
    boys: 28400,
    girls: 14200,
    nashTournaments: 4,
    naphTournaments: 2,
    trend: "up",
  },
  {
    sport: "Netball",
    emoji: "🏐",
    boys: 0,
    girls: 31800,
    nashTournaments: 3,
    naphTournaments: 1,
    trend: "up",
  },
  {
    sport: "Athletics",
    emoji: "🏃",
    boys: 19500,
    girls: 17800,
    nashTournaments: 2,
    naphTournaments: 2,
    trend: "stable",
  },
  {
    sport: "Rugby",
    emoji: "🏉",
    boys: 8900,
    girls: 1200,
    nashTournaments: 2,
    naphTournaments: 0,
    trend: "up",
  },
  {
    sport: "Cricket",
    emoji: "🏏",
    boys: 6700,
    girls: 2100,
    nashTournaments: 2,
    naphTournaments: 0,
    trend: "up",
  },
  {
    sport: "Basketball",
    emoji: "🏀",
    boys: 4800,
    girls: 4200,
    nashTournaments: 1,
    naphTournaments: 0,
    trend: "stable",
  },
  {
    sport: "Tennis",
    emoji: "🎾",
    boys: 2300,
    girls: 2100,
    nashTournaments: 1,
    naphTournaments: 0,
    trend: "stable",
  },
  {
    sport: "Swimming",
    emoji: "🏊",
    boys: 3100,
    girls: 2800,
    nashTournaments: 1,
    naphTournaments: 0,
    trend: "up",
  },
];

// ── Province breakdown ───────────────────────────────────────────────────────

export const PROVINCE_DATA: ProvinceData[] = [
  {
    province: "Harare",
    schools: 412,
    boysParticipants: 24800,
    girlsParticipants: 22100,
    topSchool: "Prince Edward School",
  },
  {
    province: "Bulawayo",
    schools: 198,
    boysParticipants: 11200,
    girlsParticipants: 10400,
    topSchool: "Christian Brothers College",
  },
  {
    province: "Mashonaland East",
    schools: 287,
    boysParticipants: 15600,
    girlsParticipants: 12800,
    topSchool: "Marondera High",
  },
  {
    province: "Matabeleland South",
    schools: 156,
    boysParticipants: 7900,
    girlsParticipants: 6200,
    topSchool: "Gwanda High",
  },
  {
    province: "Midlands",
    schools: 234,
    boysParticipants: 12100,
    girlsParticipants: 9800,
    topSchool: "Chaplin High",
  },
  {
    province: "Manicaland",
    schools: 278,
    boysParticipants: 14400,
    girlsParticipants: 11900,
    topSchool: "Mutare Boys High",
  },
  {
    province: "Mashonaland West",
    schools: 201,
    boysParticipants: 10300,
    girlsParticipants: 8600,
    topSchool: "Chinhoyi High",
  },
  {
    province: "Masvingo",
    schools: 219,
    boysParticipants: 11800,
    girlsParticipants: 9400,
    topSchool: "Masvingo High",
  },
  {
    province: "Mashonaland Central",
    schools: 176,
    boysParticipants: 9100,
    girlsParticipants: 7300,
    topSchool: "Bindura High",
  },
  {
    province: "Matabeleland North",
    schools: 142,
    boysParticipants: 7200,
    girlsParticipants: 5800,
    topSchool: "Lupane High",
  },
];

// ── Programme types ──────────────────────────────────────────────────────────

export const PROGRAMME_TYPES: ProgrammeType[] = [
  {
    id: "nash-football-boys",
    name: "NASH Football Boys Championship",
    body: "NASH",
    gender: "boys",
    ageGroup: "U19 / Open",
    description: "National secondary school boys football — regional qualifiers feeding into the national championship at a central venue.",
    status: "Active",
    registeredSchools: 634,
  },
  {
    id: "nash-football-girls",
    name: "NASH Football Girls Championship",
    body: "NASH",
    gender: "girls",
    ageGroup: "U19 / Open",
    description: "Rapidly growing girls football programme. Schools compete in provincial rounds before the national finals.",
    status: "Active",
    registeredSchools: 318,
  },
  {
    id: "nash-netball",
    name: "NASH Netball Championship",
    body: "NASH",
    gender: "girls",
    ageGroup: "U19 / Open",
    description: "Zimbabwe's largest school sport by female participation. 10 provinces, provincial champions advance to nationals.",
    status: "Active",
    registeredSchools: 891,
  },
  {
    id: "nash-athletics",
    name: "NASH Athletics Championships",
    body: "NASH",
    gender: "mixed",
    ageGroup: "U13 / U16 / U19",
    description: "Track and field across all age groups. Boys and girls compete separately within the same event calendar.",
    status: "Active",
    registeredSchools: 756,
  },
  {
    id: "nash-rugby",
    name: "NASH Rugby Championship",
    body: "NASH",
    gender: "boys",
    ageGroup: "U16 / U19",
    description: "Boys rugby league feeding the Zimbabwe Sables pathway. Regional rounds → national playoff.",
    status: "Active",
    registeredSchools: 124,
  },
  {
    id: "naph-football",
    name: "NAPH Football Under-13",
    body: "NAPH",
    gender: "mixed",
    ageGroup: "U13",
    description: "Primary school football for boys and girls under-13. Focus on participation over elite performance.",
    status: "Upcoming",
    registeredSchools: 412,
  },
  {
    id: "naph-athletics",
    name: "NAPH Athletics",
    body: "NAPH",
    gender: "mixed",
    ageGroup: "U10 / U13",
    description: "Primary school athletics introducing young athletes to track and field fundamentals.",
    status: "Active",
    registeredSchools: 523,
  },
  {
    id: "nash-cricket-boys",
    name: "NASH Cricket Boys",
    body: "NASH",
    gender: "boys",
    ageGroup: "U16 / U19",
    description: "School cricket feeding the Zimbabwe Under-19 national pathway.",
    status: "Active",
    registeredSchools: 89,
  },
  {
    id: "nash-cricket-girls",
    name: "NASH Cricket Girls",
    body: "NASH",
    gender: "girls",
    ageGroup: "U16 / U19",
    description: "Newly launched girls cricket programme supported by Zimbabwe Cricket.",
    status: "Upcoming",
    registeredSchools: 34,
  },
];

// ── Year-on-year trends ──────────────────────────────────────────────────────

export const YEARLY_TRENDS: YearlyTrend[] = [
  { year: 2021, boysParticipants: 68000, girlsParticipants: 52000, totalSchools: 1820 },
  { year: 2022, boysParticipants: 74000, girlsParticipants: 59000, totalSchools: 1940 },
  { year: 2023, boysParticipants: 80000, girlsParticipants: 66000, totalSchools: 2050 },
  { year: 2024, boysParticipants: 87000, girlsParticipants: 74000, totalSchools: 2180 },
  { year: 2025, boysParticipants: 93700, girlsParticipants: 82200, totalSchools: 2303 },
];

// ── Derived helpers ──────────────────────────────────────────────────────────

export function getTotalParticipants(gender: Gender): number {
  return SPORT_PARTICIPATION.reduce(
    (sum, s) => sum + (gender === "boys" ? s.boys : s.girls),
    0
  );
}

export function getGenderRatio(): { boysPct: number; girlsPct: number } {
  const boys = getTotalParticipants("boys");
  const girls = getTotalParticipants("girls");
  const total = boys + girls;
  return {
    boysPct: Math.round((boys / total) * 100),
    girlsPct: Math.round((girls / total) * 100),
  };
}

export function getTopSportsForGender(gender: Gender, limit = 4): SportParticipation[] {
  return [...SPORT_PARTICIPATION]
    .filter((s) => (gender === "boys" ? s.boys > 0 : s.girls > 0))
    .sort((a, b) =>
      gender === "boys" ? b.boys - a.boys : b.girls - a.girls
    )
    .slice(0, limit);
}

export function getProgrammesForGender(gender: Gender): ProgrammeType[] {
  return PROGRAMME_TYPES.filter(
    (p) => p.gender === gender || p.gender === "mixed"
  );
}
