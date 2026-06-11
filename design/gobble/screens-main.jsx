// Gobble Maps — Home, Map, Search screens + Filter sheet

// ── Offline banner (FR-16) ───────────────────────────────────
function GOfflineBanner() {
  const { tweaks } = React.useContext(GobbleCtx);
  if (!tweaks.offline) return null;
  return (
    <div className="gb-offline">
      <GIcon name="offline" size={14} strokeWidth={2} /> You're offline. Some content may not load.
    </div>
  );
}

// ── Home ─────────────────────────────────────────────────────
function GHomeScreen() {
  const ctx = React.useContext(GobbleCtx);
  const { tc, user, filters, setTab, openPlace, openAuth, openFilters, tweaks } = ctx;
  const section = gobbleHomeSection(tc);
  const visible = gobbleApplyFilters(GOBBLE_PLACES, filters, tc);
  const mealPicks = section.meal
    ? visible.filter(p => p.meals.includes(section.meal)).sort((a, b) => b.visited - a.visited)
    : visible.slice(0, 5);
  const chips = gobbleActiveFilterChips(filters);

  return (
    <div className="gb-screen" data-screen-label="Home">
      <GOfflineBanner />
      {/* header */}
      <header style={{ padding: '8px 18px 2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="gb-brand">
            <span className="gb-brand-mark"><GIcon name="pinOutline" size={17} color="#fff" strokeWidth={2.2} /></span>
            Gobble Maps
          </div>
          <p className="gb-sub" style={{ marginTop: 3 }}>Mumbai · every place personally vetted</p>
        </div>
        {user ? (
          <button className="gb-avatar" onClick={() => setTab('profile')}>{user.username[0].toUpperCase()}</button>
        ) : (
          <button className="gb-btn gb-btn-sm" onClick={() => openAuth()}>Log in</button>
        )}
      </header>

      {/* search + filter row */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 18px 4px' }}>
        <button className="gb-searchbar" onClick={() => setTab('search')}>
          <GIcon name="search" size={16} color="var(--gb-mut)" /> Search places, cuisines, areas…
        </button>
        <button className="gb-iconbtn" onClick={openFilters} style={{ position: 'relative' }}>
          <GIcon name="sliders" size={18} color="var(--gb-ink)" />
          {chips.length > 0 && <span className="gb-filter-count">{chips.length}</span>}
        </button>
      </div>

      {/* time & day section (FR-1) */}
      <div style={{ marginTop: 14 }}>
        <GSectionTitle title={section.title} sub={section.sub + ' · ' + tc.label} />
        <div className="gb-rail">
          {mealPicks.length === 0 && <p className="gb-empty" style={{ padding: '8px 4px' }}>Nothing matches your filters here.</p>}
          {mealPicks.map(p => <GCardWide key={p.id} place={p} />)}
        </div>
      </div>

      {/* map preview */}
      <div style={{ marginTop: 6 }}>
        <GSectionTitle title="On the map" sub={visible.length + ' places around Mumbai'}
          action={<button className="gb-link" onClick={() => setTab('map')}>Open map</button>} />
        <button onClick={() => setTab('map')} style={{ display: 'block', width: 'calc(100% - 36px)', margin: '10px 18px 0', padding: 0, border: '1px solid var(--gb-line)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: 'none' }}>
          <GMapCanvas style={{ height: 170, borderRadius: 15 }}>
            {visible.map(p => (
              <span key={p.id} className="gb-minipin" style={{ left: p.pos.x + '%', top: p.pos.y + '%', background: p.visited ? 'var(--gb-sky-deep)' : '#9FB3C4' }}></span>
            ))}
          </GMapCanvas>
        </button>
      </div>

      {/* vertical list */}
      <div style={{ marginTop: 18, paddingBottom: 24 }}>
        <GSectionTitle title="All places" sub="The full curated list" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 18px 0' }}>
          {visible.map(p => <GCardRow key={p.id} place={p} />)}
          {visible.length === 0 && <p className="gb-empty">No places match your filters. <button className="gb-link" onClick={ctx.clearFilters}>Clear all</button></p>}
        </div>
      </div>
    </div>
  );
}

// ── Map screen ───────────────────────────────────────────────
function GMapScreen() {
  const ctx = React.useContext(GobbleCtx);
  const { tc, filters, openPlace, openFilters, removeFilterChip, showToast, tweaks } = ctx;
  const [locQuery, setLocQuery] = React.useState('');
  const [userDot, setUserDot] = React.useState(null);
  const visible = gobbleApplyFilters(GOBBLE_PLACES, filters, tc);
  const chips = gobbleActiveFilterChips(filters);

  const useMyLocation = () => {
    setUserDot({ x: 33, y: 36 });
    showToast('Centred on your location — Bandra West');
  };
  const submitLoc = (e) => {
    e.preventDefault();
    if (!locQuery.trim()) return;
    setUserDot(null);
    showToast('Map centred on “' + locQuery.trim() + '”');
  };

  return (
    <div className="gb-screen" data-screen-label="Map" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <GOfflineBanner />
      {/* location controls */}
      <div style={{ padding: '8px 14px 8px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <form onSubmit={submitLoc} className="gb-searchbar" style={{ cursor: 'text', flex: 1 }}>
            <GIcon name="search" size={16} color="var(--gb-mut)" />
            <input value={locQuery} onChange={e => setLocQuery(e.target.value)} placeholder="Search a Mumbai location…"
              style={{ border: 'none', outline: 'none', background: 'none', font: 'inherit', color: 'var(--gb-ink)', width: '100%' }} />
          </form>
          <button className="gb-iconbtn" onClick={openFilters} style={{ position: 'relative' }}>
            <GIcon name="sliders" size={18} color="var(--gb-ink)" />
            {chips.length > 0 && <span className="gb-filter-count">{chips.length}</span>}
          </button>
        </div>
        {chips.length > 0 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {chips.map((c, i) => (
              <button key={i} className="gb-chip gb-chip-on" onClick={() => removeFilterChip(c)} style={{ flexShrink: 0 }}>
                {c.label} <GIcon name="x" size={11} strokeWidth={2.5} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <GMapCanvas style={{ position: 'absolute', inset: 0 }}>
          {GOBBLE_PLACES.filter(p => !p.permanentlyClosed).map(p => {
            const match = visible.includes(p);
            return <GPin key={p.id} place={p} dimmed={!match} showLabel={tweaks.pinLabels || tweaks.offline} onTap={() => openPlace(p.id, { fromMap: true })} />;
          })}
          {userDot && (
            <span className="gb-userdot" style={{ left: userDot.x + '%', top: userDot.y + '%' }}>
              <span className="gb-userdot-pulse"></span>
            </span>
          )}
        </GMapCanvas>

        {/* floating controls */}
        <button className="gb-fab" onClick={useMyLocation} style={{ position: 'absolute', right: 14, bottom: 18 }}>
          <GIcon name="nav" size={17} color="var(--gb-sky-deep)" strokeWidth={2} /> Use my location
        </button>
        <span className="gb-map-count">{visible.length} places</span>
        {/* legend */}
        <div className="gb-legend">
          <span><span className="gb-legend-dot" style={{ background: 'var(--gb-sky-deep)' }}></span> Visited & reviewed</span>
          <span><span className="gb-legend-dot" style={{ background: '#9FB3C4' }}></span> Not yet visited</span>
        </div>
      </div>
    </div>
  );
}

// ── Search ───────────────────────────────────────────────────
function GSearchScreen() {
  const ctx = React.useContext(GobbleCtx);
  const [q, setQ] = React.useState('');
  const query = q.trim().toLowerCase();
  const results = query ? GOBBLE_PLACES.filter(p =>
    [p.name, p.area, p.station, ...p.cuisines, ...p.vibes, GOBBLE_TYPES[p.type].label]
      .join(' ').toLowerCase().includes(query)
  ) : [];

  return (
    <div className="gb-screen" data-screen-label="Search">
      <GOfflineBanner />
      <div style={{ padding: '10px 18px 4px' }}>
        <h2 className="gb-h2" style={{ fontSize: 24 }}>Search</h2>
        <div className="gb-searchbar" style={{ marginTop: 10, cursor: 'text' }}>
          <GIcon name="search" size={16} color="var(--gb-mut)" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Place, cuisine, area or keyword…"
            style={{ border: 'none', outline: 'none', background: 'none', font: 'inherit', color: 'var(--gb-ink)', width: '100%' }} />
          {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}><GIcon name="x" size={15} color="var(--gb-mut)" strokeWidth={2.2} /></button>}
        </div>
      </div>

      {!query && (
        <div style={{ padding: '16px 18px' }}>
          <p className="gb-sub" style={{ marginBottom: 10 }}>Try searching for</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Japanese', 'Bandra West', 'Romantic', 'Dosa cart', 'Brewery', 'Work Friendly'].map(s => (
              <button key={s} className="gb-chip" onClick={() => setQ(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {query && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 18px 24px' }}>
          {results.map(p => <GCardRow key={p.id} place={p} closedNote={true} />)}
          {results.length === 0 && (
            <div className="gb-empty" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <GIcon name="search" size={28} color="var(--gb-line)" style={{ margin: '0 auto 10px' }} />
              No places found. Try a different search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Filter sheet (FR-4) ──────────────────────────────────────
function GFilterSheet() {
  const ctx = React.useContext(GobbleCtx);
  const { filters, setFilters, tc, closeFilters, clearFilters } = ctx;
  const [draft, setDraft] = React.useState(filters);
  const count = gobbleApplyFilters(GOBBLE_PLACES, draft, tc).length;

  const toggleIn = (group, value) => setDraft(d => ({
    ...d, [group]: d[group].includes(value) ? d[group].filter(v => v !== value) : [...d[group], value],
  }));
  const tri = (key, value) => setDraft(d => ({ ...d, [key]: value }));

  const chipGroup = (group, options, labelFn) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {options.map(o => (
        <button key={o} className={'gb-chip' + (draft[group].includes(o) ? ' gb-chip-on' : '')} onClick={() => toggleIn(group, o)}>
          {labelFn ? labelFn(o) : o}
        </button>
      ))}
    </div>
  );
  const triRow = (label, icon, key) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--gb-ink)' }}>
        <GIcon name={icon} size={16} color="var(--gb-mut)" /> {label}
      </span>
      <div className="gb-seg">
        {['Any', 'Yes', 'No'].map(v => (
          <button key={v} className={draft[key] === v ? 'gb-seg-on' : ''} onClick={() => tri(key, v)}>{v}</button>
        ))}
      </div>
    </div>
  );

  return (
    <GSheet onClose={closeFilters} maxH="84%">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 20px 12px' }}>
        <h3 className="gb-h2" style={{ fontSize: 20 }}>Filters</h3>
        <button className="gb-link" onClick={() => setDraft(GOBBLE_EMPTY_FILTERS)}>Clear all</button>
      </div>
      <div style={{ overflowY: 'auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="gb-fgroup"><p className="gb-flabel">Place type</p>
          {chipGroup('type', GOBBLE_FILTER_DEFS.type.options, t => GOBBLE_TYPES[t].label)}</div>
        <div className="gb-fgroup"><p className="gb-flabel">Cuisine</p>
          {chipGroup('cuisine', GOBBLE_FILTER_DEFS.cuisine.options)}</div>
        <div className="gb-fgroup"><p className="gb-flabel">Vibe</p>
          {chipGroup('vibe', GOBBLE_FILTER_DEFS.vibe.options)}</div>
        <div className="gb-fgroup"><p className="gb-flabel">Budget</p>
          {chipGroup('budget', GOBBLE_FILTER_DEFS.budget.options, n => '★'.repeat(n))}</div>
        <div className="gb-fgroup"><p className="gb-flabel">Area</p>
          {chipGroup('area', GOBBLE_FILTER_DEFS.area.options)}</div>
        <div className="gb-fgroup"><p className="gb-flabel">Timings</p>
          <div className="gb-seg" style={{ alignSelf: 'flex-start' }}>
            {[['Show all', false], ['Open now', true]].map(([l, v]) => (
              <button key={l} className={draft.openNow === v ? 'gb-seg-on' : ''} onClick={() => setDraft(d => ({ ...d, openNow: v }))}>{l}</button>
            ))}
          </div>
        </div>
        <div className="gb-fgroup" style={{ gap: 14 }}>
          {triRow('Live music', 'music', 'liveMusic')}
          {triRow('Board games', 'dice', 'boardGames')}
          {triRow('Pure veg', 'leaf', 'pureVeg')}
        </div>
        <div style={{ height: 4 }}></div>
      </div>
      <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--gb-line)' }}>
        <button className="gb-btn" style={{ width: '100%' }} onClick={() => { setFilters(draft); closeFilters(); }}>
          Show {count} {count === 1 ? 'place' : 'places'}
        </button>
      </div>
    </GSheet>
  );
}

Object.assign(window, { GHomeScreen, GMapScreen, GSearchScreen, GFilterSheet, GOfflineBanner });
