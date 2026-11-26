# CampusGo

CampusGo is an Expo and React Native course project for Université Antonine. It demonstrates how students and staff can order food, drinks, stationery, or printing for delivery to a campus room during a class break.

- [User guide](docs/USER_GUIDE.md)
- [Phone test checklist](docs/PHONE_TEST_CHECKLIST.md)
- [Screenshot checklist](docs/screenshots/README.md)
- [Image credits](assets/CREDITS.md)

## Project objectives

- Build a mobile ordering flow from account registration through checkout, tracking, rating, and reorder.
- Apply store hours, delivery break deadlines, and product availability consistently.
- Practice React components, navigation, local persistence, and reusable JavaScript logic in a realistic campus scenario.

## Installation and execution

Install Node.js LTS, then run these commands from the project folder.

```sh
npm ci
npm start
```

Scan the Expo QR code from a phone running a compatible Expo Go version. The phone and computer normally need to be on the same network. If the local network blocks the connection, try `npx expo start --tunnel`. Use `npm run android` for a configured Android emulator, `npm run ios` for an iOS simulator on macOS, or `npm run web` for a browser preview. Device permissions and notifications differ from the web preview. [Expo setup guide](https://docs.expo.dev/get-started/set-up-your-environment/)

## Main features and navigation

| Screen | What it does |
| --- | --- |
| Onboarding, Welcome, Log in, Create account | Introduces the app and opens a local student, staff, or demo account. |
| Home | Campus stores, store and product search, category filters, **Next Available Delivery Slot**, wallet shortcut, and **Order again** for an eligible prior store order. |
| Store menus and product details | Browse categories, check stock and mock product information, choose sizes, extras or cover colors where offered, and add quantities to the Bag. |
| Print | Configure a document, pages per copy, color, double-sided printing, binding, and copies. |
| Bag | Review and edit items, apply an eligible coffee reward, and review the delivery fee and total. |
| Checkout, Order Processing, Order Confirmation | Choose a room, break, and payment method. Review and place the order, then track it or return Home. |
| My orders and Track order | Filter Active and Past orders, review the scheduled arrival and progress, and cancel, rate, or reorder when eligible. |
| Profile | Campus and saved locations, Campus wallet, Coffee Rewards, Notifications, Dietary preferences, Appearance, and Demo settings. |

The bottom tabs are **Home**, **Print**, **Bag**, **My orders**, and **Profile**. React Navigation stacks handle authentication, store menus, product details, checkout, and tracking.

### Search and dietary filters

Home searches store and product names and offers **All**, **Food**, **Drinks**, **Stationery**, and **Printing**. UA Cafeteria and Coffee Corner have their own product search and filter button. The Cafeteria offers **Vegetarian**, **Vegan**, **Fasting-friendly**, and **High protein**. Coffee Corner offers **Sugar-free**, **Decaffeinated**, and **Dairy-free**. Products must meet all selected filters. A Coffee Corner result can require a displayed customization. Bookstore has no dietary controls. Save preferences in **Profile → Dietary preferences**.

## Technologies and concepts

The version ranges below match [package.json](package.json).

| Technology | Declared version | Use |
| --- | --- | --- |
| Expo | `~58.0.25` | Tooling and device APIs |
| React | `19.3.0` | Components, JSX, state, hooks, and context |
| React Native | `0.88.1` | Mobile UI, forms, lists, styling, and layout |
| React Native Web | `^0.21.4` | Browser preview |
| React Navigation | Native `^7.5.1`, native stack `^7.21.0`, bottom tabs `^7.21.0` | Screen stacks, route parameters, and tabs |
| AsyncStorage | `2.2.0` | Local data and settings |
| Reanimated | `4.7.1` | UI animation and feedback |
| Expo Document Picker / FileSystem | `~58.0.5` / `~58.0.13` | File selection and native storage |
| Expo Notifications | `~58.1.9` | Local order updates and break reminders |
| NetInfo | `12.0.1` | Connection state |

React components pass data through props and share state through context. Hooks manage form state, derived UI behavior, timers, and cleanup. React Native uses controlled inputs, FlatList, flexbox, safe areas, and theme styles. The JavaScript uses array filtering and transformation, validation functions, integer-cent arithmetic, JSON, date comparisons, and promises with async/await.

## Project structure

| Path | Purpose |
| --- | --- |
| [App.js](App.js), [index.js](index.js), [app.json](app.json) | Startup, providers, and Expo configuration |
| [src/navigation/](src/navigation/) | Authentication stack, main tabs, and app routes |
| [src/screens/](src/screens/) | Authentication, Home, stores, Print, Bag, Checkout, orders, and Profile |
| [src/components/](src/components/), [src/theme/](src/theme/) | Shared UI, motion, and design tokens |
| [src/context/](src/context/), [src/hooks/](src/hooks/) | Shared application, theme, network, and UI state |
| [src/utils/](src/utils/), [src/services/](src/services/) | Validation, pricing, scheduling, persistence adapters, and device integrations |
| [src/data/](src/data/), [db.json](db.json), [assets/](assets/) | Bundled mock data, optional server data, and local images |
| [docs/](docs/) | User instructions and demonstration checklists |

## Mock data and persistence

The bundled [catalog](src/data/campus.json) and [db.json](db.json) contain **3 campuses**, **4 stores**, **29 products** (11 cafeteria, 10 coffee, 8 bookstore), **10 buildings**, **7 delivery slots**, **6 couriers**, **7 faculties**, **2 seasonal entries**, and **25 legacy mock registry records**. Printing is configured per job. The registry records support compatibility with previously stored accounts. Registration accepts any unused nine-digit ID without a registry match.

AsyncStorage saves the local accounts and session, each account's Bag, orders and schedules, wallet, rewards, and saved locations, plus settings such as appearance, demo time, and notification preferences. Print document contents are stored separately in the native app's document directory or browser IndexedDB. The Bag and order history store references to those files.

By default, data is bundled. For an optional network demonstration, run `npx json-server db.json --port 3000`, point `API_URL` in [src/services/api.js](src/services/api.js) at the computer's reachable address, and reload. If fetching fails, the app tries the saved catalog cache, followed by bundled data. Calendar rules use [uaCalendar.json](src/data/uaCalendar.json). After editing that file, `node scripts/sync-calendar.js` synchronizes the copies in both catalog files.

## Business rules and validation

- **Accounts.** A student or staff ID must be exactly **9 numeric digits** and unused. An account needs a unique `@ua.edu.lb` email, name, faculty, and a valid Lebanese phone number. Passwords must have at least six characters and match the confirmation. Existing accounts sign in with their email and password.
- **Bag.** Only one store per Bag. The app asks before replacing another store's items. Out-of-stock items and orders from closed stores are blocked. Checkout requires a subtotal of at least **$2.00** after rewards. The delivery fee is **$0.50** unless the discounted subtotal is strictly above **$10.00**.
- **Printing.** PDF, Word, and images up to **25 MB**. Pages and copies must be positive whole numbers. The Bag may contain at most **200 printed pages** across all jobs. A page costs **$0.05** in black and white or **$0.25** in color. Binding costs **$0.00**, **$0.25** for staple, or **$1.50** for spiral per copy. Double-sided printing changes sheet count. Reorder reuses available documents and prompts for replacements for missing ones. Saved print options are preserved and current rates apply.
- **Checkout.** Choose a building, floor, and room at the account's campus, then a break and a payment method. Campus Wallet needs enough balance. Cash on delivery is the alternative. Final validation and order creation happen at confirmation. A successful order clears the Bag once, then the 1.2-second processing screen leads to confirmation.
- **Coffee rewards.** Each eligible paid coffee earns a stamp when delivered. Ten stamps earn one reward. One reward covers one eligible coffee and its selected size per order. Extras still cost their listed price. The reward is consumed at order placement. Cancellation restores it.
- **Wallet and orders.** Top up with **$5**, **$10**, **$20**, or a custom positive amount up to **$200**. Transactions record top-ups, payments, and refunds. Cancel while **Received** to refund wallet payment. Rate from **1 to 5 stars** once **Delivered**.

## Delivery scheduling

Store hours are evaluated against the campus calendar, including closed days and academic breaks.

| Store | Hours on its open weekdays | Preparation | With transportation |
| --- | --- | ---: | ---: |
| UA Cafeteria | 07:30–22:00 | 15 min | 18 min |
| Coffee Corner | 07:30–22:00 | 5 min | 8 min |
| Bookstore & Stationery | 08:00–15:00 | 5 min | 8 min |
| Printing Office | 08:00–16:30 | 20 min | 23 min |

Configured breaks are **09:45–10:00**, **11:15–11:30**, **12:45–13:00**, **14:15–15:30**, **16:45–17:00**, **18:15–18:30**, and **19:45–20:00**.

The shared calculation in [src/utils/time.js](src/utils/time.js) adds a fixed **3 minutes** of transportation. Preparation starts at the later of order confirmation and break start minus the total duration. The courier departs after preparation, and arrival follows three minutes later. The latest order time is break end minus the total duration, capped by store closing time minus preparation. The store must be open when ordering, the break must start before the store closes, and preparation must finish by closing. A break can remain available after it starts. The exact deadline is accepted, and eligibility is checked to the millisecond. The Home banner uses the Bag's store when present, or any currently open store otherwise.

**Example.** For the Cafeteria and the **12:45–13:00** break, an order confirmed at **12:20** starts preparation at **12:27**, leaves at **12:42**, and arrives at **12:45**. A **12:35** confirmation starts preparation immediately and arrives at **12:53**. The last eligible time is **12:42:00**, which arrives at **13:00**. At **12:42:01** the break is unavailable.

## Normal and demo tracking

- **Normal time** uses saved scheduled timestamps for **Received → Preparing → On the way → Delivered**. Received begins on acceptance. If preparation must start immediately, the first visible status can already be Preparing. A timer refreshes the display, and status is recalculated from timestamps on reopening or returning to Tracking from the background.
- **Demo time** uses the campus clock for availability and the ETA. Orders made with the demo clock active use a separate simulated timeline that advances every **8 seconds** (Fast), **20 seconds** (Demo), or **60 seconds** (Slow). The scheduled arrival remains within the selected break. Setting or resetting the clock or changing speed affects new orders. Previously saved orders keep their timelines.

## Demo account and demonstration

From Welcome choose **Use demo account**, then **Log in**, or enter `student@ua.edu.lb` and `campus123`. Fresh demo data includes saved order history, a wallet, a saved place called **My Lab**, and eight coffee stamps.

1. Open **Profile → Demo settings**. Choose an open academic weekday and set the time to **12:20**. Select **Fast**.
2. Add a Cafeteria order worth at least $2.00, open the Bag, and proceed to checkout. Pick **My Lab**, the **12:45–13:00** break, and a payment method.
3. Place the order and open tracking. Compare the scheduled **12:45** arrival with the accelerated status changes.
4. Show the order in **My orders**, then demonstrate **Reorder** or a sample print job. **Reset** restores the real clock. **Reset demo data** restores the demo account's starting data.

## Limitations

CampusGo is a classroom prototype. Accounts, wallet payments, top-ups, courier assignment, and delivery are simulated. It has no production authentication, password recovery, real payment gateway, courier dispatch, or print submission. Data is stored on the current device or browser and is not synchronized between devices. The catalog and dietary details are mock information. PDF page detection is an estimate and other file types may require manual entry. The academic calendar covers configured periods and depends on maintained data. Notifications are local and depend on permissions and device behavior.
