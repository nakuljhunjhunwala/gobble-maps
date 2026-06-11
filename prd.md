# Gobble Maps — Product Requirements Document
Version 1.0 | June 2026 | Prepared from Founder Interview

---

## 1. Overview

### Problem Statement
Food lovers in Mumbai are overwhelmed by apps like Zomato and Google Maps that show thousands of places with inconsistent, crowd-sourced reviews. Instagram food reels are equally unreliable — users save hundreds of posts and lose track of them with no easy way to find places on a map.

### Solution Summary
Gobble Maps is a personally curated food and nightlife guide for Mumbai. Every listed place has been vetted and reviewed by the founder. Users get a clean, map-based experience to discover trusted restaurants, cafés, bars, clubs and more — without the noise. The app shows recommendations that change dynamically based on the day of the week and time of day.

### Target Users
- Foodies who eat out frequently
- Food vloggers and content creators
- People who enjoy trying new cuisines and experiences
- Mumbai residents and visitors who want reliable, trustworthy recommendations

### Why Gobble Maps Over Alternatives?
- **vs Zomato/Google Maps:** Curated list, not thousands of crowd-sourced reviews. No confusion, just trust.
- **vs Instagram:** Places are organised, searchable, and shown on a map. No more lost saved reels.
- **Unique value:** Every place carries the founder's personal stamp of approval.

### Goals & Success Metrics (Admin Dashboard to track)
- Total user signups
- Daily / Weekly / Monthly active users
- Most saved places ("Can't Wait to Go")
- Most visited places ("Been There")
- Most shared places
- Map usage per day
- Most popular areas / neighbourhoods
- Most popular cuisines and filters used
- Number of issue reports received

---

## 2. User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Guest (Not Logged In)** | Any visitor who hasn't signed up or logged in | Browse all places, view place details, use map, search, apply filters, share places |
| **Registered User (Logged In)** | User who has created an account | All Guest permissions + save to "Been There" / "Can't Wait to Go" / custom lists, report an issue on a place |
| **Admin (Founder)** | The founder (and trusted friends with access) | Full access: add/edit/delete places, manage filters and categories, manage users, push notifications, view metrics dashboard, manage issue reports |

---

## 3. Platforms & Devices

- **Type:** Progressive Web App (PWA)
- **Access:** Works on mobile browsers (iOS and Android) and desktop browsers
- **Installation:** Users can install Gobble Maps on their phone home screen directly from the browser (no App Store or Play Store required)
- **Offline Mode:** When there is no internet connection, the app shows the initial layer of place names on the map (no full details or images — just names/pins so users can see what's around)
- **Theme / Colour:** Sky blue / light bluish palette throughout. All design decisions (icons, buttons, accents) should use this colour scheme. Reference: Zomato uses red, Swiggy uses orange — Gobble Maps uses sky blue to stand out distinctly.

---

## 4. Screens & Pages

### 4.1 Home Screen
**Purpose:** First screen users see when they open the app. Changes dynamically based on day and time.

**What's on it:**
- **Top Section — Time & Day Based Sections:**
  - Monday to Thursday:
    - Breakfast places (visible 7:00 AM – 10:59 AM)
    - Lunch places (visible 11:00 AM – 2:59 PM)
    - Dinner places (visible 7:00 PM onwards)
  - Friday to Sunday:
    - Brunch places (visible 10:00 AM – 2:59 PM)
    - Dinner / Party places (visible 9:00 PM onwards)
  - Each section shows a horizontally scrollable row of place cards
- **Map Section:** Google Maps embedded, showing pins of nearby places (based on live location, entered location, or default Mumbai view)
- **Scrollable List Section:** Full vertical list of places the user can browse

**Actions available:**
- Tap a place card → opens Place Detail Page
- Tap a map pin → opens Place Detail Page
- Tap Search icon → opens Search Screen
- Tap Filter icon → opens Filter Panel
- Tap Login/Signup (top corner) → opens Login Screen (optional prompt, never forced)

---

### 4.2 Map Screen
**Purpose:** Full-screen interactive map of all listed places.

**What's on it:**
- Google Maps integration (full map)
- Aesthetic map pins, different icons per place category:
  - Restaurant → fork & knife icon
  - Café → coffee cup icon
  - Club / Bar → cocktail glass icon
  - Bakery / Dessert Place → cake/cupcake icon
  - Street Food Stall → food cart icon
  - Brewery → beer mug icon
- Pin colours:
  - **Visited by curator (with full review):** One colour (e.g. rich sky blue / teal)
  - **Not yet personally visited by curator (basic info only):** A different, muted colour (e.g. light grey-blue)
- Location options (top of screen):
  - "Use My Location" button → detects live GPS location, centres map on user
  - Search bar → user types any Mumbai location, map centres there
  - If neither → defaults to full Mumbai view, user can zoom in
- Active filters shown as chips/tags at top of map

**Actions available:**
- Tap a pin → opens full Place Detail Page (with back button to return to map)
- Toggle filters → filters which pins are visible
- Use location options as above

---

### 4.3 Place Detail Page
**Purpose:** Full information about a single place.

**What's on it:**

**Header:**
- Place name
- Place type badge (e.g. "Restaurant", "Café", "Club/Bar")
- Curator visited badge: "✓ Personally Visited" or "ℹ️ Not Yet Visited by Curator — info sourced from Zomato/Google"

**Photos:**
- 4 to 6 photos uploaded by the admin/curator
- Swipeable photo gallery

**Ratings (Curator's personal ratings — only shown for personally visited places):**
- Food: X/5
- Service: X/5
- Ambience: X/5
- Average Score: X/5 (auto-calculated)

**Tags / Labels:**
- Cuisine type(s) (can have multiple)
- Vibe(s) (can have multiple)
- Budget: 1–5 stars (1 = cheapest, 5 = most expensive)
- Area / Neighbourhood
- Pure Veg: Yes / No
- Live Music: Yes / No
- Board Games: Yes / No

**Details:**
- Opening hours (days and times)
- Open Now / Closed indicator
- Phone number (tappable to call)
- Instagram handle (tappable, opens Instagram)
- Address
- Nearest local station

**Curator's Section:**
- Must-Try Dishes (list of recommended dishes)
- Curator's Note (personal tips, e.g. "ask for a window seat", "best after 8pm")
- Best Time to Visit

**Map Preview:**
- Small embedded Google Maps snippet showing location
- "Get Directions" button → opens Google Maps app for navigation

**Action Buttons:**
- **Share** → available to all users (Guest + Logged In). Shares via WhatsApp, Instagram, etc.
- **"Been There"** → logged-in users only. Adds to their "Been There" list. Button shows filled state if already added.
- **"Can't Wait to Go"** → logged-in users only. Adds to their wishlist. Button shows filled state if already added.
- **"Save to List"** → logged-in users only. Opens a popup to choose which custom list to save to, or create a new list.
- **"Report an Issue"** → logged-in users only. Opens a simple text form. Submitted report goes to admin panel.
- **Back to Map** button (if user arrived from map)

---

### 4.4 Search Screen
**Purpose:** Find places by name, cuisine, area, or keyword.

**What's on it:**
- Search bar (text input)
- Search results shown as a list of place cards
- If a searched place is permanently closed → show message: "This place is permanently closed."
- If no results → show "No places found. Try a different search."

---

### 4.5 Filter Panel
**Purpose:** Let users narrow down places shown on the map and lists.

**Filters available:**

| Filter | Options |
|--------|---------|
| Cuisine | North Indian, South Indian, Japanese, Chinese, Asian, Italian, Desserts, Multi-Cuisine |
| Place Type | Restaurant, Café, Clubs/Bar, Bakery/Dessert Place, Street Food Stall, Brewery |
| Vibe | Romantic, Family Dining, Party, Work Friendly, Board Games, Instagrammable |
| Budget | ★ / ★★ / ★★★ / ★★★★ / ★★★★★ (1 = cheapest, 5 = most expensive) |
| Area | All local stations from Borivali to Churchgate (East + West options) + Worli, Powai, and other key neighbourhoods |
| Timings | Open Now / Show All |
| Live Music | Yes / No / Any |
| Board Games | Yes / No / Any |
| Pure Veg | Yes / No / Any |

**Notes:**
- Multiple filters can be applied at once
- Filters persist while the user browses
- Admin can add, edit, or remove filter categories from the admin panel at any time

---

### 4.6 Login / Signup Screen
**Purpose:** Optional account creation. Never forced on users.

**Signup flow:**
1. User chooses a unique username
2. User sets a 6-digit PIN
3. User enters mobile number (labelled clearly: "For account recovery only — we will not use this for marketing or login")
4. Account created

**Login flow:**
1. User enters username
2. User enters 6-digit PIN
3. Logged in

**Forgot PIN flow:**
1. User taps "Forgot PIN"
2. Enters mobile number
3. Receives OTP via SMS
4. Sets a new 6-digit PIN

**Notes:**
- No Google login, no email login
- Login is always prompted with a message showing what they unlock (e.g. "Log in to save places, track your visits, and create custom lists")
- Login prompt appears as a soft banner/popup — never blocks browsing

---

### 4.7 User Profile / My Lists Screen
**Purpose:** Logged-in user's personal space.

**What's on it:**
- Username displayed
- **Been There** — list of all places the user has marked as visited
- **Can't Wait to Go** — wishlist of places to visit
- **My Lists** — any custom lists the user has created
  - Each list shows name, number of places, and privacy status (Private / Public)
  - Option to create a new list
  - Option to make a list public (generates a shareable link)
- Logout button
- Change PIN option

---

### 4.8 Admin Panel
**Purpose:** Full management interface for the founder. Works on both mobile and desktop browsers.

**Sections:**
1. **Dashboard** — metrics overview (see Section 10)
2. **Places** — add, edit, delete, publish places
3. **Filters & Categories** — add, edit, remove filter options
4. **Users** — view registered users, manage accounts if needed
5. **Issue Reports** — view all user-submitted reports, mark as resolved
6. **Notifications** — compose and send push notifications to all users or specific segments
7. **To Be Tried (Internal List)** — private list of places the admin plans to visit, not visible to users

---

## 5. Features & Functional Requirements

### FR-1: Time & Day Based Home Screen Sections
- **User Role:** All users
- **Behaviour:** The app detects the current day and time and displays relevant sections:
  - Mon–Thu, 7:00–10:59 AM → Breakfast
  - Mon–Thu, 11:00 AM–2:59 PM → Lunch
  - Mon–Thu, 7:00 PM+ → Dinner
  - Fri–Sun, 10:00 AM–2:59 PM → Brunch
  - Fri–Sun, 9:00 PM+ → Dinner / Party
- **Acceptance Criteria:** Sections update automatically based on device clock. If no section applies to current time, show a general "Explore" section.

---

### FR-2: Map with Location Options
- **User Role:** All users
- **Behaviour:**
  - On map screen, user is given option to share live location or enter a location manually
  - If live location shared → map centres on user's current location, shows nearby places
  - If manual location entered → map centres on that location
  - If neither → map shows full Mumbai view, user can zoom and pan
- **Acceptance Criteria:** All three scenarios work independently. Google Maps SDK is integrated. Pins are visible and tappable.

---

### FR-3: Aesthetic Map Pins
- **User Role:** All users
- **Behaviour:**
  - Each place type has a unique, aesthetically designed pin icon (see Section 4.2 for icon suggestions)
  - Curator-visited places: pins in sky blue / teal colour
  - Not-yet-visited places: pins in muted grey-blue colour
  - Logged-in users: pins for places in their "Been There" list show in a distinct colour (e.g. green tick overlay)
- **Acceptance Criteria:** Pins are visually distinct by category and visited status. Map does not feel cluttered.

---

### FR-4: Place Filters
- **User Role:** All users
- **Behaviour:** Users can apply one or multiple filters from the Filter Panel. Map pins and list update in real time to show only matching places.
- **Acceptance Criteria:** Filtering by any combination of available filters returns correct results. Filters can be cleared individually or all at once.

---

### FR-5: Place Detail Page
- **User Role:** All users (view). Logged-in users (save, report).
- **Behaviour:** Tapping any place (from map, list, or search) opens the full detail page. Page shows all available information. "Get Directions" launches Google Maps. Share button opens native share sheet.
- **Acceptance Criteria:** All fields display correctly. Missing optional fields are hidden (not shown as blank). Directions button correctly passes coordinates to Google Maps.

---

### FR-6: Visited vs Not-Yet-Visited Places
- **User Role:** All users (view)
- **Behaviour:**
  - Places personally visited by the curator show full details: photos, personal ratings, must-try dishes, curator's note
  - Places not yet personally visited show: basic info (name, address, hours, cuisine, phone, Instagram, tags) sourced from Zomato/Swiggy/Google + a clear label: "ℹ️ Not Yet Visited by Curator — info sourced from public listings"
  - No personal rating or curator's note shown for unvisited places
- **Acceptance Criteria:** Label is always visible on unvisited place pages. Unvisited places still appear on map with different pin colour.

---

### FR-7: Optional Login / Signup
- **User Role:** Guest → Registered User
- **Behaviour:** Login is never mandatory. A soft prompt shows on certain actions (saving, reporting) explaining what login unlocks. Signup uses username + 6-digit PIN + mobile number (for recovery only).
- **Acceptance Criteria:** Users can browse entire app without logging in. Logged-in features are gated but never block access to content.

---

### FR-8: Been There & Can't Wait to Go
- **User Role:** Logged-in users only
- **Behaviour:** Logged-in users can tap "Been There" or "Can't Wait to Go" on any place detail page. The place is added to the corresponding list in their profile. These can be removed from the list at any time.
- **Acceptance Criteria:** Lists persist across sessions. Buttons reflect current saved state (filled/unfilled). Removing from a list updates immediately.

---

### FR-9: Custom Lists
- **User Role:** Logged-in users only
- **Behaviour:**
  - Users can create named custom lists (e.g. "Date Night Spots", "Bandra Favourites")
  - Places can be saved to any list from the Place Detail Page
  - Lists are private by default
  - Users can toggle a list to Public, which generates a shareable link
  - Shared public lists can be viewed by anyone (even non-logged-in users) via the link
- **Acceptance Criteria:** List creation, editing, and deletion work correctly. Public link shows a read-only view of the list. Private lists are not accessible via any public URL.

---

### FR-10: Share Places
- **User Role:** All users
- **Behaviour:** Share button on Place Detail Page opens the device's native share sheet. Users can share via WhatsApp, Instagram, SMS, or any installed app. The shared link opens the place's detail page in Gobble Maps.
- **Acceptance Criteria:** Share works on both mobile and desktop. Shared link correctly deep-links to the place.

---

### FR-11: Report an Issue
- **User Role:** Logged-in users only
- **Behaviour:** "Report an Issue" button on Place Detail Page opens a text input form. User describes the issue (e.g. "place is closed", "wrong phone number") and submits. Report appears in admin panel with place name, reporter username, and report text.
- **Acceptance Criteria:** Reports are stored and visible in admin panel. User sees a confirmation message after submitting.

---

### FR-12: Permanently Closed Places
- **User Role:** Admin (manage), All users (view)
- **Behaviour:**
  - Admin marks a place as permanently closed from the admin panel
  - Place is immediately removed from the map and from all user lists (Been There, Can't Wait to Go, Custom Lists)
  - If a user searches for the place by name, a message appears: "This place is permanently closed."
- **Acceptance Criteria:** Closed places are not visible on map or in filter results. Search still finds them by name and shows the closed message.

---

### FR-13: Push Notifications
- **User Role:** All users (receive). Admin (send).
- **Behaviour:**
  - **"New Place Added":** Sent to all users when admin publishes a new personally-reviewed place
  - **"New Place in Your Area":** Sent to logged-in users when a new place is added in a neighbourhood they have saved places in
  - Admin can also manually compose and push a notification from the admin panel
- **Acceptance Criteria:** Notifications are received on mobile devices. Tapping a notification opens the relevant place detail page.

---

### FR-14: Admin — Add / Edit Place
- **User Role:** Admin only
- **Behaviour:** Admin can add a new place by filling in all fields (see Data Requirements, Section 7). Admin can upload 4–6 photos. Admin can tag a place with multiple cuisines, vibes, and other filters. Admin can save as Draft (not visible to users) or Publish (visible to users).
- **Acceptance Criteria:** Published places appear immediately on the app. Draft places are only visible in admin panel. All filter tags are correctly applied and searchable.

---

### FR-15: Admin — Manage Filters
- **User Role:** Admin only
- **Behaviour:** Admin can add new filter options, rename existing ones, or remove them from any filter category (Cuisine, Vibe, Place Type, etc.). Changes reflect immediately in the Filter Panel for all users.
- **Acceptance Criteria:** New filter options appear in user-facing Filter Panel within seconds of being added by admin.

---

### FR-16: Offline Mode
- **User Role:** All users
- **Behaviour:** When the user has no internet connection, the app displays the last cached map view with place names visible as pins. Full place details and images are not available offline. A banner message shows: "You're offline. Some content may not load."
- **Acceptance Criteria:** App does not crash when offline. Place name pins are visible. Tapping a pin shows cached basic info if available, or a "Connect to the internet to view details" message.

---

## 6. User Flows

### 6.1 First-Time Guest User
1. User opens Gobble Maps in browser / installed PWA
2. Home screen loads with time-based sections + map + list
3. User browses places, taps one → Place Detail Page
4. User taps "Get Directions" → Google Maps opens
5. User taps Share → native share sheet opens
6. User tries to tap "Can't Wait to Go" → soft prompt appears: "Log in to save places"
7. User closes prompt and continues browsing without logging in

---

### 6.2 User Signs Up
1. User taps Login / Signup
2. Taps "Create Account"
3. Enters a username → system checks availability
4. Sets 6-digit PIN
5. Enters mobile number (recovery only)
6. Account created → user is logged in
7. User sees their profile with empty Been There and Can't Wait to Go lists

---

### 6.3 Logged-In User Saves a Place
1. User opens Place Detail Page
2. Taps "Can't Wait to Go" → place added to wishlist, button fills
3. OR taps "Save to List" → popup shows existing custom lists + "Create New List" option
4. User selects or creates a list → place saved
5. Confirmation message shown

---

### 6.4 User Uses Map with Filters
1. User opens Map Screen
2. Taps "Use My Location" → map centres on user
3. Taps Filter icon → Filter Panel opens
4. Selects Cuisine: Japanese, Vibe: Romantic, Budget: ★★★
5. Map updates — only matching pins visible
6. User taps a pin → Place Detail Page opens
7. Taps "Back to Map" → returns to filtered map

---

### 6.5 Admin Adds a New Place
1. Admin logs into admin panel
2. Navigates to Places → Add New Place
3. Fills in all details (name, address, tags, hours, ratings, must-try dishes, curator's note, phone, Instagram, etc.)
4. Uploads 4–6 photos
5. Tags multiple cuisines and vibes
6. Saves as Draft OR clicks Publish
7. If Published → place appears on map immediately + push notification sent to users

---

### 6.6 User Reports an Issue
1. Logged-in user on Place Detail Page
2. Taps "Report an Issue"
3. Types issue description (e.g. "Phone number is incorrect")
4. Submits report
5. Confirmation message: "Thanks! We'll look into this."
6. Report appears in admin panel under Issue Reports

---

## 7. Data Requirements

### Place
- Name
- Place Type (Restaurant / Café / Clubs & Bar / Bakery & Dessert Place / Street Food Stall / Brewery)
- Cuisine(s) — can be multiple
- Vibe(s) — can be multiple
- Budget (1–5 stars)
- Area / Neighbourhood
- Nearest local station
- Address (full text)
- Latitude & Longitude (for map pin)
- Phone number
- Instagram handle
- Website (optional)
- Opening hours (per day of week: open time, close time, or closed)
- Photos (4–6 images, uploaded by admin)
- Curator Visited: Yes / No
- If Visited:
  - Food Rating (1–5)
  - Service Rating (1–5)
  - Ambience Rating (1–5)
  - Average Rating (auto-calculated)
  - Must-Try Dishes (list of dish names)
  - Curator's Note (free text)
  - Best Time to Visit (free text)
- Live Music: Yes / No
- Board Games: Yes / No
- Pure Veg: Yes / No
- Status: Draft / Published / Permanently Closed
- Date Added
- Date Last Updated

---

### User
- Username (unique)
- 6-digit PIN (stored securely / hashed)
- Mobile number (for recovery only)
- Date Joined
- Been There list (array of Place IDs)
- Can't Wait to Go list (array of Place IDs)
- Custom Lists (each list has: name, privacy status, array of Place IDs)

---

### Issue Report
- Report ID
- Place ID + Place Name
- Reported by (Username)
- Report text
- Date submitted
- Status: Open / Resolved

---

### Notification Log
- Notification ID
- Type (New Place / Area-based / Manual)
- Message text
- Place ID (if applicable)
- Date sent
- Recipients (All / Segment)

---

### Admin Internal — To Be Tried List
- Place name
- Address
- Notes (why it's on the list)
- Date added to list
- Status: Pending Visit / Visited (at which point admin moves it to the main published places)

---

## 8. Notifications & Communications

| Trigger | Recipient | Message |
|---------|-----------|---------|
| Admin publishes a new personally-reviewed place | All users | "🍴 New spot on Gobble Maps! [Place Name] in [Area] just dropped. Check it out!" |
| New place added in an area where user has saved places | Logged-in users with saves in that area | "📍 New place near your saved spots! [Place Name] just added in [Area]." |
| Admin manually sends notification | All users or specific segment | Custom message composed by admin |

**Notes:**
- Notifications are push notifications (PWA supports web push notifications)
- Users should be able to opt out of notifications from their profile settings
- Tapping a notification deep-links to the relevant place detail page

---

## 9. Payments & Monetisation

**Not applicable for Version 1.** No payments, subscriptions, ads, or paid promotions in the first release.

---

## 10. Admin Panel Requirements

### 10.1 Metrics Dashboard
The admin dashboard must display the following, with date range filters (today / this week / this month / all time):
- Total registered users
- New signups (in selected period)
- Daily active users (DAU)
- Weekly active users (WAU)
- Monthly active users (MAU)
- Most saved places (Can't Wait to Go — top 10)
- Most visited places (Been There — top 10)
- Most shared places (top 10)
- Map opens per day (chart)
- Most popular areas / neighbourhoods (bar chart)
- Most popular cuisines (bar chart)
- Most used filters
- Open issue reports count

---

### 10.2 Places Management
- View all places (Published / Draft / Permanently Closed / To Be Tried)
- Add new place (full form with all fields, multi-tag support)
- Edit any existing place
- Delete a place (with confirmation prompt)
- Mark a place as Permanently Closed
- Upload / replace photos (min 4, max 6 per place)
- Preview how a place looks to users before publishing

---

### 10.3 Filters & Categories Management
- View all current filter options per category
- Add new option to any filter category
- Rename any existing filter option
- Remove a filter option (with warning if it's currently used by active places)

---

### 10.4 User Management
- View list of all registered users (username, join date, activity)
- View a user's saved lists (for support purposes)
- Delete a user account if necessary

---

### 10.5 Issue Reports
- View all submitted reports (sorted by date, filterable by status)
- See: place name, reporter username, report text, date
- Mark report as Resolved
- Take action (edit the place directly from the report)

---

### 10.6 Push Notifications
- Compose a notification message
- Select recipients: All Users or Users with saved places in a specific area
- Schedule or send immediately
- View notification history (sent notifications with date and recipient count)

---

### 10.7 To Be Tried (Internal List)
- View admin's private pipeline of places to visit
- Add, edit, delete items
- Mark as "Visited" — triggers flow to create a full place listing

---

## 11. Business Rules & Edge Cases

| Situation | Rule |
|-----------|------|
| User has no internet | Offline mode shows cached place names on map. Banner shown: "You're offline." |
| Place is permanently closed | Removed from map and all user lists. Searchable by name with message: "This place is permanently closed." |
| User forgets PIN | Can reset via mobile number OTP |
| User forgets username | Must contact support (no automated recovery for username in V1 — flagged as open question) |
| Admin tries to publish place with fewer than 4 photos | System blocks publish and shows error: "Please upload at least 4 photos before publishing." |
| User tries to save a place without logging in | Soft prompt shown: "Log in to save places and track your visits." Browse is not blocked. |
| A place can have multiple cuisine/vibe tags | Supported. Admin can select multiple options from each filter category. |
| Two users report the same issue | Both reports appear in admin panel separately. Admin resolves at their discretion. |
| Admin removes a filter option that is tagged to existing places | System warns admin. If removed, places retain the tag internally but it no longer appears in the filter panel. Admin should manually re-tag affected places. |
| Place added to user list is later permanently closed | Place is removed from user's list automatically. |

---

## 12. Design Direction

### Colour Palette
- **Primary:** Sky blue / light bluish (main brand colour — for buttons, pins, accents, highlights)
- **Secondary:** White / off-white backgrounds for clean, minimal feel
- **Accent:** Deeper blue or teal for visited place pins and active states
- **Muted:** Grey-blue for unvisited place pins, secondary text

### Reference Apps for Style Inspiration
- Clean and minimal map UI (reference: Google Maps simplicity)
- Curated editorial feel (reference: a premium lifestyle magazine app)
- Easy-to-scan place cards with photos prominent

### Map Pin Design
- Each place category has a unique aesthetic icon (fork & knife, coffee cup, cocktail glass, cake, food cart, beer mug)
- Pins should be clean, rounded, and visually appealing — not the standard Google Maps red pin style
- Visited vs unvisited pins must be clearly distinguishable at a glance

### Overall Feel
- Fresh, clean, trustworthy
- Not cluttered or overwhelming
- Sky blue should feel distinct from Zomato (red) and Swiggy (orange)

---

## 13. Out of Scope for Version 1

The following features are deliberately excluded from the first release to keep the app simple and focused:

- ❌ Food delivery integration (no Zomato/Swiggy order links)
- ❌ In-app chat or community/social features
- ❌ Events or special offers from restaurants
- ❌ Monetisation, ads, or paid promotions
- ❌ Expansion to cities outside Mumbai (planned for later)
- ❌ User-generated reviews or ratings (only curator ratings in V1)
- ❌ Loyalty or rewards programme
- ❌ Table reservation integration

---

## 14. Open Questions

The following items require further clarification or decisions before or during development:

| # | Question | Why It Matters |
|---|----------|---------------|
| 1 | What happens if a user forgets their username (not PIN)? | No automated recovery exists for usernames in V1. Options: contact support via an email, or prompt users to also save their username during signup. |
| 2 | Should the app request push notification permission on first open, or only when a user opts in? | Affects how many users receive notifications. Best practice is to ask at a meaningful moment (e.g. after they've browsed a few places). |
| 3 | What are all the local stations to be listed under the Area filter? (Full list from Borivali to Churchgate, Western + Central + Harbour lines, East + West) | Developer needs the complete list to build the filter. |
| 4 | Should "To Be Tried" places (not yet personally visited by curator) be visible on the map from Day 1, or only after the app has a sufficient number of personally reviewed places? | Impacts how full the map looks at launch. |
| 5 | Who are the "trusted friends" who help curate — do they need their own admin logins, or do they submit suggestions to the founder who then publishes? | Determines if multi-admin access is needed in V1. |
| 6 | What is the preferred hosting / backend stack? | Developer decision, but good to confirm early for PWA offline capabilities. |
| 7 | Is there a specific target number of places to be listed at launch before the app goes live? | Helps plan pre-launch workload. |

---

*Document