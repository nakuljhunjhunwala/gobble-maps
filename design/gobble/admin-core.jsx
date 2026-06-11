// Gobble Maps Admin — context, shared atoms, Dashboard
const AdminCtx = React.createContext(null);

// ── Atoms ────────────────────────────────────────────────────
function AStat({ label, value, hint }) {
  return (
    <div className="ad-card ad-stat">
      <span className="ad-stat-label">{label}</span>
      <span className="ad-stat-value">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</span>
      {hint && <span className="ad-stat-hint">{hint}</span>}
    </div>
  );
}

function ABadge({ tone = 'grey', children }) {
  const tones = {
    grey: { background: '#EFF3F6', color: '#5E7C8C' },
    sky: { background: '#EAF5FC', color: '#1D7FB8' },
    green: { background: '#E8F5EC', color: '#15803D' },
    red: { background: '#FBEAE8', color: '#B4514B' },
    amber: { background: '#FFF4DE', color: '#8A6116' },
    ink: { background: '#14313F', color: '#fff' },
  };
  return <span className="ad-badge" style={tones[tone]}>{children}</span>;
}

function AColChart({ data, height = 120 }) {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height, paddingTop: 8 }}>
      {data.map(d => (
        <div key={d.d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gb-mut)' }}>{d.v}</span>
          <div style={{ width: '100%', maxWidth: 38, borderRadius: '6px 6px 2px 2px', background: 'linear-gradient(180deg, var(--gb-sky), var(--gb-deep))', height: Math.max(6, (d.v / max) * (height - 44)) }}></div>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gb-mut)' }}>{d.d}</span>
        </div>
      ))}
    </div>
  );
}

function ABars({ data, unit = '' }) {
  const max = Math.max(...data.map(d => d[1]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(([label, v]) => (
        <div key={label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 38px', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--gb-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          <div style={{ height: 7, borderRadius: 99, background: 'var(--gb-sky-50)' }}>
            <div style={{ width: (v / max * 100) + '%', height: '100%', borderRadius: 99, background: 'var(--gb-deep)' }}></div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gb-mut)', textAlign: 'right' }}>{v}{unit}</span>
        </div>
      ))}
    </div>
  );
}

function ATopList({ title, rows, unit }) {
  const { placeById } = React.useContext(AdminCtx);
  return (
    <div className="ad-card">
      <p className="ad-card-title">{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.slice(0, 5).map(([id, n], i) => {
          const p = placeById(id);
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--gb-line)' : 'none' }}>
              <span style={{ width: 18, fontSize: 11, fontWeight: 800, color: i < 3 ? 'var(--gb-deep)' : 'var(--gb-mut)' }}>{i + 1}</span>
              <GPhoto place={p} style={{ width: 30, height: 30, borderRadius: 8 }} iconSize={14} />
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: 'var(--gb-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gb-mut)' }}>{n} {unit}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AModal({ title, onClose, children, wide = false, footer = null }) {
  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className={'ad-modal' + (wide ? ' ad-modal-wide' : '')} onClick={e => e.stopPropagation()}>
        <div className="ad-modal-head">
          <h3 className="ad-h3">{title}</h3>
          <button className="ad-iconbtn" onClick={onClose}><GIcon name="x" size={15} strokeWidth={2.4} /></button>
        </div>
        <div className="ad-modal-body">{children}</div>
        {footer && <div className="ad-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function AField({ label, children, note }) {
  return (
    <label className="ad-field">
      <span className="ad-flabel">{label}</span>
      {children}
      {note && <span style={{ fontSize: 11, color: 'var(--gb-mut)' }}>{note}</span>}
    </label>
  );
}

// ── Dashboard (PRD 10.1) ─────────────────────────────────────
function ADashboard() {
  const { reports } = React.useContext(AdminCtx);
  const [range, setRange] = React.useState('This week');
  const m = ADMIN_METRICS[range];
  const openReports = reports.filter(r => r.status === 'Open').length;

  return (
    <div data-screen-label="Admin Dashboard">
      <div className="ad-pagehead">
        <div>
          <h2 className="ad-h2">Dashboard</h2>
          <p className="ad-sub">How Gobble Maps is doing — {range.toLowerCase()}</p>
        </div>
        <div className="gb-seg">
          {Object.keys(ADMIN_METRICS).map(r => (
            <button key={r} className={range === r ? 'gb-seg-on' : ''} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div className="ad-statgrid">
        <AStat label="Total users" value={m.users} />
        <AStat label="New signups" value={m.signups} hint={range.toLowerCase()} />
        <AStat label="Daily active" value={m.dau} hint="DAU" />
        <AStat label="Weekly active" value={m.wau} hint="WAU" />
        <AStat label="Monthly active" value={m.mau} hint="MAU" />
        <AStat label="Map opens" value={m.mapOpens} hint={range.toLowerCase()} />
        <AStat label="Places shared" value={m.shares} hint={range.toLowerCase()} />
        <AStat label="Open reports" value={openReports} hint="needs attention" />
      </div>

      <div className="ad-grid2">
        <div className="ad-card">
          <p className="ad-card-title">Map opens per day</p>
          <AColChart data={ADMIN_MAP_OPENS_7D} />
        </div>
        <div className="ad-card">
          <p className="ad-card-title">Most used filters</p>
          <ABars data={ADMIN_TOP_FILTERS.slice(0, 6)} />
        </div>
      </div>

      <div className="ad-grid3">
        <ATopList title="Most saved · Can't Wait to Go" rows={ADMIN_TOP_SAVED} unit="saves" />
        <ATopList title="Most visited · Been There" rows={ADMIN_TOP_VISITED} unit="visits" />
        <ATopList title="Most shared" rows={ADMIN_TOP_SHARED} unit="shares" />
      </div>

      <div className="ad-grid2">
        <div className="ad-card">
          <p className="ad-card-title">Most popular areas</p>
          <ABars data={ADMIN_TOP_AREAS} unit="%" />
        </div>
        <div className="ad-card">
          <p className="ad-card-title">Most popular cuisines</p>
          <ABars data={ADMIN_TOP_CUISINES} unit="%" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminCtx, AStat, ABadge, AColChart, ABars, ATopList, AModal, AField, ADashboard });
