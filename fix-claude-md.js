const fs = require('fs');
const path = 'D:/bhora-ai/CLAUDE.md';
let c = fs.readFileSync(path, 'utf8');

const origLen = c.length;

// Replace all chemistry 'NOT YET BUILT' rows (3 occurrences)
const chemOld = '| Week 5 \u2014 Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |';
const chemNew = '| Week 5 \u2014 Player Chemistry View | \u2705 BUILT \u2014 `/player/similar` | Consent gate, U18 safeguarding, chemistry score cards |';
c = c.replaceAll(chemOld, chemNew);

// Replace clubs/new NOT YET BUILT row (1 occurrence)
const clubsOld = '| `/arena/clubs/new` page | NOT YET BUILT | Club registration form |';
const clubsNew = '| `/arena/clubs/new` page | \u2705 BUILT \u2014 `/arena/clubs/new` | Coach-only form: name, sport, province, tier, formation, playing style, scouting/trials |';
c = c.replace(clubsOld, clubsNew);

fs.writeFileSync(path, c);
console.log('Done. Length change:', c.length - origLen);
