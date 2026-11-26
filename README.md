# CampusGo – Antonine Campus Delivery App

**Your campus, delivered between classes.**

## About

CampusGo is a React Native (Expo) app for ordering food, drinks, stationery and printing from the stores on the Antonine University campus. Orders are delivered to your building and room during a class break. It is the final project of the Mobile Development course.

**User guide for students:** [docs/USER_GUIDE.md](docs/USER_GUIDE.md) (install, ordering, printing, tracking, extras, 5-minute demo script, FAQ).

## Features

- First-launch onboarding (3 slides), Welcome with the official UA logo and a one-tap demo account
- University login and 2-step sign-up with validation (`@ua.edu.lb` email, UA ID checked against a (mock) UA registry, Lebanese phone, faculty, campus)
- Home: 4 campus stores with live Open/Closed state, search, category filter, pull-to-refresh
- Store menus grouped by category, product sizes and extras, quantity, out-of-stock handling
- Printing service: live price, colour/B&W, double-sided, binding
- Cart limited to one store, minimum order, free-delivery threshold
- Checkout in 3 steps (Location → Delivery → Payment): real campus buildings and room codes (`G.2.15`), delivery break slots with rules, campus wallet or cash
- Live order tracking (status advances every 8 / 20 / 60 seconds, even when the app is closed), cancel with refund, rating
- Order history with filters and reorder
- Profile: campus choice (3 UA campuses), saved locations with door-sign room codes, demo clock, campus wallet with top-ups and transactions grouped by day
- Motion and feedback: press animations, staggered lists, skeletons, toasts with Undo, haptics
- Data saved on the phone with AsyncStorage (per account)

## Tech stack (and course chapters)

| Part | Used for | Chapter / concept |
| --- | --- | --- |
| Expo SDK 58, React Native, JavaScript | The app | Functional components + Hooks |
| `View`, `Text`, `Image`, `TextInput`, `Pressable`, `Switch`, `Modal`, `ActivityIndicator` | UI | Core components |
| `Animated` (`timing`, `spring`, `sequence`, `loop`, `stagger`, `event`), `LayoutAnimation` | Motion | Animations |
| `AccessibilityInfo` (Reduce Motion), `accessibilityLabel` | Accessibility | — |
| `FlatList` (`horizontal`, `ListHeaderComponent`, `ListEmptyComponent`), `RefreshControl` | Every data list | Lists |
| `StyleSheet.create` in `*.styles.js` files, style arrays | Styling | Styling |
| `useState`, `useEffect` (mount, dependencies, cleanup), `useContext`, custom hooks (`useTheme`, `useThemedStyles`) | State, timers, theme | Hooks, Context API |
| `async/await`, `Promise`, `fetch` (`src/services/api.js`) | Loading data | Chapter 19 |
| `@react-native-async-storage/async-storage` | Persistence | Storage |
| React Navigation: native stack + bottom tabs, route params | Navigation | Navigation |
| `expo-linear-gradient`, `@expo/vector-icons`, Karla + Roboto (`@expo-google-fonts`) | Design | — |
| `expo-haptics` | Haptic feedback | — |
| `expo-notifications`, `expo-document-picker`, `expo-file-system`, `@react-native-community/netinfo` | Notifications, file pick, offline detection | Native modules |

No Redux, no Expo Router, no TypeScript, no `Alert.alert` (all messages use our own `ConfirmModal`).

## Code structure for styles

Every screen and component keeps its styles in a separate file next to it, like a CSS file. Since dark mode, the
style file exports a **factory** that receives the colour palette:

```
LoginScreen.js         <- the component (JSX + logic)
LoginScreen.styles.js  <- export const createStyles = (c) => StyleSheet.create({ ... })
```

In the screen: `const styles = useThemedStyles(createStyles);` (a small hook that runs the factory with
`useMemo`, so it only re-runs when the palette changes). Spacing, radius, fonts and typography come from
`src/theme/theme.js`; colours come from the `c` argument.

## How to run

1. Install [Node.js](https://nodejs.org) (LTS) and the **Expo Go** app on your phone.
2. In the `campusgo` folder:

   ```bash
   npm install
   npx expo start
   ```

3. Scan the QR code with Expo Go (Android) or the Camera app (iPhone). The phone and laptop must be on the same Wi-Fi.
4. If the university Wi-Fi blocks the connection, run:

   ```bash
   npx expo start --tunnel
   ```

## Demo account

| Email | Password |
| --- | --- |
| `student@ua.edu.lb` | `campus123` |

The demo account starts with a wallet of about **$33** (after its seeded orders), 12 past delivered orders, a coffee card at **8 / 10 stamps** and a saved location **"My Lab – Building D, Room D.2.8"** (the Robotics Lab) on the Hadat–Baabda campus. On the Welcome screen, **Use demo account** fills the login for you. New accounts get a **$10.00** welcome credit.

## Demo clock

Store hours and delivery breaks depend on the time. Because a presentation can happen at any hour, the app has a **demo clock**:

1. Open **Profile → Demo settings**.
2. Type a time such as `11:00` and press **Set time**. All stores, slots and greetings now use this time (it keeps ticking from there).
3. Press **Reset** to go back to the real phone time.

The same screen has a **demo date** (needed because UA is closed on weekends and holidays): type `YYYY-MM-DD`, or tap **Next weekday**, **A Saturday**, **Christmas break** (28 Dec 2026) or **Independence Day (23 Nov)**. The quick buttons also set the time to 11:00. **Set time** keeps the chosen date; **Reset** goes back to the real date and time. The date is stored as the same time offset as the clock, so `getNow(timeOffsetMs)` returns that date and time everywhere (weekday, greeting, breaks, open/closed, closures, past-order dates, wallet times).

Tip: `11:00` on a normal weekday makes every store open and most delivery breaks available. The UA Cafeteria is open 07:30–22:00, Monday to Friday.

## UA calendar: weekends, closed days, semester breaks

UA is **closed** (no orders at all) on: Saturdays and Sundays; every date in `closedDays`; and every date outside the `teachingPeriods` (semester start → end of exams) while `"closeBetweenSemesters": true`. The data and the rules are in `src/data/uaCalendar.json` and `src/utils/calendar.js` (`isUniversityOpen`, `getClosure`, `getDayStatus`). Sources: the UA Academic Calendar 2026–27 (https://ua.edu.lb/en/academic-calendar), the UA HR holiday calendar (https://ua.edu.lb/en/human-resources/holiday-calendar) and PM Memorandum No. 25/2026 (23 Nov 2026). Lunar-calendar dates are marked `"estimated": true` and shown with "(date may change)".

While UA is closed: **Add to bag, Reorder, Print → Add to bag and Place order are blocked**, in the screens *and* inside `AppContext` (`addToCart`, `replaceCart`, `reorder`, `placeOrder`). Browsing menus stays allowed ("Browsing only – …" on the store menu). Home, the product sheet, the bag and checkout show the reason and when ordering opens. Break reminders skip closed days.

**How to add a new closed day** (the government often announces extra days off at short notice):
1. Open `src/data/uaCalendar.json` and add one line to `closedDays`: `{ "date": "2027-02-12", "name": "Extra day off", "type": "national" }`, or a range `{ "from": "2027-02-12", "to": "2027-02-14", "name": "…", "type": "ua" }`. Add `"estimated": true` if the date may still change. An entry with `"closesCampus": false` is only an event and does not close anything.
2. Run `node scripts/sync-calendar.js`. It copies the file into `src/data/campus.json` and `db.json` (key `calendar`) so the three stay identical.
3. Reload the app. Past entries are ignored automatically and never need to be deleted. To stop closing the university between semesters, set `"closeBetweenSemesters": false`.

## Business rules

**Stores**
- A store is open when **UA is open today** (see *UA calendar* below), the store works on this weekday (`days` in `campus.json`, JS `getDay()` convention: Sunday = 0 … Saturday = 6, so Monday–Friday = `[1,2,3,4,5]`) and opening time ≤ now < closing time. Hours: UA Cafeteria 07:30–22:00; Coffee Corner 07:30–22:00 (same as the Cafeteria); Bookstore 08:00–15:00; Printing Office 08:00–16:30; all Monday to Friday.
- Closed stores show a red badge that says when they open next: "Closed · opens Monday 07:30", or "Closed for Independence Day … · opens tomorrow 07:30" (`storeStatusLabel` in `src/utils/time.js`). You can browse them, but you cannot add their products or check out.

**Cart**
- The cart can only hold items from one store. Adding from another store asks whether to empty the cart first.
- Out-of-stock products show a badge and cannot be added.
- Quantity minimum is 1; pressing − at 1 asks to remove the item.

**Totals** (money is stored in cents)
- Subtotal = sum of unit price × quantity, minus the loyalty reward if used.
- Minimum order is **$2.00** (counted on what you pay, after the loyalty reward); below it, checkout is disabled and the app shows how much is missing.
- Delivery is **free above $10.00**, with a **$0.50** fee on paid subtotals up to and including $10.00. The Bag shows the subtotal after rewards and progress toward $10.01, the smallest qualifying subtotal.

**Printing**
- Price = pages × copies × ($0.05 B&W or $0.25 colour) + binding × copies.
- Binding: none $0.00, staple $0.25, spiral $1.50 (per copy).
- Double-sided does not change the price; the app shows how many sheets you save.
- Pages and copies must be positive whole numbers. The total printed pages across all jobs, copies, and quantities cannot exceed 200 per order. A document name is required.
- With 0 pages (or 0 copies) the price is **$0.00**: the binding fee is only charged when something is printed.
- The hint "Page count edited by you" appears only after the student changes the page count the app filled in (detected or sample document).

**Delivery breaks**
- **Breaks** are UA's real ones (75-minute classes): 09:45–10:00, 11:15–11:30, 12:45–13:00, **14:15–15:30 (long break)**, 16:45–17:00, 18:15–18:30, 19:45–20:00. Orders store the break label, so orders placed with the older timetable still display their own break.
- A break is disabled if UA is closed today ("UA is closed today"), if the store does not work today, if it has already started ("Passed"), if the store cannot prepare the order in time — now + preparation time > break start ("Too close – needs N min") — or if it starts after the store closes ("Store closed").
- The home banner shows the **next available break**: the first break the student can still order for. It uses the cart's store if the bag is not empty, otherwise the **shortest preparation time among the stores that are open now**, through the same `getSlotState` rule as checkout (`getNextAvailableSlot` in `src/utils/time.js`). A break that has not started but is already too close is skipped and mentioned in a small line ("14:00–14:15 break is too close to order"). If nothing is left today the banner says "No more breaks today – ordering opens tomorrow at 09:45" (or the next open day). On a closed day the banner is replaced by the reason, e.g. "🎄 UA is closed – Christmas & New Year's · Ordering opens Monday 18 Jan at 09:45". With 0 minutes left it says "Order now – last minute for this break".

**Checkout**
- Checkout starts at Location with no saved place selected. Choose a saved place or confirm a new room, then select a delivery break and payment method. Place order stays disabled while information is missing or the order cannot be placed.
- Building, floor and room number (1–99) are required; together they form the real UA room code `Building.Floor.Room` (e.g. `G.2.15`). Delivery break and payment method are required too.
- Only the buildings of the user's campus are shown.
- Saved locations fill the location in one tap; a new place can be saved during checkout.
- Wallet payment is refused if the balance is lower than the total (the app shows the missing amount and a Top up button). Cash on delivery is always allowed.

**Tracking**
- Simulated status steps: Received → Preparing → On the way → Delivered. Stages advance at the selected speed starting from placement. Status timestamps remain valid after reopening the app.
- Tracking shows the scheduled break separately from order progress. The timeline shows recorded timestamps where available and leaves unrecorded stages without a time. The selected break records the delivery booking. Tracking and notifications use the simulated schedule.
- The last step reads **"Delivered to Building D, Room D.2.8"** before and after delivery. Only the label changes; the status keys (`STATUS_STEPS`) and the history filters are unchanged.
- A **cancelled** order keeps "Received" as done (with its time), shows the other steps as skipped, replaces "Arriving" by "Cancelled at HH:MM" (plus "Refunded $X to wallet" for wallet orders) and hides the courier card.
- An order can be cancelled only while it is "Received". Wallet orders are refunded.
- After delivery the order can be rated 1–5 stars with an optional comment.

**Wallet**
- Top-ups of $5, $10, $20 or a custom amount (max $200). Every top-up, payment and refund is listed as a transaction.

**Accounts**
- Email must end with `@ua.edu.lb` (typing only the username adds the domain automatically); password ≥ 6 characters;
- **UA ID**: 8 digits whose first 4 are the year of enrolment (1996 → the current demo year), constant `UA_ID_REGEX` in `src/utils/validation.js`. It is looked up in the **mock UA registry** (`uaRegistry` in `campus.json`, 25 records incl. the demo account `20231234`; the app cannot reach UA's real student system, so this is simulated). Not found → "This ID isn't in Antonine University's records. Check your student card." Found → faculty and campus are filled from the record and locked, with a "✓ Verified UA ID" badge. The first name typed must match the record (case-insensitive, titles like Dr. ignored), otherwise "Name doesn't match the UA record for this ID". One account per ID ("An account already exists for this ID"). Example IDs to try: `20240101` Rami Khoury, `20240215` Maya Haddad, `20230342` Karim Nassar, `20250123` Elie Frem, `20230876` Georges Sleiman (Zahle), `20231390` Charbel Rahme (Zgharta). Login accepts the university email and password.
- phone matches `03xxxxxx`, `7Xxxxxxx` or `81xxxxxx`; passwords must match; an email can only be registered once.

## Project structure

```
App.js                  fonts + AppProvider + NavigationContainer
db.json                 copy of the mock data for json-server
src/
  data/campus.json      mock data
  data/images.js        maps product ids / store ids to local photos (one static require per file)
  services/api.js       loadCampusData() – fetch with timeout, fallback to local JSON
  context/               AppContext (user, cart, wallet, orders, loyalty), ThemeContext, NetworkContext
  hooks/                 useThemedStyles, useDietFilter, useNotificationNavigation
  services/              api (fetch + catalog cache), notifications (local scheduled notifications)
  utils/                 money, time, validation, orderStatus, loyalty, diet, spending, pdfPages, notificationPlan, demoSeed (pure functions), haptics
  theme/theme.js        colours, spacing, radius, fonts, typography, shadows
  navigation/           RootNavigator, AuthStack, MainTabs
  components/           reusable UI (AppButton, AppInput, Card, Badge, Chip, DoorSign, RoomPicker, …)
    motion/             animation kit (PressableScale, FadeInView, Toast, …)
assets/brand/           official UA logos (blue and white)
assets/products/        product photos (README lists the exact filenames; optional, gradient fallback)
assets/stores/          store logos (same idea)
docs/USER_GUIDE.md      user manual for students (+ docs/screenshots/)
  screens/
    auth/               Onboarding, Welcome, Login, SignUp
    home/               Home, StoreMenu, ProductDetails
    print/              Print
    cart/               Cart, Checkout
    orders/             Orders, Tracking
    profile/            Profile, Wallet, Loyalty, Notifications
```

## Mock data summary

Source: `src/data/campus.json` (`db.json` is an identical copy for json-server).

| Data | Brief asks for | We have |
| --- | --- | --- |
| Stores | ≥ 4 | **4** (UA Cafeteria, Coffee Corner, Bookstore & Stationery, Printing Office) |
| Products | ≥ 25 | **28** (3 out of stock; the Printing Office has no products, it uses the print form) |
| Buildings | ≥ 6 | **10**: **6 on the main Hadat–Baabda campus** (A, B, C, D, G, Sports Complex S) · Zahle 2 (A, B) · Zgharta 2 (A, B) |
| Delivery breaks | ≥ 5 | **7** (UA's real timetable, incl. the 14:15–15:30 long break) |
| UA registry (mock) | – | 25 records (students and staff) |
| Calendar | – | 3 teaching periods, 21 closed-day entries (`src/data/uaCalendar.json`) |
| Campuses | – | 3 (Hadat–Baabda, Nabi Ayla–Zahle, Mejdlaya–Zgharta) |
| Couriers | – | 6 |
| Faculties | – | 7 (the real UA faculties) |

## Background image

Onboarding and Welcome use a photo of the Hadat–Baabda campus (`assets/backgrounds/ua-campus.jpg`, from the official UA website, see `assets/CREDITS.md`) through `components/CampusBackground.js`: a dark UA-blue overlay (85–95% opacity, white text stays above 4.5:1), a slow Ken Burns zoom (1.0 → 1.06 over 12 s, off when Reduce Motion is on) and the blue gradient as fallback. The photo is preloaded with `Asset.loadAsync` during the splash. The mapping is `src/data/backgrounds.js` (comment its line out if you remove the file).

## Product photos and store logos

All 28 products and 4 stores have a free-licence photo from Wikimedia Commons (credits in `assets/CREDITS.md` and in the app: Profile → About → Photo credits). Without a photo a product or store shows a gradient tile with an icon. To add real images: put `assets/products/<productId>.jpg` (e.g. `p12.jpg`, 600×600, under 80 KB) or `assets/stores/<storeId>.jpg` in the folder, then add **one line** to `src/data/images.js` (Metro needs static `require`s, and JSON cannot hold them). `assets/products/README.md` and `assets/stores/README.md` list every expected filename. The image then appears on product cards, the product sheet, the bag, Home search results and "Order again", the store cards and the store menu header. Items without an image keep the gradient, and out-of-stock items stay dimmed.

## UA Branding & Campus Data

**Logos.** The official Université Antonine logos are in `assets/brand/` (from ua.edu.lb): the white logo on blue screens (Onboarding, Welcome, Wallet watermark) and the blue logo on light screens (Login, Sign-up, Profile). They are always shown with `resizeMode="contain"` at their real ratio (about 3.3 : 1). The app keeps its own product name, **CampusGo**, shown as a wordmark "by Université Antonine".

**Colours** (official values from the ua.edu.lb stylesheet, in `src/theme/theme.js`):

| Token | Value | Use |
| --- | --- | --- |
| `primary` | `#005BAA` UA blue | headers, primary buttons, active tab |
| `primaryDark` | `#0C2640` UA deep navy | gradients, titles, text |
| `primaryMid` | `#0F5CA8` | pressed states, links |
| `textBrand` | `#32577C` UA slate blue | secondary text, section titles |
| `accent` | `#00AEEF` UA cyan | highlights, live indicators, progress |
| `accentWarm` | `#FBB040` UA amber | badges, cart badge |
| `success` / `danger` / `warning` | `#009444` / `#ED1C24` / `#E8930C` | status |

Category tiles use the UA faculty palette. White text is only used on the dark blues; on cyan and amber the text is navy, so text/background pairs meet WCAG AA contrast.

**Fonts.** Like ua.edu.lb: **Karla** (Bold / ExtraBold) for titles, prices and buttons, **Roboto** (Regular / Medium) for body text, inputs and captions. Text scaling is capped at 1.3× so large accessibility sizes don't break layouts.

**Campuses.** Hadat–Baabda (Main Campus), Nabi Ayla–Zahle and Mejdlaya–Zgharta. Each user picks a campus at sign-up (default Hadat–Baabda) and can change it in Profile; the Home header and the Checkout buildings follow it.

**Buildings (Hadat–Baabda).**

| Code | Building | Landmarks |
| --- | --- | --- |
| A | Building A | Library, central administration (HR, Communications) |
| B | Building B | Office of Student Affairs, health labs |
| C | Building C | Information & Communication studios, Engineering labs |
| D | Building D | Computer & Communications Engineering, Robotics lab |
| G | Building G | Business School, **Cafeteria** (ground floor), Mac labs |
| S | Sports Complex | Sport Sciences, gym, pools (the site gives no letter, so the app uses `S`) |

Nabi Ayla–Zahle has buildings A and B (cafeteria in B); Mejdlaya–Zgharta has buildings A and B.

**Room codes.** UA rooms follow `Building.Floor.Room` (e.g. Student Affairs `B.0.34`; floor 0 = ground floor). The room picker builds the code from building, floor and room number and shows it like a door sign, e.g. **G.2.15**. Rooms are displayed everywhere as "Building G · Room G.2.15". Rooms saved by version 1 of the app stay readable.

**Store locations.** The UA Cafeteria is real (Building G ground floor on Hadat–Baabda, Building B in Zahle, open 07:30–22:00, Monday to Friday). **Coffee Corner, Bookstore & Stationery and Printing Office are assumed** for this project (marked `"isPlaceholder": true` in the data): Coffee Corner in Building A, Bookstore in Building B, Printing Office in Building C, all on the ground floor.

**Faculties.** Antonine School of Business · Faculty of Engineering and Technology · Faculty of Information and Communication · Faculty of Music and Musicology · Faculty of Public Health · Faculty of Sport Sciences · Faculty of Theology.

## Animations & UX

All animations use React Native's built-in `Animated` API (native driver where possible) and `LayoutAnimation`. When the phone has **Reduce Motion** turned on, animations are skipped or shortened.

| Component (`src/components/motion/`) | What it does |
| --- | --- |
| `PressableScale` | Every button, card and chip shrinks slightly when pressed (spring) |
| `FadeInView` / `StaggerItem` | Content fades and slides in; list items appear one after another |
| `useScreenFocusAnimation` | Replays the entrance animation each time a tab is opened |
| `PulseDot` | Pulsing dot for "Open now", the current tracking step and live orders |
| `BumpBadge` | The cart badge and quantities "bump" when they change |
| `ShakeView` | Forms shake (with an error haptic) when submit fails |
| `SkeletonBlock` | Shimmering placeholders while lists load |
| `AnimatedProgressBar` | Tracking progress, free-delivery progress, password strength |
| `Toast` | Short messages at the bottom ("Added to bag", "Removed – Undo", "Location saved") |
| `SuccessCheck` | Animated check for "order placed" and "top-up successful" |

UX decisions:
- **One clear main action per screen**, in a sticky bottom bar on long screens (product, print, bag, checkout).
- **No disabled button without a reason**: a one-line explanation is shown under it.
- **Checkout stepper** Where → When → Pay; each finished step collapses to a one-line summary.
- **Inline validation** on blur; on submit the form shakes and focuses the first error. The keyboard "Next" key moves to the next field.
- **Undo** after removing an item from the bag.
- **Haptics** (`expo-haptics`): tap on main buttons and add to bag, success for orders/top-ups/delivery, error on failed forms, warning on cancel.
- **Onboarding** shows only once (saved in AsyncStorage as `campusgo:onboardingDone`).
- Touch targets are at least 44×44 and icon-only buttons have accessibility labels.

## Loyalty stamps

Every 10th coffee is free. The pure rules live in `src/utils/loyalty.js`.

- Only products with `"loyalty": "coffee"` count (espresso, americano, cappuccino, latte, iced latte; not tea, juice, water or hot chocolate). **1 stamp per cup** (2 cappuccinos = 2 stamps).
- Stamps are credited **only when the order reaches Delivered**, never when it is placed, so cancelled orders earn nothing. `settleDeliveredOrders` is idempotent (it flags each order `stampsCredited`) and runs on app start, when the app returns to the foreground, every 2 s while logged in and on every tracking tick. This matters because an order can be delivered while the app is closed.
- 10 stamps = 1 reward; the remainder carries over.
- In the bag, **Apply reward** discounts the **most expensive single coffee** (size included, extras paid). One reward per order. The free coffee does not earn a stamp.
- The reward is consumed when the order is placed and **given back if the order is cancelled** (history entry "refunded").
- The **minimum order and the free-delivery threshold use the subtotal after the reward**.
- Reorder uses the current catalog prices and options for available products. It preserves the original order and its reward history. Print jobs can be reordered when the saved document is available. If it is unavailable, select it again in Print.
- Loyalty, order history, and the Bag?s reward selection share the account snapshot in AsyncStorage. The demo account starts at **8 / 10**.

## Printing files

The Print screen uses `expo-document-picker`.

- Supported types are PDF, Word (`.doc`, `.docx`) and images, up to **25 MB**.
- Page suggestions are **best effort** (`src/utils/pdfPages.js`). Images count as one page, and PDFs up to 10 MB are scanned for page objects. Enter the page count manually when a suggestion is unavailable, such as for Word files or some compressed PDFs.
- The Copies card shows printed pages against the 200-page limit and counts physical sheets. Double-sided jobs round up separately for each copy.
- Adding a real job saves the document locally on the device or in the browser. The Bag and order history keep the local reference, file information, and print settings.
- "Use a sample document" remains as a demo fallback.

## Dietary filters & seasons

Every product has `tags` (`vegetarian`, `vegan`, `siyami`, `halal`, `iftar`) and optional `allergens` (info only, shown on the product sheet).

| Tag | Meaning |
| --- | --- |
| `vegetarian` | No meat or fish (vegan products are also vegetarian) |
| `vegan` | No animal products |
| `siyami` | Lenten fasting food: no meat, dairy or eggs |
| `halal` | Only for products with meat |
| `iftar` | Travels well for breaking the fast at sunset (juices, packed sandwiches, sweets) |

- Filters are multi-select and a product must have **all** the selected tags (`matchesDiet`). They appear on every store menu and on Home. Empty sections are hidden and a count line ("12 items match") is shown.
- **My diet** (Profile) saves default filters per user. They are applied when a menu opens and shown as a removable chip; removing it only clears it for that visit.
- **Seasons** are in `src/data/campus.json` (`seasons`). The banners use the **demo clock**, so move the demo time into a season to show them. **The dates are approximate (2027 Lent 8 Feb - 27 Mar, Ramadan 8 Feb - 9 Mar): verify and edit them before the demo.** Both can be active at once. Each banner can be dismissed and stays dismissed for that season.

## Dark mode

- `src/theme/theme.js` exports `lightColors` and `darkColors` (same token names). `primaryText` is the primary colour to use for **text and icons** (`#005BAA` light, `#6CB4F0` dark); `primary` stays `#005BAA` for filled surfaces with white text. `successSolid` / `dangerSolid` are fills that carry white text.
- `src/context/ThemeContext.js` (**Context API + custom hook**) holds the mode (System / Light / Dark, saved in `campusgo:themeMode`) and exposes `{ colors, isDark, mode, setMode }` through `useTheme()`.
- Every `Screen.styles.js` exports `createStyles(colors)`; screens call `useThemedStyles(createStyles)`. There are no hardcoded colours in components (only white-on-gradient overlays).
- The navigation theme is built from React Navigation's `DefaultTheme` / `DarkTheme`. Change the mode in Profile -> Appearance.

## Spending insights

In the Wallet: spending = every **non-cancelled** order (wallet **and** cash), dated by the order's `placedAt` (demo clock). Week shows 7 daily bars compared with the previous 7 days; Month shows 4 weekly bars (28 days) compared with the previous 28. The logic is in `src/utils/spending.js`. The **demo account** is seeded with 12 delivered orders over about 3 weeks (`isSeed: true`, matching wallet transactions) and a card at 8/10. Profile -> Demo settings -> **Reset demo data** clears and re-seeds.

## Offline mode

`NetworkContext` uses `@react-native-community/netinfo` (`null` counts as online, listener removed in cleanup). An offline banner slides down ("You're offline - showing saved data") and turns green for 2 s when the connection returns.

- Works offline: stores, menus, bag, orders, wallet history, stamps (all stored on the phone). With json-server, the last successful catalog load is cached in `campusgo:catalogCache`.
- Blocked offline, with the reason under the button: **Place order** ("You're offline. Reconnect to place your order."), **Wallet top-up** ("Top-ups need a connection."), and **pull-to-refresh** (toast).
- Profile -> Demo settings -> **Simulate offline** shows all of this on stage without turning off Wi-Fi (which would also cut Expo Go off from the dev server).

## Notifications

**Why local scheduled notifications:** there is no backend, so no server can send push messages. When an order is placed the app already knows when each status will change, so it hands the three notifications (Preparing, On the way, Delivered) to the phone's OS right away. The OS delivers them even if the app is in the background, the phone is locked or the app was swiped away.

**Why the status is time-based:** a `setInterval` stops when the app is closed. Each order stores `placedAtMs` and `statusSchedule` (absolute real-time timestamps), and `getOrderStatus(order, now)` returns the latest step whose time has passed. The Tracking screen still runs its 1 s `setInterval` (with cleanup), but it only refreshes `now`, so the app always matches the phone after reopening.

- Permission is never asked on first launch: after the first order a bottom sheet explains the benefit and only "Turn on" shows the system prompt. If denied, Profile -> Notifications shows "Notifications are off for CampusGo" with **Open settings**.
- Android channels: `orders` (high importance) and `reminders`.
- Foreground rule: no banner or sound for the order you are already watching on Tracking.
- Cancelling an order cancels its pending notifications; opening Tracking clears that order's notifications from the tray; tapping one opens Tracking for that order (warm and cold start; after login if logged out).
- **Break reminders** (off by default, 10/15/20 min before): date-triggered notifications for each delivery slot on the next 5 weekdays, in real time (the OS does not know the demo clock). `rescheduleBreakReminders()` cancels every `kind: "break"` notification and schedules again (on setting change, login and app open). A break with an active order is skipped.
- Log out cancels all scheduled notifications.

**Limits (Expo Go):**
- Remote push is not available in Expo Go on Android (SDK 53+); **local scheduled notifications work**. A console warning about push in Expo Go is about remote push only.
- Android **Force stop** in system settings cancels scheduled alarms. Swiping the app away is fine.
- True iOS Live Activities and Android progress-style ongoing notifications need native code, so one clear notification per step is sent instead.
- iOS keeps at most 64 scheduled notifications per app, plenty here (3 per order + at most 30 reminders).
- The step times in the notifications use the tracking speed chosen when the order was placed.

**How to demo it:** Set the demo clock shortly before a bookable break, leaving enough time for the selected store to prepare. Place an order and check its estimated arrival. Open Profile ? Notifications to send a test notification, or watch the order notifications as its booked delivery approaches.

## New packages

`expo-notifications`, `expo-document-picker`, `expo-file-system`, `@react-native-community/netinfo` (all work in Expo Go; installed with `npx expo install`).

## Motion

All motion lives in `src/components/motion/` and uses **react-native-reanimated 4** (UI thread; only transform, opacity and colours are animated, never width/height/top/left inside long lists). The older React Native `Animated` components still work and were migrated only where they were touched. Durations, easings and springs are tokens in `src/theme/motion.js`.

| Token | Value |
| --- | --- |
| `durations` | instant 50 · short 150 · medium 250 · long 400 · extraLong 600 ms |
| `easings` | standard `bezier(0.2, 0, 0, 1)` · emphasizedDecel `bezier(0.05, 0.7, 0.1, 1)` · emphasizedAccel `bezier(0.3, 0, 0.8, 0.15)` |
| `springs` | snappy `{damping 18, stiffness 220}` · bouncy `{12, 180}` · gentle `{20, 120}` |

**Animations by screen**

| Screen | Animation |
| --- | --- |
| Onboarding | parallax (illustration at 0.6×, text 1×, fade + scale by distance), dots widen 8 → 24 and change colour, break rows enter one by one (60 ms) and the "Delivery" row pulses; the Next button now always advances (the page index comes from the scroll position) |
| Welcome / Onboarding | campus photo with Ken Burns zoom and a light blur band behind the logo |
| Home | collapsing header (greeting shrinks, date/campus fade, search stays pinned), rolling wallet balance, countdown ring (amber at ≤ 5 min), coffee-stamp chip, one-time emoji drop on closed days, list reflow with a spring layout transition |
| Store menu | 200 px hero that stretches on pull-down and fades while scrolling, store name fades into the header, sticky tabs with a sliding underline, scroll-spy and smooth jump, Diet chip in the same row, **fly-to-bag** from the "+" |
| Product sheet | image zoom-in (1.08 → 1), segmented-control sliding thumb, rolling price, "✓ Added" morph, then fly-to-bag |
| Bag | swipe-to-delete (red action with a growing trash icon, row exit + FadeOut, Undo toast), rolling totals, confetti burst when free delivery unlocks |
| Checkout | stepper connector fills left → right, circle pop + drawn check, available breaks first with one expandable "earlier breaks passed" row, place-order button shrinks to a spinner |
| Order placed | check drawn inside a growing ring + 2 ripples, confetti in UA colours, door sign flips in (≤ 1.5 s, tap anywhere to skip) |
| Tracking | scooter springs along the track and wobbles while "On the way", step icons pop, draining "Next update" ring, confetti on Delivered |
| Coffee stamps | new stamps land like a rubber stamp (scale 1.6 → 1, −12° → 0, burst ring, haptic); full card gets a shimmer sweep and a bouncing "Free coffee" badge |
| Wallet | bars grow with a 60 ms stagger and the selected bar lifts, new transactions slide in with a fading highlight |
| Tabs | active icon bounces, one indicator slides between tabs, bag badge bumps, 150 ms cross-fade between tabs |
| Everywhere | chips cross-fade their selected colour, loading skeletons shimmer, empty states pop in once, theme switch cross-fades (~200 ms) |

**Reduce Motion.** `useReduceMotion` combines the phone setting and Reanimated's own flag. With it on: no flight, parallax, stretch, scaling, spinning, confetti, ripples or shimmer; the rest become a ≤ 150 ms fade or switch instantly. Haptics are skipped as well.

**Dependencies added:** `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler` (swipe-to-delete, root view), `react-native-svg` (rings, drawn check marks), `expo-blur` (blur behind the logo), `expo-asset`. All are in Expo Go; no Babel plugin was added by hand.

## Phone-only features

Notifications, haptics and the document picker only work on a real phone (not on web). Test them with [docs/PHONE_TEST_CHECKLIST.md](docs/PHONE_TEST_CHECKLIST.md). Haptics are skipped on web and when Reduce Motion is on; every notification or file-picker problem (permission denied, cancelled pick, wrong or too large file) shows a Toast and never crashes; only local notifications are used (no push token).

## Optional: load data from json-server

By default the app reads `src/data/campus.json`. To show real network loading:

1. In the `campusgo` folder run:

   ```bash
   npx json-server db.json --port 3000
   ```

2. Find your laptop's IP address (e.g. `192.168.1.20`) and set it in `src/services/api.js`:

   ```js
   export const API_URL = 'http://192.168.1.20:3000';
   ```

3. Reload the app. If the server cannot be reached within 3 seconds, the app falls back to the local JSON automatically.
