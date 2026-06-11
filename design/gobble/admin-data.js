// Gobble Maps Admin — sample operational data (prototype)

const ADMIN_USERS = [
  { username: 'vada_pav_vigilante', joined: '12 Jan 2026', lastActive: 'Today', been: 14, wish: 22, lists: 3 },
  { username: 'bandra_bites', joined: '03 Feb 2026', lastActive: 'Today', been: 9, wish: 17, lists: 2 },
  { username: 'chai_pe_charcha', joined: '18 Feb 2026', lastActive: 'Yesterday', been: 6, wish: 11, lists: 1 },
  { username: 'powai_paula', joined: '02 Mar 2026', lastActive: '3 days ago', been: 4, wish: 8, lists: 1 },
  { username: 'misal_missile', joined: '21 Mar 2026', lastActive: 'Today', been: 11, wish: 5, lists: 4 },
  { username: 'south.bombay.sue', joined: '09 Apr 2026', lastActive: '1 week ago', been: 2, wish: 19, lists: 2 },
  { username: 'dosa_daddy', joined: '27 Apr 2026', lastActive: 'Yesterday', been: 7, wish: 9, lists: 0 },
  { username: 'late_night_lassi', joined: '15 May 2026', lastActive: 'Today', been: 3, wish: 13, lists: 1 },
];

const ADMIN_REPORTS = [
  { id: 'R-1041', placeId: 'gully', by: 'bandra_bites', text: 'Phone number goes to a different restaurant now.', date: '10 Jun 2026', status: 'Open' },
  { id: 'R-1040', placeId: 'annas', by: 'dosa_daddy', text: 'Cart has moved ~200m, now opposite the station exit.', date: '09 Jun 2026', status: 'Open' },
  { id: 'R-1037', placeId: 'velvet', by: 'misal_missile', text: 'Closed for renovation till July, maybe mark temporarily closed?', date: '06 Jun 2026', status: 'Open' },
  { id: 'R-1029', placeId: 'heitea', by: 'south.bombay.sue', text: 'Opening hours are wrong — they open at 11 AM, not 10.', date: '28 May 2026', status: 'Resolved' },
  { id: 'R-1022', placeId: 'socialhouse', by: 'vada_pav_vigilante', text: 'This place has shut down permanently.', date: '19 May 2026', status: 'Resolved' },
];

const ADMIN_NOTIFS = [
  { id: 'N-218', type: 'New Place', msg: '🍴 New spot on Gobble Maps! Pasta Per Favore in Khar West just dropped. Check it out!', date: '02 Jun 2026', recipients: 'All users · 1,284' },
  { id: 'N-217', type: 'Area-based', msg: '📍 New place near your saved spots! Brewdock BKC just added in BKC.', date: '24 May 2026', recipients: 'BKC savers · 312' },
  { id: 'N-214', type: 'Manual', msg: 'Monsoon picks are live — 6 places worth getting wet for ☔', date: '11 May 2026', recipients: 'All users · 1,151' },
];

const ADMIN_TBT = [
  { id: 'T-1', name: 'Khichdi Experiment', address: 'Versova, Andheri West', notes: 'Three reels in one week — modern khichdi tasting menu. Suspicious but curious.', date: '08 Jun 2026', status: 'Pending Visit' },
  { id: 'T-2', name: 'Bombil & Co.', address: 'Ranade Road, Dadar West', notes: 'Old-school Malvani place, recommended by Anna himself.', date: '04 Jun 2026', status: 'Pending Visit' },
  { id: 'T-3', name: 'Cold Brew Koliwada', address: 'Worli Koliwada', notes: 'Café inside a fishing-village heritage home. Check weekend crowd.', date: '29 May 2026', status: 'Pending Visit' },
  { id: 'T-4', name: 'The Idli Project', address: 'Hiranandani, Powai', notes: '12 kinds of idli. Office-lunch potential for Powai crowd.', date: '21 May 2026', status: 'Pending Visit' },
];

// Metrics per date range (PRD 10.1)
const ADMIN_METRICS = {
  'Today':      { users: 1284, signups: 9,   dau: 214, wau: 643, mau: 1009, mapOpens: 388, shares: 41, reportsOpen: 3 },
  'This week':  { users: 1284, signups: 56,  dau: 214, wau: 643, mau: 1009, mapOpens: 2410, shares: 233, reportsOpen: 3 },
  'This month': { users: 1284, signups: 217, dau: 214, wau: 643, mau: 1009, mapOpens: 9866, shares: 1018, reportsOpen: 3 },
  'All time':   { users: 1284, signups: 1284, dau: 214, wau: 643, mau: 1009, mapOpens: 41205, shares: 3922, reportsOpen: 3 },
};

const ADMIN_MAP_OPENS_7D = [
  { d: 'Fri', v: 402 }, { d: 'Sat', v: 511 }, { d: 'Sun', v: 468 }, { d: 'Mon', v: 287 },
  { d: 'Tue', v: 301 }, { d: 'Wed', v: 329 }, { d: 'Thu', v: 388 },
];

// top-10 style lists keyed by place id
const ADMIN_TOP_SAVED = [['saltwater', 188], ['koyo', 164], ['velvet', 121], ['cinnamon', 102], ['pasta', 96], ['brewdock', 88], ['heitea', 61], ['mamawong', 54], ['sodade', 49], ['tatva', 41]];
const ADMIN_TOP_VISITED = [['tatva', 142], ['annas', 131], ['cinnamon', 97], ['sodade', 85], ['mamawong', 71], ['brewdock', 64], ['koyo', 52], ['pasta', 47], ['saltwater', 33], ['velvet', 29]];
const ADMIN_TOP_SHARED = [['koyo', 96], ['saltwater', 91], ['velvet', 74], ['annas', 58], ['cinnamon', 51], ['brewdock', 44], ['pasta', 38], ['heitea', 27], ['sodade', 22], ['mamawong', 18]];

const ADMIN_TOP_AREAS = [['Bandra West', 31], ['Lower Parel', 17], ['BKC', 13], ['Fort', 11], ['Powai', 9], ['Worli', 8], ['Churchgate', 6], ['Juhu', 5]];
const ADMIN_TOP_CUISINES = [['Multi-Cuisine', 24], ['South Indian', 19], ['Japanese', 15], ['Italian', 13], ['Desserts', 11], ['Chinese', 9], ['Asian', 6], ['North Indian', 3]];
const ADMIN_TOP_FILTERS = [['Open now', 1410], ['Vibe: Romantic', 980], ['Budget ★★', 861], ['Cuisine: Japanese', 704], ['Pure veg: Yes', 633], ['Area: Bandra West', 612], ['Live music: Yes', 388]];

Object.assign(window, {
  ADMIN_USERS, ADMIN_REPORTS, ADMIN_NOTIFS, ADMIN_TBT, ADMIN_METRICS,
  ADMIN_MAP_OPENS_7D, ADMIN_TOP_SAVED, ADMIN_TOP_VISITED, ADMIN_TOP_SHARED,
  ADMIN_TOP_AREAS, ADMIN_TOP_CUISINES, ADMIN_TOP_FILTERS,
});
