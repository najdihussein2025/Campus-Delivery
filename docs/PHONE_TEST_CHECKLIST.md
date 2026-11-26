# Phone test checklist (Expo Go)

These features cannot be tested in the browser. Tick each box on **a real Android phone** and **a real iPhone**, in **Expo Go**, with the phone and laptop on the same Wi-Fi (`npx expo start`, or `--tunnel` on the university Wi-Fi).

Before you start: log in with **Use demo account**. Open **Profile → Demo settings**, set the demo date to a weekday (**Next weekday**) so UA is open, set time `11:00`, and set **Tracking speed → Demo** (20 s per step).

Legend: ☐ Android ☐ iPhone – tick both columns.

## 1. Notifications

| # | Step | Expected | Android | iPhone |
| --- | --- | --- | --- | --- |
| 1.1 | Place an order (Cafeteria, wallet) | A sheet explains notifications; **Turn on** shows the system permission prompt | ☐ | ☐ |
| 1.2 | Tap **Allow** | Toast "Notifications are on" | ☐ | ☐ |
| 1.3 | Profile → Notifications → **Send a test notification**, lock the phone | A notification "CampusGo test" arrives after about 5 s | ☐ | ☐ |
| 1.4 | Place an order, then **lock the phone / send the app to the background** and wait about 20 s per step | "Preparing", "On the way" and "Delivered to Building …, Room …" arrive one after another | ☐ | ☐ |
| 1.5 | Tap the "Delivered" notification | CampusGo opens on **that order's** Tracking screen | ☐ | ☐ |
| 1.6 | Swipe the app away (not Force stop), place an order first, wait | Notifications still arrive; tapping opens the right order after a cold start | ☐ | ☐ |
| 1.7 | Deny the permission (reinstall or reset it in Settings). Profile → Notifications | "Notifications are off" + **Open settings**; tapping it opens the phone's Settings | ☐ | ☐ |
| 1.8 | Allow it in the phone's Settings, come back to the app | The status turns on by itself; an active order's notifications are scheduled | ☐ | ☐ |
| 1.9 | Turn on **Break reminders** (10 min) | No crash; reminders only for open UA days | ☐ | ☐ |
| 1.10 | Open the Metro/console log | No error about push tokens (only local notifications are used) | ☐ | ☐ |

## 2. Haptics

| # | Step | Expected | Android | iPhone |
| --- | --- | --- | --- | --- |
| 2.1 | Add a product to the bag | Light tap | ☐ | ☐ |
| 2.2 | Place an order | Success vibration | ☐ | ☐ |
| 2.3 | Submit the login form with a wrong password | Error vibration + the form shakes | ☐ | ☐ |
| 2.4 | Turn on the phone's **Reduce Motion** (Android: "Remove animations"), reopen the app, repeat 2.1 | No haptics, no zoom on the Welcome photo | ☐ | ☐ |

## 3. File picker (Print)

| # | Step | Expected | Android | iPhone |
| --- | --- | --- | --- | --- |
| 3.1 | Printing Office → **Choose a file** → a PDF | File chip, page count detected, price updates | ☐ | ☐ |
| 3.2 | Choose a **.docx** | Accepted; "Enter the number of pages" (Word files are not counted) | ☐ | ☐ |
| 3.3 | Open the picker and **cancel** | Toast "No file selected", nothing breaks | ☐ | ☐ |
| 3.4 | Choose a file bigger than 25 MB or an unsupported type (e.g. .zip) | Red message and a Toast, no crash | ☐ | ☐ |
| 3.5 | **Change** and **×** on the file chip | Works | ☐ | ☐ |

## 4. Display and layout

| # | Step | Expected | Android | iPhone |
| --- | --- | --- | --- | --- |
| 4.1 | Phone in **dark mode**, Profile → Appearance → System | App follows the system, every screen readable | ☐ | ☐ |
| 4.2 | Welcome and Onboarding screens | Campus photo with a dark blue overlay, logo and text readable, slow zoom, no white flash at start | ☐ | ☐ |
| 4.3 | Phone with a notch / gesture bar | Nothing hidden under the notch; the tab bar labels ("My orders", "Bag") are not cut | ☐ | ☐ |
| 4.4 | Print → **Number of copies** on a small phone | The − / + stepper is fully inside the card | ☐ | ☐ |
| 4.5 | Sign-up and Checkout: tap each input | The keyboard never hides the field you are typing in | ☐ | ☐ |
| 4.6 | Sign-up: tap "Step 1" while on step 1, then go to step 2 and tap "Step 1" | Nothing happens on step 1; from step 2 you go back and your text is still there | ☐ | ☐ |

## 5. Offline

| # | Step | Expected | Android | iPhone |
| --- | --- | --- | --- | --- |
| 5.1 | Turn on **airplane mode** (the app stays open) | Banner "You're offline – showing saved data" | ☐ | ☐ |
| 5.2 | Try **Place order** and a wallet **Top up** | Blocked with a reason | ☐ | ☐ |
| 5.3 | Turn airplane mode off | The banner turns green, then disappears | ☐ | ☐ |

Note: airplane mode also cuts Expo Go from the laptop, so reload the app afterwards if it stops responding. **Profile → Demo settings → Simulate offline** shows the same screens without losing the connection.

## 6. Weekends, holidays and the real timetable (demo date)

| # | Step | Expected | Android | iPhone |
| --- | --- | --- | --- | --- |
| 6.1 | Demo settings → **A Saturday** | Home banner: "UA is closed on weekends · Ordering opens Monday at 09:45"; store cards say "Closed · opens Monday 07:30" | ☐ | ☐ |
| 6.2 | Open a store and a product | Menu is browsable ("Browsing only – …"); **Add to bag** is disabled with the reason | ☐ | ☐ |
| 6.3 | Print → sample document | **Add to bag** is disabled with the reason | ☐ | ☐ |
| 6.4 | Orders → **Reorder** a past order | Toast with the closure reason; the bag stays unchanged | ☐ | ☐ |
| 6.5 | Demo settings → **Independence Day (23 Nov)** | "UA is closed – Independence Day …" | ☐ | ☐ |
| 6.6 | Demo settings → **Christmas break** | "🎄 UA is closed – Christmas & New Year's" and the next opening date | ☐ | ☐ |
| 6.7 | Date = a weekday, time `13:50` | Banner shows the **14:15–15:30 (long break)** | ☐ | ☐ |
| 6.8 | Time `21:00` | Only the Cafeteria is open; "No more breaks today – ordering opens tomorrow at 09:45" | ☐ | ☐ |
| 6.9 | Reset the demo clock | Real date and time again | ☐ | ☐ |

## 7. Sign-up with a UA ID

| # | Step | Expected | Android | iPhone |
| --- | --- | --- | --- | --- |
| 7.1 | Sign up with an unused ID such as 012345678 | Select faculty and campus manually, then create the account | ☐ | ☐ |
| 7.2 | Enter an eight-digit ID | Student/staff ID must be exactly 9 digits | ☐ | ☐ |
| 7.3 | Paste letters or punctuation into the ID field | Only numeric digits remain | ☐ | ☐ |
| 7.4 | Sign up with a different email and an already registered ID | An account already exists for this ID | ☐ | ☐ |
| 7.5 | Create the account, log out, log in with the **university email and password** | Works; signing up again with the same ID says "An account already exists for this ID" | ☐ | ☐ |

Notes for the report: write the phone model, the OS version and anything that failed next to the step number.

## 8. Motion and animations (Reanimated)

Tick on a real Android phone and a real iPhone. Then repeat the table with **Reduce Motion ON** (Android: Settings → Accessibility → *Remove animations*; iPhone: Settings → Accessibility → Motion → *Reduce Motion*) and compare.

| # | Step | Reduce Motion OFF | Reduce Motion ON | Android | iPhone |
| --- | --- | --- | --- | --- | --- |
| 8.1 | Onboarding: tap **Next** twice | Reaches slide 3 and the button says "Get started"; dots widen, illustration slides slower than the text | Same pages, only fades | ☐ | ☐ |
| 8.2 | Home: scroll down a little | Greeting shrinks, date fades, search stays pinned | Search stays pinned, no shrinking | ☐ | ☐ |
| 8.3 | Store menu: pull down, then scroll up | Hero stretches, then fades; store name appears in the header; underline slides under the tabs | No stretch; fades only | ☐ | ☐ |
| 8.4 | **Fly-to-bag:** tap **+** on a product without options | Thumbnail flies in an arc to the bag icon, icon bumps, badge number bumps, light haptic | No flight; a toast says "Added … to bag" | ☐ | ☐ |
| 8.5 | Product sheet: add a product with options | Button morphs to "✓ Added", sheet closes, thumbnail flies to the bag | No flight, toast only | ☐ | ☐ |
| 8.6 | **Swipe-to-delete:** swipe a bag row to the left | Red action with a growing trash icon; releasing past the threshold deletes, the row fades out and the rows below slide up; Undo toast works | Row disappears with a short fade | ☐ | ☐ |
| 8.7 | **Confetti:** raise the bag above $10.00 | A short burst (≤ 1 s) and "🎉 Free delivery unlocked" springs up | No confetti | ☐ | ☐ |
| 8.8 | Checkout: complete a step | Connector line fills, circle pops, check mark draws | Instant | ☐ | ☐ |
| 8.9 | Checkout: **Place order** | Full-screen processing, then order confirmation with the booked details. Back cannot return to submitted Checkout. | Same flow with reduced motion | ? | ? |
| 8.10 | Tracking at Demo speed | Preparing, On the way, and Delivered appear at 20-second intervals from placement. The booked break stays visible. | Same timing with reduced motion | ☐ | ☐ |
| 8.11 | **Stamp animation:** order 2 coffees from Coffee Corner, wait for delivery, open **Coffee stamps** | New stamps land like a rubber stamp with a haptic; at 10/10 a shimmer sweeps and the "Free coffee" badge bounces | Stamps just appear | ☐ | ☐ |
| 8.12 | Wallet: switch Week / Month, tap a bar, top up | Bars grow one after another, the tapped bar lifts, the balance rolls to the new value, the new transaction slides in highlighted | Values swap | ☐ | ☐ |
| 8.13 | **Tab bar:** tap each tab | Icon bounces, the indicator slides between tabs, content cross-fades, bag badge bumps when the count changes | Indicator jumps, no bounce | ☐ | ☐ |
| 8.14 | Profile → Appearance → Dark | Whole screen cross-fades (~200 ms), headers turn deep navy with a thin bottom border | Same, instant | ☐ | ☐ |
| 8.15 | Pull Home and Orders down to refresh | Skeleton cards shimmer while loading | Static skeletons | ☐ | ☐ |
| 8.16 | Set the demo date to a Saturday | The "UA is closed" emoji drops in once, nothing keeps moving | Fade only | ☐ | ☐ |
| 8.17 | Low-end Android (if available): scroll Home and the store menu quickly | No dropped taps, no visible stutter | — | ☐ | — |
