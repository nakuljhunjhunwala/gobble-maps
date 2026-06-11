// Gobble Maps — shared components: icons, photos, cards, pins, map canvas, sheets
const GobbleCtx = React.createContext(null);

// ── Icons (stroke line icons, 24 viewBox) ───────────────────
const GB_ICON_PATHS = {
  fork: <g><path d="M7 3v5a2 2 0 0 0 2 2h0V3M9 10v11M5 3v5"/><path d="M16 3c-1.5 1-2.5 3.5-2.5 6 0 2 .9 3 2.5 3v9M16 3c1 .8 1.8 3 1.8 5"/></g>,
  coffee: <g><path d="M4 9h11v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z"/><path d="M15 10h2a2.5 2.5 0 0 1 0 5h-2M7 5.5c0-1 .8-1 .8-2M11 5.5c0-1 .8-1 .8-2"/></g>,
  cocktail: <g><path d="M5 4h14l-7 8-7-8zM12 12v7M8.5 21h7"/><path d="M9 7.5h6"/></g>,
  cake: <g><path d="M6 11c0-3 2.5-5 6-5s6 2 6 5c0 1.2-1 2-2 1.6-.8-.3-1.3-.3-2 0-.7.4-1.3.4-2 0-.7-.3-1.2-.3-2 0-1 .4-2-.4-2-1.6h-2z" transform="translate(0,-1)"/><path d="M7 11l1.4 8.2c.1.5.5.8 1 .8h5.2c.5 0 .9-.3 1-.8L17 11M12 3v2"/></g>,
  cart: <g><path d="M3 8l2-4h14l2 4H3zM5 8v9M19 8v9M5 13h14"/><circle cx="8" cy="19.5" r="1.5"/><circle cx="16" cy="19.5" r="1.5"/></g>,
  beer: <g><path d="M6 8h10v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"/><path d="M16 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M6 8c-1.2-.5-2-1.5-2-2.7C4 3.6 5.4 3 6.5 3 7 1.8 8.3 1.2 9.6 1.6c.8-.8 2.6-.8 3.4.2 1.6-.5 3 .6 3 2.2 0 1.4-.8 2.4-2 2.8" transform="translate(0,1)"/><path d="M9 12v6M13 12v6"/></g>,
  search: <g><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></g>,
  sliders: <g><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></g>,
  heart: <path d="M12 20.5S3.5 15.5 3.5 9.3C3.5 6.4 5.7 4.5 8 4.5c1.7 0 3.2.9 4 2.3.8-1.4 2.3-2.3 4-2.3 2.3 0 4.5 1.9 4.5 4.8 0 6.2-8.5 11.2-8.5 11.2z"/>,
  bookmark: <path d="M6 4.5h12a1 1 0 0 1 1 1V21l-7-4.2L5 21V5.5a1 1 0 0 1 1-1z" transform="translate(0,-1)"/>,
  check: <path d="M4.5 12.5l5 5L19.5 6.5"/>,
  share: <g><path d="M12 3v12M8 6.5L12 3l4 3.5"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></g>,
  chevL: <path d="M14.5 4.5L7 12l7.5 7.5"/>,
  chevR: <path d="M9.5 4.5L17 12l-7.5 7.5"/>,
  chevD: <path d="M5 9l7 7 7-7"/>,
  star: <path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2-5.6-3.2L6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3z"/>,
  nav: <path d="M21 3L10 21l-1.5-7.5L1 12 21 3z" transform="translate(1,0) scale(0.92)"/>,
  phone: <path d="M5 4h4l1.5 5L8 11a13 13 0 0 0 5 5l2-2.5 5 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>,
  instagram: <g><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor"/></g>,
  clock: <g><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></g>,
  list: <g><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></g>,
  user: <g><circle cx="12" cy="8" r="4"/><path d="M4.5 21c1-4 4-6 7.5-6s6.5 2 7.5 6"/></g>,
  home: <path d="M4 11l8-7.5L20 11v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9z"/>,
  map: <g><path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4zM9 4v14M15 6v14"/></g>,
  x: <path d="M6 6l12 12M18 6L6 18"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  flag: <path d="M5 21V4c4-2.2 8 2.2 12 0v10c-4 2.2-8-2.2-12 0"/>,
  music: <g><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></g>,
  dice: <g><rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/></g>,
  leaf: <path d="M5 20C5 10 11 4 20 4c0 9-6 15-15 16zM5 20c2-5 5-8 9-10"/>,
  lock: <g><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></g>,
  globe: <g><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c-2.5 2.3-3.8 5.2-3.8 8.5s1.3 6.2 3.8 8.5c2.5-2.3 3.8-5.2 3.8-8.5s-1.3-6.2-3.8-8.5z"/></g>,
  arrowUR: <path d="M7 17L17 7M9 7h8v8"/>,
  info: <g><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.7" fill="currentColor"/></g>,
  train: <g><rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 11h12M9.5 20.5L8 23M14.5 20.5L16 23M9 16.5L8 20.5h8l-1-4"/><circle cx="9.5" cy="13.8" r="0.7" fill="currentColor"/><circle cx="14.5" cy="13.8" r="0.7" fill="currentColor"/></g>,
  pinOutline: <g><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></g>,
  edit: <path d="M16.5 4.5l3 3L8 19l-4 1 1-4L16.5 4.5z"/>,
  logout: <g><path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8"/><path d="M10 12h10M17 8.5l3.5 3.5L17 15.5"/></g>,
  offline: <g><path d="M1.5 1.5l21 21" /><path d="M5 10a11 11 0 0 1 4-2.5M2 7.5A15 15 0 0 1 5.6 5M12 14.5a4.5 4.5 0 0 1 3.5 1.6M22 7.5a15 15 0 0 0-7-3.9M18.8 10.7A11 11 0 0 0 14 8.3"/><circle cx="12" cy="20" r="1" fill="currentColor"/></g>,
};

function GIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, fill = 'none', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block', color, ...style }}>
      {GB_ICON_PATHS[name] || <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

// ── Photo placeholder (admin uploads in production) ─────────
function GPhoto({ place, idx = 0, style = {}, iconSize = 36, showNote = false }) {
  const h = (place.hue + idx * 14) % 360;
  return (
    <div style={{
      background: `linear-gradient(150deg, oklch(0.88 0.055 ${h}) 0%, oklch(0.74 0.085 ${h + 25}) 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      overflow: 'hidden', ...style,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 18% 12%, rgba(255,255,255,0.4), transparent 55%)' }}></div>
      <GIcon name={GOBBLE_TYPES[place.type].icon} size={iconSize} color={`oklch(0.45 0.07 ${h})`} strokeWidth={1.5} style={{ opacity: 0.5, position: 'relative' }} />
      {showNote && (
        <span style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, letterSpacing: 0.3, color: `oklch(0.4 0.06 ${h})`, opacity: 0.75, fontWeight: 600 }}>
          Photo {idx + 1} · curator upload
        </span>
      )}
    </div>
  );
}

// ── Small atoms ──────────────────────────────────────────────
function GBudget({ n, size = 11 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1, alignItems: 'center' }} title={`Budget ${n}/5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <GIcon key={i} name="star" size={size} strokeWidth={1.6}
          fill={i <= n ? 'var(--gb-sky-deep)' : 'none'}
          color={i <= n ? 'var(--gb-sky-deep)' : 'var(--gb-line)'} />
      ))}
    </span>
  );
}

function GScorePill({ score, small = false }) {
  if (score == null) return null;
  return (
    <span className="gb-score" style={small ? { fontSize: 11, padding: '2px 7px' } : {}}>
      <GIcon name="star" size={small ? 10 : 12} fill="#fff" color="#fff" /> {score}
    </span>
  );
}

function GVisitedBadge({ place, small = false }) {
  return place.visited ? (
    <span className={'gb-badge gb-badge-visited' + (small ? ' gb-badge-sm' : '')}>
      <GIcon name="check" size={small ? 10 : 12} strokeWidth={2.6} /> {small ? 'Visited' : 'Personally visited'}
    </span>
  ) : (
    <span className={'gb-badge gb-badge-unvisited' + (small ? ' gb-badge-sm' : '')}>
      <GIcon name="info" size={small ? 10 : 12} strokeWidth={2} /> {small ? 'Not yet visited' : 'Not yet visited by curator'}
    </span>
  );
}

function GOpenDot({ place }) {
  const { tc } = React.useContext(GobbleCtx);
  const open = gobbleIsOpen(place, tc);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: open ? '#15803D' : '#B4514B' }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: 'currentColor' }}></span>
      {open ? 'Open now' : 'Closed'}
    </span>
  );
}

// ── Cards ────────────────────────────────────────────────────
function GCardWide({ place }) {
  const { openPlace } = React.useContext(GobbleCtx);
  return (
    <button className="gb-card-wide" onClick={() => openPlace(place.id)}>
      <GPhoto place={place} style={{ height: 118, borderRadius: '14px 14px 0 0' }} />
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 5, textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span className="gb-card-name">{place.name}</span>
          <GScorePill score={gobbleAvgRating(place.ratings)} small={true} />
        </div>
        <div className="gb-card-meta">
          <span>{place.cuisines[0]}</span><span className="gb-dot"></span>
          <span>{place.area}</span><span className="gb-dot"></span>
          <GBudget n={place.budget} size={10} />
        </div>
        <GOpenDot place={place} />
      </div>
    </button>
  );
}

function GCardRow({ place, trailing = null, closedNote = false }) {
  const { openPlace, user, beenThere } = React.useContext(GobbleCtx);
  const closed = place.permanentlyClosed;
  return (
    <div className="gb-card-row" role="button" tabIndex={0} onClick={() => !closed && openPlace(place.id)} style={closed ? { opacity: 0.85, cursor: 'default' } : {}}>
      <GPhoto place={place} style={{ width: 78, height: 78, borderRadius: 12, flexShrink: 0 }} iconSize={26} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="gb-card-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</span>
          {user && beenThere.includes(place.id) && <GIcon name="check" size={13} color="#15803D" strokeWidth={3} />}
        </div>
        <div className="gb-card-meta">
          <span>{GOBBLE_TYPES[place.type].label}</span><span className="gb-dot"></span>
          <span>{place.area}</span><span className="gb-dot"></span>
          <GBudget n={place.budget} size={10} />
        </div>
        {closed && closedNote
          ? <span style={{ fontSize: 11.5, fontWeight: 700, color: '#B4514B' }}>This place is permanently closed.</span>
          : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GVisitedBadge place={place} small={true} />
              <GOpenDot place={place} />
            </div>}
      </div>
      {!closed && (trailing || <GScorePill score={gobbleAvgRating(place.ratings)} small={true} />)}
    </div>
  );
}

// ── Map pin ──────────────────────────────────────────────────
function GPin({ place, onTap, showLabel = false, dimmed = false }) {
  const { user, beenThere } = React.useContext(GobbleCtx);
  const been = user && beenThere.includes(place.id);
  const bg = place.visited ? 'var(--gb-sky-deep)' : '#9FB3C4';
  return (
    <button className="gb-pin" onClick={onTap}
      style={{ left: place.pos.x + '%', top: place.pos.y + '%', opacity: dimmed ? 0.25 : 1, pointerEvents: dimmed ? 'none' : 'auto' }}>
      <span className="gb-pin-head" style={{ background: bg }}>
        <GIcon name={GOBBLE_TYPES[place.type].icon} size={14} color="#fff" strokeWidth={2} />
        {been && <span className="gb-pin-been"><GIcon name="check" size={8} color="#fff" strokeWidth={3.5} /></span>}
      </span>
      <span className="gb-pin-tail" style={{ borderTopColor: bg }}></span>
      {showLabel && <span className="gb-pin-label">{place.name}</span>}
    </button>
  );
}

// ── Stylised Mumbai map canvas (Google Maps SDK in production) ──
function GMapCanvas({ children, style = {} }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#BFDCEE', ...style }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* land */}
        <path d="M22,-2 L70,-2 L72,6 C73,14 71,22 67,30 C64,38 62,46 61,54 C60,64 58,76 55,88 C54,93 52,98 50,102 L43,102 C43,96 44,90 43,84 C42,76 43,70 41,64 C39,58 36,62 34,56 C32,50 36,46 34,42 C32,38 27,40 27,34 C27,28 31,26 30,20 C29,14 24,10 22,4 Z" fill="#EBF0E4" />
        {/* eastern land mass (Navi Mumbai) */}
        <path d="M84,-2 L102,-2 L102,102 L78,102 C80,92 80,80 82,68 C84,56 82,44 84,32 C86,20 84,8 84,-2 Z" fill="#EBF0E4" />
        {/* green patches */}
        <ellipse cx="56" cy="16" rx="9" ry="8" fill="#D9E8CB" />
        <ellipse cx="50" cy="44" rx="4.5" ry="6" fill="#D9E8CB" />
        <ellipse cx="90" cy="50" rx="5" ry="9" fill="#D9E8CB" />
        {/* roads */}
        <path d="M31,0 C36,12 38,20 39,30 C41,42 46,50 46,60 C46,72 45,82 44,98" fill="none" stroke="#fff" strokeWidth="1.1" />
        <path d="M50,0 C52,10 54,22 53,34 C52,44 49,54 48,64" fill="none" stroke="#fff" strokeWidth="0.8" />
        <path d="M39,30 C46,32 52,36 58,37 C66,38 74,36 84,34" fill="none" stroke="#fff" strokeWidth="0.8" />
        <path d="M46,60 C52,60 58,62 64,61" fill="none" stroke="#fff" strokeWidth="0.7" />
        {/* sea link */}
        <path d="M30,41 C28,48 31,54 35,60" fill="none" stroke="#fff" strokeWidth="0.9" strokeDasharray="2 1.2" opacity="0.9" />
        {/* water texture */}
        <path d="M10,30 q3,-1.5 6,0 M8,55 q3,-1.5 6,0 M14,78 q3,-1.5 6,0 M70,80 q3,-1.5 6,0 M72,55 q3,-1.5 6,0" stroke="#A9CFE8" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        {/* area labels */}
        {[['ANDHERI', 44, 12], ['POWAI', 64, 20], ['JUHU', 26, 24], ['BANDRA', 27, 35.5], ['BKC', 52, 41], ['MATUNGA', 56, 52], ['WORLI', 31, 64], ['LOWER PAREL', 50, 64], ['FORT', 53, 83], ['COLABA', 50, 95], ['ARABIAN SEA', 12, 45]].map(([t, x, y]) => (
          <text key={t} x={x} y={y} fontSize="2.5" fontWeight="700" letterSpacing="0.5" fill={t === 'ARABIAN SEA' ? '#7FAECC' : '#9DAFA4'} fontFamily="'Albert Sans', sans-serif" fontStyle={t === 'ARABIAN SEA' ? 'italic' : 'normal'}>{t}</text>
        ))}
      </svg>
      {children}
    </div>
  );
}

// ── Sheets, toasts, prompts ──────────────────────────────────
function GSheet({ onClose, children, maxH = '78%' }) {
  return (
    <div className="gb-overlay" onClick={onClose}>
      <div className="gb-sheet" style={{ maxHeight: maxH }} onClick={e => e.stopPropagation()}>
        <div className="gb-sheet-handle"></div>
        {children}
      </div>
    </div>
  );
}

function GSectionTitle({ title, sub, action = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 18px', gap: 12 }}>
      <div>
        <h2 className="gb-h2">{title}</h2>
        {sub && <p className="gb-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

Object.assign(window, {
  GobbleCtx, GIcon, GPhoto, GBudget, GScorePill, GVisitedBadge, GOpenDot,
  GCardWide, GCardRow, GPin, GMapCanvas, GSheet, GSectionTitle,
});
