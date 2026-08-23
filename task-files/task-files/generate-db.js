/**
 * generate-db.js
 * Rebuilds db.json with dates relative to TODAY.
 * Run:  node generate-db.js
 *
 * The data is intentionally "real world" — some clients have lots of data,
 * some have almost none, some have none at all. That is not a mistake.
 */

const fs = require('fs');
const path = require('path');

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
// normalise to 09:00 local so entries never land on a date boundary
now.setHours(9, 0, 0, 0);

const daysAgo = (n) => new Date(now.getTime() - n * DAY).toISOString();

let seq = 1000;
const id = (p) => `${p}_${++seq}`;

/* ------------------------------------------------------------------ */
/* Coach + auth                                                        */
/* ------------------------------------------------------------------ */

const coach = {
  id: 'coach_1',
  name: 'Priya Menon',
  email: 'coach@molt.app',
  role: 'coach',
  gymName: 'Molt Strength Studio',
  clientCount: 5,
};

// The only valid login. Anything else must return 401.
const credentials = {
  email: 'coach@molt.app',
  password: 'molt1234',
};

/* ------------------------------------------------------------------ */
/* Clients                                                             */
/* ------------------------------------------------------------------ */

const clients = [
  {
    id: 'c1',
    name: 'Aarav Shah',
    goal: 'fat_loss',
    startDateISO: daysAgo(120),
    heightCm: 178,
    avatarColor: '#3B82F6',
  },
  {
    id: 'c2',
    name: 'Meera Iyer',
    goal: 'muscle_gain',
    startDateISO: daysAgo(9),
    heightCm: 162,
    avatarColor: '#10B981',
  },
  {
    id: 'c3',
    name: 'Rohan Desai',
    goal: 'maintenance',
    startDateISO: daysAgo(2),
    heightCm: 171,
    avatarColor: '#F59E0B',
  },
  {
    id: 'c4',
    name: 'Sana Qureshi',
    goal: 'fat_loss',
    startDateISO: daysAgo(60),
    heightCm: 165,
    avatarColor: '#EF4444',
  },
  {
    id: 'c5',
    name: 'Vikram Nair',
    goal: 'recomp',
    startDateISO: daysAgo(400),
    heightCm: 183,
    avatarColor: '#8B5CF6',
  },
];

/* ------------------------------------------------------------------ */
/* Weight entries  (weightKg stored in KILOGRAMS, 3 decimals)          */
/* ------------------------------------------------------------------ */

const w = (clientId, days, kg, note) => ({
  id: id('w'),
  clientId,
  dateISO: daysAgo(days),
  weightKg: kg,
  note: note ?? null,
  source: 'coach',
});

const weightEntries = [
  /* ---- c1: healthy 90-day history, steady loss ------------------- */
  w('c1', 88, 92.4, 'Baseline weigh-in'),
  w('c1', 81, 91.8),
  w('c1', 74, 91.9, 'Travel week'),
  w('c1', 67, 90.6),
  w('c1', 60, 90.1),
  w('c1', 53, 89.4),
  w('c1', 46, 89.6),
  w('c1', 39, 88.5),
  w('c1', 32, 88.0),
  w('c1', 25, 87.4, 'Feeling strong'),
  w('c1', 18, 87.1),
  w('c1', 11, 86.5),
  w('c1', 4, 86.2),
  w('c1', 1, 86.0, 'Morning, fasted'),

  /* ---- c2: EXACTLY ONE entry (no delta can be calculated) --------- */
  w('c2', 5, 54.3, 'First weigh-in'),

  /* ---- c3: NOTHING. Client exists, zero entries. ------------------ */

  /* ---- c4: messy real data ---------------------------------------- */
  // deliberately NOT in date order in the array
  w('c4', 12, 70.1),
  w('c4', 40, 71.6, 'Start of block'),
  w('c4', 3, 70.0), // 70.1 -> 70.0 = the 0.1 float-rounding trap
  w('c4', 26, 70.9),
  // two entries on the SAME day, different times
  { ...w('c4', 19, 70.4), dateISO: new Date(now.getTime() - 19 * DAY).toISOString() },
  {
    ...w('c4', 19, 70.7, 'Re-weighed after training'),
    dateISO: new Date(now.getTime() - 19 * DAY + 6 * 60 * 60 * 1000).toISOString(),
  },

  /* ---- c5: history exists but ALL of it is older than 90 days ----- */
  w('c5', 210, 79.2),
  w('c5', 180, 78.6),
  w('c5', 150, 78.9),
  w('c5', 120, 77.8),
  w('c5', 95, 77.1, 'Last session before break'),
];

/* ------------------------------------------------------------------ */
/* Girth entries  (valueMm stored in MILLIMETRES — read this twice)    */
/* ------------------------------------------------------------------ */

const g = (clientId, days, site, mm) => ({
  id: id('g'),
  clientId,
  dateISO: daysAgo(days),
  site,
  valueMm: mm,
  source: 'coach',
});

const girthEntries = [
  /* ---- c1: waist / chest / hip / thigh present, ARM MISSING ------- */
  g('c1', 88, 'waist', 1012),
  g('c1', 88, 'chest', 1068),
  g('c1', 88, 'hip', 1043),
  g('c1', 88, 'thigh', 618),

  g('c1', 60, 'waist', 991),
  g('c1', 60, 'chest', 1061),
  g('c1', 60, 'hip', 1038),
  g('c1', 60, 'thigh', 615),

  g('c1', 32, 'waist', 968),
  g('c1', 32, 'chest', 1057),
  g('c1', 32, 'hip', 1029),
  g('c1', 32, 'thigh', 610),

  g('c1', 4, 'waist', 946),
  g('c1', 4, 'chest', 1052),
  g('c1', 4, 'hip', 1021),
  g('c1', 4, 'thigh', 607),
  // NOTE: no 'arm' rows anywhere for c1 — on purpose.

  /* ---- c2: no girth at all (has weight, no girth) ----------------- */

  /* ---- c3: nothing ------------------------------------------------ */

  /* ---- c4: only waist, only two points ---------------------------- */
  g('c4', 40, 'waist', 842),
  g('c4', 3, 'waist', 829),

  /* ---- c5: all older than 90 days --------------------------------- */
  g('c5', 210, 'waist', 903),
  g('c5', 95, 'waist', 888),
  g('c5', 210, 'arm', 351),
  g('c5', 95, 'arm', 358),
];

/* ------------------------------------------------------------------ */

const db = {
  meta: {
    generatedAtISO: now.toISOString(),
    weightUnitOnServer: 'kg',
    girthUnitOnServer: 'mm',
    note: 'Server always stores kg and mm. Any other unit is a display concern.',
  },
  credentials,
  coach,
  clients,
  weightEntries,
  girthEntries,
};

fs.writeFileSync(
  path.join(__dirname, 'db.json'),
  JSON.stringify(db, null, 2) + '\n',
  'utf8'
);

console.log('db.json written.');
console.log(`  clients:       ${clients.length}`);
console.log(`  weightEntries: ${weightEntries.length}`);
console.log(`  girthEntries:  ${girthEntries.length}`);
console.log(`  today:         ${now.toISOString()}`);
