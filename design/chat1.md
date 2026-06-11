# Interactive Prototype Build

_Started 2026-06-11 18:28 UTC_

---

## User

i want working prototype to see! no need for multiple options make one but correct all info you need is attached in PRD

## Assistant

_[tool: list_files]_

_[tool: copy_starter_component]_

_[tool: copy_starter_component]_

_[tool: update_todos]_

The design system project is empty, so I'll build from the PRD's design direction (sky blue, clean, curated-editorial). Since you want one correct working prototype, I'll get straight to it.

_[tool: read_file]_

_[tool: write_file]_

Now I'll build the prototype. Writing the data layer, components, screens, and shell:

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: str_replace_edit]_

_[tool: write_file]_

Now the main shell with styles, state management, and tweaks:

_[tool: show_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: save_screenshot]_

_[tool: multi_screenshot]_

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: str_replace_edit]_

The scaler wrapper keeps its unscaled layout size, pushing the device out of view. Fixing with a sized wrapper + top-left origin:

_[tool: str_replace_edit]_

_[tool: show_html]_

_[tool: done]_

It's rendering correctly. Handing off and running verification:

_[tool: fork_verifier_agent]_

Here's your working **Gobble Maps prototype** — a phone-framed, fully interactive build of the PRD:

**What works:**
- **Home** — time/day-based sections (FR-1), map preview, full curated list
- **Map** — stylized Mumbai map with category pins (fork/coffee/cocktail/cake/cart/beer), visited vs. not-yet-visited colors, green tick for your "Been There" places, filter chips, "Use my location", legend
- **Place detail** — photo gallery, curator ratings, must-try dishes & notes, hours with Open Now logic, tags, directions, share
- **Filters** — all 9 filter groups from the PRD, live result count, removable chips
- **Search** — finds by name/cuisine/area/vibe; try "Bombay Social House" to see the *permanently closed* message
- **Auth** — optional username + 6-digit PIN signup (with availability check), login, forgot-PIN OTP flow; soft login prompts never block browsing; state persists across refreshes
- **Profile** — Been There / Can't Wait / custom lists with public-link toggle, notification opt-out, change PIN, logout

**Tweaks panel** (toolbar) lets you simulate day/time (to demo breakfast → brunch → party sections), toggle offline mode (FR-16), pin labels, and try 3 sky-blue accent variants.

Caveats: the map is a stylized stand-in for the Google Maps SDK, and photos are curator-upload placeholders. The **admin panel** (dashboard, place management, reports, notifications) isn't built yet — want that as a desktop companion screen next?

## User

build admin panel too please! no need seperate desktop screen same can be used via media query correctly!

## Assistant

_[tool: update_todos]_

_[tool: write_file]_

I'll build the admin panel as a responsive companion (sidebar on desktop, collapses for mobile via media queries), linked from the app.

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: str_replace_edit]_

Now linking the admin panel from the app's Profile screen:

_[tool: done]_

_[tool: fork_verifier_agent]_

The **Admin Panel** is live — one responsive layout that works desktop and mobile (sidebar collapses to a scrollable top nav under 880px, forms/tables/stat grids reflow via media queries). All seven PRD sections:

- **Dashboard** — date-range filter (today/week/month/all time), user & activity stats, map-opens chart, top-10 saved/visited/shared, popular areas/cuisines, most-used filters, open reports count
- **Places** — Published/Draft/Closed tabs, search, full add/edit form (multi-tag cuisines & vibes, curator ratings with auto-average, must-try dishes, photo slots), preview-as-user, mark permanently closed & delete with confirmation. Publishing with fewer than 4 photos is blocked with the exact PRD error — try publishing the "Sip & Saga" draft
- **Filters & Categories** — add/rename/remove options, with the in-use warning rule
- **Users** — includes any accounts you actually create in the app prototype (tagged "from your prototype")
- **Issue Reports** — open/resolved filter, resolve, jump straight into editing the reported place
- **Notifications** — compose, all-users vs. area-segment targeting, send/schedule, history
- **To Be Tried** — private pipeline; "Visited — create listing" opens the place editor pre-filled

It's linked both ways: "Founder? Open the admin panel →" in the app's Profile tab, and "View the app →" in the admin sidebar. Note admin changes are session-only (refresh resets) — say the word if you'd like them to persist and sync into the user app.

