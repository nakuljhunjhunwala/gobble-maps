// Gobble Maps — sample data + domain logic (from PRD v1.0)
// All places are illustrative sample content for the prototype.

const GOBBLE_TYPES = {
  restaurant: { label: 'Restaurant', icon: 'fork' },
  cafe: { label: 'Café', icon: 'coffee' },
  club: { label: 'Club / Bar', icon: 'cocktail' },
  bakery: { label: 'Bakery / Dessert', icon: 'cake' },
  street: { label: 'Street Food Stall', icon: 'cart' },
  brewery: { label: 'Brewery', icon: 'beer' },
};

const GOBBLE_FILTER_DEFS = {
  cuisine: { label: 'Cuisine', options: ['North Indian', 'South Indian', 'Japanese', 'Chinese', 'Asian', 'Italian', 'Desserts', 'Multi-Cuisine'] },
  type: { label: 'Place Type', options: Object.keys(GOBBLE_TYPES) },
  vibe: { label: 'Vibe', options: ['Romantic', 'Family Dining', 'Party', 'Work Friendly', 'Board Games', 'Instagrammable'] },
  budget: { label: 'Budget', options: [1, 2, 3, 4, 5] },
  area: { label: 'Area', options: ['Andheri West', 'Juhu', 'Khar West', 'Bandra West', 'BKC', 'Powai', 'Matunga', 'Dadar', 'Lower Parel', 'Worli', 'Fort', 'Churchgate', 'Colaba'] },
};

// hour values are 24h decimals; close > 24 means past midnight
const GOBBLE_PLACES = [
  {
    id: 'koyo', name: 'Koyo', type: 'restaurant', cuisines: ['Japanese', 'Asian'],
    vibes: ['Romantic', 'Instagrammable'], budget: 4, area: 'Bandra West', station: 'Bandra',
    address: '14 Chapel Road, Ranwar Village, Bandra West', phone: '+91 98200 11223', insta: 'koyo.bombay',
    hoursText: [['Mon – Sun', '12:30 PM – 11:30 PM']], open: 12.5, close: 23.5, closedDays: [],
    visited: true, ratings: { food: 4.5, service: 4, ambience: 5 },
    mustTry: ['Miso black cod', 'Truffle edamame gyoza', 'Yuzu cheesecake'],
    note: 'Ask for the counter seats facing the open kitchen — the chefs hand you bites between courses. Portions are small, order generously.',
    bestTime: 'Weeknights after 8 PM, when the lights dim',
    liveMusic: false, boardGames: false, pureVeg: false,
    meals: ['dinner'], pos: { x: 30, y: 37 }, hue: 205, photos: 5,
  },
  {
    id: 'tatva', name: 'Tatva Tiffin Room', type: 'cafe', cuisines: ['South Indian'],
    vibes: ['Family Dining', 'Work Friendly'], budget: 1, area: 'Matunga', station: 'Matunga Road',
    address: 'Shop 3, Bhandarkar Road, Matunga East', phone: '+91 98331 40404', insta: 'tatvatiffinroom',
    hoursText: [['Mon – Sun', '7:00 AM – 9:30 PM']], open: 7, close: 21.5, closedDays: [],
    visited: true, ratings: { food: 5, service: 4.5, ambience: 3.5 },
    mustTry: ['Ghee podi idli', 'Benne dosa', 'Filter coffee (ask for strong)'],
    note: 'Go before 9 AM on weekends or expect a 30-minute wait. Cash and UPI only.',
    bestTime: 'Weekday breakfasts, 7–9 AM',
    liveMusic: false, boardGames: false, pureVeg: true,
    meals: ['breakfast', 'lunch'], pos: { x: 52, y: 52 }, hue: 95, photos: 4,
  },
  {
    id: 'saltwater', name: 'Salt Water Deck', type: 'restaurant', cuisines: ['Multi-Cuisine'],
    vibes: ['Romantic', 'Instagrammable'], budget: 5, area: 'Worli', station: 'Mahalaxmi',
    address: 'Sea Face Road, Worli Sea Face', phone: '+91 99300 77881', insta: 'saltwaterdeck',
    hoursText: [['Tue – Sun', '12:00 PM – 1:00 AM'], ['Mon', 'Closed']], open: 12, close: 25, closedDays: [1],
    visited: true, ratings: { food: 4, service: 4.5, ambience: 5 },
    mustTry: ['Lobster thermidor', 'Burrata & slow tomatoes', 'Smoked old fashioned'],
    note: 'Reserve a deck-edge table for sunset — the sea-link view is the whole point. Skip dessert, walk the sea face instead.',
    bestTime: 'Golden hour, 6:30–7:30 PM',
    liveMusic: true, boardGames: false, pureVeg: false,
    meals: ['dinner', 'brunch'], pos: { x: 36, y: 62 }, hue: 215, photos: 6,
  },
  {
    id: 'brewdock', name: 'Brewdock BKC', type: 'brewery', cuisines: ['Multi-Cuisine'],
    vibes: ['Party', 'Board Games'], budget: 3, area: 'BKC', station: 'Bandra',
    address: 'Unit 4, G Block, Bandra Kurla Complex', phone: '+91 98700 55512', insta: 'brewdockbkc',
    hoursText: [['Mon – Sun', '12:00 PM – 1:30 AM']], open: 12, close: 25.5, closedDays: [],
    visited: true, ratings: { food: 3.5, service: 4, ambience: 4.5 },
    mustTry: ['Mango wheat ale (seasonal)', 'Beer-battered bhavnagri chillies', 'Smash burger'],
    note: 'Tuesdays are board-game nights — shelves by the bar, free to borrow. The wheat ale runs out by 10 PM on weekends.',
    bestTime: 'Friday & Saturday after 9 PM',
    liveMusic: true, boardGames: true, pureVeg: false,
    meals: ['dinner', 'party'], pos: { x: 56, y: 38 }, hue: 38, photos: 5,
  },
  {
    id: 'cinnamon', name: 'Cinnamon & Co.', type: 'bakery', cuisines: ['Desserts'],
    vibes: ['Instagrammable', 'Work Friendly'], budget: 2, area: 'Bandra West', station: 'Bandra',
    address: '21 Waroda Road, Bandra West', phone: '+91 98209 33445', insta: 'cinnamonandco.in',
    hoursText: [['Mon – Sun', '8:00 AM – 10:00 PM']], open: 8, close: 22, closedDays: [],
    visited: true, ratings: { food: 4.5, service: 3.5, ambience: 4.5 },
    mustTry: ['Sticky cinnamon knot', 'Basque cheesecake slice', 'Iced Vietnamese coffee'],
    note: 'Cinnamon knots sell out by noon. The two window seats are the best work spots in Bandra.',
    bestTime: 'Weekday mornings, 8–10 AM',
    liveMusic: false, boardGames: false, pureVeg: true,
    meals: ['breakfast', 'brunch'], pos: { x: 33, y: 33 }, hue: 25, photos: 4,
  },
  {
    id: 'annas', name: "Anna's Dosa Cart", type: 'street', cuisines: ['South Indian'],
    vibes: ['Family Dining'], budget: 1, area: 'Churchgate', station: 'Churchgate',
    address: 'Opp. Eros Building, Churchgate', phone: '+91 99204 88776', insta: 'annasdosacart',
    hoursText: [['Mon – Sat', '7:00 AM – 4:00 PM'], ['Sun', 'Closed']], open: 7, close: 16, closedDays: [0],
    visited: true, ratings: { food: 5, service: 4, ambience: 3 },
    mustTry: ['Ghee roast dosa', 'Sabudana vada (limited, before 11 AM)'],
    note: "Anna remembers regulars' orders. Stand on the left side of the cart — it's the fast lane.",
    bestTime: 'Office lunch rush, 12:30–2 PM, for the theatre of it',
    liveMusic: false, boardGames: false, pureVeg: true,
    meals: ['breakfast', 'lunch'], pos: { x: 43, y: 87 }, hue: 140, photos: 4,
  },
  {
    id: 'velvet', name: 'The Velvet Room', type: 'club', cuisines: ['Asian', 'Multi-Cuisine'],
    vibes: ['Party', 'Instagrammable'], budget: 4, area: 'Lower Parel', station: 'Lower Parel',
    address: 'Level 3, Mathuradas Mills Compound, Lower Parel', phone: '+91 98198 22001', insta: 'thevelvetroom.mum',
    hoursText: [['Wed – Sun', '8:00 PM – 3:00 AM'], ['Mon – Tue', 'Closed']], open: 20, close: 27, closedDays: [1, 2],
    visited: true, ratings: { food: 3.5, service: 4, ambience: 5 },
    mustTry: ['Lychee & chilli martini', 'Korean fried cauliflower'],
    note: 'Thursdays = live jazz, weekends = house. Get on the list via their Instagram DMs to skip the queue.',
    bestTime: 'Thursday nights for jazz, after 10 PM',
    liveMusic: true, boardGames: false, pureVeg: false,
    meals: ['party'], pos: { x: 45, y: 61 }, hue: 280, photos: 5,
  },
  {
    id: 'mamawong', name: 'Mama Wong', type: 'restaurant', cuisines: ['Chinese', 'Asian'],
    vibes: ['Family Dining'], budget: 2, area: 'Powai', station: 'Kanjurmarg',
    address: 'Central Avenue, Hiranandani Gardens, Powai', phone: '+91 98675 11890', insta: 'mamawongpowai',
    hoursText: [['Mon – Sun', '11:30 AM – 11:00 PM']], open: 11.5, close: 23, closedDays: [],
    visited: true, ratings: { food: 4.5, service: 4, ambience: 3.5 },
    mustTry: ['Hand-pulled dan dan noodles', 'Crystal prawn dumplings', 'Burnt garlic fried rice'],
    note: 'Order the noodles "Mama spicy" only if you mean it. Big portions — two mains feed three.',
    bestTime: 'Sunday family lunches',
    liveMusic: false, boardGames: false, pureVeg: false,
    meals: ['lunch', 'dinner'], pos: { x: 70, y: 17 }, hue: 0, photos: 4,
  },
  {
    id: 'sodade', name: 'Caffè Sodade', type: 'cafe', cuisines: ['Italian', 'Desserts'],
    vibes: ['Work Friendly', 'Romantic'], budget: 2, area: 'Fort', station: 'CSMT',
    address: 'Ground Floor, Kala Ghoda, Fort', phone: '+91 99877 60504', insta: 'caffesodade',
    hoursText: [['Mon – Sun', '8:30 AM – 11:00 PM']], open: 8.5, close: 23, closedDays: [],
    visited: true, ratings: { food: 4, service: 4.5, ambience: 4.5 },
    mustTry: ['Tiramisu in a jar', 'Mushroom truffle toast', 'Affogato'],
    note: 'Quiet until 5 PM, then gallery crowd rolls in. Plug points at every table along the brick wall.',
    bestTime: 'Weekday afternoons with a laptop',
    liveMusic: false, boardGames: true, pureVeg: false,
    meals: ['breakfast', 'lunch', 'brunch'], pos: { x: 47, y: 83 }, hue: 168, photos: 5,
  },
  {
    id: 'gully', name: 'Gully Tandoor', type: 'restaurant', cuisines: ['North Indian'],
    vibes: ['Family Dining'], budget: 2, area: 'Andheri West', station: 'Andheri',
    address: 'Lokhandwala Back Road, Andheri West', phone: '+91 98926 73310', insta: 'gullytandoor',
    hoursText: [['Mon – Sun', '12:00 PM – 12:30 AM']], open: 12, close: 24.5, closedDays: [],
    visited: false, ratings: null, mustTry: null, note: null, bestTime: null,
    liveMusic: false, boardGames: false, pureVeg: false,
    meals: ['dinner'], pos: { x: 38, y: 13 }, hue: 18, photos: 4,
  },
  {
    id: 'heitea', name: 'Hēi Tea House', type: 'cafe', cuisines: ['Asian', 'Desserts'],
    vibes: ['Instagrammable', 'Work Friendly'], budget: 3, area: 'Juhu', station: 'Vile Parle',
    address: 'Juhu Tara Road, Juhu', phone: '+91 99302 18874', insta: 'hei.teahouse',
    hoursText: [['Mon – Sun', '10:00 AM – 10:00 PM']], open: 10, close: 22, closedDays: [],
    visited: false, ratings: null, mustTry: null, note: null, bestTime: null,
    liveMusic: false, boardGames: false, pureVeg: true,
    meals: ['brunch', 'lunch'], pos: { x: 31, y: 22 }, hue: 320, photos: 4,
  },
  {
    id: 'pasta', name: 'Pasta Per Favore', type: 'restaurant', cuisines: ['Italian'],
    vibes: ['Romantic', 'Family Dining'], budget: 3, area: 'Khar West', station: 'Khar Road',
    address: '5th Road, Khar West', phone: '+91 98203 45670', insta: 'pastaperfavore',
    hoursText: [['Tue – Sun', '12:00 PM – 11:30 PM'], ['Mon', 'Closed']], open: 12, close: 23.5, closedDays: [1],
    visited: true, ratings: { food: 4.5, service: 5, ambience: 4 },
    mustTry: ['Cacio e pepe (table-side)', 'Wood-oven burrata pizza', 'Panna cotta'],
    note: 'The cacio e pepe is finished in a cheese wheel at your table — sit near the kitchen to watch. BYOB on weeknights.',
    bestTime: 'Date nights, Tuesday–Thursday',
    liveMusic: false, boardGames: false, pureVeg: false,
    meals: ['dinner', 'brunch'], pos: { x: 34, y: 28 }, hue: 55, photos: 5,
  },
  {
    id: 'socialhouse', name: 'Bombay Social House', type: 'club', cuisines: ['Multi-Cuisine'],
    vibes: ['Party'], budget: 3, area: 'Bandra West', station: 'Bandra',
    address: 'Hill Road, Bandra West', phone: '', insta: '',
    hoursText: [], open: 0, close: 0, closedDays: [],
    visited: true, ratings: null, mustTry: null, note: null, bestTime: null,
    liveMusic: false, boardGames: false, pureVeg: false,
    meals: [], pos: { x: 31, y: 39 }, hue: 230, photos: 0,
    permanentlyClosed: true,
  },
];

// ── Time context ─────────────────────────────────────────────
const GOBBLE_TIME_PRESETS = {
  'Live clock': null,
  'Weekday 8 AM': { weekend: false, hour: 8, label: 'Tuesday, 8:00 AM' },
  'Weekday 1 PM': { weekend: false, hour: 13, label: 'Tuesday, 1:00 PM' },
  'Weekday 8 PM': { weekend: false, hour: 20, label: 'Tuesday, 8:00 PM' },
  'Weekend 12 PM': { weekend: true, hour: 12, label: 'Saturday, 12:00 PM' },
  'Weekend 10 PM': { weekend: true, hour: 22, label: 'Saturday, 10:00 PM' },
};

function gobbleTimeCtx(presetKey) {
  const preset = GOBBLE_TIME_PRESETS[presetKey];
  if (preset) return { ...preset, day: preset.weekend ? 6 : 2 };
  const now = new Date();
  const day = now.getDay(); // 0 Sun … 6 Sat
  const weekend = day === 5 || day === 6 || day === 0; // Fri–Sun per PRD
  const hour = now.getHours() + now.getMinutes() / 60;
  const label = now.toLocaleDateString('en-IN', { weekday: 'long' }) + ', ' +
    now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return { weekend, hour, label, day };
}

// FR-1: which meal section applies right now
function gobbleHomeSection(tc) {
  if (!tc.weekend) {
    if (tc.hour >= 7 && tc.hour < 11) return { meal: 'breakfast', title: 'Breakfast, sorted', sub: 'Open right now for the first meal' };
    if (tc.hour >= 11 && tc.hour < 15) return { meal: 'lunch', title: 'Lunch break', sub: 'Where to go in the next hour' };
    if (tc.hour >= 19) return { meal: 'dinner', title: 'Dinner tonight', sub: 'Curated tables for this evening' };
  } else {
    if (tc.hour >= 10 && tc.hour < 15) return { meal: 'brunch', title: 'Weekend brunch', sub: 'Slow mornings, long tables' };
    if (tc.hour >= 21) return { meal: 'party', title: 'Tonight, out out', sub: 'Dinner & party picks for the weekend' };
  }
  return { meal: null, title: 'Explore Mumbai', sub: 'Every place, personally vetted' };
}

// Open-now from time context
function gobbleIsOpen(place, tc) {
  if (place.permanentlyClosed) return false;
  if (place.closedDays.includes(tc.day)) return false;
  const h = tc.hour;
  if (place.close > 24) return h >= place.open || h < place.close - 24;
  return h >= place.open && h < place.close;
}

// ── Filters ──────────────────────────────────────────────────
const GOBBLE_EMPTY_FILTERS = { cuisine: [], type: [], vibe: [], budget: [], area: [], openNow: false, liveMusic: 'Any', boardGames: 'Any', pureVeg: 'Any' };

function gobbleApplyFilters(places, f, tc) {
  return places.filter(p => {
    if (p.permanentlyClosed) return false;
    if (f.cuisine.length && !f.cuisine.some(c => p.cuisines.includes(c))) return false;
    if (f.type.length && !f.type.includes(p.type)) return false;
    if (f.vibe.length && !f.vibe.some(v => p.vibes.includes(v))) return false;
    if (f.budget.length && !f.budget.includes(p.budget)) return false;
    if (f.area.length && !f.area.includes(p.area)) return false;
    if (f.openNow && !gobbleIsOpen(p, tc)) return false;
    if (f.liveMusic !== 'Any' && p.liveMusic !== (f.liveMusic === 'Yes')) return false;
    if (f.boardGames !== 'Any' && p.boardGames !== (f.boardGames === 'Yes')) return false;
    if (f.pureVeg !== 'Any' && p.pureVeg !== (f.pureVeg === 'Yes')) return false;
    return true;
  });
}

function gobbleActiveFilterChips(f) {
  const chips = [];
  f.cuisine.forEach(v => chips.push({ group: 'cuisine', value: v, label: v }));
  f.type.forEach(v => chips.push({ group: 'type', value: v, label: GOBBLE_TYPES[v].label }));
  f.vibe.forEach(v => chips.push({ group: 'vibe', value: v, label: v }));
  f.budget.forEach(v => chips.push({ group: 'budget', value: v, label: '★'.repeat(v) }));
  f.area.forEach(v => chips.push({ group: 'area', value: v, label: v }));
  if (f.openNow) chips.push({ group: 'openNow', value: true, label: 'Open now' });
  ['liveMusic', 'boardGames', 'pureVeg'].forEach(k => {
    if (f[k] !== 'Any') chips.push({ group: k, value: f[k], label: ({ liveMusic: 'Live music', boardGames: 'Board games', pureVeg: 'Pure veg' })[k] + ': ' + f[k] });
  });
  return chips;
}

function gobbleAvgRating(r) {
  if (!r) return null;
  return Math.round(((r.food + r.service + r.ambience) / 3) * 10) / 10;
}

Object.assign(window, {
  GOBBLE_PLACES, GOBBLE_TYPES, GOBBLE_FILTER_DEFS, GOBBLE_EMPTY_FILTERS, GOBBLE_TIME_PRESETS,
  gobbleTimeCtx, gobbleHomeSection, gobbleIsOpen, gobbleApplyFilters, gobbleActiveFilterChips, gobbleAvgRating,
});
