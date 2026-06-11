// Gobble Maps Admin — Places management, editor, preview, To Be Tried

const AD_STATUS_TONE = { 'Published': 'green', 'Draft': 'amber', 'Permanently Closed': 'red' };

// ── Places list (PRD 10.2) ──────────────────────────────────
function APlaces() {
  const ctx = React.useContext(AdminCtx);
  const { places, setPlaces, openEditor, openPreview, toast } = ctx;
  const [statusTab, setStatusTab] = React.useState('All');
  const [q, setQ] = React.useState('');
  const [confirm, setConfirm] = React.useState(null);

  const tabs = ['All', 'Published', 'Draft', 'Permanently Closed'];
  const rows = places.filter(p =>
    (statusTab === 'All' || p.status === statusTab) &&
    (!q.trim() || (p.name + ' ' + p.area).toLowerCase().includes(q.trim().toLowerCase()))
  );

  const markClosed = (p) => setConfirm({
    msg: 'Mark “' + p.name + '” as permanently closed? It will be removed from the map and from all user lists.',
    fn: () => { setPlaces(ps => ps.map(x => x.id === p.id ? { ...x, status: 'Permanently Closed', permanentlyClosed: true } : x)); toast('“' + p.name + '” marked permanently closed'); },
  });
  const del = (p) => setConfirm({
    msg: 'Delete “' + p.name + '” forever? This cannot be undone.',
    fn: () => { setPlaces(ps => ps.filter(x => x.id !== p.id)); toast('“' + p.name + '” deleted'); },
  });

  return (
    <div data-screen-label="Admin Places">
      <div className="ad-pagehead">
        <div>
          <h2 className="ad-h2">Places</h2>
          <p className="ad-sub">{places.length} places · add, edit, publish & retire listings</p>
        </div>
        <button className="gb-btn gb-btn-sm" onClick={() => openEditor(null)}><GIcon name="plus" size={14} strokeWidth={2.6} /> Add new place</button>
      </div>

      <div className="ad-toolbar">
        <div className="gb-seg">
          {tabs.map(s => <button key={s} className={statusTab === s ? 'gb-seg-on' : ''} onClick={() => setStatusTab(s)}>{s}{s !== 'All' ? ' (' + places.filter(p => p.status === s).length + ')' : ''}</button>)}
        </div>
        <input className="gb-input ad-search" placeholder="Search places…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="ad-rows">
        {rows.map(p => (
          <div key={p.id} className="ad-row">
            <GPhoto place={p} style={{ width: 46, height: 46, borderRadius: 11, flexShrink: 0 }} iconSize={20} />
            <div className="ad-row-main">
              <span className="ad-row-name">{p.name}</span>
              <span className="ad-sub">{GOBBLE_TYPES[p.type].label} · {p.area} · {p.photos} photos</span>
            </div>
            <div className="ad-row-badges">
              <ABadge tone={AD_STATUS_TONE[p.status]}>{p.status}</ABadge>
              <ABadge tone={p.visited ? 'sky' : 'grey'}>{p.visited ? '✓ Visited' : 'Not visited'}</ABadge>
            </div>
            <div className="ad-row-actions">
              <button className="ad-iconbtn" title="Preview as user" onClick={() => openPreview(p)}><GIcon name="search" size={14} /></button>
              <button className="ad-iconbtn" title="Edit" onClick={() => openEditor(p.id)}><GIcon name="edit" size={14} /></button>
              {p.status !== 'Permanently Closed' && <button className="ad-iconbtn" title="Mark permanently closed" onClick={() => markClosed(p)}><GIcon name="flag" size={14} /></button>}
              <button className="ad-iconbtn ad-iconbtn-danger" title="Delete" onClick={() => del(p)}><GIcon name="x" size={14} strokeWidth={2.4} /></button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="gb-empty" style={{ padding: 20 }}>Nothing here.</p>}
      </div>

      {confirm && (
        <AModal title="Are you sure?" onClose={() => setConfirm(null)}
          footer={<React.Fragment>
            <button className="gb-btn gb-btn-sm" style={{ background: '#B4514B' }} onClick={() => { confirm.fn(); setConfirm(null); }}>Yes, do it</button>
            <button className="gb-btn gb-btn-sm" style={{ background: '#EFF3F6', color: 'var(--gb-ink)' }} onClick={() => setConfirm(null)}>Cancel</button>
          </React.Fragment>}>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--gb-ink)' }}>{confirm.msg}</p>
        </AModal>
      )}
    </div>
  );
}

// ── Place editor (FR-14) ────────────────────────────────────
function APlaceEditor({ placeId, prefill, onClose }) {
  const ctx = React.useContext(AdminCtx);
  const { places, setPlaces, filterDefs, toast } = ctx;
  const existing = placeId ? places.find(p => p.id === placeId) : null;
  const [d, setD] = React.useState(() => existing ? { ...existing } : {
    id: 'new-' + Date.now(), name: '', type: 'restaurant', cuisines: [], vibes: [], budget: 2,
    area: filterDefs.area.options[0], station: '', address: '', phone: '', insta: '', website: '',
    hoursText: [['Mon – Sun', '12:00 PM – 11:00 PM']], open: 12, close: 23, closedDays: [],
    visited: false, ratings: { food: 4, service: 4, ambience: 4 }, mustTry: [], note: '', bestTime: '',
    liveMusic: false, boardGames: false, pureVeg: false, meals: ['dinner'],
    pos: { x: 40 + Math.random() * 20, y: 20 + Math.random() * 60 }, hue: Math.floor(Math.random() * 360),
    photos: 0, status: 'Draft', ...(prefill || {}),
  });
  const [err, setErr] = React.useState('');
  const set = (k, v) => setD(x => ({ ...x, [k]: v }));
  const toggleArr = (k, v) => setD(x => ({ ...x, [k]: x[k].includes(v) ? x[k].filter(i => i !== v) : [...x[k], v] }));

  const save = (status) => {
    setErr('');
    if (!d.name.trim()) return setErr('Give the place a name first.');
    if (status === 'Published' && d.photos < 4) return setErr('Please upload at least 4 photos before publishing.');
    const rec = { ...d, status, permanentlyClosed: false, mustTry: d.visited ? d.mustTry : null, note: d.visited ? d.note : null, bestTime: d.visited ? d.bestTime : null, ratings: d.visited ? d.ratings : null };
    setPlaces(ps => existing ? ps.map(p => p.id === d.id ? rec : p) : [rec, ...ps]);
    toast(status === 'Published' ? '“' + d.name + '” published — live on the map & notification queued 🔔' : '“' + d.name + '” saved as draft');
    onClose();
  };

  const chipPick = (k, options, labelFn) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => (
        <button key={o} type="button" className={'gb-chip' + (d[k].includes(o) ? ' gb-chip-on' : '')} style={{ padding: '5px 11px', fontSize: 12 }} onClick={() => toggleArr(k, o)}>{labelFn ? labelFn(o) : o}</button>
      ))}
    </div>
  );
  const numSel = (k) => (
    <select className="gb-input" value={d.ratings[k]} onChange={e => set('ratings', { ...d.ratings, [k]: +e.target.value })}>
      {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  );
  const toggle = (k, label) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      <button type="button" className={'gb-switch' + (d[k] ? ' gb-switch-on' : '')} onClick={() => set(k, !d[k])}><span></span></button>
    </div>
  );

  return (
    <AModal title={existing ? 'Edit place — ' + existing.name : 'Add new place'} onClose={onClose} wide={true}
      footer={<React.Fragment>
        {err && <span style={{ fontSize: 12.5, fontWeight: 700, color: '#B4514B', marginRight: 'auto' }}>{err}</span>}
        <button className="gb-btn gb-btn-sm" style={{ background: '#EFF3F6', color: 'var(--gb-ink)' }} onClick={() => save('Draft')}>Save as Draft</button>
        <button className="gb-btn gb-btn-sm" onClick={() => save('Published')}>Publish</button>
      </React.Fragment>}>
      <div className="ad-form">
        <AField label="Name"><input className="gb-input" value={d.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Koyo" /></AField>
        <AField label="Place type">
          <select className="gb-input" value={d.type} onChange={e => set('type', e.target.value)}>
            {Object.entries(GOBBLE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </AField>
        <AField label="Area">
          <select className="gb-input" value={d.area} onChange={e => set('area', e.target.value)}>
            {filterDefs.area.options.map(a => <option key={a}>{a}</option>)}
          </select>
        </AField>
        <AField label="Nearest station"><input className="gb-input" value={d.station} onChange={e => set('station', e.target.value)} /></AField>
        <AField label="Budget">
          <select className="gb-input" value={d.budget} onChange={e => set('budget', +e.target.value)}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n}/5)</option>)}
          </select>
        </AField>
        <AField label="Phone"><input className="gb-input" value={d.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 " /></AField>
        <AField label="Instagram"><input className="gb-input" value={d.insta} onChange={e => set('insta', e.target.value)} placeholder="handle (without @)" /></AField>
        <AField label="Website (optional)"><input className="gb-input" value={d.website || ''} onChange={e => set('website', e.target.value)} /></AField>
        <div className="ad-span2"><AField label="Address"><input className="gb-input" value={d.address} onChange={e => set('address', e.target.value)} /></AField></div>
        <div className="ad-span2"><AField label="Opening hours" note="Per day-of-week ranges in the real backend; free text here.">
          <input className="gb-input" value={d.hoursText.map(h => h.join(' · ')).join('  |  ')} onChange={e => set('hoursText', [[e.target.value.split('·')[0] || 'Mon – Sun', e.target.value.split('·')[1] || '']])} />
        </AField></div>
        <div className="ad-span2"><AField label={'Cuisines (' + d.cuisines.length + ' selected)'}>{chipPick('cuisines', filterDefs.cuisine.options)}</AField></div>
        <div className="ad-span2"><AField label={'Vibes (' + d.vibes.length + ' selected)'}>{chipPick('vibes', filterDefs.vibe.options)}</AField></div>

        <div className="ad-span2"><AField label={'Photos (' + d.photos + ' of 6 — minimum 4 to publish)'}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Array.from({ length: d.photos }).map((_, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <GPhoto place={d} idx={i} style={{ width: 64, height: 64, borderRadius: 10 }} iconSize={22} />
                <button type="button" className="ad-photo-x" onClick={() => set('photos', d.photos - 1)}><GIcon name="x" size={10} strokeWidth={3} color="#fff" /></button>
              </div>
            ))}
            {d.photos < 6 && (
              <button type="button" className="ad-photo-add" onClick={() => set('photos', d.photos + 1)}>
                <GIcon name="plus" size={18} color="var(--gb-mut)" strokeWidth={2.2} /> Upload
              </button>
            )}
          </div>
        </AField></div>

        <div className="ad-span2" style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--gb-sky-50)', borderRadius: 12, padding: 14 }}>
          {toggle('visited', 'Personally visited by curator')}
          {d.visited && (
            <React.Fragment>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <AField label="Food /5">{numSel('food')}</AField>
                <AField label="Service /5">{numSel('service')}</AField>
                <AField label="Ambience /5">{numSel('ambience')}</AField>
              </div>
              <p className="ad-sub" style={{ marginTop: -4 }}>Average auto-calculated: <strong>{gobbleAvgRating(d.ratings)}/5</strong></p>
              <AField label="Must-try dishes (one per line)">
                <textarea className="gb-input" rows={3} value={(d.mustTry || []).join('\n')} onChange={e => set('mustTry', e.target.value.split('\n').filter(Boolean))}></textarea>
              </AField>
              <AField label="Curator's note"><textarea className="gb-input" rows={2} value={d.note || ''} onChange={e => set('note', e.target.value)}></textarea></AField>
              <AField label="Best time to visit"><input className="gb-input" value={d.bestTime || ''} onChange={e => set('bestTime', e.target.value)} /></AField>
            </React.Fragment>
          )}
        </div>

        <div className="ad-span2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {toggle('pureVeg', 'Pure Veg')}
          {toggle('liveMusic', 'Live Music')}
          {toggle('boardGames', 'Board Games')}
        </div>
      </div>
    </AModal>
  );
}

// ── Preview as user ──────────────────────────────────────────
function APreview({ place, onClose }) {
  return (
    <AModal title={'Preview — how users see “' + place.name + '”'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {Array.from({ length: Math.max(place.photos, 1) }).map((_, i) => (
            <GPhoto key={i} place={place} idx={i} style={{ width: 110, height: 80, borderRadius: 10, flexShrink: 0 }} iconSize={26} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="gb-badge gb-badge-type">{GOBBLE_TYPES[place.type].label}</span>
          {place.visited
            ? <span className="gb-badge gb-badge-visited"><GIcon name="check" size={11} strokeWidth={2.6} /> Personally visited</span>
            : <span className="gb-badge gb-badge-unvisited"><GIcon name="info" size={11} strokeWidth={2} /> Not yet visited by curator</span>}
        </div>
        <div>
          <h3 className="ad-h3" style={{ fontSize: 20 }}>{place.name || 'Unnamed place'}</h3>
          <p className="ad-sub">{place.cuisines.join(', ') || 'No cuisine tags'} · {place.area} · {'★'.repeat(place.budget)}</p>
        </div>
        {place.visited && place.ratings && (
          <p style={{ fontSize: 13 }}>Food <strong>{place.ratings.food}</strong> · Service <strong>{place.ratings.service}</strong> · Ambience <strong>{place.ratings.ambience}</strong> · Avg <strong>{gobbleAvgRating(place.ratings)}/5</strong></p>
        )}
        {place.visited && place.note && <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--gb-ink)' }}>“{place.note}”</p>}
        <p className="ad-sub">{place.address}</p>
      </div>
    </AModal>
  );
}

// ── To Be Tried (PRD 10.7) ───────────────────────────────────
function AToBeTried() {
  const ctx = React.useContext(AdminCtx);
  const { tbt, setTbt, openEditor, toast } = ctx;
  const [form, setForm] = React.useState({ name: '', address: '', notes: '' });

  const add = () => {
    if (!form.name.trim()) return;
    setTbt(t => [{ id: 'T-' + Date.now(), ...form, date: 'Today', status: 'Pending Visit' }, ...t]);
    setForm({ name: '', address: '', notes: '' });
    toast('Added to your pipeline');
  };
  const markVisited = (item) => {
    setTbt(t => t.filter(x => x.id !== item.id));
    openEditor(null, { name: item.name, address: item.address, visited: true, note: item.notes });
    toast('Moving “' + item.name + '” to a full listing — fill in the review');
  };

  return (
    <div data-screen-label="Admin To Be Tried">
      <div className="ad-pagehead">
        <div>
          <h2 className="ad-h2">To Be Tried</h2>
          <p className="ad-sub">Your private pipeline — never visible to users</p>
        </div>
      </div>
      <div className="ad-card" style={{ marginBottom: 14 }}>
        <p className="ad-card-title">Add to pipeline</p>
        <div className="ad-form" style={{ gap: 10 }}>
          <AField label="Place name"><input className="gb-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></AField>
          <AField label="Address / area"><input className="gb-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></AField>
          <div className="ad-span2"><AField label="Why it's on the list"><input className="gb-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></AField></div>
          <div><button className="gb-btn gb-btn-sm" onClick={add}><GIcon name="plus" size={14} strokeWidth={2.6} /> Add</button></div>
        </div>
      </div>
      <div className="ad-rows">
        {tbt.map(item => (
          <div key={item.id} className="ad-row">
            <span className="ad-detail-ic"><GIcon name="pinOutline" size={16} color="var(--gb-deep)" /></span>
            <div className="ad-row-main">
              <span className="ad-row-name">{item.name}</span>
              <span className="ad-sub">{item.address} · added {item.date}</span>
              <span style={{ fontSize: 12, color: 'var(--gb-ink)', marginTop: 2 }}>{item.notes}</span>
            </div>
            <div className="ad-row-actions">
              <button className="gb-btn gb-btn-sm" style={{ background: '#E8F5EC', color: '#15803D' }} onClick={() => markVisited(item)}>
                <GIcon name="check" size={13} strokeWidth={2.6} /> Visited — create listing
              </button>
              <button className="ad-iconbtn ad-iconbtn-danger" onClick={() => setTbt(t => t.filter(x => x.id !== item.id))}><GIcon name="x" size={14} strokeWidth={2.4} /></button>
            </div>
          </div>
        ))}
        {tbt.length === 0 && <p className="gb-empty" style={{ padding: 20 }}>Pipeline is empty — go scout something.</p>}
      </div>
    </div>
  );
}

Object.assign(window, { APlaces, APlaceEditor, APreview, AToBeTried });
