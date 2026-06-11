// Gobble Maps Admin — Filters & Categories, Users, Issue Reports, Notifications

// ── Filters & Categories (FR-15, PRD 10.3) ───────────────────
function AFilterMgmt() {
  const ctx = React.useContext(AdminCtx);
  const { filterDefs, setFilterDefs, places, toast } = ctx;
  const [adding, setAdding] = React.useState({});
  const [renaming, setRenaming] = React.useState(null); // {cat, opt, value}

  const usageCount = (cat, opt) => {
    if (cat === 'cuisine') return places.filter(p => p.cuisines.includes(opt)).length;
    if (cat === 'vibe') return places.filter(p => p.vibes.includes(opt)).length;
    if (cat === 'area') return places.filter(p => p.area === opt).length;
    if (cat === 'type') return places.filter(p => p.type === opt).length;
    return 0;
  };

  const addOpt = (cat) => {
    const v = (adding[cat] || '').trim();
    if (!v) return;
    setFilterDefs(fd => ({ ...fd, [cat]: { ...fd[cat], options: [...fd[cat].options, v] } }));
    setAdding(a => ({ ...a, [cat]: '' }));
    toast('“' + v + '” added — live in the user filter panel now');
  };
  const removeOpt = (cat, opt) => {
    const used = usageCount(cat, opt);
    if (used > 0 && !window.confirm('“' + opt + '” is tagged on ' + used + ' active place(s). Places keep the tag internally, but it will no longer appear in the filter panel. Remove anyway?')) return;
    setFilterDefs(fd => ({ ...fd, [cat]: { ...fd[cat], options: fd[cat].options.filter(o => o !== opt) } }));
    toast('“' + opt + '” removed from filters');
  };
  const commitRename = () => {
    const { cat, opt, value } = renaming;
    if (value.trim() && value !== opt) {
      setFilterDefs(fd => ({ ...fd, [cat]: { ...fd[cat], options: fd[cat].options.map(o => o === opt ? value.trim() : o) } }));
      toast('Renamed to “' + value.trim() + '”');
    }
    setRenaming(null);
  };

  const cats = ['cuisine', 'vibe', 'area'];
  return (
    <div data-screen-label="Admin Filters">
      <div className="ad-pagehead">
        <div>
          <h2 className="ad-h2">Filters & Categories</h2>
          <p className="ad-sub">Changes appear in the user-facing filter panel immediately</p>
        </div>
      </div>
      <div className="ad-grid3">
        {cats.map(cat => (
          <div key={cat} className="ad-card">
            <p className="ad-card-title">{GOBBLE_FILTER_DEFS[cat].label} <span className="ad-sub" style={{ fontWeight: 600 }}>· {filterDefs[cat].options.length} options</span></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {filterDefs[cat].options.map(opt => (
                <div key={opt} className="ad-fopt">
                  {renaming && renaming.cat === cat && renaming.opt === opt ? (
                    <input className="gb-input" style={{ padding: '6px 10px', fontSize: 13 }} autoFocus value={renaming.value}
                      onChange={e => setRenaming({ ...renaming, value: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && commitRename()} onBlur={commitRename} />
                  ) : (
                    <React.Fragment>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{opt}</span>
                      <span className="ad-sub" style={{ fontSize: 10.5 }}>{usageCount(cat, opt)} places</span>
                      <button className="ad-iconbtn" style={{ width: 26, height: 26 }} title="Rename" onClick={() => setRenaming({ cat, opt, value: opt })}><GIcon name="edit" size={12} /></button>
                      <button className="ad-iconbtn ad-iconbtn-danger" style={{ width: 26, height: 26 }} title="Remove" onClick={() => removeOpt(cat, opt)}><GIcon name="x" size={12} strokeWidth={2.6} /></button>
                    </React.Fragment>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="gb-input" style={{ flex: 1, padding: '8px 11px', fontSize: 13 }} placeholder={'New ' + cat + '…'}
                value={adding[cat] || ''} onChange={e => setAdding(a => ({ ...a, [cat]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addOpt(cat)} />
              <button className="gb-btn gb-btn-sm" onClick={() => addOpt(cat)}><GIcon name="plus" size={13} strokeWidth={2.6} /></button>
            </div>
          </div>
        ))}
      </div>
      <p className="ad-sub" style={{ marginTop: 12 }}>Place Type and Budget are structural categories in V1 — edit them with a schema change, not here.</p>
    </div>
  );
}

// ── Users (PRD 10.4) ─────────────────────────────────────────
function AUsers() {
  const ctx = React.useContext(AdminCtx);
  const { users, setUsers, toast } = ctx;
  const [viewing, setViewing] = React.useState(null);

  return (
    <div data-screen-label="Admin Users">
      <div className="ad-pagehead">
        <div>
          <h2 className="ad-h2">Users</h2>
          <p className="ad-sub">{users.length} registered accounts {users.some(u => u.fromPrototype) ? '· includes accounts you created in the app prototype' : ''}</p>
        </div>
      </div>
      <div className="ad-rows">
        {users.map(u => (
          <div key={u.username} className="ad-row">
            <span className="gb-avatar" style={{ width: 36, height: 36, fontSize: 14, cursor: 'default' }}>{u.username[0].toUpperCase()}</span>
            <div className="ad-row-main">
              <span className="ad-row-name">@{u.username} {u.fromPrototype && <ABadge tone="sky">from your prototype</ABadge>}</span>
              <span className="ad-sub">Joined {u.joined} · last active {u.lastActive}</span>
            </div>
            <div className="ad-row-badges">
              <ABadge tone="grey">{u.been} been</ABadge>
              <ABadge tone="grey">{u.wish} wishlist</ABadge>
              <ABadge tone="grey">{u.lists} lists</ABadge>
            </div>
            <div className="ad-row-actions">
              <button className="ad-iconbtn" title="View saved lists" onClick={() => setViewing(u)}><GIcon name="list" size={14} /></button>
              <button className="ad-iconbtn ad-iconbtn-danger" title="Delete account"
                onClick={() => { if (window.confirm('Delete @' + u.username + '? Their lists and saves are removed.')) { setUsers(us => us.filter(x => x.username !== u.username)); toast('@' + u.username + ' deleted'); } }}>
                <GIcon name="x" size={14} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {viewing && (
        <AModal title={'@' + viewing.username + ' — saved lists'} onClose={() => setViewing(null)}>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            <strong>{viewing.been}</strong> places in Been There · <strong>{viewing.wish}</strong> in Can't Wait to Go · <strong>{viewing.lists}</strong> custom {viewing.lists === 1 ? 'list' : 'lists'}.
          </p>
          <p className="ad-sub" style={{ marginTop: 8 }}>Full list contents are shown here for support purposes in the production build.</p>
        </AModal>
      )}
    </div>
  );
}

// ── Issue Reports (FR-11, PRD 10.5) ──────────────────────────
function AReports() {
  const ctx = React.useContext(AdminCtx);
  const { reports, setReports, placeById, openEditor, toast } = ctx;
  const [statusF, setStatusF] = React.useState('Open');
  const rows = reports.filter(r => statusF === 'All' || r.status === statusF);

  return (
    <div data-screen-label="Admin Reports">
      <div className="ad-pagehead">
        <div>
          <h2 className="ad-h2">Issue Reports</h2>
          <p className="ad-sub">{reports.filter(r => r.status === 'Open').length} open · submitted by logged-in users</p>
        </div>
        <div className="gb-seg">
          {['Open', 'Resolved', 'All'].map(s => <button key={s} className={statusF === s ? 'gb-seg-on' : ''} onClick={() => setStatusF(s)}>{s}</button>)}
        </div>
      </div>
      <div className="ad-rows">
        {rows.map(r => {
          const p = placeById(r.placeId);
          return (
            <div key={r.id} className="ad-row" style={{ alignItems: 'flex-start' }}>
              <span className="ad-detail-ic" style={{ marginTop: 2 }}><GIcon name="flag" size={15} color={r.status === 'Open' ? '#B4514B' : 'var(--gb-mut)'} /></span>
              <div className="ad-row-main">
                <span className="ad-row-name">{p ? p.name : r.placeId} <span className="ad-sub" style={{ fontWeight: 600 }}>· {r.id}</span></span>
                <span style={{ fontSize: 13, color: 'var(--gb-ink)', lineHeight: 1.5, margin: '3px 0' }}>“{r.text}”</span>
                <span className="ad-sub">by @{r.by} · {r.date}</span>
              </div>
              <div className="ad-row-badges"><ABadge tone={r.status === 'Open' ? 'red' : 'green'}>{r.status}</ABadge></div>
              <div className="ad-row-actions">
                {p && <button className="ad-iconbtn" title="Edit this place" onClick={() => openEditor(p.id)}><GIcon name="edit" size={14} /></button>}
                {r.status === 'Open' && (
                  <button className="gb-btn gb-btn-sm" style={{ background: '#E8F5EC', color: '#15803D' }}
                    onClick={() => { setReports(rs => rs.map(x => x.id === r.id ? { ...x, status: 'Resolved' } : x)); toast(r.id + ' marked resolved'); }}>
                    <GIcon name="check" size={13} strokeWidth={2.6} /> Resolve
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="gb-empty" style={{ padding: 20 }}>No {statusF.toLowerCase()} reports. Quiet day.</p>}
      </div>
    </div>
  );
}

// ── Push Notifications (FR-13, PRD 10.6) ─────────────────────
function ANotifications() {
  const ctx = React.useContext(AdminCtx);
  const { notifs, setNotifs, filterDefs, toast } = ctx;
  const [msg, setMsg] = React.useState('');
  const [seg, setSeg] = React.useState('All users');
  const [area, setArea] = React.useState(filterDefs.area.options[0]);

  const send = (scheduled) => {
    if (!msg.trim()) return;
    const recipients = seg === 'All users' ? 'All users · 1,284' : area + ' savers · ' + (90 + Math.floor(Math.random() * 300));
    if (scheduled) { toast('Scheduled for tomorrow, 11 AM — ' + recipients); }
    else {
      setNotifs(n => [{ id: 'N-' + (219 + n.length), type: 'Manual', msg: msg.trim(), date: 'Today', recipients }, ...n]);
      toast('Notification sent to ' + recipients);
    }
    setMsg('');
  };

  return (
    <div data-screen-label="Admin Notifications">
      <div className="ad-pagehead">
        <div>
          <h2 className="ad-h2">Push Notifications</h2>
          <p className="ad-sub">“New place” pushes go out automatically on publish — compose manual ones here</p>
        </div>
      </div>
      <div className="ad-card" style={{ marginBottom: 14 }}>
        <p className="ad-card-title">Compose</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea className="gb-input" rows={2} placeholder="e.g. 🍴 New spot on Gobble Maps! …" value={msg} onChange={e => setMsg(e.target.value)}></textarea>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="gb-seg">
              {['All users', 'Users with saves in…'].map(s => <button key={s} className={seg === s ? 'gb-seg-on' : ''} onClick={() => setSeg(s)}>{s}</button>)}
            </div>
            {seg !== 'All users' && (
              <select className="gb-input" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }} value={area} onChange={e => setArea(e.target.value)}>
                {filterDefs.area.options.map(a => <option key={a}>{a}</option>)}
              </select>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="gb-btn gb-btn-sm" style={{ background: '#EFF3F6', color: 'var(--gb-ink)' }} onClick={() => send(true)}>Schedule</button>
              <button className="gb-btn gb-btn-sm" onClick={() => send(false)}>Send now</button>
            </div>
          </div>
        </div>
      </div>
      <p className="ad-card-title" style={{ margin: '0 0 8px 2px' }}>History</p>
      <div className="ad-rows">
        {notifs.map(n => (
          <div key={n.id} className="ad-row" style={{ alignItems: 'flex-start' }}>
            <span className="ad-detail-ic" style={{ marginTop: 2 }}><GIcon name="share" size={15} color="var(--gb-deep)" /></span>
            <div className="ad-row-main">
              <span style={{ fontSize: 13.5, color: 'var(--gb-ink)', lineHeight: 1.5, fontWeight: 600 }}>{n.msg}</span>
              <span className="ad-sub" style={{ marginTop: 3 }}>{n.date} · {n.recipients} · {n.id}</span>
            </div>
            <div className="ad-row-badges"><ABadge tone={n.type === 'Manual' ? 'grey' : 'sky'}>{n.type}</ABadge></div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AFilterMgmt, AUsers, AReports, ANotifications });
