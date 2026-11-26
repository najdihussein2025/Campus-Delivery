# CampusGo – User Guide

**Your campus, delivered between classes.** CampusGo lets you order food, drinks, stationery and printing from the stores on the Université Antonine campus. Your order is brought to your building and room during a class break.

> Screenshots: the images below are placeholders. See [screenshots/README.md](screenshots/README.md) for the list of pictures to take.

---

## 1. Installing Expo Go and opening the app

1. On your phone, install **Expo Go** (Google Play on Android, App Store on iPhone).
2. Make sure your phone and the laptop that runs the app are on the **same Wi-Fi**.
3. On the laptop, the team runs `npx expo start`. A **QR code** appears in the terminal.
4. **Android:** open Expo Go and tap **Scan QR code**. **iPhone:** open the normal **Camera** app, point it at the code and tap the banner.
5. CampusGo opens. The first time you see three short introduction slides; tap **Next** (or **Skip**).

If the university Wi-Fi blocks the connection, ask the team to start the app with `npx expo start --tunnel`.

![Welcome screen](screenshots/welcome.png)

## 2. Signing up and logging in

- **Quick try:** on the Welcome screen tap **Use demo account**. It fills in `student@ua.edu.lb` / `campus123` for you. The demo account already has a wallet, past orders, a coffee card at 8/10 stamps and a saved place called "My Lab".
- **Log in:** type your university email and your password. You can type only your username (for example `maya`): the app adds `@ua.edu.lb`.
- **Sign up** (2 steps):
  1. Name, university email (must end with **@ua.edu.lb**), password (at least 6 characters, typed twice).
  2. Your **UA ID** (8 digits; the first 4 are the year you joined Antonine University, e.g. `20231234`), Lebanese phone (`03xxxxxx`, `7Xxxxxxx` or `81xxxxxx`). The app checks the ID against Antonine University's records: if it is found you see **✓ Verified UA ID** and your faculty and campus are filled in for you. The name you typed must match the record, and one ID can only have one account. If you see "This ID isn't in Antonine University's records", check your student card.
- An email can only be registered once. New accounts receive a **$10.00 welcome credit**.
- Red messages under a field tell you exactly what to fix.

![Login](screenshots/login.png)

## 3. Browsing stores

The **Home** tab shows:

- A banner with the **next break you can still order for** (a ring around the clock shows the time left, amber in the last 5 minutes), your **wallet balance** (with a **Top up** button) and your **coffee-stamp progress**.
- The greeting shrinks when you scroll and the **search bar stays pinned** at the top, with a **Diet** chip next to it.
- Four stores: **UA Cafeteria**, **Coffee Corner**, **Bookstore & Stationery** and **Printing Office**. Each card shows the logo, the category, where the store is, the average preparation time ("≈ 15 min") and its opening hours.
- **Open / Closed:** a green badge means you can order now. A red "Closed · opens 08:00" badge means you can still browse the menu, but you cannot add items or check out.
- **Search:** type a store or a product name. Products that match appear under the stores.
- **Category chips:** All, Food, Drinks, Stationery, Printing.
- **Dietary filters:** tap the **Diet** chip to choose Vegetarian, Vegan, Siyami (Lenten fasting food), Halal or Iftar. You can pick several: a product must match **all** of them. The chip shows how many are on. Save your favourites in **Profile → My diet**.
- Pull down to refresh.

![Home](screenshots/home.png)

## 4. Ordering food and drinks

1. Tap a store, then a product.
2. On the product sheet choose a **size** and **extras** (each shows its extra price), and the **quantity**.
3. Tap **Add to bag**. The button turns into **✓ Added** and the picture flies into your bag. On a menu, the **+** on a product without sizes or extras adds it straight away.
   (With the phone's *Reduce Motion* setting on, the picture does not fly; you get a message instead.)
4. Items marked **Out of stock** cannot be added.

**One store per bag.** A bag can only contain items from one store. If you try to add something from another store, the app asks whether to empty your bag first.

In the **Bag** tab you can change quantities (the − button is greyed at 1), remove an item with the **✕** or by **swiping it to the left** (with **Undo**), or clear the bag. When you pass $10.00 a little confetti celebrates free delivery.

Prices:

- **Minimum order: $2.00** (what you pay, after any free coffee).
- **Delivery: $0.50, or free on orders over $10.00.** The bag tells you how far you are from free delivery.

![Product](screenshots/product.png)
![Bag](screenshots/bag.png)

## 5. Ordering printing

Open the **Printing Office** card (or the Print screen).

1. **Document:** Tap **Choose a file** (PDF, Word or image, up to 25 MB). The app estimates pages for supported files. You can also choose **Use a sample document**. When you add a real print job to the Bag, CampusGo saves a copy locally and keeps its reference with the job.
2. **Pages per copy:** Enter the number of pages in one copy or check and correct the suggested count.
3. **Options:** Black & white or Colour, double-sided (saves paper, same price), binding.
4. **Copies:** use the + / − buttons.

| Item | Price |
| --- | --- |
| Black & white page | $0.05 |
| Colour page | $0.25 |
| Binding – none | $0.00 |
| Binding – staple | $0.25 per copy |
| Binding – spiral | $1.50 per copy |

Price = pages × copies × page price + binding × copies. The total updates live at the bottom (tap it to see the breakdown).

**200-page limit.** Each order can have up to 200 printed pages across all print jobs. Four copies of 50 pages reach the limit. The Copies card also shows physical sheets, rounding up each double-sided copy separately.

![Print](screenshots/print.png)

## 6. Checkout

Tap **Checkout** in the bag. There are three steps; each finished step folds into one line you can tap to change.

1. **Location:** Select a **saved place** or confirm a **new location** with a building, floor, and room number (1–99). Every checkout starts with no location selected. A new room code such as **G.2.15** appears on the door sign. Choose **Save this location** and enter a name to reuse the location later.
2. **Delivery:** Choose a **delivery break** for the displayed date. Available breaks come first, and the earlier or unavailable breaks are grouped below them.
   - UA's breaks are 09:45, 11:15, 12:45, **14:15–15:30 (the long break)**, 16:45, 18:15 and 19:45.
   - A break is **greyed out** if it already started (**Passed**), if the store cannot prepare your order in time (**Too close – needs N min**), or if it starts after the store closes (**Store closed**).
   - Available breaks show "Order by HH:MM".
3. **Payment:**
   - **Campus wallet:** the amount is taken from your balance. If your balance is too low, the app shows how much is missing and a **Top up** button.
   - **Cash on delivery:** pay the courier. Always allowed.

The **Place order** button looks greyed while something is missing and says what (for example "Choose a delivery break to continue"). Press **Place order** to see a summary, then confirm.

![Checkout](screenshots/checkout.png)

## 7. Tracking, cancelling and rating

After ordering, tap **Track order** (or open it from Home / My orders).

- The timeline shows **Received → Preparing → On the way → Delivered to Building X, Room Y**, with the break you chose (for example "15:15–15:30 break").
- A courier is assigned to your order.
- **Cancel:** possible only while the order is still **Received**. Wallet payments are refunded immediately and the screen shows "Cancelled at HH:MM · Refunded $X to wallet".
- **Rate:** when the order is delivered, give 1–5 stars, pick quick tags (Fast, Hot, Friendly courier, Accurate) and optionally write a comment.

> The simulated status starts advancing after placement. The booked break is displayed separately.

![Tracking](screenshots/tracking.png)

## 8. Order history

The **My orders** tab lists your orders. Use **Active / Past**, the store filter and the status filter (Received, Preparing, On the way, Delivered, Cancelled). Tap an order to open its tracking page. Tap **Reorder** on a past order to put its items in your bag again (items now out of stock are skipped, and the app asks before replacing a bag from another store). Print jobs can be reordered when their saved documents are available.

![Orders](screenshots/orders.png)

## 9. Profile, saved locations and wallet

In the **Profile** tab:

- Your details, **campus** (Hadat–Baabda, Nabi Ayla–Zahle or Mejdlaya–Zgharta: the buildings you can choose follow it).
- **Saved locations:** places you use often (for example "My Lab – Building D, Room D.2.8"). Add them at checkout; remove them here.
- **Wallet:** balance, **top-up** ($5, $10, $20 or a custom amount up to $200) and the list of **transactions** grouped by day (top-ups, payments, refunds).
- **Log out** at the bottom.

![Profile](screenshots/profile.png)
![Wallet](screenshots/wallet.png)

## 10. Extras

- **Coffee Rewards:** Each eligible paid coffee earns a stamp when delivered. Ten stamps earn one free coffee. Choose **Apply reward** in the Bag to discount one eligible coffee per order. Size is included and extras stay payable. Cancelled orders earn no stamps and restore any redeemed reward.
- **Dark mode:** **Profile → Appearance** – System, Light or Dark (the screen fades smoothly when you switch).
- **Animations:** all motion respects your phone's *Reduce Motion* setting (Android: *Remove animations*).
- **Notifications:** **Profile → Notifications**. The app can tell you when your order is being prepared, on the way and delivered, even with the phone locked. You can also turn on **break reminders** (10, 15 or 20 minutes before a break). Use **Send a test notification** to check your phone.
- **Offline mode:** without internet a banner says "You're offline – showing saved data". You can still browse stores, your bag, orders and wallet history. Placing an order and topping up need a connection.
- **Spending insights:** in the **Wallet**, see how much you spent this week or month, by day or by store, compared with the previous period.
- **Seasons:** during Lent or Ramadan, a banner offers Siyami or Iftar filters in one tap.

![Loyalty](screenshots/loyalty.png)

## 11. For the presenter

### Demo clock and tracking speed

Stores and breaks depend on the time of day, so the app has a **demo clock**.

1. **Profile → Demo settings.**
2. Set the **date** (`YYYY-MM-DD`, or the quick buttons: Next weekday, A Saturday, Christmas break, Independence Day) and/or type a time such as `11:00` and press **Set time**. On a Saturday, a holiday or between semesters UA is closed: Home shows why and ordering is blocked (a great thing to show in the demo). **Reset** returns to the real date and time.
3. Type a time such as `11:00` and press **Set time**. Everything (open/closed, breaks, greetings, banner) now uses it. **Reset** returns to the phone's time.
3. **Tracking speed:** **Fast** (8 s), **Demo** (20 s, default) or **Slow** (60 s). The setting affects the interval between simulated stages for new orders.
4. **Simulate offline** shows the offline mode without turning Wi-Fi off. **Reset demo data** restores the demo account.

Tip: `11:00` opens every store and leaves most breaks available.

### Suggested 5-minute demo script

| Time | What to do | Requirement shown |
| --- | --- | --- |
| 0:00 | Welcome → **Use demo account** | Login, validation, demo data |
| 0:30 | Home: point at the banner (next break + wallet), the 4 store cards (logo, category, location, prep time, hours), search "latte" and a dietary filter | Store list, search, open/closed |
| 1:15 | Open **Coffee Corner**, add a **cappuccino** (size + extra), then try adding a sandwich from the **Cafeteria** → one-store prompt | Menu, options, one-store rule |
| 2:00 | Open the **Bag**: change quantity, note the delivery line, minimum order | Cart, totals, minimum, free delivery |
| 2:20 | **Printing Office** → **Use a sample document**, set 0 pages (price $0.00), then 60 pages × 4 copies (limit message), fix it, spiral binding, **Add to bag** | Printing price and 200-page rule |
| 3:00 | **Checkout:** saved place **My Lab**, choose a break (point at greyed ones), pay with the **wallet** | Location, slots, payment |
| 3:40 | **Track:** watch the timeline reach "Delivered to Building D, Room D.2.8"; show the estimated arrival; **Cancel** a second order to show the refund | Tracking, cancel, refund |
| 4:20 | Rate the order; show the **stamp** added; open **My orders** filters and **Reorder** | Rating, history, loyalty |
| 4:45 | **Profile:** wallet top-up, dark mode, offline simulation; then **Demo settings → A Saturday** to show "UA is closed on weekends" | Wallet, extras, closed days |

## 12. FAQ and troubleshooting

**The QR code does not open the app.** Check that the phone and the laptop use the same Wi-Fi, or ask the team to restart with `npx expo start --tunnel`.

**A store says "Closed".** Stores have opening hours (for example the Cafeteria is open 07:30–22:00, Monday to Friday) and the university is closed on weekends, public holidays and between semesters. You can still browse, but not order: the banner on Home tells you why and when ordering opens (for example "UA is closed on weekends · Ordering opens Monday at 09:45"). Some holiday dates are marked "(date may change)" because they depend on the moon. In a demo, set the demo clock to `11:00` on a weekday.

**All delivery breaks are greyed out.** Breaks that already started, that come before the store can prepare your order, or that start after closing are disabled. Pick a later one, or try tomorrow (the Home banner says when ordering opens).

**"Add $X more to reach the $2.00 minimum".** The minimum order is $2.00 after any discount.

**"Insufficient balance".** Top up your wallet or pay by cash on delivery.

**I cannot cancel my order.** Cancelling is only possible while the order is "Received", before the store starts preparing.

**The page count of my file is wrong or empty.** The app only estimates it. Type the right number yourself.

**My document is over 200 pages.** One order can print at most 200 pages (pages × copies). Split it into two orders.

**I do not get notifications.** Allow them in **Profile → Notifications** (or your phone's settings). Expo Go on Android does not support remote push, but CampusGo uses local notifications, which work. Force-stopping the app on Android cancels scheduled notifications.

**I forgot my password.** The demo has no password reset: create a new account with another email, or use the demo account.

**Start again.** In **Demo settings**, **Reset demo data** restores the demo account.
