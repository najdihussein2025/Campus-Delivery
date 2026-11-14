# CampusGo – Antonine Campus Delivery App

**Your campus, delivered between classes.**

## About

CampusGo is a React Native (Expo) app for ordering food, drinks, stationery and printing from the stores on the Antonine University campus. Orders are delivered to your building and room during a class break. It is the final project of the Mobile Development course.

## Features

- First-launch onboarding (3 slides), Welcome with the official UA logo and a one-tap demo account
- University login and 2-step sign-up with validation (`@ua.edu.lb` email, 8-digit ID, Lebanese phone, faculty, campus)
- Home: 4 campus stores with live Open/Closed state, search, category filter, pull-to-refresh
- Store menus grouped by category, product sizes and extras, quantity, out-of-stock handling
- Printing service: live price, colour/B&W, double-sided, binding
- Cart limited to one store, minimum order, free-delivery threshold
- Checkout in 3 steps (Where → When → Pay): real campus buildings and room codes (`G.2.15`), delivery break slots with rules, campus wallet or cash
- Live order tracking (status advances every 12 seconds), cancel with refund, rating
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
| `useState`, `useEffect` (mount, dependencies, cleanup), `useContext` | State, timers | Hooks |
| `async/await`, `Promise`, `fetch` (`src/services/api.js`) | Loading data | Chapter 19 |
| `@react-native-async-storage/async-storage` | Persistence | Storage |
| React Navigation: native stack + bottom tabs, route params | Navigation | Navigation |
| `expo-linear-gradient`, `@expo/vector-icons`, Karla + Roboto (`@expo-google-fonts`) | Design | — |
| `expo-haptics` | Haptic feedback | — |

No Redux, no Expo Router, no TypeScript, no `Alert.alert` (all messages use our own `ConfirmModal`).

## Code structure for styles

Every screen and component keeps its styles in a separate file next to it, like a CSS file:

```
LoginScreen.js         ← the component (JSX + logic)
LoginScreen.styles.js  ← export default StyleSheet.create({ ... })
```

All colours, spacing, radius, fonts and shadows come from `src/theme/theme.js` (the design system).

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

The demo account starts with **$25.00** in the wallet and a saved location **"My Lab – Building D, Room D.2.8"** (the Robotics Lab) on the Hadat–Baabda campus. On the Welcome screen, **Use demo account** fills the login for you. New accounts get a **$10.00** welcome credit.

## Demo clock

Store hours and delivery breaks depend on the time. Because a presentation can happen at any hour, the app has a **demo clock**:

1. Open **Profile → Demo time**.
2. Type a time such as `11:00` and press **Set time**. All stores, slots and greetings now use this time (it keeps ticking from there).
3. Press **Reset** to go back to the real phone time.

Tip: `11:00` makes every store open and most delivery breaks available. The UA Cafeteria is open 06:30–20:00 (its real hours, Monday to Friday).

## Business rules

**Stores**
- A store is open when opening time ≤ now < closing time.
- Closed stores show a red "Closed · opens HH:MM" badge. You can browse them, but you cannot add their products or check out.

**Cart**
- The cart can only hold items from one store. Adding from another store asks whether to empty the cart first.
- Out-of-stock products show a badge and cannot be added.
- Quantity minimum is 1; pressing − at 1 asks to remove the item.

**Totals** (money is stored in cents)
- Subtotal = sum of unit price × quantity.
- Minimum order is **$2.00**; below it, checkout is disabled and the app shows how much is missing.
- Delivery fee is **free above $10.00**, otherwise **$0.50**. The app shows how much more is needed for free delivery.

**Printing**
- Price = pages × copies × ($0.05 B&W or $0.25 colour) + binding × copies.
- Binding: none $0.00, staple $0.25, spiral $1.50 (per copy).
- Double-sided does not change the price; the app shows how many sheets you save.
- Pages and copies must be whole numbers ≥ 1, and pages × copies ≤ 200. A document name is required.

**Delivery breaks**
- A break is disabled if it has already started ("Passed"), if the store cannot prepare the order in time — now + preparation time > break start ("Too close – needs N min") — or if it starts after the store closes ("Store closed").
- The home banner shows the next break that has not started yet.

**Checkout**
- Building, floor and room number (1–99) are required; together they form the real UA room code `Building.Floor.Room` (e.g. `G.2.15`). Delivery break and payment method are required too.
- Only the buildings of the user's campus are shown.
- Saved locations fill the location in one tap; a new place can be saved during checkout.
- Wallet payment is refused if the balance is lower than the total (the app shows the missing amount and a Top up button). Cash on delivery is always allowed.

**Tracking**
- Status steps: Received → Preparing → On the way → Delivered, one step every **12 seconds**. The status is computed from the order time, so it is correct even after closing the app.
- An order can be cancelled only while it is "Received". Wallet orders are refunded.
- After delivery the order can be rated 1–5 stars with an optional comment.

**Wallet**
- Top-ups of $5, $10, $20 or a custom amount (max $200). Every top-up, payment and refund is listed as a transaction.

**Accounts**
- Email must end with `@ua.edu.lb` (typing only the username adds the domain automatically); password ≥ 6 characters; ID exactly 8 digits; phone matches `03xxxxxx`, `7Xxxxxxx` or `81xxxxxx`; passwords must match; an email can only be registered once.

## Project structure

```
App.js                  fonts + AppProvider + NavigationContainer
db.json                 copy of the mock data for json-server
src/
  data/campus.json      mock data
  services/api.js       loadCampusData() – fetch with timeout, fallback to local JSON
  context/AppContext.js shared state (user, cart, wallet, orders) + AsyncStorage
  utils/                money, time, validation, orderStatus, haptics helpers
  theme/theme.js        colours, spacing, radius, fonts, typography, shadows
  navigation/           RootNavigator, AuthStack, MainTabs
  components/           reusable UI (AppButton, AppInput, Card, Badge, Chip, DoorSign, RoomPicker, …)
    motion/             animation kit (PressableScale, FadeInView, Toast, …)
assets/brand/           official UA logos (blue and white)
  screens/
    auth/               Onboarding, Welcome, Login, SignUp
    home/               Home, StoreMenu, ProductDetails
    print/              Print
    cart/               Cart, Checkout
    orders/             Orders, Tracking
    profile/            Profile, Wallet
```

## Mock data summary

| Data | Count |
| --- | --- |
| Stores | 4 (UA Cafeteria, Coffee Corner, Bookstore & Stationery, Printing Office) |
| Products | 28 (3 out of stock) |
| Campuses | 3 (Hadat–Baabda, Nabi Ayla–Zahle, Mejdlaya–Zgharta) |
| Buildings | 10 (Hadat–Baabda: A, B, C, D, G, Sports Complex S · Zahle: A, B · Zgharta: A, B) |
| Delivery breaks | 6 |
| Couriers | 6 |
| Faculties | 7 (the real UA faculties) |

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

**Store locations.** The UA Cafeteria is real (Building G ground floor on Hadat–Baabda, Building B in Zahle, open 06:30–20:00). **Coffee Corner, Bookstore & Stationery and Printing Office are assumed** for this project (marked `"isPlaceholder": true` in the data): Coffee Corner in Building A, Bookstore in Building B, Printing Office in Building C, all on the ground floor.

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
