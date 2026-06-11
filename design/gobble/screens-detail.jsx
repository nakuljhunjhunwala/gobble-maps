// Gobble Maps — Place detail, Auth, Profile, Save-to-list, Report sheets

// ── Place Detail (FR-5, FR-6) ────────────────────────────────
function GPlaceDetail({ place, fromMap }) {
  const ctx = React.useContext(GobbleCtx);
  const { user, beenThere, wishlist, toggleBeenThere, toggleWish, requireLogin, showToast, pop, tweaks, tc, openSaveSheet, openReportSheet } = ctx;
  const avg = gobbleAvgRating(place.ratings);
  const been = user && beenThere.includes(place.id);
  const wish = user && wishlist.includes(place.id);
  const galRef = React.useRef(null);
  const [photoIdx, setPhotoIdx] = React.useState(0);

  const onGalScroll = () => {
    const el = galRef.current; if (!el) return;
    setPhotoIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (tweaks.offline) {
    return (
      <div className="gb-screen" data-screen-label="Place Detail (offline)" style={{ background: 'var(--gb-bg)' }}>
        <GOfflineBanner />
        <div style={{ padding: '14px 18px' }}>
          <button className="gb-backbtn" style={{ position: 'static', marginBottom: 18 }} onClick={pop}><GIcon name="chevL" size={16} strokeWidth={2.4} /></button>
          <h1 className="gb-h1">{place.name}</h1>
          <p className="gb-sub" style={{ marginTop: 4 }}>{GOBBLE_TYPES[place.type].label} · {place.area}</p>
          <div className="gb-infobox" style={{ marginTop: 18 }}>
            <GIcon name="offline" size={16} strokeWidth={2} />
            <span>Connect to the internet to view details.</span>
          </div>
        </div>
      </div>
    );
  }

  const ratingRow = (label, val) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 70, fontSize: 12.5, fontWeight: 600, color: 'var(--gb-mut)' }}>{label}</span>
      <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'var(--gb-sky-50)' }}>
        <div style={{ width: (val / 5 * 100) + '%', height: '100%', borderRadius: 99, background: 'var(--gb-sky-deep)' }}></div>
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gb-ink)', width: 28, textAlign: 'right' }}>{val}/5</span>
    </div>
  );

  const detailRow = (icon, content, onClick) => (
    <button className="gb-detailrow" onClick={onClick || (() => {})} style={onClick ? {} : { cursor: 'default' }}>
      <span className="gb-detailrow-ic"><GIcon name={icon} size={16} color="var(--gb-sky-deep)" /></span>
      <span style={{ flex: 1, textAlign: 'left' }}>{content}</span>
      {onClick && <GIcon name="chevR" size={13} color="var(--gb-line2)" strokeWidth={2.4} />}
    </button>
  );

  const actionBtn = (icon, label, active, onTap, activeColor) => (
    <button className={'gb-action' + (active ? ' gb-action-on' : '')} onClick={onTap}
      style={active && activeColor ? { color: activeColor, borderColor: activeColor, background: activeColor + '14' } : {}}>
      <GIcon name={icon} size={18} strokeWidth={2} fill={active ? 'currentColor' : 'none'} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="gb-screen" data-screen-label="Place Detail" style={{ background: '#fff' }}>
      {/* gallery */}
      <div style={{ position: 'relative' }}>
        <div ref={galRef} onScroll={onGalScroll} className="gb-gallery">
          {Array.from({ length: place.photos }).map((_, i) => (
            <GPhoto key={i} place={place} idx={i} showNote={true} style={{ minWidth: '100%', height: 250, scrollSnapAlign: 'start' }} iconSize={48} />
          ))}
        </div>
        <button className="gb-backbtn" onClick={pop}>
          <GIcon name="chevL" size={16} strokeWidth={2.4} />{fromMap ? <span style={{ fontSize: 12.5, fontWeight: 700, paddingRight: 2 }}>Map</span> : null}
        </button>
        <button className="gb-backbtn" style={{ left: 'auto', right: 14 }} onClick={() => showToast('Share sheet opened — WhatsApp, Instagram & more')}>
          <GIcon name="share" size={16} strokeWidth={2} />
        </button>
        <span className="gb-gallery-count">{photoIdx + 1} / {place.photos}</span>
      </div>

      <div style={{ padding: '16px 18px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="gb-badge gb-badge-type">{GOBBLE_TYPES[place.type].label}</span>
            <GVisitedBadge place={place} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <h1 className="gb-h1">{place.name}</h1>
            <GScorePill score={avg} />
          </div>
          <div className="gb-card-meta" style={{ fontSize: 13 }}>
            <span>{place.cuisines.join(', ')}</span><span className="gb-dot"></span>
            <span>{place.area}</span><span className="gb-dot"></span>
            <GBudget n={place.budget} size={11} />
          </div>
          <GOpenDot place={place} />
        </div>

        {/* actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {actionBtn('check', 'Been There', been, () => requireLogin('save places', () => toggleBeenThere(place.id)), '#15803D')}
          {actionBtn('heart', "Can't Wait", wish, () => requireLogin('save places', () => toggleWish(place.id)), '#C2417A')}
          {actionBtn('bookmark', 'Save to List', false, () => requireLogin('create lists', () => openSaveSheet(place.id)))}
        </div>

        {/* unvisited notice */}
        {!place.visited && (
          <div className="gb-infobox">
            <GIcon name="info" size={16} strokeWidth={2} />
            <span><strong>Not yet visited by curator</strong> — info sourced from public listings (Zomato / Google). No personal rating yet.</span>
          </div>
        )}

        {/* curator ratings */}
        {place.visited && place.ratings && (
          <section className="gb-panel">
            <p className="gb-flabel" style={{ marginBottom: 10 }}>Curator's ratings</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {ratingRow('Food', place.ratings.food)}
              {ratingRow('Service', place.ratings.service)}
              {ratingRow('Ambience', place.ratings.ambience)}
            </div>
          </section>
        )}

        {/* tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {place.vibes.map(v => <span key={v} className="gb-chip" style={{ cursor: 'default' }}>{v}</span>)}
          {place.pureVeg && <span className="gb-chip" style={{ cursor: 'default', display: 'inline-flex', gap: 5, alignItems: 'center' }}><GIcon name="leaf" size={12} color="#15803D" /> Pure Veg</span>}
          {place.liveMusic && <span className="gb-chip" style={{ cursor: 'default', display: 'inline-flex', gap: 5, alignItems: 'center' }}><GIcon name="music" size={12} /> Live Music</span>}
          {place.boardGames && <span className="gb-chip" style={{ cursor: 'default', display: 'inline-flex', gap: 5, alignItems: 'center' }}><GIcon name="dice" size={12} /> Board Games</span>}
        </div>

        {/* curator's section */}
        {place.visited && place.mustTry && (
          <section className="gb-panel gb-panel-sky">
            <p className="gb-flabel" style={{ marginBottom: 10, color: 'var(--gb-sky-deep)' }}>From the curator</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gb-mut)', marginBottom: 6 }}>MUST-TRY DISHES</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {place.mustTry.map(d => (
                    <span key={d} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, color: 'var(--gb-ink)', fontWeight: 600 }}>
                      <GIcon name="fork" size={13} color="var(--gb-sky-deep)" /> {d}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gb-mut)', marginBottom: 4 }}>CURATOR'S NOTE</p>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--gb-ink)' }}>“{place.note}”</p>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gb-mut)', marginBottom: 4 }}>BEST TIME TO VISIT</p>
                <p style={{ fontSize: 13.5, color: 'var(--gb-ink)', fontWeight: 600 }}>{place.bestTime}</p>
              </div>
            </div>
          </section>
        )}

        {/* details */}
        <section className="gb-panel" style={{ padding: '4px 6px' }}>
          {detailRow('clock', (
            <span>
              {place.hoursText.map(([d, t]) => <span key={d} style={{ display: 'block' }}><strong>{d}</strong> · {t}</span>)}
            </span>
          ))}
          {detailRow('phone', place.phone, () => showToast('Calling ' + place.phone + '…'))}
          {detailRow('instagram', '@' + place.insta, () => showToast('Opening Instagram — @' + place.insta))}
          {detailRow('pinOutline', place.address)}
          {detailRow('train', 'Nearest station · ' + place.station)}
        </section>

        {/* map preview */}
        <section style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--gb-line)' }}>
          <GMapCanvas style={{ height: 130 }}>
            <GPin place={place} onTap={() => {}} />
          </GMapCanvas>
          <button className="gb-btn" style={{ width: 'calc(100% - 24px)', margin: 12 }}
            onClick={() => showToast('Opening Google Maps for directions…')}>
            <GIcon name="arrowUR" size={16} strokeWidth={2.4} /> Get Directions
          </button>
        </section>

        <button className="gb-link" style={{ alignSelf: 'center', display: 'inline-flex', gap: 6, alignItems: 'center', color: 'var(--gb-mut)' }}
          onClick={() => requireLogin('report issues', () => openReportSheet(place.id))}>
          <GIcon name="flag" size={13} /> Report an issue with this place
        </button>
      </div>
    </div>
  );
}

// ── Auth (FR-7) ──────────────────────────────────────────────
function GAuthScreen() {
  const ctx = React.useContext(GobbleCtx);
  const { closeAuth, signup, login, accounts, showToast } = ctx;
  const [mode, setMode] = React.useState('login'); // login | signup | forgot
  const [username, setUsername] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [err, setErr] = React.useState('');

  const uname = username.trim().toLowerCase();
  const taken = mode === 'signup' && uname && (uname === 'gobble' || accounts[uname]);
  const reset = () => { setPin(''); setErr(''); setOtpSent(false); };

  const submit = () => {
    setErr('');
    if (mode === 'signup') {
      if (!uname) return setErr('Pick a username first.');
      if (taken) return setErr('That username is taken — try another.');
      if (pin.length !== 6) return setErr('Your PIN must be exactly 6 digits.');
      if (mobile.replace(/\D/g, '').length < 10) return setErr('Enter a valid mobile number for recovery.');
      signup(uname, pin, mobile);
    } else if (mode === 'login') {
      if (!accounts[uname]) return setErr('No account with that username. Create one?');
      if (accounts[uname].pin !== pin) return setErr("That PIN doesn't match.");
      login(uname);
    } else {
      if (!otpSent) {
        if (mobile.replace(/\D/g, '').length < 10) return setErr('Enter the mobile number on your account.');
        setOtpSent(true); showToast('OTP sent via SMS (use 123456 in this prototype)');
      } else {
        if (pin.length !== 6) return setErr('Set a new 6-digit PIN.');
        showToast('PIN reset — log in with your new PIN');
        setMode('login'); reset();
      }
    }
  };

  const field = (label, val, set, props = {}, note = null) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span className="gb-flabel">{label}</span>
      <input className="gb-input" value={val} onChange={e => set(e.target.value)} {...props} />
      {note && <span style={{ fontSize: 11.5, color: 'var(--gb-mut)', lineHeight: 1.45 }}>{note}</span>}
    </label>
  );

  return (
    <div className="gb-screen" data-screen-label="Login / Signup" style={{ background: 'var(--gb-bg)' }}>
      <div style={{ padding: '14px 22px 30px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <button className="gb-backbtn" style={{ position: 'static', alignSelf: 'flex-start' }} onClick={closeAuth}>
          <GIcon name="x" size={15} strokeWidth={2.4} />
        </button>
        <div>
          <div className="gb-brand" style={{ fontSize: 21 }}>
            <span className="gb-brand-mark"><GIcon name="pinOutline" size={17} color="#fff" strokeWidth={2.2} /></span>
            Gobble Maps
          </div>
          <h1 className="gb-h1" style={{ marginTop: 14 }}>
            {mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your PIN' : 'Welcome back'}
          </h1>
          <p className="gb-sub" style={{ marginTop: 5 }}>
            {mode === 'forgot' ? 'We’ll text an OTP to the mobile number on your account.' : 'Save places, track visits, build custom lists. Browsing never requires an account.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode !== 'forgot' && field('Username', username, setUsername, { placeholder: 'e.g. vada_pav_vigilante', autoCapitalize: 'none' },
            mode === 'signup' && uname ? (taken ? <span style={{ color: '#B4514B', fontWeight: 700 }}>✕ Taken — try another</span> : <span style={{ color: '#15803D', fontWeight: 700 }}>✓ Available</span>) : null)}
          {(mode === 'signup' || mode === 'forgot') && field('Mobile number', mobile, setMobile, { placeholder: '+91 ', inputMode: 'tel' },
            mode === 'signup' ? 'For account recovery only — we will not use this for marketing or login.' : null)}
          {mode === 'forgot' && otpSent && field('OTP from SMS', '123456', () => {}, { readOnly: true })}
          {(mode !== 'forgot' || otpSent) && field(mode === 'forgot' ? 'New 6-digit PIN' : '6-digit PIN', pin,
            v => setPin(v.replace(/\D/g, '').slice(0, 6)),
            { placeholder: '••••••', inputMode: 'numeric', type: 'password', style: { letterSpacing: 6, fontWeight: 700 } })}
          {err && <p style={{ fontSize: 12.5, fontWeight: 700, color: '#B4514B' }}>{err}</p>}
          <button className="gb-btn" onClick={submit}>
            {mode === 'signup' ? 'Create account' : mode === 'forgot' ? (otpSent ? 'Set new PIN' : 'Send OTP') : 'Log in'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', marginTop: 4 }}>
          {mode === 'login' && <button className="gb-link" onClick={() => { setMode('forgot'); reset(); }}>Forgot PIN?</button>}
          <button className="gb-link" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); reset(); }}>
            {mode === 'signup' ? 'Already have an account? Log in' : 'New here? Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile / My Lists (FR-8, FR-9) ──────────────────────────
function GProfileScreen() {
  const ctx = React.useContext(GobbleCtx);
  const { user, beenThere, wishlist, lists, toggleBeenThere, toggleWish, createList, toggleListPublic, deleteList, logout, openAuth, showToast, notifOptIn, setNotifOptIn } = ctx;
  const [tab, setTab] = React.useState('been');
  const [newList, setNewList] = React.useState('');

  if (!user) {
    return (
      <div className="gb-screen" data-screen-label="Profile (guest)">
        <div style={{ padding: '60px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <span className="gb-brand-mark" style={{ width: 52, height: 52, borderRadius: 16 }}><GIcon name="user" size={26} color="#fff" strokeWidth={2} /></span>
          <h2 className="gb-h2">Your food memory</h2>
          <p className="gb-sub" style={{ maxWidth: 250, margin: '0 auto' }}>Log in to save places, track your visits, and create custom lists. Browsing stays free for everyone.</p>
          <button className="gb-btn" style={{ marginTop: 8, minWidth: 200 }} onClick={() => openAuth()}>Log in or sign up</button>
          <a className="gb-link" style={{ marginTop: 14, color: 'var(--gb-mut)', textDecoration: 'none' }} href="Gobble Admin Panel.html">Founder? Open the admin panel →</a>
        </div>
      </div>
    );
  }

  const renderPlaces = (ids, removeFn, emptyMsg) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ids.map(id => {
        const p = GOBBLE_PLACES.find(x => x.id === id);
        return p && <GCardRow key={id} place={p} trailing={
          <button className="gb-iconbtn" style={{ width: 32, height: 32 }} onClick={e => { e.stopPropagation(); removeFn(id); }}>
            <GIcon name="x" size={13} color="var(--gb-mut)" strokeWidth={2.4} />
          </button>} />;
      })}
      {ids.length === 0 && <p className="gb-empty" style={{ padding: '26px 10px', textAlign: 'center' }}>{emptyMsg}</p>}
    </div>
  );

  return (
    <div className="gb-screen" data-screen-label="Profile">
      <div style={{ padding: '14px 18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="gb-avatar" style={{ width: 48, height: 48, fontSize: 19 }}>{user.username[0].toUpperCase()}</span>
          <div style={{ flex: 1 }}>
            <h2 className="gb-h2">@{user.username}</h2>
            <p className="gb-sub">{beenThere.length} been there · {wishlist.length} can't wait · {lists.length} {lists.length === 1 ? 'list' : 'lists'}</p>
          </div>
        </div>

        <div className="gb-seg" style={{ width: '100%' }}>
          {[['been', 'Been There'], ['wish', "Can't Wait"], ['lists', 'My Lists']].map(([k, l]) => (
            <button key={k} style={{ flex: 1 }} className={tab === k ? 'gb-seg-on' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === 'been' && renderPlaces(beenThere, toggleBeenThere, 'Places you mark as visited will live here.')}
        {tab === 'wish' && renderPlaces(wishlist, toggleWish, 'Your wishlist is empty — go find something delicious.')}

        {tab === 'lists' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lists.map((l, i) => (
              <div key={i} className="gb-panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GIcon name={l.public ? 'globe' : 'lock'} size={15} color="var(--gb-sky-deep)" />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14.5, color: 'var(--gb-ink)' }}>{l.name}</span>
                  <span className="gb-sub">{l.places.length} {l.places.length === 1 ? 'place' : 'places'}</span>
                  <button className="gb-iconbtn" style={{ width: 30, height: 30 }} onClick={() => deleteList(i)}><GIcon name="x" size={12} color="var(--gb-mut)" strokeWidth={2.4} /></button>
                </div>
                {l.places.length > 0 && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {l.places.slice(0, 5).map(id => {
                      const p = GOBBLE_PLACES.find(x => x.id === id);
                      return p && <GPhoto key={id} place={p} style={{ width: 44, height: 44, borderRadius: 10 }} iconSize={18} />;
                    })}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="gb-sub">{l.public ? 'Public — anyone with the link can view' : 'Private — only you'}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {l.public && <button className="gb-link" onClick={() => showToast('Link copied: gobble.maps/l/' + l.name.toLowerCase().replace(/\W+/g, '-'))}>Copy link</button>}
                    <button className="gb-link" onClick={() => toggleListPublic(i)}>{l.public ? 'Make private' : 'Make public'}</button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="gb-input" style={{ flex: 1 }} placeholder="New list name, e.g. Date Night Spots" value={newList} onChange={e => setNewList(e.target.value)} />
              <button className="gb-btn gb-btn-sm" onClick={() => { if (newList.trim()) { createList(newList.trim()); setNewList(''); } }}>
                <GIcon name="plus" size={14} strokeWidth={2.6} /> Create
              </button>
            </div>
          </div>
        )}

        {/* settings */}
        <section className="gb-panel" style={{ padding: '4px 6px', marginTop: 6 }}>
          <div className="gb-detailrow" style={{ cursor: 'default' }}>
            <span className="gb-detailrow-ic"><GIcon name="info" size={16} color="var(--gb-sky-deep)" /></span>
            <span style={{ flex: 1, textAlign: 'left' }}>Push notifications</span>
            <button className={'gb-switch' + (notifOptIn ? ' gb-switch-on' : '')} onClick={() => setNotifOptIn(!notifOptIn)}><span></span></button>
          </div>
          <button className="gb-detailrow" onClick={() => showToast('PIN change flow — verify OTP, then set a new PIN')}>
            <span className="gb-detailrow-ic"><GIcon name="lock" size={16} color="var(--gb-sky-deep)" /></span>
            <span style={{ flex: 1, textAlign: 'left' }}>Change PIN</span>
            <GIcon name="chevR" size={13} color="var(--gb-line2)" strokeWidth={2.4} />
          </button>
          <button className="gb-detailrow" onClick={logout}>
            <span className="gb-detailrow-ic" style={{ background: '#FBEAE8' }}><GIcon name="logout" size={16} color="#B4514B" /></span>
            <span style={{ flex: 1, textAlign: 'left', color: '#B4514B', fontWeight: 700 }}>Log out</span>
          </button>
        </section>
        <a className="gb-link" style={{ alignSelf: 'center', color: 'var(--gb-mut)', textDecoration: 'none' }} href="Gobble Admin Panel.html">Founder? Open the admin panel →</a>
      </div>
    </div>
  );
}

// ── Save to list sheet (FR-9) ────────────────────────────────
function GSaveSheet({ placeId }) {
  const ctx = React.useContext(GobbleCtx);
  const { lists, createList, toggleInList, closeSaveSheet, showToast } = ctx;
  const [newName, setNewName] = React.useState('');
  return (
    <GSheet onClose={closeSaveSheet} maxH="62%">
      <div style={{ padding: '2px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 className="gb-h2" style={{ fontSize: 19 }}>Save to a list</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {lists.map((l, i) => {
            const inList = l.places.includes(placeId);
            return (
              <button key={i} className="gb-detailrow" onClick={() => { toggleInList(i, placeId); if (!inList) { showToast('Saved to “' + l.name + '”'); closeSaveSheet(); } }}>
                <span className="gb-detailrow-ic"><GIcon name={l.public ? 'globe' : 'lock'} size={15} color="var(--gb-sky-deep)" /></span>
                <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>{l.name} <span className="gb-sub">· {l.places.length}</span></span>
                {inList ? <GIcon name="check" size={16} color="var(--gb-sky-deep)" strokeWidth={2.6} /> : <GIcon name="plus" size={15} color="var(--gb-mut)" strokeWidth={2.2} />}
              </button>
            );
          })}
          {lists.length === 0 && <p className="gb-empty" style={{ padding: '8px 4px' }}>No lists yet — create your first one below.</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="gb-input" style={{ flex: 1 }} placeholder="Create new list…" value={newName} onChange={e => setNewName(e.target.value)} />
          <button className="gb-btn gb-btn-sm" onClick={() => {
            if (newName.trim()) { createList(newName.trim(), placeId); showToast('Saved to “' + newName.trim() + '”'); setNewName(''); closeSaveSheet(); }
          }}>Create</button>
        </div>
      </div>
    </GSheet>
  );
}

// ── Report an issue sheet (FR-11) ────────────────────────────
function GReportSheet({ placeId }) {
  const ctx = React.useContext(GobbleCtx);
  const { closeReportSheet, showToast, user } = ctx;
  const [text, setText] = React.useState('');
  const place = GOBBLE_PLACES.find(p => p.id === placeId);
  return (
    <GSheet onClose={closeReportSheet} maxH="56%">
      <div style={{ padding: '2px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h3 className="gb-h2" style={{ fontSize: 19 }}>Report an issue</h3>
          <p className="gb-sub" style={{ marginTop: 3 }}>{place.name} · goes straight to the curator</p>
        </div>
        <textarea className="gb-input" rows={4} style={{ resize: 'none', lineHeight: 1.5 }}
          placeholder="e.g. The phone number is incorrect, or this place has shut down…"
          value={text} onChange={e => setText(e.target.value)}></textarea>
        <button className="gb-btn" onClick={() => {
          if (!text.trim()) return;
          closeReportSheet();
          showToast("Thanks @" + user.username + "! We'll look into this.");
        }}>Submit report</button>
      </div>
    </GSheet>
  );
}

// ── Soft login prompt (FR-7) ─────────────────────────────────
function GLoginPrompt({ action }) {
  const ctx = React.useContext(GobbleCtx);
  const { closeLoginPrompt, openAuth } = ctx;
  return (
    <GSheet onClose={closeLoginPrompt} maxH="46%">
      <div style={{ padding: '6px 24px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <span className="gb-brand-mark" style={{ width: 46, height: 46, borderRadius: 14 }}><GIcon name="heart" size={22} color="#fff" strokeWidth={2} /></span>
        <h3 className="gb-h2">Log in to {action}</h3>
        <p className="gb-sub" style={{ maxWidth: 250 }}>Log in to save places, track your visits, and create custom lists. Browsing never requires an account.</p>
        <button className="gb-btn" style={{ width: '100%', marginTop: 6 }} onClick={() => { closeLoginPrompt(); openAuth(); }}>Log in or sign up</button>
        <button className="gb-link" style={{ color: 'var(--gb-mut)' }} onClick={closeLoginPrompt}>Keep browsing</button>
      </div>
    </GSheet>
  );
}

Object.assign(window, { GPlaceDetail, GAuthScreen, GProfileScreen, GSaveSheet, GReportSheet, GLoginPrompt });
